import type { StrategyManager } from './strategy-manager.js';
import type { PromptRefiner } from './prompt-refiner.js';
import { logger } from './logger.js';

interface WorkflowResponse {
  messages: Array<{
    role: 'user' | 'assistant';
    content: {
      type: 'text';
      text: string;
    };
  }>;
}

export abstract class BaseWorkflowHandler {
  constructor(
    protected strategyManager: StrategyManager,
    protected promptRefiner: PromptRefiner
  ) {}

  abstract handle(args: Record<string, any>): Promise<WorkflowResponse>;

  protected createResponse(text: string): WorkflowResponse {
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text
          }
        }
      ]
    };
  }
}

export class AutoRefineHandler extends BaseWorkflowHandler {
  async handle(args: Record<string, any>): Promise<WorkflowResponse> {
    const userPrompt = args.user_prompt || '[User prompt will be inserted here]';
    
    try {
      // Get all strategies organized by category
      const allCategoriesMetadata = this.strategyManager.getAllCategoriesMetadata();
      
      const responseText = `You are an expert prompt engineer. Your task is to analyze the user's prompt and select the most appropriate strategy from all available options, then apply it.

**User's Prompt:** ${userPrompt}

**Available Strategy Categories & Options:**
${JSON.stringify(allCategoriesMetadata, null, 2)}

**Your Process:**
1. **Analyze the user's prompt** to understand its:
   - Domain (technical, creative, analytical, business, etc.)
   - Complexity level (simple, moderate, complex)
   - Key requirements and goals
   - Specific characteristics that would benefit from enhancement

2. **Review all available strategies** across all categories:
   - Core Strategies: General-purpose approaches
   - Software Development: Code and system design focused
   - AI Core Principles: Critical thinking frameworks
   - Vibe Coding Rules: AI-assisted development patterns
   - Advanced Thinking: Sophisticated reasoning methods

3. **Select the most appropriate strategy** based on:
   - Which strategy's "best_for" criteria match the prompt
   - Trigger keywords that apply to the prompt
   - Complexity level appropriate for the task
   - Expected improvements needed

4. **Apply the selected strategy** by:
   - Using the strategy's metaprompt template approach
   - Incorporating the strategy's specific enhancement techniques
   - Following the strategy's methodology completely

**Output Format:**
\`\`\`
SELECTED STRATEGY: [strategy_name]

REASONING: [Why this strategy is optimal for this specific prompt]

REFINED PROMPT:
[The enhanced prompt using the selected strategy's approach]

KEY IMPROVEMENTS:
- [List specific enhancements made]
- [Each improvement on a new line]
\`\`\`

**Important:** You must select and apply the strategy yourself - analyze all options and choose the one that best matches the user's prompt characteristics and requirements.`;

      return this.createResponse(responseText);
    } catch (error) {
      logger.error('Error in AutoRefineHandler', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

export class RefineWithHandler extends BaseWorkflowHandler {
  async handle(args: Record<string, any>): Promise<WorkflowResponse> {
    const userPrompt = args.user_prompt || '[User prompt will be inserted here]';
    const strategyKey = args.strategy_key;
    
    if (!strategyKey) {
      throw new Error('strategy_key is required for RefineWithHandler');
    }

    try {
      const strategy = this.strategyManager.getStrategy(strategyKey);
      
      if (!strategy) {
        throw new Error(`Strategy '${strategyKey}' not found`);
      }

      const metapromptTemplate = strategy.template.replace('[Insert initial prompt here]', userPrompt);
      
      const responseText = `You are an expert prompt engineer. Apply the '${strategy.name}' meta-prompt template to refine the following user prompt.

${strategy.description}

Process the meta-prompt completely and return a JSON response with:
1. initial_prompt_evaluation: Analysis of the original prompt's strengths and weaknesses
2. refined_prompt: The enhanced version
3. explanation_of_refinements: What was improved and why

Meta-prompt template:
${metapromptTemplate}

Remember to return your response in valid JSON format.`;

      return this.createResponse(responseText);
    } catch (error) {
      logger.error('Error in RefineWithHandler', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

export class CompareRefinementsHandler extends BaseWorkflowHandler {
  async handle(args: Record<string, any>): Promise<WorkflowResponse> {
    const userPrompt = args.user_prompt || '[User prompt will be inserted here]';
    const strategiesStr = args.strategies;
    
    try {
      let strategyInfo: Record<string, any> = {};
      
      if (strategiesStr) {
        // User specified strategies to compare
        const strategyKeys = strategiesStr.split(',').map((s: string) => s.trim());
        for (const key of strategyKeys.slice(0, 5)) { // Limit to 5 for readability
          const strategy = this.strategyManager.getStrategy(key);
          if (strategy) {
            strategyInfo[key] = {
              name: strategy.name,
              description: strategy.description,
              bestFor: strategy.bestFor,
              complexity: strategy.complexity,
              triggers: strategy.triggers
            };
          }
        }
      } else {
        // Present all categories for LLM to choose from
        const allCategoriesMetadata = this.strategyManager.getAllCategoriesMetadata();
        
        const responseText = `You are an expert prompt engineer. Your task is to select and compare the most relevant strategies for this prompt.

**User's Prompt:** ${userPrompt}

**Available Strategy Categories & Options:**
${JSON.stringify(allCategoriesMetadata, null, 2)}

**Your Process:**
1. **Analyze the user's prompt** to identify key characteristics
2. **Select 3-5 most relevant strategies** from different categories that could enhance this prompt
3. **Compare each selected strategy** in detail
4. **Recommend the best approach** with reasoning

**Output Format:**
\`\`\`json
{
  "prompt_analysis": "Brief analysis of the prompt's key characteristics",
  "selected_strategies": [
    {
      "strategy_key": "strategy_name",
      "strategy_name": "Display Name", 
      "category": "category_name",
      "suitability_score": 85,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "approach": "How this strategy would enhance the prompt"
    }
  ],
  "recommendation": {
    "best_strategy": "strategy_key",
    "reasoning": "Detailed explanation of why this is optimal",
    "expected_outcome": "What improvements this will provide"
  },
  "alternative": {
    "strategy": "alternative_strategy_key", 
    "when_to_use": "Scenarios where this alternative might be better"
  }
}
\`\`\`

**Important:** Select strategies that are actually relevant to the prompt. Consider domain, complexity, and specific enhancement needs.`;

        return this.createResponse(responseText);
      }
      
      // If specific strategies were provided, compare them
      const comparisonText = `You are an expert prompt engineer. Compare these specific strategies for the given prompt:

**User's Prompt:** ${userPrompt}

**Strategies to Compare:**
${JSON.stringify(strategyInfo, null, 2)}

**Your Task:**
Analyze each strategy's fit for this specific prompt and provide a detailed comparison.

**Output Format:**
\`\`\`json
{
  "prompt_analysis": "Analysis of the prompt's characteristics",
  "strategy_comparisons": {
    "strategy_key": {
      "suitability_score": 0-100,
      "strengths": ["list of strengths for this prompt"],
      "weaknesses": ["list of limitations for this prompt"], 
      "enhancement_approach": "How this strategy would improve the prompt"
    }
  },
  "recommendation": {
    "best_strategy": "strategy_key",
    "reasoning": "Why this strategy is optimal for this prompt",
    "sample_enhancement": "Brief example of how it would enhance the prompt"
  }
}
\`\`\``;

      return this.createResponse(comparisonText);
    } catch (error) {
      logger.error('Error in CompareRefinementsHandler', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

export class TwoStepWorkflowHandler extends BaseWorkflowHandler {
  async handlePrepareRefinement(args: Record<string, any>): Promise<WorkflowResponse> {
    const userPrompt = args.user_prompt || '[User prompt will be inserted here]';
    
    try {
      // Get all strategies organized by category
      const allCategoriesMetadata = this.strategyManager.getAllCategoriesMetadata();
      
      const responseText = `STEP 1: Strategy Selection and Metaprompt Preparation

**User's Prompt:** ${userPrompt}

**Available Strategy Categories & Options:**
${JSON.stringify(allCategoriesMetadata, null, 2)}

**Your Task:**
1. **Analyze the user's prompt** to understand its characteristics and requirements
2. **Select the most appropriate strategy** from all available options
3. **Prepare metaprompt execution instructions** for the next step

**Process:**
- Review all strategy categories and their available options
- Consider which strategy's approach would best enhance this specific prompt
- Look at "best_for" criteria, triggers, and complexity levels
- Choose the strategy that provides the most relevant improvements

**Output Format:**
\`\`\`
STEP 1 COMPLETE: Strategy Selected for Prompt Refinement

SELECTED STRATEGY: [strategy_name] ([category])
REASONING: [Why this strategy is optimal for this prompt]

METAPROMPT INSTRUCTIONS:
Apply the [strategy_name] methodology to enhance the user's prompt. This strategy focuses on [strategy's key approach] and is designed for [strategy's best use cases].

Key enhancement areas to address:
- [List 3-5 specific improvements this strategy provides]
- [Each should be relevant to the user's prompt]

Process the prompt using [strategy_name] principles and provide a comprehensive enhancement that incorporates [strategy's specific techniques].

ORIGINAL PROMPT: ${userPrompt}

NEXT STEP: Execute this metaprompt analysis, then use the 'execute_refinement' prompt with your results.
\`\`\`

**Important:** Select the strategy that best matches the prompt's needs - you have access to all 44+ strategies across 5 categories.`;

      return this.createResponse(responseText);
    } catch (error) {
      logger.error('Error in prepare refinement', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async handleExecuteRefinement(args: Record<string, any>): Promise<WorkflowResponse> {
    const metapromptResults = args.metaprompt_results;
    const originalPrompt = args.original_prompt || args.user_prompt || '[Original prompt not provided]';
    
    if (!metapromptResults) {
      throw new Error('metaprompt_results is required for execute_refinement');
    }

    try {
      const responseText = `STEP 2: Final refinement processing.

**Task:** Extract the refined prompt from the metaprompt execution results and format it as the final output.

**Original Prompt:** ${originalPrompt}

**Metaprompt Execution Results:**
${metapromptResults}

**Your Task:** 
1. Analyze the metaprompt execution results above
2. Extract the key improvements and refined prompt
3. Return a clean, final refined prompt that incorporates all the enhancements
4. Provide a brief summary of the key improvements made

**Format your response as:**
\`\`\`
REFINED PROMPT:
[The final, polished prompt ready for use]

IMPROVEMENTS SUMMARY:
[Brief summary of key enhancements made]
\`\`\``;

      return this.createResponse(responseText);
    } catch (error) {
      logger.error('Error in execute refinement', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async handle(args: Record<string, any>): Promise<WorkflowResponse> {
    throw new Error('TwoStepWorkflowHandler requires specific step methods');
  }
}

export class ThreeStepWorkflowHandler extends BaseWorkflowHandler {
  async handleStep1GetCategories(args: Record<string, any>): Promise<WorkflowResponse> {
    const userPrompt = args.user_prompt || '[User prompt will be inserted here]';
    
    try {
      const categoryMetadata = this.strategyManager.getAllCategoriesMetadata();
      
      const responseText = `STEP 1 of 3: Category Selection for Prompt Refinement

**Your Task:** Analyze the user's prompt and select the most appropriate strategy category.

**User's Prompt:** ${userPrompt}

**Available Categories:**
${JSON.stringify(categoryMetadata, null, 2)}

**Instructions:**
1. Analyze the user's prompt to understand its nature, complexity, and requirements
2. Review each category's description, use_cases, and available strategies
3. Select the category that best matches the prompt's needs
4. Return your selection in this exact format:

\`\`\`json
{
  "selected_category": "category_name",
  "reasoning": "Explanation of why this category is best suited for the prompt",
  "analysis": "Brief analysis of the prompt's characteristics that led to this choice"
}
\`\`\`

**Remember:** Choose the category that will provide the most relevant and effective strategies for this specific prompt.`;

      return this.createResponse(responseText);
    } catch (error) {
      logger.error('Error in step 1 get categories', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async handleStep2GetStrategies(args: Record<string, any>): Promise<WorkflowResponse> {
    const categoryName = args.category_name;
    const userPrompt = args.user_prompt || '[User prompt will be inserted here]';
    
    if (!categoryName) {
      throw new Error('category_name is required for step2_get_strategies');
    }

    try {
      const categoryMetadata = this.strategyManager.getAllCategoriesMetadata()[categoryName];
      
      if (!categoryMetadata) {
        throw new Error(`Category '${categoryName}' not found`);
      }

      const responseText = `STEP 2 of 3: Strategy Selection from ${categoryMetadata.category}

**Your Task:** Select the best strategy from the ${categoryName} category for refining this prompt.

**User's Prompt:** ${userPrompt}

**Category Description:** ${categoryMetadata.description}

**Available Strategies in ${categoryMetadata.category}:**
${JSON.stringify(categoryMetadata.strategies, null, 2)}

**Instructions:**
1. Analyze how each strategy's "best_for" criteria matches the user's prompt
2. Consider the complexity level and time investment appropriate for this task
3. Look at trigger keywords that might apply to the prompt
4. Select the most suitable strategy
5. Return your selection in this exact format:

\`\`\`json
{
  "selected_strategy": "strategy_key",
  "strategy_name": "Strategy Display Name",
  "reasoning": "Detailed explanation of why this strategy is optimal for this prompt",
  "expected_improvements": "What specific improvements this strategy will provide"
}
\`\`\`

**Remember:** Choose the strategy that will be most effective for the specific characteristics and requirements of this prompt.`;

      return this.createResponse(responseText);
    } catch (error) {
      logger.error('Error in step 2 get strategies', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async handleStep3ExecuteStrategy(args: Record<string, any>): Promise<WorkflowResponse> {
    const strategyKey = args.strategy_key;
    const userPrompt = args.user_prompt || '[User prompt will be inserted here]';
    
    if (!strategyKey) {
      throw new Error('strategy_key is required for step3_execute_strategy');
    }

    try {
      const strategy = this.strategyManager.getStrategy(strategyKey);
      
      if (!strategy) {
        throw new Error(`Strategy '${strategyKey}' not found`);
      }

      const metapromptTemplate = strategy.template.replace('[Insert initial prompt here]', userPrompt);
      
      const responseText = `STEP 3 of 3: Execute Selected Strategy - ${strategy.name}

**Strategy Description:** ${strategy.description}

**Original User Prompt:** ${userPrompt}

**Your Task:** Apply the following meta-prompt template to produce a refined, enhanced version of the user's prompt.

**Meta-prompt Template:**
---
${metapromptTemplate}
---

**Instructions:**
1. Process the meta-prompt template completely and thoroughly
2. Apply all the enhancement techniques specified in the template
3. Return a final, polished, ready-to-use refined prompt
4. Format your response as:

\`\`\`
REFINED PROMPT:
[The final enhanced prompt, ready for immediate use]

KEY IMPROVEMENTS:
- [List the main enhancements made]
- [Each improvement on a new line]

STRATEGY APPLIED: ${strategy.name}
\`\`\`

**Goal:** Produce a significantly improved prompt that incorporates all the enhancements from the ${strategy.name} methodology.`;

      return this.createResponse(responseText);
    } catch (error) {
      logger.error('Error in step 3 execute strategy', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async handle(args: Record<string, any>): Promise<WorkflowResponse> {
    throw new Error('ThreeStepWorkflowHandler requires specific step methods');
  }
}

export class WorkflowFactory {
  private handlers: Map<string, BaseWorkflowHandler> = new Map();

  constructor(strategyManager: StrategyManager, promptRefiner: PromptRefiner) {
    // Register handlers
    this.handlers.set('auto_refine', new AutoRefineHandler(strategyManager, promptRefiner));
    this.handlers.set('refine_with', new RefineWithHandler(strategyManager, promptRefiner));
    this.handlers.set('compare_refinements', new CompareRefinementsHandler(strategyManager, promptRefiner));
    
    const twoStepHandler = new TwoStepWorkflowHandler(strategyManager, promptRefiner);
    this.handlers.set('prepare_refinement', twoStepHandler);
    this.handlers.set('execute_refinement', twoStepHandler);
    
    const threeStepHandler = new ThreeStepWorkflowHandler(strategyManager, promptRefiner);
    this.handlers.set('step1_get_categories', threeStepHandler);
    this.handlers.set('step2_get_strategies', threeStepHandler);
    this.handlers.set('step3_execute_strategy', threeStepHandler);
  }

  async handleWorkflow(name: string, args: Record<string, any>): Promise<WorkflowResponse> {
    try {
      if (name.startsWith('refine_with_')) {
        const strategyKey = name.replace('refine_with_', '');
        const handler = this.handlers.get('refine_with');
        if (!handler) {
          throw new Error('RefineWithHandler not found');
        }
        return await handler.handle({ ...args, strategy_key: strategyKey });
      }

      // Handle two-step workflow methods
      if (name === 'prepare_refinement') {
        const handler = this.handlers.get('prepare_refinement') as TwoStepWorkflowHandler;
        return await handler.handlePrepareRefinement(args);
      }

      if (name === 'execute_refinement') {
        const handler = this.handlers.get('execute_refinement') as TwoStepWorkflowHandler;
        return await handler.handleExecuteRefinement(args);
      }

      // Handle three-step workflow methods
      if (name === 'step1_get_categories') {
        const handler = this.handlers.get('step1_get_categories') as ThreeStepWorkflowHandler;
        return await handler.handleStep1GetCategories(args);
      }

      if (name === 'step2_get_strategies') {
        const handler = this.handlers.get('step2_get_strategies') as ThreeStepWorkflowHandler;
        return await handler.handleStep2GetStrategies(args);
      }

      if (name === 'step3_execute_strategy') {
        const handler = this.handlers.get('step3_execute_strategy') as ThreeStepWorkflowHandler;
        return await handler.handleStep3ExecuteStrategy(args);
      }

      const handler = this.handlers.get(name);
      if (!handler) {
        throw new Error(`Unknown workflow: ${name}`);
      }

      return await handler.handle(args);
    } catch (error) {
      logger.error('Workflow execution failed', { 
        workflow: name, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  getAvailableWorkflows(): string[] {
    return Array.from(this.handlers.keys());
  }
}