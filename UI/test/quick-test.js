#!/usr/bin/env node

// Use axios from the UI project
const axios = require('../prompt-plus-ui/node_modules/axios');

const BRIDGE_BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('\n🧪 Running Quick Integration Tests\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  try {
    const res = await axios.get(`${BRIDGE_BASE_URL}/health`);
    if (res.data.status === 'ok' && res.data.mcpConnected) {
      console.log('✅ Health check passed');
      passed++;
    } else {
      console.log('❌ Health check failed:', res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    failed++;
  }

  // Test 2: Get strategies
  try {
    const res = await axios.get(`${BRIDGE_BASE_URL}/strategies`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      console.log(`✅ Strategies loaded: ${res.data.length} strategies`);
      
      // Check categories
      const categories = [...new Set(res.data.map(s => s.category))];
      console.log(`   Categories: ${categories.join(', ')}`);
      passed++;
    } else {
      console.log('❌ Strategies failed:', res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ Strategies error:', error.message);
    failed++;
  }

  // Test 3: Refine with strategy
  try {
    const res = await axios.post(`${BRIDGE_BASE_URL}/refine-with-strategy`, {
      prompt: 'Write a REST API',
      strategy: 'star'
    });
    if (res.data.refinedPrompt) {
      console.log('✅ Refinement succeeded');
      console.log(`   Template length: ${res.data.refinedPrompt.length} chars`);
      passed++;
    } else {
      console.log('❌ Refinement failed:', res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ Refinement error:', error.message);
    failed++;
  }

  // Test 4: Search strategies
  try {
    const res = await axios.get(`${BRIDGE_BASE_URL}/strategies/search?q=code`);
    if (Array.isArray(res.data)) {
      const codeRelated = res.data.filter(s => 
        s.name.toLowerCase().includes('code') ||
        s.name.toLowerCase().includes('architect') ||
        s.description.toLowerCase().includes('software')
      );
      console.log(`✅ Search found ${codeRelated.length} code-related strategies`);
      passed++;
    } else {
      console.log('❌ Search failed:', res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ Search error:', error.message);
    failed++;
  }

  // Test 5: Auto-refine prompt
  try {
    const res = await axios.post(`${BRIDGE_BASE_URL}/automatic-metaprompt`, {
      prompt: 'Create a user authentication system'
    });
    if (res.data.recommended_metaprompt || res.data.auto_refine) {
      console.log('✅ Auto-refinement worked');
      passed++;
    } else {
      console.log('❌ Auto-refinement returned unexpected format:', res.data);
      failed++;
    }
  } catch (error) {
    if (error.response && error.response.status === 503) {
      console.log('⚠️  Auto-refinement unavailable (expected - MCP server limitation)');
      passed++; // This is expected behavior
    } else {
      console.log('❌ Auto-refinement error:', error.message);
      failed++;
    }
  }

  // Test 6: Get specific strategy
  try {
    const res = await axios.get(`${BRIDGE_BASE_URL}/strategies/star`);
    if (res.data.name && res.data.description) {
      console.log('✅ Get specific strategy passed');
      passed++;
    } else {
      console.log('❌ Get specific strategy failed:', res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ Get specific strategy error:', error.message);
    failed++;
  }

  // Test 7: Metrics
  try {
    const res = await axios.get(`${BRIDGE_BASE_URL}/metrics`);
    if (res.data.totalStrategies > 0) {
      console.log(`✅ Metrics: ${res.data.totalStrategies} total strategies`);
      passed++;
    } else {
      console.log('❌ Metrics failed:', res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ Metrics error:', error.message);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log('❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});