import json
import re
from typing import Optional, Dict, Any, Union, List, Tuple
from pydantic import BaseModel, Field, validator
from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError
from variables import *
from metaprompt_router import metaprompt_router

class LLMResponse(BaseModel):
  initial_prompt_evaluation: str = Field(..., description="Evaluation of the initial prompt")
  refined_prompt: str = Field(..., description="The refined version of the prompt")
  explanation_of_refinements: Union[str, List[str]] = Field(..., description="Explanation of the refinements made")
  response_content: Optional[Union[Dict[str, Any], str]] = Field(None, description="Raw response content")

  @validator('response_content', pre=True)
  def validate_response_content(cls, v):
      if isinstance(v, str):
          try:
              return json.loads(v)
          except json.JSONDecodeError:
              return {"raw_content": v}
      return v

  @validator('initial_prompt_evaluation', 'refined_prompt', 'explanation_of_refinements')
  def clean_text_fields(cls, v):
      if isinstance(v, str):
          return v.strip().replace('\\n', '\n').replace('\\"', '"')
      elif isinstance(v, list):
          return [item.strip().replace('\\n', '\n').replace('\\"', '"').replace('•', '-') 
                 for item in v if isinstance(item, str)]
      return v

class PromptRefiner:
  def __init__(self, api_token: str, meta_prompts: dict, metaprompt_explanations: dict):
      self.client = InferenceClient(token=api_token, timeout=120)
      self.meta_prompts = meta_prompts
      self.metaprompt_explanations = metaprompt_explanations

  def _clean_json_string(self, content: str) -> str:
      """Clean and prepare JSON string for parsing."""
      content = content.replace('•', '-')
      content = re.sub(r'\s+', ' ', content)
      content = content.replace('\\"', '"')
      return content.strip()

  def _parse_response(self, response_content: str) -> dict:
      """Parse the LLM response with enhanced error handling."""
      try:
          json_match = re.search(r'<json>\s*(.*?)\s*</json>', response_content, re.DOTALL)
          if json_match:
              json_str = self._clean_json_string(json_match.group(1))
              try:
                  parsed_json = json.loads(json_str)
                  print(parsed_json)
                  if isinstance(parsed_json, str):
                      parsed_json = json.loads(parsed_json)
                  prompt_analysis = f"""
                  #### Original prompt analysis    
                  - {parsed_json.get("initial_prompt_evaluation", "")}
                  """
                  explanation_of_refinements=f"""
                  #### Refinement Explanation
                  - {parsed_json.get("explanation_of_refinements", "")}
                  """
                  return {
                      "initial_prompt_evaluation": prompt_analysis,
                      "refined_prompt": parsed_json.get("refined_prompt", ""),
                      "explanation_of_refinements": explanation_of_refinements,
                      "response_content": parsed_json
                  }
              except json.JSONDecodeError:
                  return self._parse_with_regex(json_str)
          
          return self._parse_with_regex(response_content)

      except Exception as e:
          print(f"Error parsing response: {str(e)}")
          return self._create_error_dict(str(e))

  def _parse_with_regex(self, content: str) -> dict:
      """Parse content using regex when JSON parsing fails."""
      output = {}
      
      refinements_match = re.search(r'"explanation_of_refinements":\s*$(.*?)$', content, re.DOTALL)
      if refinements_match:
          refinements_str = refinements_match.group(1)
          refinements = [
              item.strip().strip('"').strip("'").replace('•', '-')
              for item in re.findall(r'[•"]([^"•]+)[•"]', refinements_str)
          ]
          output["explanation_of_refinements"] = refinements
      else:
          pattern = r'"explanation_of_refinements":\s*"(.*?)"(?:,|\})'
          match = re.search(pattern, content, re.DOTALL)
          output["explanation_of_refinements"] = match.group(1).strip() if match else ""

      for key in ["initial_prompt_evaluation", "refined_prompt"]:
          pattern = rf'"{key}":\s*"(.*?)"(?:,|\}})'
          match = re.search(pattern, content, re.DOTALL)
          output[key] = match.group(1).strip() if match else ""
      
      output["response_content"] = {"raw_content": content}
      print(content)
      return output

  def _create_error_dict(self, error_message: str) -> dict:
      """Create a standardized error response dictionary."""
      return {
          "initial_prompt_evaluation": f"Error parsing response: {error_message}",
          "refined_prompt": "",
          "explanation_of_refinements": "",
          "response_content": {"error": error_message}
      }

  def automatic_metaprompt(self, prompt: str) -> Tuple[str, str]:
      """Automatically select the most appropriate metaprompt."""
      try:
          router_messages = [
              {
                  "role": "system",
                  "content": "You are an AI Prompt Selection Assistant that helps choose the most appropriate metaprompt based on the user's query."
              },
              {
                  "role": "user",
                  "content": metaprompt_router.replace("[Insert initial prompt here]", prompt)
              }
          ]
          
          router_response = self.client.chat_completion(
              model=prompt_refiner_model,
              messages=router_messages,
              max_tokens=3000,
              temperature=0.2
          )
          
          router_content = router_response.choices[0].message.content.strip()
          json_match = re.search(r'<json>(.*?)</json>', router_content, re.DOTALL)
          
          if not json_match:
              raise ValueError("No JSON found in router response")
          
          router_result = json.loads(json_match.group(1))
          recommended_key = router_result["recommended_metaprompt"]["key"]
          metaprompt_analysis = f"""
          #### Selected MetaPrompt
          - **Primary Choice**: {router_result["recommended_metaprompt"]["name"]}
          - *Description*: {router_result["recommended_metaprompt"]["description"]}
          - *Why This Choice*: {router_result["recommended_metaprompt"]["explanation"]}
          - *Similar Sample*: {router_result["recommended_metaprompt"]["similar_sample"]}
          - *Customized Sample*: {router_result["recommended_metaprompt"]["customized_sample"]}
          
          #### Alternative Option
          - **Secondary Choice**: {router_result["alternative_recommendation"]["name"]}
          - *Why Consider This*: {router_result["alternative_recommendation"]["explanation"]}
          """
          
          return metaprompt_analysis, recommended_key
          
      except Exception as e:
          return f"Error in automatic metaprompt: {str(e)}", ""

  def refine_prompt(self, prompt: str, meta_prompt_choice: str) -> Tuple[str, str, str, dict]:
      """Refine the given prompt using the selected meta prompt."""
      try:
          selected_meta_prompt = self.meta_prompts.get(meta_prompt_choice)
          selected_meta_prompt_explanations = self.metaprompt_explanations.get(meta_prompt_choice)
          
          messages = [
              {
                  "role": "system",
                  "content": 'You are an expert at refining and extending prompts.'
              },
              {
                  "role": "user",
                  "content": selected_meta_prompt.replace("[Insert initial prompt here]", prompt)
              }
          ]
          
          response = self.client.chat_completion(
              model=prompt_refiner_model,
              messages=messages,
              max_tokens=3000,
              temperature=0.8
          )
          
          result = self._parse_response(response.choices[0].message.content.strip())
          llm_response = LLMResponse(**result)
          llm_response_dico={}
          llm_response_dico['initial_prompt']=prompt
          llm_response_dico['meta_prompt']=meta_prompt_choice
          llm_response_dico=llm_response_dico | llm_response.dict()
          
          return (
              llm_response.initial_prompt_evaluation,
              llm_response.refined_prompt,
              llm_response.explanation_of_refinements,
              llm_response_dico
          )
          
      except Exception as e:
          return (
              f"Error: {str(e)}",
              "",
              "",
              {}
          )

  def apply_prompt(self, prompt: str, model: str) -> str:
    """Apply formatting to the prompt using the specified model."""
    try:
        if not prompt or not model:
            return "Error: Prompt and model are required"
        
        messages = [
            {
                "role": "system",
                "content": "You are a markdown formatting expert."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        response = self.client.chat_completion(
            model=model,
            messages=messages,
            max_tokens=3000,
            temperature=0.8,
            stream=False  # Mode non-stream
        )
        
        # Accès direct à la réponse puisque stream=False
        result = response.choices[0].message.content.strip()
        return f"""{result}"""

        
    except Exception as e:
        return f"Error: {str(e)}"