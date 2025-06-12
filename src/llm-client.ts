import { logger } from './logger.js';

export interface LLMResponse {
  text: string;
  rawResponse?: any;
}

/**
 * LLMClient prepares prompts for Claude processing through MCP.
 * The actual LLM interaction happens through the MCP protocol when
 * Claude receives these prepared prompts.
 */
export class LLMClient {
  constructor() {
    logger.info('LLM Client initialized for MCP prompt preparation');
  }

  /**
   * Prepares a prompt for Claude processing.
   * In the MCP context, this returns the formatted prompt that Claude
   * will process when the user interacts with the MCP server.
   */
  async sendPrompt(prompt: string): Promise<LLMResponse> {
    try {
      logger.debug('Preparing prompt for Claude', { promptLength: prompt.length });
      
      // Return the formatted prompt for Claude to process
      // The actual LLM processing happens when Claude receives this through MCP
      return {
        text: prompt,
        rawResponse: { prompt, prepared: true }
      };
    } catch (error) {
      logger.error('Failed to prepare prompt', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Formats a prompt with additional context for better Claude processing
   */
  private formatPromptForClaude(prompt: string, context?: any): string {
    const formattedPrompt = `${prompt}

---
Note: This prompt has been prepared by the prompt-plus-plus-mcp server for enhanced processing.`;
    
    if (context?.strategy) {
      return `${formattedPrompt}\nStrategy: ${context.strategy.name}`;
    }
    
    return formattedPrompt;
  }

  async processMetaprompt(
    userPrompt: string,
    strategy: any,
    type: 'refine' | 'auto' = 'refine'
  ): Promise<LLMResponse> {
    let fullPrompt: string;

    if (type === 'refine') {
      const metapromptTemplate = strategy.template.replace('[Insert initial prompt here]', userPrompt);
      
      fullPrompt = `You are an expert prompt engineer. Apply the '${strategy.name}' meta-prompt template to refine the following user prompt.

${strategy.description}

Process the meta-prompt completely and return a JSON response with:
1. initial_prompt_evaluation: Analysis of the original prompt's strengths and weaknesses
2. refined_prompt: The enhanced version
3. explanation_of_refinements: What was improved and why

Meta-prompt template:
${metapromptTemplate}

Remember to return your response in valid JSON format.`;
    } else {
      // Auto-refine logic
      fullPrompt = `You are an expert prompt engineer. Analyze this prompt and select the best strategy to enhance it:

User Prompt: ${userPrompt}

Available Strategies: [Strategies would be listed here]

Select the most appropriate strategy and apply it to create an enhanced version of the prompt.`;
    }

    return await this.sendPrompt(fullPrompt);
  }
}

// Singleton instance
export const llmClient = new LLMClient();