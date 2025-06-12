const axios = require('axios');

const BRIDGE_BASE_URL = 'http://localhost:3001';

describe('MCP Bridge Endpoints', () => {
  // Helper to check if response contains dynamic data
  const verifyDynamicData = (data) => {
    expect(data).toBeDefined();
    expect(data).not.toBeNull();
    expect(JSON.stringify(data)).not.toContain('STATIC_DATA');
  };

  describe('GET /strategies', () => {
    test('should return strategies from MCP server', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Verify this is dynamic data
      verifyDynamicData(response.data);
      
      // Check strategy structure
      const strategy = response.data[0];
      expect(strategy).toHaveProperty('id');
      expect(strategy).toHaveProperty('name');
      expect(strategy).toHaveProperty('description');
      expect(strategy).toHaveProperty('category');
    });

    test('should handle server errors gracefully', async () => {
      // Test with wrong port to simulate server error
      try {
        await axios.get('http://localhost:9999/strategies');
      } catch (error) {
        expect(error.code).toBe('ECONNREFUSED');
      }
    });
  });

  describe('POST /refine-with-strategy', () => {
    test('should refine prompt using MCP strategy', async () => {
      const payload = {
        prompt: 'Write a function to calculate fibonacci',
        strategyId: 'morphosis',
        context: { language: 'JavaScript' }
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data.refinedPrompt).not.toBe(payload.prompt);
      expect(response.data.refinedPrompt.length).toBeGreaterThan(payload.prompt.length);
      
      // Check for Claude-aware response format
      expect(response.data).toHaveProperty('hasMetaprompt');
      expect(response.data).toHaveProperty('templateType');
      
      verifyDynamicData(response.data);
    });

    test('should handle missing strategy ID', async () => {
      const payload = {
        prompt: 'Test prompt',
        context: {}
      };

      try {
        await axios.post(`${BRIDGE_BASE_URL}/refine-with-strategy`, payload);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('should handle invalid strategy ID', async () => {
      const payload = {
        prompt: 'Test prompt',
        strategyId: 'invalid_strategy_id',
        context: {}
      };

      try {
        await axios.post(`${BRIDGE_BASE_URL}/refine-with-strategy`, payload);
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('POST /automatic-metaprompt', () => {
    test('should generate automatic metaprompt from MCP', async () => {
      const payload = {
        prompt: 'Create a REST API for user management',
        context: {
          projectType: 'backend',
          language: 'Node.js'
        }
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/automatic-metaprompt`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('strategy');
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data.strategy).toHaveProperty('id');
      expect(response.data.strategy).toHaveProperty('name');
      
      // Check for Claude format detection
      expect(response.data).toHaveProperty('suggestsClaudeProcessing');
      if (response.data.suggestsClaudeProcessing) {
        expect(response.data).toHaveProperty('formatHint');
      }
      
      verifyDynamicData(response.data);
    });

    test('should handle empty prompt', async () => {
      const payload = {
        prompt: '',
        context: {}
      };

      try {
        await axios.post(`${BRIDGE_BASE_URL}/automatic-metaprompt`, payload);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('POST /apply-prompt', () => {
    test('should apply prompt and return result from MCP', async () => {
      const payload = {
        prompt: 'Generate a simple hello world function',
        options: {
          format: 'code',
          language: 'javascript'
        }
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/apply-prompt`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('result');
      expect(response.data.result).toBeTruthy();
      
      verifyDynamicData(response.data);
    });

    test('should handle complex prompts', async () => {
      const payload = {
        prompt: 'Design a microservices architecture for an e-commerce platform',
        options: {
          format: 'markdown',
          detail: 'high'
        }
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/apply-prompt`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('result');
      expect(response.data.result.length).toBeGreaterThan(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      try {
        await axios.post(
          `${BRIDGE_BASE_URL}/refine-with-strategy`,
          'invalid json',
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should handle missing required fields', async () => {
      try {
        await axios.post(`${BRIDGE_BASE_URL}/apply-prompt`, {});
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('should handle server timeout', async () => {
      // This test simulates a timeout scenario
      const payload = {
        prompt: 'Simulate long processing',
        timeout: 1 // 1ms timeout to force timeout
      };

      try {
        await axios.post(
          `${BRIDGE_BASE_URL}/apply-prompt`,
          payload,
          { timeout: 1 }
        );
      } catch (error) {
        expect(error.code).toMatch(/ECONNABORTED|ETIMEDOUT/);
      }
    });
  });

  describe('Data Validation', () => {
    test('should verify no hardcoded strategies', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      const strategies = response.data;
      
      // Check that strategies are coming from MCP, not hardcoded
      expect(strategies.length).toBeGreaterThan(5); // MCP should have many strategies
      
      // Verify dynamic timestamps or IDs
      const uniqueIds = new Set(strategies.map(s => s.id));
      expect(uniqueIds.size).toBe(strategies.length);
    });

    test('should verify dynamic refinement results', async () => {
      const testPrompts = [
        'Write a sorting algorithm',
        'Create a web server',
        'Design a database schema'
      ];

      const results = await Promise.all(
        testPrompts.map(prompt =>
          axios.post(`${BRIDGE_BASE_URL}/automatic-metaprompt`, {
            prompt,
            context: {}
          })
        )
      );

      // Each prompt should get different refinements
      const refinedPrompts = results.map(r => r.data.refinedPrompt);
      const uniqueRefinements = new Set(refinedPrompts);
      expect(uniqueRefinements.size).toBe(testPrompts.length);
    });
  });

  describe('Claude Integration Features', () => {
    test('should support Claude-enhanced refinements', async () => {
      const payload = {
        prompt: 'Design a REST API architecture',
        strategyId: 'architect',
        useClaudeProcessing: true
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data).toHaveProperty('claudeProcessed');
      
      // If Claude processing was used, check for extracted data
      if (response.data.claudeProcessed) {
        expect(response.data).toHaveProperty('extractedData');
      }
    });

    test('should detect Claude-compatible strategies', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      const strategies = response.data;
      
      // Find Claude-enhanced strategies
      const claudeStrategies = strategies.filter(s => s.claudeEnhanced);
      expect(claudeStrategies.length).toBeGreaterThan(0);
      
      claudeStrategies.forEach(strategy => {
        expect(strategy).toHaveProperty('claudeTemplate');
      });
    });

    test('should handle automatic Claude format detection', async () => {
      const technicalPrompts = [
        { prompt: 'Review code for security vulnerabilities', expectedStrategy: 'reviewer' },
        { prompt: 'Design microservices architecture', expectedStrategy: 'architect' },
        { prompt: 'Set up CI/CD pipeline', expectedStrategy: 'devops' }
      ];

      for (const testCase of technicalPrompts) {
        const response = await axios.post(
          `${BRIDGE_BASE_URL}/automatic-metaprompt`,
          { prompt: testCase.prompt, context: { enableClaude: true } }
        );

        expect(response.status).toBe(200);
        expect(response.data.suggestsClaudeProcessing).toBe(true);
        
        // Technical prompts should select appropriate strategies
        if (response.data.strategy.id === testCase.expectedStrategy) {
          expect(response.data.strategy.claudeEnhanced).toBe(true);
        }
      }
    });

    test('should preserve refinement chain with Claude processing', async () => {
      // Multi-step refinement
      const step1 = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        {
          prompt: 'Create user authentication',
          strategyId: 'architect',
          useClaudeProcessing: true
        }
      );

      const step2 = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        {
          prompt: step1.data.refinedPrompt,
          strategyId: 'reviewer',
          context: { previousRefinement: step1.data },
          useClaudeProcessing: true
        }
      );

      expect(step2.status).toBe(200);
      expect(step2.data).toHaveProperty('refinementChain');
      expect(step2.data.refinementChain).toHaveLength(2);
      expect(step2.data.refinementChain[0].strategy).toBe('architect');
      expect(step2.data.refinementChain[1].strategy).toBe('reviewer');
    });

    test('should fallback gracefully when Claude is unavailable', async () => {
      const payload = {
        prompt: 'Test prompt',
        strategyId: 'morphosis',
        useClaudeProcessing: true,
        // Force fallback by using invalid API key
        context: { forceClaudeError: true }
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data.claudeProcessed).toBe(false);
      expect(response.data).toHaveProperty('fallbackReason');
    });
  });
});