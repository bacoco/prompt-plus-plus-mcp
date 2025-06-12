# UI Implementation Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Running MCP server instance

### Initial Setup

```bash
# Navigate to UI directory
cd UI

# Initialize React project with Vite
npm create vite@latest prompt-plus-ui -- --template react-ts

# Install dependencies
cd prompt-plus-ui
npm install

# Install UI dependencies
npm install @radix-ui/react-* tailwindcss @tanstack/react-query zustand
npm install monaco-editor @monaco-editor/react
npm install lucide-react recharts
npm install socket.io-client axios
npm install -D @types/react @types/node tailwindcss postcss autoprefixer
```

## API Integration Layer

### 1. Create API Service (`src/services/api.ts`)

```typescript
import axios from 'axios';
import { StrategyInfo, Collection, TestResult, Metrics } from '../types';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Strategy APIs
export const strategyAPI = {
  list: () => api.get<StrategyInfo[]>('/strategies'),
  get: (key: string) => api.get<StrategyInfo>(`/strategies/${key}`),
  create: (strategy: Partial<StrategyInfo>) => api.post('/strategies', strategy),
  update: (key: string, strategy: Partial<StrategyInfo>) => api.put(`/strategies/${key}`, strategy),
  delete: (key: string) => api.delete(`/strategies/${key}`)
};

// Testing APIs
export const testAPI = {
  refine: (prompt: string, strategy: string) => 
    api.post<TestResult>('/test/refine', { prompt, strategy }),
  compare: (prompt: string, strategies: string[]) => 
    api.post<TestResult[]>('/test/compare', { prompt, strategies }),
  history: () => api.get<TestResult[]>('/test/history')
};

// Collection APIs
export const collectionAPI = {
  list: () => api.get<Collection[]>('/collections'),
  create: (collection: Partial<Collection>) => api.post('/collections', collection),
  update: (id: string, collection: Partial<Collection>) => 
    api.put(`/collections/${id}`, collection),
  delete: (id: string) => api.delete(`/collections/${id}`),
  export: (id: string) => api.post(`/collections/${id}/export`)
};

// Metrics APIs
export const metricsAPI = {
  performance: () => api.get<Metrics>('/metrics/performance'),
  usage: () => api.get<any>('/metrics/usage'),
  health: () => api.get<any>('/metrics/health')
};
```

### 2. WebSocket Integration (`src/services/websocket.ts`)

```typescript
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';

const SOCKET_URL = process.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();

// React hook for WebSocket
export function useSocket() {
  useEffect(() => {
    const socket = socketService.connect();
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  return socketService;
}
```

## State Management with Zustand

### Strategy Store (`src/stores/strategyStore.ts`)

```typescript
import { create } from 'zustand';
import { StrategyInfo } from '../types';
import { strategyAPI } from '../services/api';

interface StrategyState {
  strategies: StrategyInfo[];
  selectedStrategy: StrategyInfo | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchStrategies: () => Promise<void>;
  selectStrategy: (key: string) => void;
  createStrategy: (strategy: Partial<StrategyInfo>) => Promise<void>;
  updateStrategy: (key: string, updates: Partial<StrategyInfo>) => Promise<void>;
  deleteStrategy: (key: string) => Promise<void>;
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  strategies: [],
  selectedStrategy: null,
  loading: false,
  error: null,

  fetchStrategies: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await strategyAPI.list();
      set({ strategies: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  selectStrategy: (key) => {
    const strategy = get().strategies.find(s => s.key === key);
    set({ selectedStrategy: strategy || null });
  },

  createStrategy: async (strategy) => {
    try {
      const { data } = await strategyAPI.create(strategy);
      set(state => ({ 
        strategies: [...state.strategies, data] 
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateStrategy: async (key, updates) => {
    try {
      const { data } = await strategyAPI.update(key, updates);
      set(state => ({
        strategies: state.strategies.map(s => 
          s.key === key ? data : s
        ),
        selectedStrategy: state.selectedStrategy?.key === key 
          ? data 
          : state.selectedStrategy
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  deleteStrategy: async (key) => {
    try {
      await strategyAPI.delete(key);
      set(state => ({
        strategies: state.strategies.filter(s => s.key !== key),
        selectedStrategy: state.selectedStrategy?.key === key 
          ? null 
          : state.selectedStrategy
      }));
    } catch (error) {
      set({ error: error.message });
    }
  }
}));
```

## Key Components Implementation

### 1. Strategy Explorer Component

```typescript
// src/components/strategies/StrategyExplorer.tsx
import React, { useEffect, useState } from 'react';
import { useStrategyStore } from '../../stores/strategyStore';
import { StrategyCard } from './StrategyCard';
import { CategoryTree } from './CategoryTree';
import { Search, Filter } from 'lucide-react';

export function StrategyExplorer() {
  const { strategies, fetchStrategies, loading } = useStrategyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [complexityFilter, setComplexityFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || strategy.category === selectedCategory;
    const matchesComplexity = !complexityFilter || strategy.complexity === complexityFilter;
    
    return matchesSearch && matchesCategory && matchesComplexity;
  });

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <CategoryTree 
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        {/* Search and filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search strategies..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg"
            value={complexityFilter || ''}
            onChange={(e) => setComplexityFilter(e.target.value || null)}
          >
            <option value="">All Complexity</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Strategy grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStrategies.map(strategy => (
              <StrategyCard key={strategy.key} strategy={strategy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Prompt Tester Component

```typescript
// src/components/testing/PromptTester.tsx
import React, { useState } from 'react';
import { useStrategyStore } from '../../stores/strategyStore';
import { testAPI } from '../../services/api';
import MonacoEditor from '@monaco-editor/react';
import { ArrowRight, Loader2 } from 'lucide-react';

export function PromptTester() {
  const { strategies } = useStrategyStore();
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const handleRefine = async () => {
    if (!originalPrompt || !selectedStrategy) return;

    setLoading(true);
    try {
      const result = await testAPI.refine(originalPrompt, selectedStrategy);
      setRefinedPrompt(result.data.refined);
      setMetrics(result.data.metrics);
    } catch (error) {
      console.error('Refinement failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-4">
        <h2 className="text-xl font-semibold">Prompt Testing Lab</h2>
        
        <select
          className="ml-auto px-4 py-2 border rounded-lg"
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value)}
        >
          <option value="">Select a strategy...</option>
          {strategies.map(s => (
            <option key={s.key} value={s.key}>{s.name}</option>
          ))}
        </select>

        <button
          onClick={handleRefine}
          disabled={!originalPrompt || !selectedStrategy || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refining...
            </>
          ) : (
            <>
              Refine
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Editor panels */}
      <div className="flex-1 flex">
        {/* Original prompt */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 bg-gray-50 border-b">
            <h3 className="font-medium">Original Prompt</h3>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language="markdown"
              value={originalPrompt}
              onChange={(value) => setOriginalPrompt(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-200" />

        {/* Refined prompt */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 bg-gray-50 border-b">
            <h3 className="font-medium">Refined Prompt</h3>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language="markdown"
              value={refinedPrompt}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">Words:</span>
              <span className="ml-2 font-medium">
                {metrics.originalWords} → {metrics.refinedWords} 
                (+{Math.round((metrics.refinedWords / metrics.originalWords - 1) * 100)}%)
              </span>
            </div>
            <div>
              <span className="text-gray-600">Clarity:</span>
              <span className="ml-2 font-medium">{metrics.clarityScore}%</span>
            </div>
            <div>
              <span className="text-gray-600">Processing Time:</span>
              <span className="ml-2 font-medium">{metrics.processingTime}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Custom Strategy Creator

```typescript
// src/components/custom/StrategyCreator.tsx
import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useStrategyStore } from '../../stores/strategyStore';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

const strategyTemplate = {
  name: '',
  description: '',
  template: '',
  examples: [''],
  complexity: 'Medium',
  timeInvestment: 'Medium',
  triggers: [],
  bestFor: [],
  customCategory: 'Custom'
};

export function StrategyCreator() {
  const { createStrategy } = useStrategyStore();
  const [strategy, setStrategy] = useState(strategyTemplate);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const validate = () => {
    const newErrors = [];
    if (!strategy.name) newErrors.push('Name is required');
    if (!strategy.description || strategy.description.length < 10) 
      newErrors.push('Description must be at least 10 characters');
    if (!strategy.template || strategy.template.length < 50)
      newErrors.push('Template must be at least 50 characters');
    if (!strategy.template.includes('[Insert initial prompt here]'))
      newErrors.push('Template must contain [Insert initial prompt here]');
    if (strategy.examples.length === 0 || !strategy.examples[0])
      newErrors.push('At least one example is required');
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await createStrategy({
        ...strategy,
        key: strategy.name.toLowerCase().replace(/\s+/g, '_')
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setStrategy(strategyTemplate);
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Form sidebar */}
      <div className="w-96 border-r p-6 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Custom Strategy Creator</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              value={strategy.name}
              onChange={(e) => setStrategy({ ...strategy, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Key</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              value={strategy.name.toLowerCase().replace(/\s+/g, '_')}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              value={strategy.customCategory}
              onChange={(e) => setStrategy({ ...strategy, customCategory: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              value={strategy.description}
              onChange={(e) => setStrategy({ ...strategy, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Complexity</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={strategy.complexity}
                onChange={(e) => setStrategy({ ...strategy, complexity: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Investment</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={strategy.timeInvestment}
                onChange={(e) => setStrategy({ ...strategy, timeInvestment: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Validation status */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Validation Errors</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Strategy saved successfully!</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Strategy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template editor */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 bg-gray-50 border-b">
          <h3 className="font-medium">Template Editor</h3>
        </div>
        <div className="flex-1">
          <MonacoEditor
            height="100%"
            language="markdown"
            value={strategy.template}
            onChange={(value) => setStrategy({ ...strategy, template: value || '' })}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on'
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

## MCP Server API Extension

Add these endpoints to your MCP server:

```typescript
// src/api-router.ts
import express from 'express';
import { StrategyManager } from './strategy-manager.js';
import { PromptRefiner } from './prompt-refiner.js';

export function createAPIRouter(strategyManager: StrategyManager, promptRefiner: PromptRefiner) {
  const router = express.Router();

  // Strategy endpoints
  router.get('/strategies', (req, res) => {
    const strategies = Array.from(strategyManager.getAllStrategies().values());
    res.json(strategies);
  });

  router.get('/strategies/:key', (req, res) => {
    const strategy = strategyManager.getStrategy(req.params.key);
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json(strategy);
  });

  router.post('/strategies', (req, res) => {
    try {
      // Validate and save custom strategy
      const strategy = req.body;
      strategyManager.addCustomStrategy(strategy);
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Test endpoints
  router.post('/test/refine', async (req, res) => {
    try {
      const { prompt, strategy } = req.body;
      const result = await promptRefiner.refine(prompt, strategy);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Metrics endpoints
  router.get('/metrics/performance', (req, res) => {
    const metrics = promptRefiner.getPerformanceMetrics();
    res.json(metrics);
  });

  return router;
}
```

## Deployment

### Development
```bash
# Start MCP server with API
npm run dev:api

# Start UI development server
cd UI/prompt-plus-ui
npm run dev
```

### Production Build
```bash
# Build UI
cd UI/prompt-plus-ui
npm run build

# Serve with MCP server
# Copy dist/ to MCP server public directory
```

## Next Steps

1. **Set up the project structure** following this guide
2. **Implement core components** starting with Strategy Explorer
3. **Connect to MCP server** via API endpoints
4. **Add real-time updates** with WebSocket
5. **Test thoroughly** with different scenarios
6. **Deploy** as standalone or integrated app

This implementation guide provides a solid foundation for building the UI. The modular architecture allows for incremental development and easy maintenance.