#!/usr/bin/env node

const http = require('http');

// Test that verifies the UI can load all necessary data
async function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response from ${path}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function runUIDataTests() {
  console.log('\n🎨 Running UI Data Loading Tests\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Dashboard metrics
  try {
    const metrics = await get('/metrics');
    if (metrics.totalStrategies > 0 && metrics.topStrategies && Array.isArray(metrics.topStrategies)) {
      console.log(`✅ Dashboard: ${metrics.totalStrategies} strategies available`);
      passed++;
    } else {
      console.log('❌ Dashboard: Invalid metrics data');
      failed++;
    }
  } catch (error) {
    console.log('❌ Dashboard metrics error:', error.message);
    failed++;
  }

  // Test 2: Strategy Explorer
  try {
    const strategies = await get('/strategies');
    const categories = [...new Set(strategies.map(s => s.category))];
    
    const hasRequiredCategories = categories.includes('core_strategies') &&
                                 categories.includes('ai_core_principles') &&
                                 categories.includes('advanced_thinking');
    
    if (hasRequiredCategories && strategies.length > 10) {
      console.log(`✅ Strategy Explorer: ${strategies.length} strategies in ${categories.length} categories`);
      passed++;
    } else {
      console.log('❌ Strategy Explorer: Missing required categories');
      failed++;
    }
  } catch (error) {
    console.log('❌ Strategy Explorer error:', error.message);
    failed++;
  }

  // Test 3: Prompt Refiner dynamic data
  try {
    const strategies = await get('/strategies');
    const coreStrategies = strategies.filter(s => s.category === 'core_strategies');
    
    if (coreStrategies.length >= 5) {
      console.log(`✅ Prompt Refiner: ${coreStrategies.length} refinement methods available`);
      passed++;
    } else {
      console.log('❌ Prompt Refiner: Insufficient core strategies');
      failed++;
    }
  } catch (error) {
    console.log('❌ Prompt Refiner error:', error.message);
    failed++;
  }

  // Test 4: Search functionality
  try {
    const results = await get('/strategies/search?q=code');
    const relevantResults = results.filter(s => 
      s.name.toLowerCase().includes('code') ||
      s.name.toLowerCase().includes('software') ||
      s.name.toLowerCase().includes('architect') ||
      s.description.toLowerCase().includes('software')
    );
    
    if (relevantResults.length > 0) {
      console.log(`✅ Search: Found ${relevantResults.length} code-related strategies`);
      passed++;
    } else {
      console.log('❌ Search: No relevant results for "code" query');
      failed++;
    }
  } catch (error) {
    console.log('❌ Search error:', error.message);
    failed++;
  }

  // Test 5: Collections support
  try {
    const collections = await get('/collections');
    if (Array.isArray(collections)) {
      console.log(`✅ Collections: Endpoint working (${collections.length} collections)`);
      passed++;
    } else {
      console.log('❌ Collections: Invalid response format');
      failed++;
    }
  } catch (error) {
    console.log('❌ Collections error:', error.message);
    failed++;
  }

  // Test 6: Strategy details (using first available strategy)
  try {
    const strategies = await get('/strategies');
    if (strategies.length > 0) {
      const firstId = strategies[0].id;
      const strategy = await get(`/strategies/${firstId}`);
      if (strategy.name && strategy.description) {
        console.log(`✅ Strategy Details: "${strategy.name}" loaded successfully`);
        passed++;
      } else {
        console.log('❌ Strategy Details: Missing required fields');
        failed++;
      }
    } else {
      console.log('❌ Strategy Details: No strategies available');
      failed++;
    }
  } catch (error) {
    console.log('❌ Strategy Details error:', error.message);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log('❌ Some UI data tests failed');
    process.exit(1);
  } else {
    console.log('✅ All UI data tests passed!');
    process.exit(0);
  }
}

runUIDataTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});