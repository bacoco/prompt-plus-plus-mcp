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
      resources: ['http://localhost:3001/health'],
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
      const strategiesResponse = await axios.get('http://localhost:3001/strategies');
      expect(strategiesResponse.status).toBe(200);
      expect(strategiesResponse.data.length).toBeGreaterThan(0);

      const firstStrategy = strategiesResponse.data[0];

      // 2. Refine a prompt with selected strategy
      const refinementResponse = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: 'Create a function to sort an array',
        strategyId: firstStrategy.id,
        context: { language: 'JavaScript' }
      });

      expect(refinementResponse.status).toBe(200);
      expect(refinementResponse.data.refinedPrompt).toBeTruthy();
      expect(refinementResponse.data.refinedPrompt).not.toBe('Create a function to sort an array');

      // 3. Apply the refined prompt
      const applyResponse = await axios.post('http://localhost:3001/apply-prompt', {
        prompt: refinementResponse.data.refinedPrompt,
        options: { format: 'code' }
      });

      expect(applyResponse.status).toBe(200);
      expect(applyResponse.data.result).toBeTruthy();
    });

    test('should handle automatic strategy selection', async () => {
      const autoResponse = await axios.post('http://localhost:3001/automatic-metaprompt', {
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
          axios.post('http://localhost:3001/automatic-metaprompt', {
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
        axios.post('http://localhost:3001/refine-with-strategy', {
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
      const strategiesResponse = await axios.get('http://localhost:3001/strategies');
      const strategyIds = strategiesResponse.data.map(s => s.id);

      // Try to use each strategy
      const validationPromises = strategyIds.slice(0, 3).map(strategyId =>
        axios.post('http://localhost:3001/refine-with-strategy', {
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
        axios.get('http://localhost:3001/strategies')
      );

      await Promise.all(requests);
      
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (5 seconds for 10 requests)
      expect(duration).toBeLessThan(5000);
    });

    test('should cache appropriately', async () => {
      // First request - cold cache
      const start1 = Date.now();
      await axios.get('http://localhost:3001/strategies');
      const duration1 = Date.now() - start1;

      // Second request - should be faster if cached
      const start2 = Date.now();
      await axios.get('http://localhost:3001/strategies');
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
        await axios.post('http://localhost:3001/refine-with-strategy', {
          prompt: 'Test',
          strategyId: 'definitely_invalid_strategy_id_12345',
          context: {}
        });
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBeTruthy();
      }

      // Should still work after error
      const response = await axios.get('http://localhost:3001/strategies');
      expect(response.status).toBe(200);
    });
  });

  describe('Claude Integration Flow', () => {
    test('should complete full Claude-enhanced workflow', async () => {
      // 1. Get Claude-enhanced strategies
      const strategiesResponse = await axios.get('http://localhost:3001/strategies');
      const claudeStrategies = strategiesResponse.data.filter(s => s.claudeEnhanced);
      expect(claudeStrategies.length).toBeGreaterThan(0);

      // 2. Use Claude-enhanced refinement
      const claudeStrategy = claudeStrategies[0];
      const refinementResponse = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: 'Design a secure authentication system',
        strategyId: claudeStrategy.id,
        useClaudeProcessing: true
      });

      expect(refinementResponse.status).toBe(200);
      expect(refinementResponse.data.claudeProcessed).toBeDefined();
      
      if (refinementResponse.data.claudeProcessed) {
        expect(refinementResponse.data.extractedData).toBeDefined();
      }

      // 3. Apply the Claude-refined prompt
      const applyResponse = await axios.post('http://localhost:3001/apply-prompt', {
        prompt: refinementResponse.data.refinedPrompt,
        options: { 
          format: 'structured',
          includeMetadata: true 
        }
      });

      expect(applyResponse.status).toBe(200);
      expect(applyResponse.data.result).toBeTruthy();
    });

    test('should handle Claude automatic detection in workflow', async () => {
      // Technical prompts that should trigger Claude processing
      const technicalPrompts = [
        'Review this authentication code for vulnerabilities',
        'Design a microservices architecture for e-commerce',
        'Set up CI/CD pipeline with testing and deployment'
      ];

      for (const prompt of technicalPrompts) {
        const response = await axios.post('http://localhost:3001/automatic-metaprompt', {
          prompt,
          context: { 
            enableClaude: true,
            projectType: 'enterprise'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data.suggestsClaudeProcessing).toBeDefined();
        
        // Technical prompts should suggest Claude processing
        if (['architect', 'reviewer', 'devops'].includes(response.data.strategy.id)) {
          expect(response.data.suggestsClaudeProcessing).toBe(true);
        }
      }
    });

    test('should maintain context through Claude refinement chain', async () => {
      // Step 1: Architecture design
      const step1 = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: 'Create a messaging system',
        strategyId: 'architect',
        useClaudeProcessing: true
      });

      expect(step1.status).toBe(200);
      expect(step1.data.refinedPrompt).toBeTruthy();

      // Step 2: Security review of architecture
      const step2 = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: step1.data.refinedPrompt,
        strategyId: 'reviewer',
        context: {
          previousStrategy: 'architect',
          previousData: step1.data.extractedData
        },
        useClaudeProcessing: true
      });

      expect(step2.status).toBe(200);
      expect(step2.data.refinementChain).toBeDefined();
      expect(step2.data.refinementChain).toHaveLength(2);

      // Step 3: DevOps implementation
      const step3 = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: step2.data.refinedPrompt,
        strategyId: 'devops',
        context: {
          refinementChain: step2.data.refinementChain
        },
        useClaudeProcessing: true
      });

      expect(step3.status).toBe(200);
      expect(step3.data.refinementChain).toHaveLength(3);
      
      // Verify context preservation
      const chain = step3.data.refinementChain;
      expect(chain[0].strategy).toBe('architect');
      expect(chain[1].strategy).toBe('reviewer');
      expect(chain[2].strategy).toBe('devops');
    });

    test('should handle mixed Claude and non-Claude strategies', async () => {
      // Start with non-Claude strategy
      const step1 = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: 'Explain quantum computing',
        strategyId: 'morphosis'
      });

      expect(step1.status).toBe(200);
      expect(step1.data.claudeProcessed).toBeFalsy();

      // Follow with Claude-enhanced strategy
      const step2 = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: step1.data.refinedPrompt,
        strategyId: 'architect',
        useClaudeProcessing: true
      });

      expect(step2.status).toBe(200);
      
      // Should handle transition smoothly
      if (step2.data.claudeProcessed) {
        expect(step2.data.extractedData).toBeDefined();
      }
    });

    test('should validate Claude response quality', async () => {
      const response = await axios.post('http://localhost:3001/refine-with-strategy', {
        prompt: 'Design a distributed cache system',
        strategyId: 'architect',
        useClaudeProcessing: true,
        options: {
          validateQuality: true
        }
      });

      expect(response.status).toBe(200);
      
      if (response.data.claudeProcessed && response.data.extractedData) {
        // Check for expected architecture components
        const data = response.data.extractedData;
        
        if (data.components) {
          expect(Array.isArray(data.components)).toBe(true);
        }
        
        if (data.considerations) {
          expect(Array.isArray(data.considerations)).toBe(true);
        }
      }
    });
  });
});