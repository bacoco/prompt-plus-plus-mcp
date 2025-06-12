const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const BRIDGE_BASE_URL = 'http://localhost:3001';

describe('Claude Integration Tests', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Claude Processor Initialization', () => {
    test('should initialize Claude processor with API key', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/claude/status`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('initialized');
      expect(response.data).toHaveProperty('hasApiKey');
    });

    test('should handle missing API key gracefully', async () => {
      // Mock environment without API key
      const originalApiKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      try {
        await axios.post(`${BRIDGE_BASE_URL}/claude/process`, {
          prompt: 'Test prompt',
          template: 'test_template'
        });
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.error).toContain('API key');
      }

      // Restore API key
      if (originalApiKey) {
        process.env.ANTHROPIC_API_KEY = originalApiKey;
      }
    });
  });

  describe('Metaprompt Template Detection', () => {
    test('should detect metaprompt templates in refined prompts', async () => {
      const payload = {
        prompt: 'Create a REST API',
        strategyId: 'architect'
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data).toHaveProperty('hasMetaprompt');
      expect(response.data).toHaveProperty('templateType');
      
      if (response.data.hasMetaprompt) {
        expect(['architect', 'reviewer', 'devops']).toContain(response.data.templateType);
      }
    });

    test('should identify Claude-specific formatting in templates', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      const strategies = response.data;

      // Check strategies that should have Claude-aware templates
      const claudeAwareStrategies = ['architect', 'reviewer', 'devops'];
      
      claudeAwareStrategies.forEach(strategyId => {
        const strategy = strategies.find(s => s.id === strategyId);
        if (strategy && strategy.template) {
          // Check for Claude-specific markers
          const hasClaudeFormat = 
            strategy.template.includes('<') || 
            strategy.template.includes('{{') ||
            strategy.template.includes('###');
          
          expect(hasClaudeFormat).toBe(true);
        }
      });
    });
  });

  describe('Template Processing', () => {
    test('should process templates with Claude API (mocked)', async () => {
      // Mock Claude API response
      mock.onPost('https://api.anthropic.com/v1/messages').reply(200, {
        content: [{
          type: 'text',
          text: JSON.stringify({
            refined_prompt: "Architect's perspective: Design a scalable REST API...",
            key_considerations: ["Security", "Scalability", "Maintainability"],
            suggested_approach: "Microservices architecture"
          })
        }]
      });

      const payload = {
        prompt: 'Create a user management API',
        strategyId: 'architect',
        useClaudeProcessing: true
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data).toHaveProperty('claudeProcessed', true);
      expect(response.data).toHaveProperty('extractedData');
      expect(response.data.extractedData).toHaveProperty('key_considerations');
    });

    test('should handle non-JSON Claude responses gracefully', async () => {
      // Mock Claude API response with plain text
      mock.onPost('https://api.anthropic.com/v1/messages').reply(200, {
        content: [{
          type: 'text',
          text: 'This is a plain text response without JSON structure.'
        }]
      });

      const payload = {
        prompt: 'Explain something',
        strategyId: 'morphosis',
        useClaudeProcessing: true
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data).toHaveProperty('claudeProcessed', true);
      expect(response.data.extractedData).toBeNull();
    });

    test('should fallback to standard processing when Claude fails', async () => {
      // Mock Claude API error
      mock.onPost('https://api.anthropic.com/v1/messages').reply(500, {
        error: 'Internal Server Error'
      });

      const payload = {
        prompt: 'Create a function',
        strategyId: 'morphosis',
        useClaudeProcessing: true
      };

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        payload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data).toHaveProperty('claudeProcessed', false);
      expect(response.data).toHaveProperty('fallbackReason', 'Claude API error');
    });
  });

  describe('JSON Extraction from Responses', () => {
    test('should extract valid JSON from Claude response', async () => {
      const claudeResponse = `
        Here's my analysis:
        
        \`\`\`json
        {
          "analysis": "detailed",
          "recommendations": ["item1", "item2"],
          "score": 8.5
        }
        \`\`\`
        
        Additional commentary here.
      `;

      mock.onPost('https://api.anthropic.com/v1/messages').reply(200, {
        content: [{
          type: 'text',
          text: claudeResponse
        }]
      });

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/claude/extract-json`,
        { text: claudeResponse }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('extracted');
      expect(response.data.extracted).toHaveProperty('analysis', 'detailed');
      expect(response.data.extracted.recommendations).toHaveLength(2);
      expect(response.data.extracted.score).toBe(8.5);
    });

    test('should handle multiple JSON blocks', async () => {
      const multiJsonResponse = `
        First block:
        \`\`\`json
        {"type": "config", "value": 123}
        \`\`\`
        
        Second block:
        \`\`\`json
        {"type": "result", "value": 456}
        \`\`\`
      `;

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/claude/extract-json`,
        { text: multiJsonResponse }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('extracted');
      expect(response.data.extracted).toBeInstanceOf(Array);
      expect(response.data.extracted).toHaveLength(2);
      expect(response.data.extracted[0].type).toBe('config');
      expect(response.data.extracted[1].type).toBe('result');
    });

    test('should return null for responses without JSON', async () => {
      const plainTextResponse = 'This is just plain text without any JSON.';

      const response = await axios.post(
        `${BRIDGE_BASE_URL}/claude/extract-json`,
        { text: plainTextResponse }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('extracted', null);
    });
  });

  describe('Error Handling', () => {
    test('should provide clear error when API key is missing', async () => {
      // Temporarily remove API key
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      try {
        await axios.post(`${BRIDGE_BASE_URL}/claude/process`, {
          prompt: 'Test',
          template: 'test'
        });
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.error).toMatch(/API key/i);
        expect(error.response.data).toHaveProperty('suggestion');
      }

      // Restore key
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });

    test('should handle rate limiting gracefully', async () => {
      // Mock rate limit response
      mock.onPost('https://api.anthropic.com/v1/messages').reply(429, {
        error: {
          type: 'rate_limit_error',
          message: 'Rate limit exceeded'
        }
      });

      try {
        await axios.post(`${BRIDGE_BASE_URL}/claude/process`, {
          prompt: 'Test',
          useClaudeProcessing: true
        });
      } catch (error) {
        expect(error.response.status).toBe(429);
        expect(error.response.data).toHaveProperty('retryAfter');
        expect(error.response.data.error).toContain('rate limit');
      }
    });

    test('should validate request payloads', async () => {
      const invalidPayloads = [
        { prompt: '' }, // Empty prompt
        { strategyId: 'test' }, // Missing prompt
        { prompt: 123 }, // Wrong type
        {} // Empty payload
      ];

      for (const payload of invalidPayloads) {
        try {
          await axios.post(`${BRIDGE_BASE_URL}/refine-with-strategy`, payload);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data).toHaveProperty('error');
        }
      }
    });
  });

  describe('Claude-Aware Automatic Metaprompt', () => {
    test('should detect when to use Claude processing automatically', async () => {
      const techPrompts = [
        'Design a microservices architecture',
        'Review this code for security issues',
        'Set up CI/CD pipeline'
      ];

      for (const prompt of techPrompts) {
        const response = await axios.post(
          `${BRIDGE_BASE_URL}/automatic-metaprompt`,
          { prompt, context: { enableClaude: true } }
        );

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('strategy');
        expect(response.data).toHaveProperty('refinedPrompt');
        expect(response.data).toHaveProperty('suggestsClaudeProcessing');
        
        // Technical prompts should suggest Claude processing
        if (['architect', 'reviewer', 'devops'].includes(response.data.strategy.id)) {
          expect(response.data.suggestsClaudeProcessing).toBe(true);
        }
      }
    });

    test('should include Claude format hints in refinements', async () => {
      const response = await axios.post(
        `${BRIDGE_BASE_URL}/automatic-metaprompt`,
        {
          prompt: 'Create a REST API with authentication',
          context: { 
            enableClaude: true,
            outputFormat: 'structured'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.refinedPrompt).toMatch(/json|structured|format/i);
      expect(response.data).toHaveProperty('formatHint');
    });
  });

  describe('Integration with MCP Strategies', () => {
    test('should enhance MCP strategies with Claude capabilities', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      
      expect(response.status).toBe(200);
      const strategies = response.data;
      
      // Check that strategies have Claude enhancement flags
      strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('claudeEnhanced');
        if (['architect', 'reviewer', 'devops'].includes(strategy.id)) {
          expect(strategy.claudeEnhanced).toBe(true);
          expect(strategy).toHaveProperty('claudeTemplate');
        }
      });
    });

    test('should process complex multi-step refinements', async () => {
      // First refinement
      const step1 = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        {
          prompt: 'Build a user authentication system',
          strategyId: 'architect'
        }
      );

      expect(step1.status).toBe(200);
      expect(step1.data).toHaveProperty('refinedPrompt');

      // Second refinement using first result
      const step2 = await axios.post(
        `${BRIDGE_BASE_URL}/refine-with-strategy`,
        {
          prompt: step1.data.refinedPrompt,
          strategyId: 'reviewer',
          context: { previousStrategy: 'architect' }
        }
      );

      expect(step2.status).toBe(200);
      expect(step2.data.refinedPrompt).not.toBe(step1.data.refinedPrompt);
      expect(step2.data).toHaveProperty('refinementChain');
      expect(step2.data.refinementChain).toHaveLength(2);
    });
  });
});