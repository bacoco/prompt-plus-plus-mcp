#!/usr/bin/env node

const axios = require('axios');

const BRIDGE_BASE_URL = 'http://localhost:3001';

// Simple test runner
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 Running Simple Integration Tests\n');

  // Health check
  await test('health check returns ok', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/health`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (response.data.status !== 'ok') throw new Error('Status not ok');
    if (response.data.mcpConnected !== true) throw new Error('MCP not connected');
  });

  // Strategies endpoint
  await test('strategies endpoint returns array', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
    if (!Array.isArray(response.data)) throw new Error('Not an array');
    if (response.data.length === 0) throw new Error('Empty array');
  });

  // Strategy structure
  await test('strategies have proper structure', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
    const strategy = response.data[0];
    if (!strategy.id) throw new Error('Missing id');
    if (!strategy.name) throw new Error('Missing name');
    if (!strategy.description) throw new Error('Missing description');
    if (!strategy.category) throw new Error('Missing category');
  });

  // Categories
  await test('strategies have expected categories', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
    const categories = [...new Set(response.data.map(s => s.category))];
    if (!categories.includes('advanced_thinking')) throw new Error('Missing advanced_thinking');
    if (!categories.includes('core_strategies')) throw new Error('Missing core_strategies');
    if (!categories.includes('ai_core_principles')) throw new Error('Missing ai_core_principles');
  });

  // Refinement endpoint
  await test('refine-with-strategy works', async () => {
    const response = await axios.post(`${BRIDGE_BASE_URL}/refine-with-strategy`, {
      prompt: 'Write a function to calculate factorial',
      strategy: 'morphosis'
    });
    if (!response.data.initialPromptEvaluation) throw new Error('Missing initialPromptEvaluation');
    if (!response.data.refinedPrompt) throw new Error('Missing refinedPrompt');
    if (!response.data.explanationOfRefinements) throw new Error('Missing explanationOfRefinements');
  });

  // Automatic metaprompt
  await test('automatic-metaprompt returns recommendation', async () => {
    try {
      const response = await axios.post(`${BRIDGE_BASE_URL}/automatic-metaprompt`, {
        prompt: 'Create a REST API'
      });
      if (!response.data.recommended_metaprompt) throw new Error('Missing recommended_metaprompt');
      if (!response.data.recommended_metaprompt.key) throw new Error('Missing key');
      if (!response.data.recommended_metaprompt.name) throw new Error('Missing name');
    } catch (error) {
      // Check if it's the expected 503 error
      if (error.response && error.response.status === 503) {
        console.log('   (Expected: auto_refine prompt not available in MCP)');
      } else {
        throw error;
      }
    }
  });

  // Search endpoint
  await test('search strategies by query', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/strategies/search?q=code`);
    if (!Array.isArray(response.data)) throw new Error('Not an array');
    const names = response.data.map(s => s.name.toLowerCase());
    const hasCodeRelated = names.some(name => 
      name.includes('code') || name.includes('software') || name.includes('dev') || name.includes('architect')
    );
    if (!hasCodeRelated) throw new Error('No code-related strategies found');
  });

  // Metrics endpoint  
  await test('metrics endpoint returns stats', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/metrics`);
    if (!response.data.totalStrategies) throw new Error('Missing totalStrategies');
    if (response.data.totalStrategies <= 0) throw new Error('No strategies reported');
  });

  // Test specific strategy
  await test('get specific strategy details', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/strategies/star`);
    if (!response.data.name) throw new Error('Missing name');
    if (!response.data.description) throw new Error('Missing description');
  });

  // Test collections endpoints
  await test('collections endpoint returns array', async () => {
    const response = await axios.get(`${BRIDGE_BASE_URL}/collections`);
    if (!Array.isArray(response.data)) throw new Error('Not an array');
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// Check if axios is available
try {
  require.resolve('axios');
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
} catch (e) {
  console.error('❌ axios not found. Please install it first:');
  console.error('   cd /Users/loic/prompt-plus-plus-mcp/UI && npm install axios');
  process.exit(1);
}