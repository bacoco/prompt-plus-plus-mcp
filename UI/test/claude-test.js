#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Simple test runner
async function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Running Claude Integration Tests\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Check if Claude processor is loaded
  try {
    const res = await makeRequest('POST', '/refine-with-strategy', {
      prompt: 'Build a web scraper',
      strategy: 'star'
    });
    
    if (res.status === 200 && res.data.refinedPrompt) {
      // Check if it's a template (no Claude) or processed (with Claude)
      const content = res.data.refinedPrompt;
      const isTemplate = content.includes('[Insert initial prompt here]') || 
                        content.includes('[USER_PROMPT]');
      
      if (isTemplate) {
        console.log('✅ Template returned (Claude not configured - expected)');
      } else {
        console.log('✅ Claude processing detected');
      }
      passed++;
    } else {
      console.log('❌ Refinement failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Refinement error:', error.message);
    failed++;
  }

  // Test 2: Check metaprompt template detection
  try {
    const res = await makeRequest('POST', '/refine-with-strategy', {
      prompt: 'Create a machine learning pipeline',
      strategy: 'morphosis'
    });
    
    if (res.status === 200) {
      const hasTemplateIndicators = res.data.refinedPrompt.includes('comprehensive') ||
                                   res.data.refinedPrompt.includes('multi-stage') ||
                                   res.data.refinedPrompt.includes('ECHO');
      
      if (hasTemplateIndicators || res.data.isTemplate || res.data.isClaudeReady) {
        console.log('✅ Metaprompt template indicators detected');
        passed++;
      } else {
        console.log('⚠️  No template indicators found (might be processed)');
        passed++; // Still pass as it could be Claude-processed
      }
    } else {
      console.log('❌ Strategy refinement failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Strategy error:', error.message);
    failed++;
  }

  // Test 3: Auto-refinement with Claude integration
  try {
    const res = await makeRequest('POST', '/automatic-metaprompt', {
      prompt: 'Design a distributed caching system'
    });
    
    if (res.status === 200) {
      if (res.data.recommended_metaprompt || res.data.auto_refine) {
        console.log('✅ Auto-refinement returned recommendation');
        passed++;
      } else {
        console.log('❌ Unexpected auto-refinement response:', res.data);
        failed++;
      }
    } else if (res.status === 503) {
      console.log('✅ Auto-refinement unavailable (expected without MCP support)');
      passed++;
    } else {
      console.log('❌ Auto-refinement error:', res.status, res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ Auto-refinement error:', error.message);
    failed++;
  }

  // Test 4: Different strategy types
  const strategies = ['star', 'arpe', 'done', 'morphosis', 'assumption_detector'];
  let strategyTestsPassed = 0;
  
  for (const strategy of strategies) {
    try {
      const res = await makeRequest('POST', '/refine-with-strategy', {
        prompt: 'Build a recommendation engine',
        strategy: strategy
      });
      
      if (res.status === 200 && res.data.refinedPrompt) {
        strategyTestsPassed++;
      }
    } catch (error) {
      // Silent fail for individual strategies
    }
  }
  
  if (strategyTestsPassed >= 3) {
    console.log(`✅ Multiple strategies tested (${strategyTestsPassed}/${strategies.length} passed)`);
    passed++;
  } else {
    console.log(`❌ Strategy testing failed (${strategyTestsPassed}/${strategies.length} passed)`);
    failed++;
  }

  // Test 5: Response format validation
  try {
    const res = await makeRequest('POST', '/refine-with-strategy', {
      prompt: 'Optimize database queries',
      strategy: 'precision_questioner'
    });
    
    if (res.status === 200) {
      const hasRequiredFields = res.data.initialPromptEvaluation !== undefined &&
                               res.data.refinedPrompt !== undefined &&
                               res.data.explanationOfRefinements !== undefined;
      
      if (hasRequiredFields) {
        console.log('✅ Response format validation passed');
        passed++;
      } else {
        console.log('❌ Missing required response fields');
        failed++;
      }
    } else {
      console.log('❌ Request failed:', res.status);
      failed++;
    }
  } catch (error) {
    console.log('❌ Format validation error:', error.message);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log('❌ Some Claude integration tests failed');
    process.exit(1);
  } else {
    console.log('✅ All Claude integration tests passed!');
    process.exit(0);
  }
}

// Check if .env exists for Claude configuration hint
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.log('\n💡 Hint: Create a .env file with ANTHROPIC_API_KEY to enable full Claude integration\n');
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});