#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import claude processor if API key is available
let processMetaprompt, isMetapromptTemplate;
(async () => {
  try {
    const claudeProcessor = await import('./claude-processor.js');
    processMetaprompt = claudeProcessor.processMetaprompt;
    isMetapromptTemplate = claudeProcessor.isMetapromptTemplate;
    console.log('Claude processor loaded successfully');
  } catch (error) {
    console.warn('Claude processor not available:', error.message);
    processMetaprompt = null;
    isMetapromptTemplate = null;
  }
})();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request monitoring
const requestCounts = new Map();
const requestDurations = new Map();

app.use((req, res, next) => {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.path}`;
  
  // Track request count
  requestCounts.set(endpoint, (requestCounts.get(endpoint) || 0) + 1);
  
  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const durations = requestDurations.get(endpoint) || [];
    durations.push(duration);
    if (durations.length > 100) durations.shift(); // Keep last 100
    requestDurations.set(endpoint, durations);
  });
  
  next();
});

// Input validation middleware
const validatePrompt = (req, res, next) => {
  const { prompt } = req.body;
  
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt: must be a non-empty string' });
  }
  
  if (prompt.length > 10000) {
    return res.status(400).json({ error: 'Prompt too long: maximum 10,000 characters' });
  }
  
  // Sanitize prompt (remove potential script injections)
  req.body.prompt = prompt.trim();
  
  next();
};

let mcpProcess = null;
let mcpBuffer = '';
let requestId = 0;
const pendingRequests = new Map();

// Start MCP server process
function startMCPServer() {
  console.log('Starting MCP server...');
  
  mcpProcess = spawn('node', ['../dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  mcpProcess.stdout.on('data', (data) => {
    mcpBuffer += data.toString();
    
    // Try to parse complete JSON-RPC messages
    const lines = mcpBuffer.split('\n');
    mcpBuffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          handleMCPResponse(message);
        } catch (e) {
          // Not a complete JSON message yet
        }
      }
    }
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP stderr:', data.toString());
  });

  mcpProcess.on('close', (code) => {
    console.log(`MCP server exited with code ${code}`);
    mcpProcess = null;
  });

  // Initialize connection
  sendMCPRequest({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'prompt-plus-ui',
        version: '1.0.0'
      }
    }
  });
}

function sendMCPRequest(request) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    request.id = id;
    
    pendingRequests.set(id, { resolve, reject });
    
    if (mcpProcess && mcpProcess.stdin.writable) {
      mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    } else {
      reject(new Error('MCP server not connected'));
    }
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }
    }, 30000);
  });
}

function handleMCPResponse(message) {
  console.log('MCP Response:', JSON.stringify(message, null, 2));
  
  if (message.id && pendingRequests.has(message.id)) {
    const { resolve, reject } = pendingRequests.get(message.id);
    pendingRequests.delete(message.id);
    
    if (message.error) {
      reject(new Error(message.error.message));
    } else {
      resolve(message.result);
    }
  }
}

// Utility function to call MCP prompts
async function callMCP(method, params) {
  return await sendMCPRequest({
    jsonrpc: '2.0',
    method,
    params
  });
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mcpConnected: mcpProcess !== null 
  });
});

app.get('/strategies', async (req, res) => {
  try {
    const result = await sendMCPRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'list_strategies',
        arguments: {}
      }
    });

    // Parse the result content
    const content = result.content?.[0]?.text || '{}';
    let strategies = [];
    
    try {
      const parsed = JSON.parse(content);
      // Handle different response formats
      if (Array.isArray(parsed)) {
        strategies = parsed;
      } else if (parsed.strategies) {
        // If it has a strategies property
        if (Array.isArray(parsed.strategies)) {
          strategies = parsed.strategies;
        } else if (typeof parsed.strategies === 'object') {
          // Convert object to array
          strategies = Object.entries(parsed.strategies).map(([key, strategy]) => ({
            ...strategy,
            id: key,
            key: key,
            category: strategy.category || strategy.customCategory || 'uncategorized'
          }));
        }
      } else if (typeof parsed === 'object') {
        // If it's a direct object with strategy keys
        strategies = Object.entries(parsed).map(([key, strategy]) => ({
          ...strategy,
          id: key,
          key: key,
          category: strategy.category || strategy.customCategory || 'uncategorized'
        }));
      }
    } catch (e) {
      console.error('Failed to parse strategies:', e);
      strategies = [];
    }
    
    // Ensure each strategy has required fields
    const enrichedStrategies = strategies.map(s => ({
      id: s.id || s.key || `${s.category || 'uncategorized'}/${s.name}`.toLowerCase().replace(/\s+/g, '-'),
      name: s.name || 'Unnamed Strategy',
      description: s.description || 'No description available',
      category: s.category || s.customCategory || 'uncategorized',
      content: s.content || s,
      examples: Array.isArray(s.examples) ? s.examples : (s.examples ? [s.examples] : [])
    }));

    res.json(enrichedStrategies);
  } catch (error) {
    console.error('Error listing strategies:', error);
    res.status(500).json({ error: 'Failed to list strategies' });
  }
});

// Search route must be before :id route
app.get('/strategies/search', async (req, res) => {
  try {
    // Get all strategies first
    const result = await sendMCPRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'list_strategies',
        arguments: {}
      }
    });

    const content = result.content?.[0]?.text || '{}';
    let strategies = [];
    
    try {
      const parsed = JSON.parse(content);
      // Handle different response formats
      if (Array.isArray(parsed)) {
        strategies = parsed;
      } else if (parsed.strategies) {
        if (Array.isArray(parsed.strategies)) {
          strategies = parsed.strategies;
        } else if (typeof parsed.strategies === 'object') {
          // Convert object to array
          strategies = Object.entries(parsed.strategies).map(([key, strategy]) => ({
            ...strategy,
            id: key,
            key: key,
            category: strategy.category || strategy.customCategory || 'uncategorized'
          }));
        }
      } else if (typeof parsed === 'object') {
        // If it's a direct object with strategy keys
        strategies = Object.entries(parsed).map(([key, strategy]) => ({
          ...strategy,
          id: key,
          key: key,
          category: strategy.category || strategy.customCategory || 'uncategorized'
        }));
      }
    } catch (e) {
      console.error('Failed to parse strategies for search:', e);
      strategies = [];
    }
    
    // Filter based on search query
    const query = req.query.q?.toLowerCase() || '';
    const filtered = query 
      ? strategies.filter(s =>
          s.name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.category?.toLowerCase().includes(query)
        )
      : strategies;

    // Ensure each strategy has required fields
    const enrichedStrategies = filtered.map(s => ({
      id: s.id || s.key || `${s.category || 'uncategorized'}/${s.name}`.toLowerCase().replace(/\s+/g, '-'),
      name: s.name || 'Unnamed Strategy',
      description: s.description || 'No description available',
      category: s.category || s.customCategory || 'uncategorized',
      content: s.content || s,
      examples: Array.isArray(s.examples) ? s.examples : (s.examples ? [s.examples] : [])
    }));

    res.json(enrichedStrategies);
  } catch (error) {
    console.error('Error searching strategies:', error);
    res.status(500).json({ error: 'Failed to search strategies' });
  }
});

app.get('/strategies/:id', async (req, res) => {
  try {
    // First try get_strategy_details tool
    let result;
    try {
      result = await sendMCPRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get_strategy_details',
          arguments: {
            strategy: req.params.id
          }
        }
      });
    } catch (toolError) {
      // If that fails, get all strategies and find the one we want
      console.log('get_strategy_details failed, falling back to list_strategies');
      const allStrategiesResult = await sendMCPRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'list_strategies',
          arguments: {}
        }
      });
      
      const content = allStrategiesResult.content?.[0]?.text || '{}';
      const parsed = JSON.parse(content);
      let strategies = {};
      
      if (parsed.strategies) {
        strategies = parsed.strategies;
      } else if (typeof parsed === 'object') {
        strategies = parsed;
      }
      
      const strategy = strategies[req.params.id];
      if (!strategy) {
        return res.status(404).json({ error: 'Strategy not found' });
      }
      
      return res.json({
        ...strategy,
        id: req.params.id,
        category: strategy.category || 'uncategorized'
      });
    }

    const content = result.content?.[0]?.text;
    if (!content) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    const strategy = JSON.parse(content);
    res.json({
      ...strategy,
      id: req.params.id
    });
  } catch (error) {
    console.error('Error getting strategy:', error);
    res.status(500).json({ error: 'Failed to get strategy' });
  }
});

app.post('/refine', async (req, res) => {
  const { prompt, strategy } = req.body;
  const startTime = Date.now();

  try {
    const result = await sendMCPRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'refine_prompt',
        arguments: {
          prompt,
          strategy,
          verbose: true
        }
      }
    });

    const refinedContent = result.content?.[0]?.text || prompt;
    const endTime = Date.now();

    res.json({
      refinedPrompt: refinedContent,
      strategy: strategy || 'auto-selected',
      refinementTime: endTime - startTime
    });

    // Emit real-time update
    io.emit('refinement:complete', {
      strategy,
      time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refining prompt:', error);
    res.status(500).json({ error: 'Failed to refine prompt' });
  }
});

// Performance metrics endpoint
app.get('/metrics/performance', (req, res) => {
  const metrics = {};
  
  // Calculate average response times
  for (const [endpoint, durations] of requestDurations.entries()) {
    if (durations.length > 0) {
      metrics[endpoint] = {
        count: requestCounts.get(endpoint) || 0,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations)
      };
    }
  }
  
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    requestMetrics: metrics,
    mcpConnected: mcpProcess !== null,
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', async (req, res) => {
  try {
    const result = await sendMCPRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'list_strategies',
        arguments: {}
      }
    });

    const content = result.content?.[0]?.text || '{}';
    let strategies = [];
    
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        strategies = parsed;
      } else if (parsed.strategies) {
        if (Array.isArray(parsed.strategies)) {
          strategies = parsed.strategies;
        } else if (typeof parsed.strategies === 'object') {
          strategies = Object.entries(parsed.strategies).map(([key, strategy]) => ({
            ...strategy,
            id: key,
            name: strategy.name,
            category: strategy.category || strategy.customCategory || 'uncategorized'
          }));
        }
      } else if (typeof parsed === 'object') {
        strategies = Object.entries(parsed).map(([key, strategy]) => ({
          ...strategy,
          id: key,
          name: strategy.name,
          category: strategy.category || strategy.customCategory || 'uncategorized'
        }));
      }
    } catch (e) {
      console.error('Failed to parse strategies for metrics:', e);
      strategies = [];
    }

    res.json({
      totalStrategies: strategies.length,
      topStrategies: strategies.slice(0, 5).map(s => ({
        id: s.id || `${s.category}/${s.name}`.toLowerCase().replace(/\s+/g, '-'),
        name: s.name
      })),
      recentActivity: []
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Collections endpoints (stored in memory for now)
const collections = [];

app.get('/collections', (req, res) => {
  res.json(collections);
});

app.post('/collections', (req, res) => {
  const collection = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  collections.push(collection);
  res.json(collection);
});

// MCP endpoints
app.post('/mcp/prompt', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    const result = await callMCP('prompts/get', { name, arguments: args || {} });
    res.json(result);
  } catch (error) {
    console.error('MCP prompt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Automatic metaprompt selection endpoint
app.post('/automatic-metaprompt', validatePrompt, async (req, res) => {
  try {
    const { prompt, routerTemplate } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Call MCP server to get strategy recommendation using auto_refine prompt
    try {
      const result = await sendMCPRequest({
        jsonrpc: '2.0',
        method: 'prompts/get',
        params: {
          name: 'auto_refine',
          arguments: {
            user_prompt: prompt
          }
        }
      });
      
      // Extract the content from the prompt response
      let content = '';
      if (result.messages && result.messages.length > 0) {
        content = result.messages[0].content;
        if (typeof content === 'object' && content.text) {
          content = content.text;
        }
      }
      
      if (!content) {
        throw new Error('No strategy recommendation received from MCP server');
      }
      
      // The auto_refine prompt returns a refined prompt directly
      // We need to analyze it to determine which strategy was used
      const strategyIndicators = {
        'assumption_detector': /assumptions|premise|belief/i,
        'devils_advocate': /devil's advocate|counterargument|challenge/i,
        'pattern_recognizer': /pattern|trend|recurring/i,
        'precision_questioner': /precise|specific|clarity/i,
        'perspective_multiplier': /perspective|viewpoint|angle/i,
        'star': /STAR|situation|task|action|result/i,
        'arpe': /Assumption|Reasoning|Perspective|Evidence/i,
        'done': /Define|Outline|Narrow|Evaluate/i,
        'bolism': /Break down|Organize|Link|Infer|Synthesize|Map/i
      };
      
      // Try to detect which strategy was likely used
      let detectedStrategy = 'auto-selected';
      let detectedStrategyName = 'Auto-Selected Strategy';
      
      for (const [key, pattern] of Object.entries(strategyIndicators)) {
        if (pattern.test(content)) {
          detectedStrategy = key;
          // Get the actual strategy name from the content if possible
          const strategyMatch = content.match(/using the ([^:]+) strategy/i);
          detectedStrategyName = strategyMatch ? strategyMatch[1].trim() : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          break;
        }
      }
      
      // Create a recommendation response that matches the expected format
      const recommendation = {
        recommended_metaprompt: {
          key: detectedStrategy,
          name: detectedStrategyName,
          description: 'Strategy automatically selected and applied based on your prompt',
          explanation: 'The auto_refine prompt analyzed your input and selected the most appropriate refinement strategy',
          isClaudeReady: true
        },
        auto_refine: {
          enabled: true,
          prompt: content,
          isClaudeReady: true
        }
      };
      
      res.json(recommendation);
    } catch (mcpError) {
      console.error('MCP auto_refine failed:', mcpError);
      // Return error with helpful message
      return res.status(503).json({ 
        error: 'Auto-refinement service unavailable',
        details: mcpError.message,
        hint: 'Make sure the MCP server is running and the auto_refine prompt is available'
      });
    }
  } catch (error) {
    console.error('Automatic metaprompt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refine with specific strategy
app.post('/refine-with-strategy', validatePrompt, async (req, res) => {
  try {
    const { prompt, strategy } = req.body;
    console.log('Refining with strategy:', strategy, 'prompt:', prompt);
    
    // First, ensure MCP is initialized
    if (!mcpProcess) {
      throw new Error('MCP server not initialized');
    }
    
    // Try to call the prompt with the exact strategy name
    let result;
    try {
      result = await sendMCPRequest({
        jsonrpc: '2.0',
        method: 'prompts/get',
        params: {
          name: `refine_with_${strategy}`,
          arguments: { user_prompt: prompt }
        }
      });
    } catch (promptError) {
      // If that fails, try the tools/call method
      console.log('Prompt method failed, trying tools/call:', promptError);
      result = await sendMCPRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'refine_prompt',
          arguments: {
            prompt,
            strategy,
            verbose: true
          }
        }
      });
    }
    
    console.log('MCP refine result:', result);
    
    // Parse the MCP response into the expected format
    let response;
    
    // Check if this is a Claude-ready format (contains instructions for Claude)
    const isClaudeFormat = (content) => {
      if (typeof content === 'string') {
        return content.includes('You are about to') || 
               content.includes('Your task is to') ||
               content.includes('<prompt>') ||
               content.includes('Please process');
      }
      return false;
    };
    
    // Handle prompts/get response format
    if (result.messages && result.messages.length > 0) {
      let content = result.messages[0].content || '';
      // Handle object content (new MCP format)
      if (typeof content === 'object' && content.text) {
        content = content.text;
      }
      
      // Check if this is a metaprompt template that needs processing
      if (processMetaprompt && isMetapromptTemplate && isMetapromptTemplate(content)) {
        console.log('Detected metaprompt template, processing with Claude...');
        try {
          const refinedPrompt = await processMetaprompt(content, prompt);
          response = {
            initialPromptEvaluation: '#### Metaprompt Template Applied\nUsed Claude to process the metaprompt template with your input.',
            refinedPrompt: refinedPrompt,
            explanationOfRefinements: '#### Processing Details\nThe metaprompt template was processed through Claude API to generate a refined prompt specifically tailored to your request.',
            isProcessed: true,
            fullResponse: result
          };
        } catch (error) {
          console.error('Failed to process metaprompt:', error);
          // Fall back to showing the template
          response = {
            initialPromptEvaluation: '#### Metaprompt Template\nThis is a template that requires Claude API processing.',
            refinedPrompt: content,
            explanationOfRefinements: '#### Template Instructions\nSet ANTHROPIC_API_KEY in .env file to enable automatic processing of metaprompt templates.',
            isTemplate: true,
            fullResponse: result
          };
        }
      }
      // Check if this is a Claude-ready prompt format
      else if (isClaudeFormat(content)) {
        response = {
          initialPromptEvaluation: '#### Claude-Ready Prompt\nThis response contains instructions for Claude to process.',
          refinedPrompt: content,
          explanationOfRefinements: '#### Format Explanation\nThis is a structured prompt ready for Claude to execute. Copy the refined prompt section and use it directly with Claude.',
          isClaudeReady: true,
          fullResponse: result
        };
      } else {
        const sections = content.split('\n\n');
        
        response = {
          initialPromptEvaluation: sections[0] || '#### Original prompt analysis\n- Analyzing prompt structure and clarity',
          refinedPrompt: sections[1] || prompt,
          explanationOfRefinements: sections[2] || '#### Refinement Explanation\n- Applied strategy-specific improvements',
          fullResponse: result
        };
      }
    } 
    // Handle tools/call response format
    else if (result.content && result.content[0]) {
      let content = result.content[0].text || '';
      if (typeof content === 'object' && content.text) {
        content = content.text;
      }
      
      // Check if this is a metaprompt template that needs processing
      if (processMetaprompt && isMetapromptTemplate && isMetapromptTemplate(content)) {
        console.log('Detected metaprompt template, processing with Claude...');
        try {
          const refinedPrompt = await processMetaprompt(content, prompt);
          response = {
            initialPromptEvaluation: '#### Metaprompt Template Applied\nUsed Claude to process the metaprompt template with your input.',
            refinedPrompt: refinedPrompt,
            explanationOfRefinements: '#### Processing Details\nThe metaprompt template was processed through Claude API to generate a refined prompt specifically tailored to your request.',
            isProcessed: true,
            fullResponse: result
          };
        } catch (error) {
          console.error('Failed to process metaprompt:', error);
          // Fall back to showing the template
          response = {
            initialPromptEvaluation: '#### Metaprompt Template\nThis is a template that requires Claude API processing.',
            refinedPrompt: content,
            explanationOfRefinements: '#### Template Instructions\nSet ANTHROPIC_API_KEY in .env file to enable automatic processing of metaprompt templates.',
            isTemplate: true,
            fullResponse: result
          };
        }
      }
      // Check if this is a Claude-ready prompt format
      else if (isClaudeFormat(content)) {
        response = {
          initialPromptEvaluation: '#### Claude-Ready Prompt\nThis response contains instructions for Claude to process.',
          refinedPrompt: content,
          explanationOfRefinements: '#### Format Explanation\nThis is a structured prompt ready for Claude to execute. Copy the refined prompt section and use it directly with Claude.',
          isClaudeReady: true,
          fullResponse: result
        };
      } else {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(content);
          response = {
            initialPromptEvaluation: parsed.initial_prompt_evaluation || parsed.initialPromptEvaluation || '#### Original prompt analysis\n- Analyzing prompt structure and clarity',
            refinedPrompt: parsed.refined_prompt || parsed.refinedPrompt || prompt,
            explanationOfRefinements: parsed.explanation_of_refinements || parsed.explanationOfRefinements || '#### Refinement Explanation\n- Applied strategy-specific improvements',
            fullResponse: result
          };
        } catch (e) {
          // If not JSON, treat as plain text
          response = {
            initialPromptEvaluation: '#### Original prompt analysis\n- Analyzing prompt structure and clarity',
            refinedPrompt: content || prompt,
            explanationOfRefinements: '#### Refinement Explanation\n- Applied strategy-specific improvements',
            fullResponse: result
          };
        }
      }
    } 
    // Fallback format
    else {
      response = {
        initialPromptEvaluation: '#### Original prompt analysis\n- ' + (result.analysis || 'Analyzing prompt structure and clarity'),
        refinedPrompt: result.refined_prompt || result.refinedPrompt || prompt,
        explanationOfRefinements: '#### Refinement Explanation\n- ' + (result.explanation || 'Applied strategy-specific improvements'),
        fullResponse: result
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Refine with strategy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply prompt to model
app.post('/apply-prompt', async (req, res) => {
  try {
    const { prompt, model, systemPrompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Try to call MCP server to apply the prompt
    try {
      const result = await sendMCPRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'apply_prompt',
          arguments: {
            prompt,
            model: model || 'default',
            system_prompt: systemPrompt
          }
        }
      });
      
      const content = result.content?.[0]?.text;
      if (!content) {
        throw new Error('No output received from MCP server');
      }
      
      res.json({ output: content });
    } catch (mcpError) {
      console.error('MCP apply prompt failed:', mcpError);
      // Return error instead of mock data
      return res.status(503).json({ 
        error: 'Prompt application service unavailable',
        details: mcpError.message,
        hint: 'This endpoint requires MCP server support for apply_prompt tool'
      });
    }
  } catch (error) {
    console.error('Apply prompt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start servers
const API_PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

startMCPServer();

app.listen(API_PORT, () => {
  console.log(`MCP HTTP Bridge running on http://localhost:${API_PORT}`);
});

httpServer.listen(WS_PORT, () => {
  console.log(`WebSocket server running on http://localhost:${WS_PORT}`);
});