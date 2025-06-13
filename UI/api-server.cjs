const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs').promises;

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

// Load strategies from the metaprompts directory
async function loadStrategies() {
  const strategies = [];
  const metapromptsDir = path.join(__dirname, '..', 'metaprompts');
  
  try {
    const categories = await fs.readdir(metapromptsDir);
    
    for (const category of categories) {
      const categoryPath = path.join(metapromptsDir, category);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory() && !category.startsWith('.')) {
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('_')) {
            const filePath = path.join(categoryPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            const strategy = JSON.parse(content);
            
            strategies.push({
              id: `${category}/${file.replace('.json', '')}`,
              name: strategy.name || file.replace('.json', ''),
              description: strategy.description || '',
              category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              content: strategy,
              usageCount: Math.floor(Math.random() * 100), // Mock data
              avgResponseTime: Math.floor(Math.random() * 200) + 50, // Mock data
              successRate: 0.8 + Math.random() * 0.2 // Mock data
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading strategies:', error);
  }
  
  return strategies;
}

let strategiesCache = [];

// Routes
app.get('/strategies', async (req, res) => {
  if (strategiesCache.length === 0) {
    strategiesCache = await loadStrategies();
  }
  res.json(strategiesCache);
});

app.get('/strategies/:id', async (req, res) => {
  if (strategiesCache.length === 0) {
    strategiesCache = await loadStrategies();
  }
  const strategy = strategiesCache.find(s => s.id === req.params.id);
  if (strategy) {
    // Debug logging
    if (strategy.id === 'done' || strategy.id === 'core_strategies/done') {
      console.log('Done strategy content keys:', Object.keys(strategy.content || {}));
      console.log('Has template:', !!strategy.content?.template);
    }
    res.json(strategy);
  } else {
    res.status(404).json({ error: 'Strategy not found' });
  }
});

app.get('/strategies/search', async (req, res) => {
  if (strategiesCache.length === 0) {
    strategiesCache = await loadStrategies();
  }
  const query = req.query.q?.toLowerCase() || '';
  const filtered = strategiesCache.filter(s => 
    s.name.toLowerCase().includes(query) ||
    s.description.toLowerCase().includes(query) ||
    s.category.toLowerCase().includes(query)
  );
  res.json(filtered);
});

app.post('/refine', async (req, res) => {
  const { prompt, strategy } = req.body;
  
  // Mock refinement result
  const refinedPrompt = `[Refined using ${strategy || 'auto'}]\n\n${prompt}\n\n[Additional context and improvements would be added here by the actual MCP server]`;
  
  res.json({
    refinedPrompt,
    strategy: strategy || 'auto-selected',
    confidence: 0.85 + Math.random() * 0.15,
    suggestions: [
      'Consider adding more specific context',
      'Include expected output format',
      'Add examples for clarity'
    ],
    refinementTime: Math.floor(Math.random() * 500) + 100
  });
});

app.get('/metrics', async (req, res) => {
  if (strategiesCache.length === 0) {
    strategiesCache = await loadStrategies();
  }
  
  res.json({
    totalStrategies: strategiesCache.length,
    totalRefinements: Math.floor(Math.random() * 1000) + 500,
    avgResponseTime: Math.floor(Math.random() * 100) + 50,
    topStrategies: strategiesCache.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      usageCount: s.usageCount
    })),
    recentActivity: [
      { time: '2 mins ago', action: 'Refined', strategy: 'ARPE Framework' },
      { time: '5 mins ago', action: 'Refined', strategy: 'STAR Method' },
      { time: '10 mins ago', action: 'Refined', strategy: 'Meta-Cognitive' },
    ]
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('refinement:start', (data) => {
    console.log('Refinement session started:', data.sessionId);
  });
  
  socket.on('refinement:update', (data) => {
    console.log('Refinement update:', data);
    // Echo back to client with mock response
    socket.emit('refinement:update', {
      type: 'refinement:update',
      sessionId: data.sessionId,
      status: 'processing'
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start servers
const API_PORT = 3001;
const WS_PORT = 3002;

app.listen(API_PORT, () => {
  console.log(`API server running on http://localhost:${API_PORT}`);
});

httpServer.listen(WS_PORT, () => {
  console.log(`WebSocket server running on http://localhost:${WS_PORT}`);
});