import { PromptPlusMCPServer } from '../src/index.js';
import { StrategyManager } from '../src/strategy-manager.js';
import { PromptRefiner } from '../src/prompt-refiner.js';

describe('MCP Server Integration', () => {
  let server: PromptPlusMCPServer;

  beforeEach(() => {
    server = new PromptPlusMCPServer();
  });

  afterEach(() => {
    server.destroy();
  });

  describe('Server Initialization', () => {
    test('should initialize without errors', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(PromptPlusMCPServer);
    });

    test('should have strategy manager', () => {
      expect(server['strategyManager']).toBeDefined();
      expect(server['strategyManager']).toBeInstanceOf(StrategyManager);
    });

    test('should have prompt refiner', () => {
      expect(server['promptRefiner']).toBeDefined();
      expect(server['promptRefiner']).toBeInstanceOf(PromptRefiner);
    });

    test('should have workflow factory', () => {
      expect(server['workflowFactory']).toBeDefined();
    });
  });

  describe('Strategy Loading', () => {
    test('should load metaprompts', () => {
      const strategies = server['strategyManager'].getStrategyNames();
      expect(strategies.length).toBeGreaterThan(40);
      expect(strategies).toContain('morphosis');
      expect(strategies).toContain('architect');
      expect(strategies).toContain('reviewer');
    });

    test('should have proper strategy structure', () => {
      const strategy = server['strategyManager'].getStrategy('morphosis');
      expect(strategy).toBeDefined();
      expect(strategy).toHaveProperty('name');
      expect(strategy).toHaveProperty('description');
      expect(strategy).toHaveProperty('template');
      expect(strategy).toHaveProperty('examples');
      expect(strategy).toHaveProperty('complexity');
    });

    test('should support category-based filtering', () => {
      const categories = server['strategyManager'].getAllCategoriesMetadata();
      expect(Object.keys(categories).length).toBeGreaterThan(0);
      expect(categories).toHaveProperty('thinking_methodologies');
      expect(categories).toHaveProperty('creative_technical');
    });
  });

  describe('Prompt Refinement', () => {
    test('should refine prompts with specific strategy', async () => {
      const refiner = server['promptRefiner'];
      const userPrompt = 'Create a simple web application';
      const refinedPrompt = await refiner.refineWithStrategy(userPrompt, 'morphosis');
      
      expect(refinedPrompt).toBeDefined();
      expect(refinedPrompt.length).toBeGreaterThan(userPrompt.length);
      expect(refinedPrompt).toContain(userPrompt);
    });

    test('should handle invalid strategy gracefully', async () => {
      const refiner = server['promptRefiner'];
      const userPrompt = 'Test prompt';
      
      await expect(
        refiner.refineWithStrategy(userPrompt, 'invalid_strategy')
      ).rejects.toThrow();
    });

    test('should support auto-selection', async () => {
      const refiner = server['promptRefiner'];
      const userPrompt = 'Design a microservices architecture';
      const result = await refiner.autoRefine(userPrompt);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('refinedPrompt');
      expect(result).toHaveProperty('selectedStrategy');
      expect(result.selectedStrategy).toBe('architect');
    });
  });

  describe('Workflow Factory', () => {
    test('should handle step-based workflows', async () => {
      const factory = server['workflowFactory'];
      
      // Step 1: Get categories
      const step1Result = await factory.handleWorkflow('step1_get_categories', {
        user_prompt: 'Test prompt'
      });
      expect(step1Result).toHaveProperty('messages');
      
      // Step 2: Get strategies
      const step2Result = await factory.handleWorkflow('step2_get_strategies', {
        category_name: 'thinking_methodologies',
        user_prompt: 'Test prompt'
      });
      expect(step2Result).toHaveProperty('messages');
      
      // Step 3: Execute strategy
      const step3Result = await factory.handleWorkflow('step3_execute_strategy', {
        strategy_key: 'morphosis',
        user_prompt: 'Test prompt'
      });
      expect(step3Result).toHaveProperty('messages');
    });

    test('should handle comparison workflows', async () => {
      const factory = server['workflowFactory'];
      const result = await factory.handleWorkflow('compare_refinements', {
        user_prompt: 'Create a REST API',
        strategies: 'architect,reviewer,morphosis'
      });
      
      expect(result).toHaveProperty('messages');
      expect(result.messages[0].content).toContain('comparison');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing arguments', async () => {
      const factory = server['workflowFactory'];
      
      await expect(
        factory.handleWorkflow('refine_with_morphosis', {})
      ).rejects.toThrow('user_prompt is required');
    });

    test('should handle invalid workflow names', async () => {
      const factory = server['workflowFactory'];
      
      await expect(
        factory.handleWorkflow('invalid_workflow', { user_prompt: 'test' })
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should cache strategy lookups', () => {
      const manager = server['strategyManager'];
      const cacheStats = manager.getCacheStats();
      
      // First lookup
      manager.getStrategy('morphosis');
      const stats1 = manager.getCacheStats();
      expect(stats1.hits).toBe(cacheStats.hits);
      
      // Second lookup should hit cache
      manager.getStrategy('morphosis');
      const stats2 = manager.getCacheStats();
      expect(stats2.hits).toBe(stats1.hits + 1);
    });

    test('should track performance metrics', () => {
      const refiner = server['promptRefiner'];
      const metrics = refiner.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('totalRefinements');
      expect(metrics).toHaveProperty('averageTime');
      expect(metrics).toHaveProperty('strategyUsage');
    });
  });
});