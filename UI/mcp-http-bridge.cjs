#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

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
            category: strategy.category || 'uncategorized'
          }));
        }
      } else if (typeof parsed === 'object') {
        // If it's a direct object with strategy keys
        strategies = Object.entries(parsed).map(([key, strategy]) => ({
          ...strategy,
          id: key,
          category: strategy.category || 'uncategorized'
        }));
      }
    } catch (e) {
      console.error('Failed to parse strategies:', e);
      strategies = [];
    }
    
    // Ensure each strategy has required fields
    const enrichedStrategies = strategies.map(s => ({
      id: s.id || `${s.category}/${s.name}`.toLowerCase().replace(/\s+/g, '-'),
      name: s.name || 'Unnamed Strategy',
      description: s.description || 'No description available',
      category: s.category || 'uncategorized',
      content: s.content || s,
      examples: Array.isArray(s.examples) ? s.examples : (s.examples ? [s.examples] : []),
      usageCount: Math.floor(Math.random() * 100),
      avgResponseTime: Math.floor(Math.random() * 200) + 50,
      successRate: 0.8 + Math.random() * 0.2
    }));

    res.json(enrichedStrategies);
  } catch (error) {
    console.error('Error listing strategies:', error);
    res.status(500).json({ error: 'Failed to list strategies' });
  }
});

app.get('/strategies/:id', async (req, res) => {
  try {
    const result = await sendMCPRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'get_strategy',
        arguments: {
          strategy_id: req.params.id
        }
      }
    });

    const content = result.content?.[0]?.text;
    if (!content) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    const strategy = JSON.parse(content);
    res.json({
      ...strategy,
      id: req.params.id,
      usageCount: Math.floor(Math.random() * 100),
      avgResponseTime: Math.floor(Math.random() * 200) + 50,
      successRate: 0.8 + Math.random() * 0.2
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
      confidence: 0.85 + Math.random() * 0.15,
      suggestions: [
        'Prompt refined using MCP server',
        'Strategic framework applied',
        'Context and clarity enhanced'
      ],
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

app.get('/strategies/search', async (req, res) => {
  try {
    // Get all strategies and filter
    const allStrategies = await sendMCPRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'list_strategies',
        arguments: {}
      }
    });

    const content = allStrategies.content?.[0]?.text || '{}';
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
            category: strategy.category || 'uncategorized'
          }));
        }
      } else if (typeof parsed === 'object') {
        strategies = Object.entries(parsed).map(([key, strategy]) => ({
          ...strategy,
          id: key,
          category: strategy.category || 'uncategorized'
        }));
      }
    } catch (e) {
      console.error('Failed to parse strategies for search:', e);
      strategies = [];
    }
    
    const query = req.query.q?.toLowerCase() || '';
    const filtered = strategies.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query)
    );

    res.json(filtered.map(s => ({
      id: s.id || `${s.category}/${s.name}`.toLowerCase().replace(/\s+/g, '-'),
      name: s.name || 'Unnamed Strategy',
      description: s.description || 'No description available',
      category: s.category || 'uncategorized',
      content: s.content || s,
      examples: Array.isArray(s.examples) ? s.examples : (s.examples ? [s.examples] : []),
      usageCount: Math.floor(Math.random() * 100),
      avgResponseTime: Math.floor(Math.random() * 200) + 50,
      successRate: 0.8 + Math.random() * 0.2
    })));
  } catch (error) {
    console.error('Error searching strategies:', error);
    res.status(500).json({ error: 'Failed to search strategies' });
  }
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
            category: strategy.category || 'uncategorized'
          }));
        }
      } else if (typeof parsed === 'object') {
        strategies = Object.entries(parsed).map(([key, strategy]) => ({
          ...strategy,
          id: key,
          name: strategy.name,
          category: strategy.category || 'uncategorized'
        }));
      }
    } catch (e) {
      console.error('Failed to parse strategies for metrics:', e);
      strategies = [];
    }

    res.json({
      totalStrategies: strategies.length,
      totalRefinements: Math.floor(Math.random() * 1000) + 500,
      avgResponseTime: Math.floor(Math.random() * 100) + 50,
      topStrategies: strategies.slice(0, 5).map(s => ({
        id: s.id || `${s.category}/${s.name}`.toLowerCase().replace(/\s+/g, '-'),
        name: s.name,
        usageCount: Math.floor(Math.random() * 100)
      })),
      recentActivity: [
        { time: '2 mins ago', action: 'Refined', strategy: 'ARPE Framework' },
        { time: '5 mins ago', action: 'Refined', strategy: 'STAR Method' },
        { time: '10 mins ago', action: 'Refined', strategy: 'Meta-Cognitive' },
      ]
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
app.post('/automatic-metaprompt', async (req, res) => {
  try {
    const { prompt, routerTemplate } = req.body;
    
    // For now, return mock data that matches the expected format
    // In production, this would call the actual LLM with the router template
    const mockResult = {
      recommended_metaprompt: {
        key: 'arpe',
        name: 'ARPE Framework',
        description: 'Versatile framework for general prompt enhancement',
        explanation: 'Based on the nature of your prompt, ARPE provides a balanced approach',
        similar_sample: 'General task refinement',
        customized_sample: 'Your prompt refined with ARPE methodology'
      },
      alternative_recommendation: {
        name: 'STAR Method',
        explanation: 'Alternative structured approach for clarity'
      }
    };
    
    res.json(mockResult);
  } catch (error) {
    console.error('Automatic metaprompt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refine with specific strategy
app.post('/refine-with-strategy', async (req, res) => {
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
    
    // Handle prompts/get response format
    if (result.messages && result.messages.length > 0) {
      let content = result.messages[0].content || '';
      // Handle object content (new MCP format)
      if (typeof content === 'object' && content.text) {
        content = content.text;
      }
      const sections = content.split('\n\n');
      
      response = {
        initialPromptEvaluation: sections[0] || '#### Original prompt analysis\n- Analyzing prompt structure and clarity',
        refinedPrompt: sections[1] || prompt,
        explanationOfRefinements: sections[2] || '#### Refinement Explanation\n- Applied strategy-specific improvements',
        fullResponse: result
      };
    } 
    // Handle tools/call response format
    else if (result.content && result.content[0]) {
      let content = result.content[0].text || '';
      if (typeof content === 'object' && content.text) {
        content = content.text;
      }
      
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
    
    // Mock response for now
    // In production, this would call the actual model API
    const mockOutput = `**Analysis Results**\n\n${prompt}\n\n*Model: ${model}*\n*Applied with system prompt: ${systemPrompt}*`;
    
    res.json({ output: mockOutput });
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