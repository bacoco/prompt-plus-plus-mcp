const { spawn } = require('child_process');
const axios = require('axios');
const waitOn = require('wait-on');

describe('Full Integration Tests', () => {
  let mcpServer;
  let mcpBridge;

  beforeAll(async () => {
    console.log('Starting MCP Server...');
    mcpServer = spawn('npm', ['run', 'start:mcp'], {
      cwd: '/Users/loic/prompt-plus-plus-mcp',
      detached: false
    });

    // Wait for MCP server to start
    await waitOn({
      resources: ['tcp:3001'],
      timeout: 30000
    });

    console.log('Starting MCP Bridge...');
    mcpBridge = spawn('npm', ['run', 'start:bridge'], {
      cwd: '/Users/loic/prompt-plus-plus-mcp/UI',
      detached: false
    });

    // Wait for bridge to start
    await waitOn({
      resources: ['http://localhost:3002/health'],
      timeout: 30000
    });

    console.log('Services started successfully');
  }, 60000);

  afterAll(async () => {
    console.log('Stopping services...');
    if (mcpBridge) {
      mcpBridge.kill('SIGTERM');
    }
    if (mcpServer) {
      mcpServer.kill('SIGTERM');
    }
    
    // Wait for processes to terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('End-to-End Flow', () => {
    test('should complete full refinement workflow', async () => {
      // 1. Get strategies from MCP
      const strategiesResponse = await axios.get('http://localhost:3002/strategies');
      expect(strategiesResponse.status).toBe(200);
      expect(strategiesResponse.data.strategies.length).toBeGreaterThan(0);

      const firstStrategy = strategiesResponse.data.strategies[0];

      // 2. Refine a prompt with selected strategy
      const refinementResponse = await axios.post('http://localhost:3002/refine-with-strategy', {
        prompt: 'Create a function to sort an array',
        strategyId: firstStrategy.id,
        context: { language: 'JavaScript' }
      });

      expect(refinementResponse.status).toBe(200);
      expect(refinementResponse.data.refinedPrompt).toBeTruthy();
      expect(refinementResponse.data.refinedPrompt).not.toBe('Create a function to sort an array');

      // 3. Apply the refined prompt
      const applyResponse = await axios.post('http://localhost:3002/apply-prompt', {
        prompt: refinementResponse.data.refinedPrompt,
        options: { format: 'code' }
      });

      expect(applyResponse.status).toBe(200);
      expect(applyResponse.data.result).toBeTruthy();
    });

    test('should handle automatic strategy selection', async () => {
      const autoResponse = await axios.post('http://localhost:3002/automatic-metaprompt', {
        prompt: 'Design a database schema for a blog platform',
        context: {
          projectType: 'backend',
          database: 'PostgreSQL'
        }
      });

      expect(autoResponse.status).toBe(200);
      expect(autoResponse.data.strategy).toBeTruthy();
      expect(autoResponse.data.strategy.id).toBeTruthy();
      expect(autoResponse.data.refinedPrompt).toBeTruthy();
      expect(autoResponse.data.refinedPrompt.length).toBeGreaterThan(50);
    });

    test('should verify no static data in responses', async () => {
      // Make multiple requests to verify dynamic responses
      const prompts = [
        'Write a sorting algorithm',
        'Create a web server',
        'Design a REST API'
      ];

      const responses = await Promise.all(
        prompts.map(prompt => 
          axios.post('http://localhost:3002/automatic-metaprompt', {
            prompt,
            context: {}
          })
        )
      );

      // All responses should be different
      const refinedPrompts = responses.map(r => r.data.refinedPrompt);
      const uniquePrompts = new Set(refinedPrompts);
      expect(uniquePrompts.size).toBe(prompts.length);

      // Check for absence of static markers
      responses.forEach(response => {
        const responseText = JSON.stringify(response.data);
        expect(responseText).not.toContain('STATIC');
        expect(responseText).not.toContain('HARDCODED');
        expect(responseText).not.toContain('MOCK');
      });
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = Array(5).fill(null).map((_, index) => 
        axios.post('http://localhost:3002/refine-with-strategy', {
          prompt: `Concurrent request ${index}`,
          strategyId: 'morphosis',
          context: {}
        })
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data.refinedPrompt).toBeTruthy();
        expect(response.data.refinedPrompt).toContain(`request ${index}`);
      });
    });

    test('should maintain data consistency across endpoints', async () => {
      // Get strategies
      const strategiesResponse = await axios.get('http://localhost:3002/strategies');
      const strategyIds = strategiesResponse.data.strategies.map(s => s.id);

      // Try to use each strategy
      const validationPromises = strategyIds.slice(0, 3).map(strategyId =>
        axios.post('http://localhost:3002/refine-with-strategy', {
          prompt: 'Test prompt',
          strategyId,
          context: {}
        })
      );

      const results = await Promise.allSettled(validationPromises);
      
      // All should succeed since strategies exist
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        expect(result.value.status).toBe(200);
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle load efficiently', async () => {
      const startTime = Date.now();
      
      // Make 10 rapid requests
      const requests = Array(10).fill(null).map(() =>
        axios.get('http://localhost:3002/strategies')
      );

      await Promise.all(requests);
      
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (5 seconds for 10 requests)
      expect(duration).toBeLessThan(5000);
    });

    test('should cache appropriately', async () => {
      // First request - cold cache
      const start1 = Date.now();
      await axios.get('http://localhost:3002/strategies');
      const duration1 = Date.now() - start1;

      // Second request - should be faster if cached
      const start2 = Date.now();
      await axios.get('http://localhost:3002/strategies');
      const duration2 = Date.now() - start2;

      // Cache should make second request faster
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from temporary MCP errors', async () => {
      // This test would require ability to control MCP server
      // For now, we test that bridge handles errors gracefully
      
      try {
        // Invalid strategy ID should return proper error
        await axios.post('http://localhost:3002/refine-with-strategy', {
          prompt: 'Test',
          strategyId: 'definitely_invalid_strategy_id_12345',
          context: {}
        });
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBeTruthy();
      }

      // Should still work after error
      const response = await axios.get('http://localhost:3002/strategies');
      expect(response.status).toBe(200);
    });
  });
});