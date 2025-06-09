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
import { WorkflowFactory } from './workflow-factory.js';
import { logger } from './logger.js';

export class PromptPlusMCPServer {
  private server: Server;
  private strategyManager: StrategyManager;
  private promptRefiner: PromptRefiner;
  private workflowFactory: WorkflowFactory;

  constructor() {
    this.server = new Server(
      {
        name: 'prompt-plus-mcp',
        version: '3.1.0',
      },
      {
        capabilities: {
          prompts: {},
          tools: {},
        },
      }
    );

    // Get custom prompts directory from environment or use default
    const customPromptsDir = process.env.PROMPT_PLUS_CUSTOM_DIR;
    
    this.strategyManager = new StrategyManager(undefined, customPromptsDir);
    this.promptRefiner = new PromptRefiner(this.strategyManager);
    this.workflowFactory = new WorkflowFactory(this.strategyManager, this.promptRefiner);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = [];
      
      // Strategy-specific prompts
      for (const [key, strategy] of this.strategyManager.getAllStrategies()) {
        const prefix = strategy.source === 'custom' ? '[CUSTOM] ' : '';
        prompts.push({
          name: `refine_with_${key}`,
          description: `${prefix}Refine a prompt using ${strategy.name}: ${strategy.description}`,
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
            {
              name: 'source',
              description: 'Strategy source: "all" (default), "built-in", or "custom"',
              required: false,
            },
            {
              name: 'collection',
              description: 'Use strategies from a specific collection',
              required: false,
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
        },
        {
          name: 'step1_get_categories',
          description: 'Step 1 of 3: Get all available strategy categories with descriptions for LLM to choose from',
          arguments: [
            {
              name: 'user_prompt',
              description: 'The prompt that needs refinement (for context)',
              required: true,
            },
          ],
        },
        {
          name: 'step2_get_strategies',
          description: 'Step 2 of 3: Get all strategies from selected category for LLM to choose the best one',
          arguments: [
            {
              name: 'category_name',
              description: 'The selected category name',
              required: true,
            },
            {
              name: 'user_prompt',
              description: 'The original user prompt (for context)',
              required: true,
            },
          ],
        },
        {
          name: 'step3_execute_strategy',
          description: 'Step 3 of 3: Execute the selected strategy with the user prompt',
          arguments: [
            {
              name: 'strategy_key',
              description: 'The selected strategy key',
              required: true,
            },
            {
              name: 'user_prompt',
              description: 'The original user prompt to refine',
              required: true,
            },
          ],
        }
      );

      return { prompts };
    });

    // Get specific prompt using workflow factory
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;
      
      try {
        const result = await this.workflowFactory.handleWorkflow(name, args);
        return result as any; // Type assertion for MCP compatibility
      } catch (error) {
        logger.error('Prompt request failed', { 
          prompt: name, 
          error: error instanceof Error ? error.message : String(error) 
        });
        throw new Error(`Failed to handle prompt '${name}': ${error instanceof Error ? error.message : String(error)}`);
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
          {
            name: 'get_performance_metrics',
            description: 'Get performance metrics for strategy selection and usage',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'health_check',
            description: 'Check the health status of the server and strategy manager',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_custom_strategies',
            description: 'List all custom user-defined strategies with their categories',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_collections',
            description: 'List all strategy collections',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'manage_collection',
            description: 'Create, update, or delete strategy collections',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['create', 'delete', 'add_strategy', 'remove_strategy', 'update'],
                  description: 'Action to perform',
                },
                collection: {
                  type: 'string',
                  description: 'Collection key/identifier',
                },
                name: {
                  type: 'string',
                  description: 'Collection display name (for create/update)',
                },
                description: {
                  type: 'string',
                  description: 'Collection description (for create/update)',
                },
                strategy: {
                  type: 'string',
                  description: 'Strategy key (for add/remove)',
                },
              },
              required: ['action', 'collection'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
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
        } else if (name === 'get_performance_metrics') {
          return this.handleGetPerformanceMetrics();
        } else if (name === 'health_check') {
          return this.handleHealthCheck();
        } else if (name === 'list_custom_strategies') {
          return this.handleListCustomStrategies();
        } else if (name === 'list_collections') {
          return this.handleListCollections();
        } else if (name === 'manage_collection') {
          return this.handleManageCollection(args || {});
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error('Tool call failed', { 
          tool: name, 
          error: error instanceof Error ? error.message : String(error) 
        });
        throw error;
      }
    });
  }

  private async handleListStrategies() {
    const strategiesInfo: Record<string, any> = {};
    
    for (const [key, strategy] of this.strategyManager.getAllStrategies()) {
      strategiesInfo[key] = {
        name: strategy.name,
        description: strategy.description,
        prompt_name: `refine_with_${key}`,
        examples: strategy.examples.slice(0, 2),
        complexity: strategy.complexity,
        timeInvestment: strategy.timeInvestment,
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            strategies: strategiesInfo,
            total_count: Object.keys(strategiesInfo).length,
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
            complexity: strategy.complexity,
            timeInvestment: strategy.timeInvestment,
            triggers: strategy.triggers,
            bestFor: strategy.bestFor,
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

  private async handleGetPerformanceMetrics() {
    const metrics = this.promptRefiner.getPerformanceMetrics();
    const healthStatus = this.strategyManager.getHealthStatus();
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            performance_metrics: metrics,
            health_status: healthStatus,
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleHealthCheck() {
    const healthStatus = this.strategyManager.getHealthStatus();
    const cacheStats = this.strategyManager.getCacheStats();
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            server_status: 'running',
            strategy_manager: healthStatus,
            cache_stats: cacheStats,
            workflows_available: this.workflowFactory.getAvailableWorkflows(),
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleListCustomStrategies() {
    const customStrategies = this.strategyManager.getCustomStrategies();
    const customCategories = this.strategyManager.getCustomCategories();
    
    const strategiesByCategory: Record<string, any[]> = {};
    
    // Group custom strategies by category
    for (const [key, strategy] of customStrategies) {
      const category = strategy.customCategory || 'uncategorized';
      if (!strategiesByCategory[category]) {
        strategiesByCategory[category] = [];
      }
      strategiesByCategory[category].push({
        key: key,
        name: strategy.name,
        description: strategy.description,
        prompt_name: `refine_with_${key}`,
        complexity: strategy.complexity,
        timeInvestment: strategy.timeInvestment,
      });
    }
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            total_custom_strategies: customStrategies.size,
            custom_categories: customCategories,
            strategies_by_category: strategiesByCategory,
            usage_example: customStrategies.size > 0 
              ? `Use 'refine_with_${Array.from(customStrategies.keys())[0]}' prompt to use your first custom strategy`
              : 'No custom strategies found. Add JSON files to your custom-prompts directory.',
            custom_directory_hint: 'Set PROMPT_PLUS_CUSTOM_DIR environment variable or create ~/.prompt-plus-plus/custom-prompts/',
          }, null, 2),
        },
      ],
    };
  }

  private async handleListCollections() {
    const collectionsManager = this.strategyManager.getCollectionsManager();
    const collections = collectionsManager.getAllCollections();
    
    const collectionsInfo: Record<string, any> = {};
    
    for (const [key, collection] of Object.entries(collections)) {
      const validation = this.strategyManager.validateCollectionStrategies(key);
      collectionsInfo[key] = {
        name: collection.name,
        description: collection.description,
        strategy_count: collection.strategies.length,
        valid_strategies: validation.valid.length,
        invalid_strategies: validation.invalid,
        created: collection.created,
        updated: collection.updated,
        usage_example: `Use auto_refine prompt with user_prompt: "..." and collection: "${key}"`,
      };
    }
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            total_collections: Object.keys(collections).length,
            collections: collectionsInfo,
            usage_hint: 'Use manage_collection tool to create and manage collections',
            collections_file: 'Stored in ~/.prompt-plus-plus/collections.json',
          }, null, 2),
        },
      ],
    };
  }

  private async handleManageCollection(args: Record<string, any>) {
    const collectionsManager = this.strategyManager.getCollectionsManager();
    const { action, collection: collectionKey, name, description, strategy } = args;
    
    try {
      let result: any = {};
      
      switch (action) {
        case 'create':
          if (!name || !description) {
            throw new Error('Name and description are required for creating a collection');
          }
          collectionsManager.createCollection(collectionKey, name, description);
          result = {
            action: 'created',
            collection: collectionKey,
            message: `Collection '${collectionKey}' created successfully`,
          };
          break;
          
        case 'delete':
          collectionsManager.deleteCollection(collectionKey);
          result = {
            action: 'deleted',
            collection: collectionKey,
            message: `Collection '${collectionKey}' deleted successfully`,
          };
          break;
          
        case 'add_strategy':
          if (!strategy) {
            throw new Error('Strategy parameter is required for adding to collection');
          }
          // Validate strategy exists
          if (!this.strategyManager.getStrategy(strategy)) {
            throw new Error(`Strategy '${strategy}' not found`);
          }
          collectionsManager.addStrategyToCollection(collectionKey, strategy);
          result = {
            action: 'strategy_added',
            collection: collectionKey,
            strategy: strategy,
            message: `Strategy '${strategy}' added to collection '${collectionKey}'`,
          };
          break;
          
        case 'remove_strategy':
          if (!strategy) {
            throw new Error('Strategy parameter is required for removing from collection');
          }
          collectionsManager.removeStrategyFromCollection(collectionKey, strategy);
          result = {
            action: 'strategy_removed',
            collection: collectionKey,
            strategy: strategy,
            message: `Strategy '${strategy}' removed from collection '${collectionKey}'`,
          };
          break;
          
        case 'update':
          const updates: any = {};
          if (name !== undefined) updates.name = name;
          if (description !== undefined) updates.description = description;
          collectionsManager.updateCollection(collectionKey, updates);
          result = {
            action: 'updated',
            collection: collectionKey,
            updates: updates,
            message: `Collection '${collectionKey}' updated successfully`,
          };
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Collection management failed', { 
        action, 
        collection: collectionKey,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Prompt++ MCP Server running on stdio');
  }

  destroy(): void {
    try {
      this.strategyManager.destroy();
      logger.info('Server cleanup completed');
    } catch (error) {
      logger.error('Error during server cleanup', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

// Run the server
async function main() {
  let server: PromptPlusMCPServer | undefined;
  
  try {
    logger.info('Starting Prompt++ MCP Server', {
      version: process.version,
      cwd: process.cwd()
    });
    
    server = new PromptPlusMCPServer();
    await server.run();
    logger.info('Server started successfully');
  } catch (error) {
    logger.error('Server startup failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }

  // Cleanup on exit
  const cleanup = () => {
    if (server) {
      server.destroy();
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: String(promise)
  });
  process.exit(1);
});

// Main module detection and execution
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1].includes('prompt-plus-plus-mcp') ||
                     import.meta.url.includes('prompt-plus-plus-mcp');

if (isMainModule) {
  main().catch((error) => {
    logger.error('Main function error', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  });
}