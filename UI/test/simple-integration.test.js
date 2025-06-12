const axios = require('axios');

const BRIDGE_BASE_URL = 'http://localhost:3001';

// Simple integration tests that work with the running bridge
describe('Simple Integration Tests', () => {
  describe('Basic Endpoints', () => {
    test('health check', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
      expect(response.data.mcpConnected).toBe(true);
    });

    test('strategies endpoint returns array', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Check first strategy structure
      const strategy = response.data[0];
      expect(strategy).toHaveProperty('id');
      expect(strategy).toHaveProperty('name');
      expect(strategy).toHaveProperty('description');
      expect(strategy).toHaveProperty('category');
    });

    test('strategies have proper categories', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      const categories = [...new Set(response.data.map(s => s.category))];
      
      expect(categories).toContain('advanced_thinking');
      expect(categories).toContain('core_strategies');
      expect(categories).toContain('ai_core_principles');
      expect(categories.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Refinement Endpoints', () => {
    test('refine-with-strategy returns proper structure', async () => {
      const response = await axios.post(`${BRIDGE_BASE_URL}/refine-with-strategy`, {
        prompt: 'Write a function to calculate factorial',
        strategy: 'morphosis'
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('initialPromptEvaluation');
      expect(response.data).toHaveProperty('refinedPrompt');
      expect(response.data).toHaveProperty('explanationOfRefinements');
    });

    test('automatic-metaprompt works', async () => {
      const response = await axios.post(`${BRIDGE_BASE_URL}/automatic-metaprompt`, {
        prompt: 'Create a REST API'
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('recommended_metaprompt');
      expect(response.data.recommended_metaprompt).toHaveProperty('key');
      expect(response.data.recommended_metaprompt).toHaveProperty('name');
    });
  });

  describe('Search and Metrics', () => {
    test('search strategies', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/strategies/search?q=code`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Should find strategies related to code
      const names = response.data.map(s => s.name.toLowerCase());
      const hasCodeRelated = names.some(name => 
        name.includes('code') || name.includes('software') || name.includes('dev')
      );
      expect(hasCodeRelated).toBe(true);
    });

    test('metrics endpoint', async () => {
      const response = await axios.get(`${BRIDGE_BASE_URL}/metrics`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalStrategies');
      expect(response.data.totalStrategies).toBeGreaterThan(0);
    });
  });

  describe('Claude Integration', () => {
    test('refinement includes Claude indicators when no API key', async () => {
      const response = await axios.post(`${BRIDGE_BASE_URL}/refine-with-strategy`, {
        prompt: 'Build a web app',
        strategy: 'star'
      });
      
      // Without API key, should show template
      const refinedText = response.data.refinedPrompt;
      const hasTemplateIndicators = 
        refinedText.includes('comprehensive') || 
        refinedText.includes('ECHO') ||
        refinedText.includes('multi-stage');
      
      expect(hasTemplateIndicators).toBe(true);
    });

    test('strategy details include examples', async () => {
      const strategies = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
      const starStrategy = strategies.data.find(s => s.id === 'star');
      
      expect(starStrategy).toBeDefined();
      expect(starStrategy.examples).toBeDefined();
      expect(Array.isArray(starStrategy.examples)).toBe(true);
    });
  });
});

// Run with: npx jest simple-integration.test.js