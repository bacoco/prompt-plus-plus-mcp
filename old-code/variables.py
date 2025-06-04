import json
import os

# Load templates from environment variable with a safe default
templates_json = os.getenv('PROMPT_TEMPLATES', '{}')

try:
  # Parse JSON data with error handling
  prompt_data = json.loads(templates_json)
except json.JSONDecodeError:
  # Fallback to empty dict if JSON is invalid
  prompt_data = {}

metaprompt_list = [key for key in prompt_data.keys()] if prompt_data else []
print(metaprompt_list)

# Create explanations dictionary with safe access
metaprompt_explanations = {
  key: data.get("description", "No description available")
  for key, data in prompt_data.items()
} if prompt_data else {}

# Generate markdown explanation
explanation_markdown = "".join([
  f"- **{key}**: {value}\n" 
  for key, value in metaprompt_explanations.items()
])

# Define models list
models = [
  "meta-llama/Meta-Llama-3-70B-Instruct",
  "meta-llama/Meta-Llama-3-8B-Instruct",
  "meta-llama/Llama-3.1-70B-Instruct",
  "meta-llama/Llama-3.1-8B-Instruct",
  "meta-llama/Llama-3.2-3B-Instruct",
  "meta-llama/Llama-3.2-1B-Instruct",
  "meta-llama/Llama-2-13b-chat-hf",
  "meta-llama/Llama-2-7b-chat-hf",
  "HuggingFaceH4/zephyr-7b-beta",
  "HuggingFaceH4/zephyr-7b-alpha",
  "Qwen/Qwen2.5-72B-Instruct",
  "Qwen/Qwen2.5-1.5B",
  "microsoft/Phi-3.5-mini-instruct"
]

# Extract examples only from JSON templates
examples = []
for key, data in prompt_data.items():
  template_examples = data.get("examples", [])
  if template_examples:
      examples.extend([
          [example[0], key] if isinstance(example, list) else [example, key]
          for example in template_examples
      ])

# Get API token with error handling
api_token = os.getenv('HF_API_TOKEN')
if not api_token:
  raise ValueError("HF_API_TOKEN not found in environment variables")

# Create meta_prompts dictionary with safe access
meta_prompts = {
  key: data.get("template", "No template available")
  for key, data in prompt_data.items()
} if prompt_data else {}

prompt_refiner_model = os.getenv('prompt_refiner_model', 'meta-llama/Llama-3.1-8B-Instruct')
print("prompt_refiner_model used :" + prompt_refiner_model)

echo_prompt_refiner = os.getenv('echo_prompt_refiner')
openai_metaprompt = os.getenv('openai_metaprompt')
advanced_meta_prompt = os.getenv('advanced_meta_prompt')