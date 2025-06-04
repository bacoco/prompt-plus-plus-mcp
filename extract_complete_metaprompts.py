#!/usr/bin/env python3
"""
Extract metaprompts from the original meta_prompt.txt file
"""

import json
import os
import re

def extract_metaprompts_from_file(filepath):
    """Extract complete metaprompts from the original file"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The content is a JSON structure, but with triple-quoted strings
    # We need to carefully extract it
    
    # Find the start of the JSON
    json_start = content.find('{')
    if json_start == -1:
        raise ValueError("No JSON structure found in file")
    
    # Extract from the JSON start
    content = content[json_start:]
    
    # Initialize result
    metaprompts = {}
    
    # Pattern to match each metaprompt entry
    # This regex captures: "key": { ... entire content including triple quotes ... }
    pattern = r'"(\w+)":\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*?)\}(?=\s*,\s*"|\s*\})'
    
    matches = list(re.finditer(pattern, content, re.DOTALL))
    
    for match in matches:
        key = match.group(1)
        block_content = match.group(2)
        
        # Extract individual fields
        metaprompt = {}
        
        # Extract name
        name_match = re.search(r'"name":\s*"([^"]+)"', block_content)
        if name_match:
            metaprompt['name'] = name_match.group(1)
        
        # Extract description
        desc_match = re.search(r'"description":\s*"([^"]+)"', block_content)
        if desc_match:
            metaprompt['description'] = desc_match.group(1)
        
        # Extract template (handling triple quotes)
        template_match = re.search(r'"template":\s*"""(.*?)"""', block_content, re.DOTALL)
        if template_match:
            metaprompt['template'] = template_match.group(1).strip()
        
        # Extract examples
        examples_match = re.search(r'"examples":\s*\[(.*?)\]', block_content, re.DOTALL)
        if examples_match:
            examples_str = examples_match.group(1)
            # Extract individual examples
            examples = []
            for ex_match in re.finditer(r'"([^"]+)"', examples_str):
                examples.append(ex_match.group(1))
            metaprompt['examples'] = examples
        else:
            metaprompt['examples'] = []
        
        # Only add if we have a valid metaprompt with at least name and template
        if 'name' in metaprompt and 'template' in metaprompt:
            metaprompts[key] = metaprompt
    
    return metaprompts

def save_individual_metaprompts(metaprompts, output_dir='metaprompts'):
    """Save each metaprompt as an individual JSON file"""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each metaprompt
    for key, metaprompt in metaprompts.items():
        filepath = os.path.join(output_dir, f"{key}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(metaprompt, f, indent=2, ensure_ascii=False)
        print(f"Saved: {filepath}")

def main():
    # Use the uploaded file content
    meta_prompt_content = '''meta prompt++ secret


 {
    "star": {
        "name": "ECHO Prompt",
        "description": "Use ECHO when you need a comprehensive, multi-stage approach for complex prompts. It's ideal for tasks requiring in-depth analysis, exploration of multiple alternatives, and synthesis of ideas. Choose this over others when you have time for a thorough refinement process and need to consider various aspects of the prompt.",
        "template": """You are an AI assistant implementing an advanced version of the ECHO (Enhanced Chain of Harmonized Optimization) method to refine an initial prompt into a more relevant, comprehensive, and effective one. Given an initial prompt, meticulously follow these steps:

1. Prompt Analysis and Evaluation:
   - Thoroughly analyze the initial prompt
   - Identify key concepts, objectives, constraints, and implicit assumptions within the prompt
   - Determine the prompt type (e.g., task-oriented, creative, analytical, informational)
   - Evaluate the prompt's strengths and weaknesses
   - Assess the complexity and any specific requirements

2. Prompt Expansion and Exploration:
   - Generate 8-10 alternative versions of the prompt that explore different aspects or phrasings
   - Ensure these versions cover various perspectives and potential interpretations
   - Include a mix of more specific, more general, and differently focused versions
   - Apply techniques such as role prompting, emotion prompting, and style prompting
   - Incorporate chain-of-thought reasoning in your expansions

3. Prompt Clustering and Thematic Analysis:
   - Group the generated prompts into 5-7 thematic clusters
   - Identify the core themes, objectives, and unique aspects represented by each cluster
   - Apply the Tree of Thoughts technique to explore multiple enhancement paths simultaneously

4. Demonstration and Approach Outline:
   - For each cluster, outline how an AI might interpret and approach that prompt version
   - Include potential reasoning steps, areas of focus, and expected outcomes
   - Incorporate techniques like few-shot prompting and least-to-most prompting
   - Avoid generating actual responses; focus on the approach and reasoning process

5. Prompt Refinement and Optimization:
   - Review the demonstration outlines and identify strengths and weaknesses of each prompt version
   - Refine each version, addressing potential misinterpretations and improving clarity
   - Ensure each refined version maintains the original intent while enhancing specificity or broadening scope as needed
   - Apply linguistic optimization techniques to improve structure and clarity
   - Aim to create at least 7-10 refined versions
   - Implement self-consistency checks and self-calibration techniques

6. Cross-Pollination and Synthesis:
   - Identify effective elements, techniques, and approaches from each refined version
   - Integrate these elements to create multiple synthesized, improved prompts
   - Apply the mixture of reasoning experts (MoRE) approach to combine insights from various perspectives

7. Final Prompt Synthesis and Optimization:
   - Combine the most effective elements from all refined and synthesized versions
   - Construct a final, comprehensive prompt that captures the essence of the original while incorporating improvements from multiple refined versions
   - Ensure the final prompt is detailed, clear, and addresses multiple aspects identified in the refinement process
   - The final prompt should be substantially longer and more detailed than any individual refined prompt, typically at least 3-10 times the length of the original prompt
   - Include specific instructions, key areas to cover, and guidance on approach and structure
   - Incorporate self-verification and chain-of-verification (COVE) steps
   - Apply the max mutual information method to optimize the prompt's effectiveness
   - Include instructions for dynamic, adaptive reasoning processes
   - Ensure the prompt leverages the autoregressive nature of language models by strategically ordering information

8. Meta-Learning and Continuous Improvement:
   - Incorporate steps for the AI to learn from the prompt enhancement process
   - Include instructions for adaptive technique selection based on prompt characteristics
   - Add self-evaluation and iterative improvement guidelines within the prompt

Ensure each step of your process is thorough and well-documented in the JSON output. Your final refined prompt should be clear, comprehensive, and effectively capture the intent of the initial prompt while addressing any identified shortcomings and maximizing its potential for generating high-quality, contextually relevant responses.

Initial prompt: [Insert initial prompt here]

Please provide your response in the following JSON format, enclosed in <json> tags:

<json>
{
"initial_prompt": "The original prompt provided",
"initial_prompt_evaluation": "Your detailed evaluation of the initial prompt, including strengths and weaknesses, in a string format using markdown bullet points",
"prompt_analysis": {
  "key_concepts": ["concept1", "concept2", "concept3", "..."],
  "objectives": "String describing the main objectives",
  "constraints": "String describing any identified constraints",
  "prompt_type": "Type of prompt (e.g., task-oriented, creative, analytical, informational)",
  "complexity_assessment": "Assessment of the prompt's complexity and specific requirements"
},
"expanded_prompts": [
  "First alternative prompt version",
  "Second alternative prompt version",
  "...",
  "Last alternative prompt version"
],
"prompt_clusters": {
  "cluster1_name": [
    "First prompt in this cluster",
    "Second prompt in this cluster",
    "..."
  ],
  "cluster2_name": [
    "First prompt in this cluster",
    "Second prompt in this cluster",
    "..."
  ],
  "...": "Additional clusters as needed"
},
"demonstration_outlines": {
  "cluster1_name": "Detailed approach outline for this cluster",
  "cluster2_name": "Detailed approach outline for this cluster",
  "...": "Additional outlines as needed"
},
"prompts_refined": [
  "First refined prompt version",
  "Second refined prompt version",
  "...",
  "Last refined prompt version"
],
"refined_prompt": "The final, synthesized prompt from prompts_refined as a single comprehensive string",
"explanation_of_refinements": "Detailed explanation of techniques used, improvements made, and rationale behind the final synthesized prompt. Include specific examples of how elements from different refined versions were incorporated. Provide this explanation in a bullet-point format for clarity. Add 
discussion of any potential limitations or considerations for the refined prompt, including areas that may require further refinement or attention in future iterations. Output in a single comprehensive string"
}
</json>
""",
        "examples": [
            "Write a story on the end of prompt engineering replaced by an Ai specialized in refining prompts",
            "Explain the universe"
        ]
    },
    "done": {
        "name": "Done Prompt",
        "description": "Opt for this when you want a structured approach with emphasis on role-playing and advanced techniques. It's particularly useful for tasks that benefit from diverse perspectives and complex reasoning. Prefer this over 'physics' when you need a more detailed, step-by-step refinement process.",
        "template": """
As an AI Prompt Enhancement Specialist, your mission is to elevate the given prompt using state-of-the-art prompting techniques while emphasizing the utilization of previously generated context. Analyze the input prompt and apply the following comprehensive approach to enhance it:

1. Role and Expertise Definition:
   Assume the role of a "Multidisciplinary Prompt Engineering Expert" with deep knowledge in:
   a) The subject matter of the input prompt
   b) Linguistic principles and natural language processing
   c) Cognitive science and reasoning methodologies
   d) AI systems and their response patterns

2. Structured Output Generation with Iterative Refinement:
   Design a prompt structure that builds upon previous sections and incorporates iterative improvement:
   a) Initial Analysis
   b) Preliminary Enhancement (referencing the analysis)
   c) Intermediate Evaluation (critiquing the enhancement)
   d) Advanced Refinement (building on evaluation)
   e) Final Optimization (synthesizing all previous steps)
   f) Meta-Review (analyzing the entire process)

3. Multi-Technique Integration:
   Combine the following techniques to create a synergistic prompt engineering approach:
   
   a) Chain-of-Thought (CoT) and Zero-Shot CoT:
      - Incorporate explicit reasoning steps
      - Provide guidance for handling unfamiliar tasks
      - Example: "To enhance this prompt, first analyze its structure, then identify areas for improvement by considering..."

   b) Tree of Thoughts (ToT):
      - Create a branching structure for exploring multiple enhancement paths
      - Evaluate each branch using a defined criterion
      - Example: "Consider three potential directions for improvement: 1) Clarity, 2) Specificity, 3) Context utilization. For each direction..."

   c) Least-to-Most Prompting:
      - Break down complex aspects into manageable sub-tasks
      - Build complexity gradually
      - Example: "Start by simplifying the core request, then add layers of detail and context requirements..."

   d) ReAct Prompting:
      - Alternate between reasoning and acting steps
      - Incorporate self-reflection after each action
      - Example: "Reason: The prompt lacks specific instructions for context utilization. Action: Add a section on context referencing. Reflection: Evaluate if the added section improves coherence..."

   e) Multimodal CoT Prompting:
      - If applicable, integrate instructions for handling multiple modalities (text, images, etc.)
      - Provide reasoning steps for each modality
      - Example: "When enhancing prompts involving image analysis, consider the following steps..."

   f) Generated Knowledge Prompting:
      - Incorporate instructions for the AI to generate relevant background knowledge
      - Use this knowledge to inform the prompt enhancement process
      - Example: "Before enhancing the prompt, generate a brief overview of key concepts in the subject area. Use this knowledge to..."

   g) Graph Prompting:
      - Create a conceptual graph of the prompt's components and their relationships
      - Use this graph to identify areas for enhancement and connection
      - Example: "Map out the main elements of the prompt as nodes, with edges representing relationships. Identify weak connections and enhance them by..."

4. Linguistic Optimization:
   Apply linguistic principles to refine the prompt's structure and clarity:
   a) Use clear, concise language
   b) Employ parallel structure for related concepts
   c) Incorporate rhetorical devices for emphasis
   d) Ensure logical flow and coherence

5. Mathematical Representation (if applicable):
   If the prompt involves quantitative elements, incorporate mathematical notation to enhance precision:
   a) Use set theory to define scope
   b) Employ logical operators for conditional instructions
   c) Utilize probability notation for uncertainty handling


6. Synergy Exploitation:
   Leverage the synergies between AI, Linguistics, and Prompt Engineering:
   a) Use AI-specific language patterns
   b) Incorporate linguistic cues that enhance AI comprehension
   c) Design prompts that align with AI reasoning processes

7. Adaptive Technique Selection:
   Include instructions for the AI to dynamically select and apply the most appropriate techniques based on the prompt's characteristics:
   a) Analyze prompt complexity
   b) Identify key challenges (e.g., ambiguity, lack of context)
   c) Select and apply relevant techniques from the available set

8. Meta-Learning Integration:
   Incorporate steps for the AI to learn from the prompt enhancement process:
   a) Analyze successful enhancements
   b) Identify patterns in effective prompt structures
   c) Apply learned insights to future prompt improvements

Now, apply these advanced techniques to improve the following prompt:

[Insert initial prompt here]

Follow these steps to generate an enhanced version of the prompt:

1. Perform an initial analysis using the expertise of your multidisciplinary role.
2. Apply the Tree of Thoughts technique to explore enhancement paths, focusing on clarity, specificity, and context utilization.
3. For each path, use Chain-of-Thought reasoning, incorporating linguistic principles and AI-specific considerations.
4. Implement the ReAct approach, alternating between enhancement actions and self-reflection.
5. Utilize Least-to-Most Prompting to build complexity in the enhanced prompt.
6. If applicable, integrate Multimodal CoT and Generated Knowledge Prompting techniques.
7. Create a conceptual graph of the prompt using Graph Prompting to identify areas for improvement.
8. Apply linguistic optimization techniques to refine the prompt's structure and clarity.
9. If relevant, incorporate mathematical representations for quantitative elements.
10. Include self-evaluation instructions using the specified metrics.
11. Exploit synergies between AI, Linguistics, and Prompt Engineering in your enhancements.
12. Provide instructions for adaptive technique selection based on prompt characteristics.
13. Integrate meta-learning steps for continuous improvement.

Present the final enhanced prompt in key explanation_of_refinements , along with a detailed explanation of:
1. Key improvements made
2. Techniques applied and their rationale
3. Expected impact on AI response quality and context utilization
4. Potential limitations or areas for further refinement

Ensure that the enhanced prompt:
1. Maintains and amplifies the original intent
2. Significantly improves effectiveness, clarity, and precision
3. Maximizes the leverage of previously generated context
4. Includes explicit instructions for dynamic, adaptive reasoning processes
5. Creates a cohesive, interconnected, and self-improving response framework

Your enhanced prompt should guide the AI to generate a response that not only addresses the original query but also demonstrates advanced reasoning, contextual awareness, and continuous self-improvement throughout the response generation process.

Only provide the output in the following JSON format enclosed in <json> tags:
<json>
{
"initial_prompt_evaluation": "Your evaluation of the initial prompt with Strengths and Weaknesses in a string as bullet points format",
"refined_prompt": "Your refined prompt",
"explanation_of_refinements": "Detailed explanation of techniques used and improvements made, including the extract of final prompt where it used. Answer in a string "
}
</json>
""",
        "examples": [
            "How to make money fast?"
        ]
    },
    "physics": {
        "name": "Physics Prompt",
        "description": "Select this when you need a balance between structure and advanced techniques, with a focus on role-playing. It's similar to 'done' but may be more suitable for scientific or technical prompts. Choose this over 'done' for a slightly less complex approach.",
        "template": """
As an AI Prompt Enhancement Specialist, your task is to improve the given prompt using advanced prompting techniques while emphasizing the use of previously generated context. Analyze the input prompt and apply the following steps to enhance it:

1. Role Prompting: Assume the role of an "Expert Prompt Analyst and Optimizer" with deep knowledge in the subject matter of the input prompt.

2. Structured Output Generation: Design a prompt structure that builds upon previous sections:
   a) Introduction
   b) Key Points (referencing the introduction)
   c) Detailed Analysis (expanding on key points and referencing previous sections)
   d) Conclusion (summarizing and synthesizing all previous content)
   e) Final Review and Refinement

3. Few-Shot Prompting: Provide 2-3 relevant examples demonstrating the desired output format, reasoning, and effective use of previous context.

4. Chain-of-Thought (CoT) and Zero-Shot CoT: Incorporate step-by-step reasoning in your instructions, explaining the thought process for each enhancement and how to handle unfamiliar tasks.

5. Self-Consistency: Generate multiple reasoning paths and select the most consistent one for the final improved prompt.

6. Least-to-Most Prompting: Break down complex aspects of the prompt into smaller, manageable sub-tasks that build upon each other.

7. Tree-of-Thought: Create a branching structure for exploring multiple improvement paths simultaneously, considering different aspects of the prompt.

8. Prompt Paraphrasing: Rephrase key instructions in multiple ways to ensure clarity and comprehension.

9. Self-Calibration: Include steps for the AI to assess its own confidence in the generated output and adjustments.

10. Self-Refine: Implement an iterative process for the AI to improve its initial response to the prompt enhancement task.

11. Self-Verification and Chain-of-Verification (COVE): Add verification steps to check the logical consistency, effectiveness, and fulfillment of all requirements in the improved prompt.

12. Cumulative Reasoning: Build upon previous enhancements, accumulating improvements throughout the process.

13. Style Prompting: Adjust the language style of the prompt to match the intended audience or purpose.

14. Emotion Prompting: Incorporate language that emphasizes the importance and impact of the task described in the prompt.

15. System 2 Attention (S2A): Guide the AI to focus on specific critical aspects of the prompt that require careful consideration.

16. Rephrase and Respond (RaR): After each major enhancement, instruct the AI to rephrase the prompt and respond to it to test its effectiveness.

17. Re-reading (RE2): Instruct the AI to re-read the original and enhanced prompts multiple times to catch nuances and potential improvements.

18. Self-Ask: Encourage the AI to ask itself questions about the prompt's clarity, effectiveness, and potential weaknesses, especially in relation to using previous context.

19. Automatic Chain-of-Thought (Auto-CoT): Generate intermediate reasoning steps automatically to support the prompt enhancement process.

20. Program-of-Thoughts: Structure the prompt improvement process as a series of logical operations or a program-like sequence.

21. Skeleton-of-Thought: Create a basic structure or skeleton for the enhanced prompt, then iteratively fill in the details.

22. Mixture of Reasoning Experts (MoRE): Combine insights from multiple expert perspectives (e.g., subject matter expert, language specialist, task optimization expert) to enhance the prompt.

23. Max Mutual Information Method: Optimize the prompt to maximize the mutual information between the input and desired output.

Now, apply these techniques to improve the following prompt:

Initial Prompt: [Insert initial prompt here]

Follow these steps to generate an enhanced version of the prompt:

1. Analyze the original prompt, identifying its main objectives, strengths, and weaknesses.
2. Apply the role of an Expert Prompt Analyst and Optimizer, considering the subject matter.
3. Design a structured output format that encourages use of previous context.
4. Use the Tree-of-Thought technique to explore multiple enhancement paths.
5. For each path, apply Chain-of-Thought reasoning to explain the enhancements.
6. Incorporate Few-Shot examples to illustrate the desired outcome and effective use of previous context.
7. Break down complex aspects using Least-to-Most Prompting.
8. Rephrase key instructions using Prompt Paraphrasing.
9. Adjust the language style and incorporate emotional elements as appropriate.
10. Implement Self-Verification and Chain-of-Verification steps.
11. Use Self-Ask to critically evaluate the enhancements, especially regarding context usage.
12. Apply the Skeleton-of-Thought technique to structure the improved prompt.
13. Utilize the Mixture of Reasoning Experts approach to refine the prompt from multiple perspectives.
14. Employ the Max Mutual Information Method to optimize the prompt's effectiveness.
15. Use Self-Calibration to assess the confidence in the final enhanced prompt.
16. Apply Self-Refine to iteratively improve the enhanced prompt.

Present the final enhanced prompt, along with a brief explanation of the key improvements and techniques used. Ensure that the enhanced prompt:
1. Maintains the original intent
2. Significantly improves effectiveness and clarity
3. Effectively leverages previously generated context
4. Includes explicit instructions for the AI to refer back to and build upon its own previous outputs
5. Creates a cohesive and interconnected result

Your enhanced prompt should guide the AI to generate a response that not only addresses the original query but also demonstrates a clear progression of thought and utilization of previously generated information throughout the response.

Only provide the output in the following JSON format enclosed in <json> tags:
<json>
{
"initial_prompt_evaluation": "Your evaluation of the initial prompt with Strengths and Weaknesses in a string as bullet points format",
"refined_prompt": "Your refined prompt",
"explanation_of_refinements": "Explain techniques used and improvements made, including the extract of final prompt where it used. Answer in a string "
}
</json>
""",
        "examples": [
            "Tell me about that guy who invented the light bulb"
        ]
    },
    "morphosis": {
        "name": "Morphosis Prompt",
        "description": "Use this simplified approach for straightforward prompts or when time is limited. It focuses on essential improvements without complex techniques. Prefer this over other methods when you need quick, clear refinements without extensive analysis.",
        "template": """
Given an initial prompt:

Initial Prompt: [Insert initial prompt here]

Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.
- Leverage Autoregressive Nature: Strategically order information to prime the model for better results. Generate key concepts, context, or vocabulary early in the prompt to inform later reasoning and outputs.
- Reasoning Before Conclusions: Encourage reasoning steps before any conclusions are reached. If user examples show reasoning afterward, reverse the order. Never start examples with conclusions.
    - Reasoning Order: Identify reasoning and conclusion parts. Determine their order and reverse if needed. Conclusions, classifications, or results should always appear last.
- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
   - Assess example needs, quantity, and complexity for potential placeholder use.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.
- Formatting: Use markdown features for readability. Avoid code blocks unless requested.
- Preserve User Content: Retain extensive guidelines or examples from input. Break down vague instructions into sub-steps. Maintain user-provided details, guidelines, examples, variables, or placeholders.
- Constants: Include constants (guides, rubrics, examples) as they resist prompt injection.
- Output Format: Specify appropriate output format in detail, including length and syntax.
    - For structured data, prefer JSON output (unwrapped unless requested).

The final prompt should follow this structure, with no additional commentary:
Leverage Autoregressive Nature: Strategically order information to prime the model for better results. Generate key concepts, context, or vocabulary early in the prompt to inform later reasoning and outputs.

[Concise task instruction - first line, no header]

[Additional details as needed]

[Optional sections with headings or bullet points for detailed steps]

# Context Generation

[Instructions for generating key concepts, vocabulary, or context to inform later reasoning]

# Steps [optional]

[Detailed task breakdown]

# Reasoning Process

[Specific instructions for the reasoning process, ensuring it precedes conclusions]

# Output Format

[Detailed output format specifications]

# Examples [optional]

[1-3 well-defined examples with placeholders if necessary. Mark input/output clearly. Use placeholders and indicate if real examples differ in length/complexity]

# Notes [optional]

[Edge cases, important considerations, repeated key points]

Only provide the output in the following JSON format enclosed in <json> tags:

<json>
{
"initial_prompt_evaluation": "Your evaluation of the initial prompt with Strengths and Weaknesses in a string",
"refined_prompt": "Your refined prompt into quote",
"explanation_of_refinements": "Explanation of the techniques used and improvements made, also include the extract of final prompt where it made.Answer in bullet points if accurate. Output in a single comprehensive string"
}
</json>
""",
        "examples": [
            "What's the population of New York City and how tall is the Empire State Building and who was the first mayor?",
            "Explain why the experiment failed"
        ]
    },
    "verse": {
        "name": "Verse Prompt",
        "description": "Choose this method when you need to analyze and improve a prompt's strengths and weaknesses, with a focus on information flow. It's particularly useful for enhancing the logical structure of prompts. Use this over 'morphosis' when you need more depth but less complexity than 'star'.",
        "template": """
Given a task description or existing prompt, produce a detailed system prompt to guide a language model in completing the task effectively.

Initial Prompt: [Insert initial prompt here]

# Guidelines

- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.
- Reasoning Before Conclusions**: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!
    - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.
    - Conclusion, classifications, or results should ALWAYS appear last.
- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
   - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.
- Formatting: Use markdown features for readability. DO NOT USE ``` CODE BLOCKS UNLESS SPECIFICALLY REQUESTED.
- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.
- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.
- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, JSON, etc.)
    - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a JSON.
    - JSON should never be wrapped in code blocks (```) unless explicitly requested.

The final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no "---")

[Concise instruction describing the task - this should be the first line in the prompt, no section header]

[Additional details as needed.]

[Optional sections with headings or bullet points for detailed steps.]

# Steps [optional]

[optional: a detailed breakdown of the steps necessary to accomplish the task]

# Output Format

[Specifically call out how the output should be formatted, be it response length, structure e.g. JSON, markdown, etc]

# Examples [optional]

[Optional: 1-3 well-defined examples with placeholders if necessary. Clearly mark where examples start and end, and what the input and output are. User placeholders as necessary.]
[If the examples are shorter than what a realistic example is expected to be, make a reference with () explaining how real examples should be longer / shorter / different. AND USE PLACEHOLDERS! ]

# Notes [optional]

[optional: edge cases, details, and an area to call or repeat out specific important considerations]

Only provide the output in the following JSON format enclosed in <json> tags:

<json>
{
"initial_prompt_evaluation": "Your evaluation of the initial prompt with Strengths and Weaknesses in a string on markdown bullet points format",
"refined_prompt": "Your refined prompt",
"explanation_of_refinements": "Explanation of the techniques used and improvements made, also include the extract of final prompt where it made. Answer in bullet points if accurate. Output in a single comprehensive string"
}
</json>
""",
        "examples": [
            "List American presidents",
            "Is nuclear energy good?"
        ]
    },
    "phor": {
        "name": "Phor Prompt",
        "description": "Employ this advanced approach when you need to combine multiple prompt engineering techniques. It's ideal for complex tasks requiring both clarity and sophisticated prompting methods. Select this over 'star' when you want a more flexible, technique-focused approach.",
        "template": """Create an effective prompt from this one:

Initial Prompt: [Insert initial prompt here]

Use these simple steps:

1. Look at the task closely, focusing on goals, needs, and limits.
2. Make prompts better by making language clear without changing the main idea.
3. Keep a logical flow by putting reasoning steps first.
4. Use good examples with [placeholders] for tricky parts.
5. Use simple words; remove unneeded instructions.
6. Use markdown for easy reading; skip code blocks unless needed.
7. Keep user content like guides and examples.
8. Add constants like guides and rubrics.
9. Clearly state output format including structure and syntax.

Only provide the output in the following JSON format enclosed in <json> tags:

<json>
{
"initial_prompt_evaluation": "Your evaluation of the initial prompt with Strengths and Weaknesses in a string as bullet points format",
"refined_prompt": "Your refined prompt",
"explanation_of_refinements": "Explanation of the techniques used and improvements made, also include the extract of final prompt where it made. Answer in bullet points if accurate. Output in a single comprehensive string"
}
</json>
""",
        "examples": [
            "How does a computer work?"
        ]
    },
    "bolism": {
        "name": "Bolism Prompt",
        "description": "Utilize this method when working with autoregressive language models and when the task requires careful reasoning before conclusions. It's best for prompts that need detailed output formatting. Choose this over others when the prompt's structure and reasoning order are crucial.",
        "template": """Given an initial prompt:

Initial Prompt: [Insert initial prompt here]

follow these steps to refine the prompt:

1. Analyze the prompt:
   - Identify the main topic and key concepts
   - Determine the type of task (e.g., math problem, logical reasoning, factual question)
   - Assess the complexity and any specific requirements

2. Evaluate the initial prompt:
   - Determine its strengths and weaknesses in relation to the query
   - Identify any missing elements or irrelevant information

3. Refine the prompt:
   - Retain relevant parts of the initial prompt
   - Add query-specific context or information
   - Incorporate appropriate reasoning frameworks (e.g., step-by-step, chain-of-thought)
   - Ensure clear instructions for the desired output format

4. Optimize for information flow:
   - Ensure the refined prompt allows for direct use of query information
   - Enable indirect information aggregation through prompt-guided reasoning

5. Enhance versatility:
   - Add elements that encourage flexible