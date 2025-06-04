import gradio as gr
from prompt_refiner import PromptRefiner
from variables import models, explanation_markdown, metaprompt_list, examples
from custom_css import custom_css

class GradioInterface:
  def __init__(self, prompt_refiner: PromptRefiner, custom_css):
      self.prompt_refiner = prompt_refiner
      # Set default model to second-to-last in the list
      default_model = models[-1] if len(models) >= 1 else models[0] if models else None
      #meta_prompt_choice=metaprompt_list[0]
      
      with gr.Blocks(css=custom_css, theme=gr.themes.Default()) as self.interface:
          # CONTAINER 1
          with gr.Column(elem_classes=["container", "title-container"]):
              gr.Markdown("# PROMPT++")
              gr.Markdown("### Automating Prompt Engineering by Refining your Prompts")
              gr.Markdown("Learn how to generate an improved version of your prompts.")
              
          # CONTAINER 2
          with gr.Column(elem_classes=["container", "input-container"]):
              prompt_text = gr.Textbox(label="Type your prompt (or leave empty to see metaprompt)",lines=5)
              with gr.Accordion("Prompt Examples", open=False, visible=True):     
                  gr.Examples(examples=examples,inputs=[prompt_text]) 
              automatic_metaprompt_button = gr.Button(
                  "Automatic Choice for Refinement Method",
                  elem_classes=["button-highlight"]
              )
              MetaPrompt_analysis = gr.Markdown()
              
          # CONTAINER 3    
          with gr.Column(elem_classes=["container","meta-container"]):
              meta_prompt_choice = gr.Radio(
                  choices=metaprompt_list,
                  label="Choose Meta Prompt",
                  value=metaprompt_list[0],
                  elem_classes=["no-background", "radio-group"]
              )
              refine_button = gr.Button(
                  "Refine Prompt",
                  elem_classes=["button-waiting"]
              )
              with gr.Accordion("Metaprompt Explanation", open=False, visible=True): 
                  gr.Markdown(explanation_markdown)              
              
          with gr.Column(elem_classes=["container", "analysis-container"]):           
              gr.Markdown(" ")
              prompt_evaluation = gr.Markdown()
              gr.Markdown("### Refined Prompt")
              refined_prompt = gr.Textbox(
                  label=" ",
                  interactive=True,
                  show_label=True,
                  show_copy_button=True,
              )
              explanation_of_refinements = gr.Markdown()

          with gr.Column(elem_classes=["container", "model-container"]):
              with gr.Row():
                  apply_model = gr.Dropdown(
                      choices=models,
                      value=default_model,
                      label="Choose the Model",
                      container=False,
                      scale=1,
                      min_width=300
                  )
                  apply_button = gr.Button(
                      "Apply Prompts",
                      elem_classes=["button-waiting"]
                  )
              
              gr.Markdown("### Prompts on Chosen Model")
              with gr.Tabs(elem_classes=["tabs"]):
                with gr.TabItem("Prompts Output Comparison", elem_classes=["tabitem"]):                     
                    with gr.Row(elem_classes=["output-row"]):
                        with gr.Column(scale=1, elem_classes=["comparison-column"]):
                              gr.Markdown("### Original Prompt Output")
                              original_output1 = gr.Markdown(
                           #       value="Output will appear here",
                                  elem_classes=["output-content"],
                                  visible=True
                              )
                        with gr.Column(scale=1, elem_classes=["comparison-column"]):
                              gr.Markdown("### Refined Prompt Output")
                              refined_output1 = gr.Markdown(
                             #     value="Output will appear here",
                                  elem_classes=["output-content"],
                                  visible=True
                              )
                with gr.TabItem("Original Prompt Output", elem_classes=["tabitem"]):
                      with gr.Row(elem_classes=["output-row"]):
                          with gr.Column(scale=1, elem_classes=["comparison-column"]):
                              gr.Markdown("### Original Prompt Output")
                              original_output = gr.Markdown(
                               #   value="Output will appear here",
                                  elem_classes=[ "output-content"],
                                  visible=True
                              )
                with gr.TabItem("Refined Prompt Output", elem_classes=["tabitem"]):
                      with gr.Row(elem_classes=["output-row"]):
                          with gr.Column(scale=1, elem_classes=["comparison-column"]):
                              gr.Markdown("### Refined Prompt Output")
                              refined_output = gr.Markdown(
                              #    value="Output will appear here",
                                  elem_classes=["output-content"],
                                  visible=True
                              )
              
              with gr.Accordion("Full Response JSON", open=False, visible=True):
                  full_response_json = gr.JSON()

          # Button click handlers
          automatic_metaprompt_button.click(
              fn=self.automatic_metaprompt,
              inputs=[prompt_text],
              outputs=[MetaPrompt_analysis, meta_prompt_choice]
          ).then(
              fn=lambda: None,
              inputs=None,
              outputs=None,
              js="""
                  () => {
                      // Clear subsequent outputs
                      document.querySelectorAll('.analysis-container textarea, .analysis-container .markdown-text, .model-container .markdown-text, .comparison-output').forEach(el => {
                          if (el.value !== undefined) {
                              el.value = '';
                          } else {
                              el.textContent = '';
                          }
                      });
                      
                      // Update button states
                      const allButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                          btn.textContent.includes('Automatic Choice') || 
                          btn.textContent.includes('Refine Prompt') || 
                          btn.textContent.includes('Apply Prompts')
                      );
                      allButtons.forEach(btn => btn.classList.remove('button-highlight'));
                      allButtons[1].classList.add('button-highlight'); // Highlight refine button
                      allButtons[0].classList.add('button-completed'); // Complete current button
                      allButtons[2].classList.add('button-waiting'); // Set apply button to waiting
                  }
              """
          )
          
          refine_button.click(
              fn=self.refine_prompt,
              inputs=[prompt_text, meta_prompt_choice],
              outputs=[prompt_evaluation, refined_prompt, explanation_of_refinements, full_response_json]
          ).then(
              fn=lambda: None,
              inputs=None,
              outputs=None,
              js="""
                  () => {
                      // Clear model outputs
                      document.querySelectorAll('.model-container .markdown-text, .comparison-output').forEach(el => {
                          if (el.value !== undefined) {
                              el.value = '';
                          } else {
                              el.textContent = '';
                          }
                      });
                      
                      // Update button states
                      const allButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                          btn.textContent.includes('Automatic Choice') || 
                          btn.textContent.includes('Refine Prompt') || 
                          btn.textContent.includes('Apply Prompts')
                      );
                      allButtons.forEach(btn => btn.classList.remove('button-highlight'));
                      allButtons[2].classList.add('button-highlight'); // Highlight apply button
                      allButtons[1].classList.add('button-completed'); // Complete current button
                      allButtons[2].classList.remove('button-waiting'); // Remove waiting from apply button
                  }
              """
          )
          
          apply_button.click(
              fn=self.apply_prompts,
              inputs=[prompt_text, refined_prompt, apply_model],
              outputs=[original_output, refined_output, original_output1, refined_output1],
              show_progress=True  # Add this line
            ).then(
              fn=lambda: None,
              inputs=None,
              outputs=None,
              js="""
                  () => {
                      // Update button states
                      const allButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                          btn.textContent.includes('Automatic Choice') || 
                          btn.textContent.includes('Refine Prompt') || 
                          btn.textContent.includes('Apply Prompts')
                      );
                      allButtons.forEach(btn => btn.classList.remove('button-highlight', 'button-waiting'));
                      allButtons[2].classList.add('button-completed'); // Complete apply button
                      
                      // Force refresh of output containers
                      document.querySelectorAll('.comparison-output').forEach(el => {
                          if (el.parentElement) {
                              el.parentElement.style.display = 'none';
                              setTimeout(() => {
                                  el.parentElement.style.display = 'block';
                              }, 100);
                          }
                      });
                  }
              """
            )

          # Reset when input changes
          prompt_text.change(
              fn=lambda: None,
              inputs=None,
              outputs=None,
              js="""
                  () => {
                      // Clear all outputs
                      document.querySelectorAll('.analysis-container textarea, .analysis-container .markdown-text, .model-container .markdown-text, .comparison-output').forEach(el => {
                          if (el.value !== undefined) {
                              el.value = '';
                          } else {
                              el.textContent = '';
                          }
                      });
                      
                      // Reset all button states
                      const allButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                          btn.textContent.includes('Automatic Choice') || 
                          btn.textContent.includes('Refine Prompt') || 
                          btn.textContent.includes('Apply Prompts')
                      );
                      allButtons.forEach(btn => {
                          btn.classList.remove('button-completed', 'button-highlight', 'button-waiting');
                      });
                      allButtons[0].classList.add('button-highlight'); // Highlight first button
                      allButtons.slice(1).forEach(btn => btn.classList.add('button-waiting')); // Set subsequent buttons to waiting
                  }
              """
          )

  def automatic_metaprompt(self, prompt: str) -> tuple:
      """Handle automatic metaprompt selection"""
      try:
          if not prompt.strip():
              return "Please enter a prompt to analyze.", None

          metaprompt_analysis, recommended_key = self.prompt_refiner.automatic_metaprompt(prompt)
          return metaprompt_analysis, recommended_key

      except Exception as e:
          error_message = f"Error in automatic metaprompt: {str(e)}"
          return error_message, None

  def refine_prompt(self, prompt: str, meta_prompt_choice: str) -> tuple:
      """Handle manual prompt refinement"""
      try:
          if not prompt.strip():
              return ("No prompt provided.", "", "", {})
    
          result = self.prompt_refiner.refine_prompt(prompt, meta_prompt_choice)
          return (
              result[0],  # initial_prompt_evaluation
              result[1],  # refined_prompt
              result[2],  # explanation_of_refinements
              result[3]   # full_response
          )
      except Exception as e:
          error_message = f"Error in refine_prompt: {str(e)}"
          return error_message, "", "", {}

  def apply_prompts(self, original_prompt: str, refined_prompt: str, model: str) -> tuple:
      """Apply both original and refined prompts to the selected model"""
      try:
          if not original_prompt or not refined_prompt:
              return ("Please provide both original and refined prompts.", 
                      "Please provide both original and refined prompts.",
                      "Please provide both original and refined prompts.",
                      "Please provide both original and refined prompts.")

          if not model:
              return ("Please select a model.", 
                      "Please select a model.",
                      "Please select a model.",
                      "Please select a model.")

          # Apply prompts and get outputs
          try:
            #  print(original_prompt)
             # print(refined_prompt)
              #print(model)
              
              original_output = self.prompt_refiner.apply_prompt(original_prompt, model)
              #print(original_output)
              refined_output = self.prompt_refiner.apply_prompt(refined_prompt, model)
          except Exception as e:
              return (f"Error applying prompts: {str(e)}", 
                      f"Error applying prompts: {str(e)}",
                      f"Error applying prompts: {str(e)}",
                      f"Error applying prompts: {str(e)}")

          # Ensure we have string outputs
          original_output = str(original_output) if original_output is not None else "No output generated"
          refined_output = str(refined_output) if refined_output is not None else "No output generated"
          #print('-'*100)
          #print(original_output)
          #print('-'*100)
          #print(refined_output)
          #print('-'*100)
          
          return (
              original_output,  # For Original Prompt Output tab
              refined_output,   # For Refined Prompt Output tab
              original_output,  # For Comparison tab - original
              refined_output    # For Comparison tab - refined
          )
          
      except Exception as e:
          error_message = f"Error in apply_prompts: {str(e)}"
          return (error_message, error_message, error_message, error_message)

  def launch(self, share=False):
      """Launch the Gradio interface"""
      self.interface.launch(share=share)


if __name__ == '__main__':
  from variables import api_token, meta_prompts, metaprompt_explanations
  
  # Initialize the prompt refiner
  prompt_refiner = PromptRefiner(api_token, meta_prompts, metaprompt_explanations)
  
  # Create and launch the Gradio interface
  gradio_interface = GradioInterface(prompt_refiner, custom_css)
  gradio_interface.launch(share=True)