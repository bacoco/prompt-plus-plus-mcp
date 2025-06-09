#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { StrategyManager } from './strategy-manager.js';
import { PromptRefiner } from './prompt-refiner.js';

export class PromptPlusMCPServer {
  private server: Server;
  private strategyManager: StrategyManager;
  private promptRefiner: PromptRefiner;

  constructor() {
    this.server = new Server(
      {
        name: 'prompt-plus-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          prompts: {},
          tools: {},
        },
      }
    );

    this.strategyManager = new StrategyManager();
    this.promptRefiner = new PromptRefiner(this.strategyManager);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = [];
      
      // Strategy-specific prompts
      for (const [key, strategy] of this.strategyManager.getAllStrategies()) {
        prompts.push({
          name: `refine_with_${key}`,
          description: `Refine a prompt using ${strategy.name}: ${strategy.description}`,
          arguments: [
            {
              name: 'user_prompt',
              description: 'The prompt to refine',
              required: true,
            },
          ],
        });
      }

      // Special prompts
      prompts.push(
        {
          name: 'auto_refine',
          description: 'Automatically select the best strategy and refine the prompt',
          arguments: [
            {
              name: 'user_prompt',
              description: 'The prompt to refine',
              required: true,
            },
          ],
        },
        {
          name: 'compare_refinements',
          description: 'Compare multiple refinement strategies for a prompt',
          arguments: [
            {
              name: 'user_prompt',
              description: 'The prompt to refine',
              required: true,
            },
            {
              name: 'strategies',
              description: 'Comma-separated list of strategies to compare (optional)',
              required: false,
            },
          ],
        },
        {
          name: 'prepare_refinement',
          description: 'Step 1: Analyze user prompt and return metaprompt execution instructions',
          arguments: [
            {
              name: 'user_prompt',
              description: 'The prompt to prepare for refinement',
              required: true,
            },
          ],
        },
        {
          name: 'execute_refinement',
          description: 'Step 2: Process metaprompt results and return final refined prompt',
          arguments: [
            {
              name: 'metaprompt_results',
              description: 'The results from executing the metaprompt',
              required: true,
            },
            {
              name: 'original_prompt',
              description: 'The original user prompt (for context)',
              required: true,
            },
          ],
        }
      );

      return { prompts };
    });

    // Get specific prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;
      const userPrompt = args.user_prompt || '[User prompt will be inserted here]';

      if (name === 'auto_refine') {
        return this.handleAutoRefine(userPrompt);
      } else if (name.startsWith('refine_with_')) {
        return this.handleRefineWith(name, userPrompt);
      } else if (name === 'compare_refinements') {
        return this.handleCompareRefinements(userPrompt, args.strategies);
      } else if (name === 'prepare_refinement') {
        return this.handlePrepareRefinement(userPrompt);
      } else if (name === 'execute_refinement') {
        return this.handleExecuteRefinement(args.metaprompt_results, args.original_prompt || userPrompt);
      } else {
        throw new Error(`Unknown prompt: ${name}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_strategies',
            description: 'List all available metaprompt strategies with descriptions',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_strategy_details',
            description: 'Get detailed information about a specific strategy',
            inputSchema: {
              type: 'object',
              properties: {
                strategy: {
                  type: 'string',
                  enum: this.strategyManager.getStrategyNames(),
                  description: 'The strategy to get details for',
                },
              },
              required: ['strategy'],
            },
          },
          {
            name: 'discover_strategies',
            description: 'Get comprehensive metadata about all strategy categories and their available strategies for intelligent selection',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'list_strategies') {
        return this.handleListStrategies();
      } else if (name === 'get_strategy_details') {
        const strategy = args?.strategy as string;
        if (!strategy) {
          throw new Error('Strategy parameter is required');
        }
        return this.handleGetStrategyDetails(strategy);
      } else if (name === 'discover_strategies') {
        return this.handleDiscoverStrategies();
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleAutoRefine(userPrompt: string) {
    const autoResult = this.promptRefiner.autoSelectStrategy(userPrompt);
    const strategy = this.strategyManager.getStrategy(autoResult.recommended_strategy);
    
    if (!strategy) {
      throw new Error(`Strategy '${autoResult.recommended_strategy}' not found`);
    }

    const metapromptTemplate = strategy.template.replace('[Insert initial prompt here]', userPrompt);
    
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `You are an expert prompt engineer. Based on the analysis, the '${strategy.name}' strategy is most suitable for this prompt because: ${autoResult.reason}.

Apply the following meta-prompt template to refine the user's prompt. Process it completely and return a JSON response with:
1. initial_prompt_evaluation: Analysis of the original prompt's strengths and weaknesses
2. refined_prompt: The enhanced version
3. explanation_of_refinements: What was improved and why

Meta-prompt template:
${metapromptTemplate}

Remember to return your response in valid JSON format.`,
          },
        },
      ],
    };
  }

  private async handleRefineWith(name: string, userPrompt: string) {
    const strategyKey = name.replace('refine_with_', '');
    const strategy = this.strategyManager.getStrategy(strategyKey);
    
    if (!strategy) {
      throw new Error(`Strategy '${strategyKey}' not found`);
    }

    const metapromptTemplate = strategy.template.replace('[Insert initial prompt here]', userPrompt);
    
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `You are an expert prompt engineer. Apply the '${strategy.name}' meta-prompt template to refine the following user prompt.

${strategy.description}

Process the meta-prompt completely and return a JSON response with:
1. initial_prompt_evaluation: Analysis of the original prompt's strengths and weaknesses
2. refined_prompt: The enhanced version
3. explanation_of_refinements: What was improved and why

Meta-prompt template:
${metapromptTemplate}

Remember to return your response in valid JSON format.`,
          },
        },
      ],
    };
  }

  private async handleCompareRefinements(userPrompt: string, strategiesStr?: string) {
    let strategyKeys: string[];
    
    if (strategiesStr) {
      strategyKeys = strategiesStr.split(',').map(s => s.trim());
    } else {
      const autoResult = this.promptRefiner.autoSelectStrategy(userPrompt);
      strategyKeys = [
        autoResult.recommended_strategy,
        autoResult.alternative,
        'physics' // Default third option
      ];
    }

    let comparisonText = 'You are an expert prompt engineer. Compare the following refinement strategies for the given prompt:\n\n';
    comparisonText += `Original prompt: ${userPrompt}\n\n`;
    
    for (const key of strategyKeys.slice(0, 3)) {
      const strategy = this.strategyManager.getStrategy(key);
      if (strategy) {
        comparisonText += `**Strategy: ${strategy.name}**\n`;
        comparisonText += `Description: ${strategy.description}\n`;
        comparisonText += `Approach: Apply this template and evaluate effectiveness\n\n`;
      }
    }
    
    comparisonText += `Analyze each strategy and return a JSON response with:
1. comparisons: Object with each strategy's strengths, weaknesses, and suitability score (0-100)
2. recommendation: The best strategy key
3. reasoning: Why this strategy is best for this specific prompt
4. sample_refinement: A brief example of how the recommended strategy would enhance the prompt

Return your response in valid JSON format.`;

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: comparisonText,
          },
        },
      ],
    };
  }

  private async handlePrepareRefinement(userPrompt: string) {
    const autoResult = this.promptRefiner.autoSelectStrategy(userPrompt);
    const strategy = this.strategyManager.getStrategy(autoResult.recommended_strategy);
    
    if (!strategy) {
      throw new Error(`Strategy '${autoResult.recommended_strategy}' not found`);
    }

    const metapromptTemplate = strategy.template.replace('[Insert initial prompt here]', userPrompt);
    
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `STEP 1 COMPLETE: Metaprompt preparation for prompt refinement.

**Analysis Results:**
- Selected Strategy: ${strategy.name}
- Reason: ${autoResult.reason}
- Alternative: ${autoResult.alternative_name}

**Instructions for Next Step:**
Execute the following metaprompt and return the results to the \`execute_refinement\` prompt:

---
${metapromptTemplate}
---

**Expected Output:** Process this metaprompt completely and provide your detailed analysis and refined prompt. Then call the \`execute_refinement\` prompt with your results to get the final refined prompt.

**Original Prompt (for reference):** ${userPrompt}`,
          },
        },
      ],
    };
  }

  private async handleExecuteRefinement(metapromptResults: string, originalPrompt: string) {
    if (!metapromptResults) {
      throw new Error('metaprompt_results is required for execute_refinement');
    }

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `STEP 2: Final refinement processing.

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
\`\`\``,
          },
        },
      ],
    };
  }

  private async handleListStrategies() {
    const strategiesInfo: Record<string, any> = {};
    
    for (const [key, strategy] of this.strategyManager.getAllStrategies()) {
      strategiesInfo[key] = {
        name: strategy.name,
        description: strategy.description,
        prompt_name: `refine_with_${key}`,
        examples: strategy.examples.slice(0, 2),
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            strategies: strategiesInfo,
            usage: "Use the prompt name (e.g., 'refine_with_star') to refine prompts with that strategy",
            auto_refine: "Use 'auto_refine' prompt to automatically select the best strategy",
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetStrategyDetails(strategyKey: string) {
    const strategy = this.strategyManager.getStrategy(strategyKey);
    
    if (!strategy) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ error: `Strategy '${strategyKey}' not found` }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            key: strategyKey,
            name: strategy.name,
            description: strategy.description,
            examples: strategy.examples,
            prompt_name: `refine_with_${strategyKey}`,
            template_preview: strategy.template.length > 200 
              ? strategy.template.substring(0, 200) + '...' 
              : strategy.template,
          }, null, 2),
        },
      ],
    };
  }

  private async handleDiscoverStrategies() {
    const categoryMetadata = this.strategyManager.getAllCategoriesMetadata();
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            total_strategies: this.strategyManager.getStrategyNames().length,
            categories: categoryMetadata,
            usage: {
              selection_process: "1. Review category descriptions and use cases. 2. Examine individual strategies within relevant categories. 3. Select the most appropriate strategy based on triggers and best_for criteria.",
              trigger_keywords: "Each strategy lists trigger keywords that indicate when it should be used",
              complexity_levels: "Strategies are rated as Low/Medium/High complexity with corresponding time investment",
              prompt_naming: "Use 'refine_with_[strategy_key]' to apply a specific strategy (e.g., 'refine_with_assumption_detector')"
            },
            auto_selection: "Use 'auto_refine' for automatic strategy selection based on keyword analysis"
          }, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Prompt++ MCP Server running on stdio');
  }
}

// Debug: Add immediate logging
console.error('🔥 SCRIPT STARTED - prompt-plus-plus-mcp');
console.error('🔥 Node version:', process.version);
console.error('🔥 Process argv:', process.argv);
console.error('🔥 Working directory:', process.cwd());

// Run the server
async function main() {
  try {
    console.error('🚀 Starting Prompt++ MCP Server...');
    console.error('🔍 About to create PromptPlusMCPServer instance...');
    
    const server = new PromptPlusMCPServer();
    console.error('📡 Server instance created, connecting to transport...');
    
    await server.run();
    console.error('✅ Server running successfully');
  } catch (error) {
    console.error('❌ Server startup error:', error);
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  console.error('💥 Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Check if this is the main module
console.error('🔥 Checking if main module...');
console.error('🔥 import.meta.url:', import.meta.url);
console.error('🔥 process.argv[1]:', process.argv[1]);

// More flexible main module detection
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1].includes('prompt-plus-plus-mcp') ||
                     import.meta.url.includes('prompt-plus-plus-mcp');

console.error('🔥 isMainModule:', isMainModule);

if (isMainModule) {
  console.error('🔥 Running as main module');
  main().catch((error) => {
    console.error('💥 Main function error:', error);
    process.exit(1);
  });
} else {
  console.error('🔥 NOT running as main module - forcing main anyway');
  // Force run as main since this is clearly the MCP server
  main().catch((error) => {
    console.error('💥 Main function error:', error);
    process.exit(1);
  });
}