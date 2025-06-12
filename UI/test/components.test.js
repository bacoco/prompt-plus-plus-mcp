import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Import components
import PromptRefiner from '../src/components/PromptRefiner';
import StrategyExplorer from '../src/components/StrategyExplorer';
import Dashboard from '../src/components/Dashboard';

// Mock axios
const mock = new MockAdapter(axios);

// Helper to wrap components with QueryClient
const renderWithQueryClient = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('React Components - Dynamic Data Loading', () => {
  beforeEach(() => {
    mock.reset();
  });

  describe('PromptRefiner Component', () => {
    test('should load strategies dynamically from MCP', async () => {
      const mockStrategies = {
        strategies: [
          { id: 'morphosis', name: 'Morphosis', description: 'Transform ideas', category: 'core' },
          { id: 'star', name: 'STAR', description: 'Structured approach', category: 'core' },
          { id: 'arpe', name: 'ARPE', description: 'Advanced reasoning', category: 'core' }
        ]
      };

      mock.onGet('http://localhost:3002/strategies').reply(200, mockStrategies);

      renderWithQueryClient(<PromptRefiner />);

      // Wait for strategies to load
      await waitFor(() => {
        expect(screen.getByText('Morphosis')).toBeInTheDocument();
        expect(screen.getByText('STAR')).toBeInTheDocument();
        expect(screen.getByText('ARPE')).toBeInTheDocument();
      });

      // Verify no static data is present
      expect(screen.queryByText('STATIC_STRATEGY')).not.toBeInTheDocument();
    });

    test('should handle strategy selection and refinement', async () => {
      const mockStrategies = {
        strategies: [
          { id: 'morphosis', name: 'Morphosis', description: 'Transform ideas', category: 'core' }
        ]
      };

      const mockRefinement = {
        refinedPrompt: 'This is a dynamically refined prompt from MCP server'
      };

      mock.onGet('http://localhost:3002/strategies').reply(200, mockStrategies);
      mock.onPost('http://localhost:3002/refine-with-strategy').reply(200, mockRefinement);

      renderWithQueryClient(<PromptRefiner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter your prompt/i)).toBeInTheDocument();
      });

      // Enter a prompt
      const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
      await userEvent.type(promptInput, 'Create a REST API');

      // Select strategy
      await waitFor(() => {
        const strategyButton = screen.getByText('Morphosis');
        fireEvent.click(strategyButton);
      });

      // Click refine button
      const refineButton = screen.getByText(/refine prompt/i);
      fireEvent.click(refineButton);

      // Wait for refined prompt
      await waitFor(() => {
        expect(screen.getByText(mockRefinement.refinedPrompt)).toBeInTheDocument();
      });
    });

    test('should display error when MCP server is unavailable', async () => {
      mock.onGet('http://localhost:3002/strategies').networkError();

      renderWithQueryClient(<PromptRefiner />);

      await waitFor(() => {
        expect(screen.getByText(/error loading strategies/i)).toBeInTheDocument();
      });
    });

    test('should use automatic metaprompt when no strategy selected', async () => {
      const mockAutoResponse = {
        strategy: { id: 'auto', name: 'Auto-selected' },
        refinedPrompt: 'Automatically refined prompt'
      };

      mock.onPost('http://localhost:3002/automatic-metaprompt').reply(200, mockAutoResponse);

      renderWithQueryClient(<PromptRefiner />);

      const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
      await userEvent.type(promptInput, 'Build a web app');

      const refineButton = screen.getByText(/refine prompt/i);
      fireEvent.click(refineButton);

      await waitFor(() => {
        expect(screen.getByText(mockAutoResponse.refinedPrompt)).toBeInTheDocument();
        expect(screen.getByText(/auto-selected strategy/i)).toBeInTheDocument();
      });
    });
  });

  describe('StrategyExplorer Component', () => {
    test('should display strategies grouped by category from MCP', async () => {
      const mockStrategies = {
        strategies: [
          { id: '1', name: 'Strategy A', category: 'core', description: 'Core strategy A' },
          { id: '2', name: 'Strategy B', category: 'core', description: 'Core strategy B' },
          { id: '3', name: 'Strategy C', category: 'advanced', description: 'Advanced strategy C' }
        ]
      };

      mock.onGet('http://localhost:3002/strategies').reply(200, mockStrategies);

      renderWithQueryClient(<StrategyExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Core')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
        expect(screen.getByText('Strategy A')).toBeInTheDocument();
        expect(screen.getByText('Strategy B')).toBeInTheDocument();
        expect(screen.getByText('Strategy C')).toBeInTheDocument();
      });
    });

    test('should filter strategies based on search', async () => {
      const mockStrategies = {
        strategies: [
          { id: '1', name: 'Morphosis', category: 'core', description: 'Transform' },
          { id: '2', name: 'STAR', category: 'core', description: 'Structured' },
          { id: '3', name: 'ARPE', category: 'advanced', description: 'Reasoning' }
        ]
      };

      mock.onGet('http://localhost:3002/strategies').reply(200, mockStrategies);

      renderWithQueryClient(<StrategyExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Morphosis')).toBeInTheDocument();
      });

      // Search for specific strategy
      const searchInput = screen.getByPlaceholderText(/search strategies/i);
      await userEvent.type(searchInput, 'STAR');

      await waitFor(() => {
        expect(screen.getByText('STAR')).toBeInTheDocument();
        expect(screen.queryByText('Morphosis')).not.toBeInTheDocument();
        expect(screen.queryByText('ARPE')).not.toBeInTheDocument();
      });
    });

    test('should show strategy details on selection', async () => {
      const mockStrategies = {
        strategies: [
          { 
            id: 'morphosis', 
            name: 'Morphosis', 
            category: 'core', 
            description: 'Transform and evolve ideas',
            template: 'Dynamic template from MCP'
          }
        ]
      };

      mock.onGet('http://localhost:3002/strategies').reply(200, mockStrategies);

      renderWithQueryClient(<StrategyExplorer />);

      await waitFor(() => {
        const strategyCard = screen.getByText('Morphosis');
        fireEvent.click(strategyCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Transform and evolve ideas')).toBeInTheDocument();
        expect(screen.getByText(/dynamic template from mcp/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Component', () => {
    test('should load all data from MCP on mount', async () => {
      const mockStrategies = {
        strategies: [
          { id: '1', name: 'Strategy 1', category: 'core' },
          { id: '2', name: 'Strategy 2', category: 'core' },
          { id: '3', name: 'Strategy 3', category: 'advanced' }
        ]
      };

      const mockStats = {
        totalStrategies: 3,
        categoriesCount: 2,
        recentActivity: []
      };

      mock.onGet('http://localhost:3002/strategies').reply(200, mockStrategies);
      mock.onGet('http://localhost:3002/stats').reply(200, mockStats);

      renderWithQueryClient(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/3 strategies/i)).toBeInTheDocument();
        expect(screen.getByText(/2 categories/i)).toBeInTheDocument();
      });

      // Verify no hardcoded data
      expect(screen.queryByText(/static/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/hardcoded/i)).not.toBeInTheDocument();
    });

    test('should handle real-time updates', async () => {
      const initialStrategies = {
        strategies: [{ id: '1', name: 'Initial Strategy', category: 'core' }]
      };

      const updatedStrategies = {
        strategies: [
          { id: '1', name: 'Initial Strategy', category: 'core' },
          { id: '2', name: 'New Strategy', category: 'advanced' }
        ]
      };

      mock.onGet('http://localhost:3002/strategies').replyOnce(200, initialStrategies);

      renderWithQueryClient(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Initial Strategy')).toBeInTheDocument();
      });

      // Simulate refresh
      mock.onGet('http://localhost:3002/strategies').replyOnce(200, updatedStrategies);

      const refreshButton = screen.getByText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('New Strategy')).toBeInTheDocument();
      });
    });
  });

  describe('API Service Methods', () => {
    test('should verify all API calls go through MCP bridge', async () => {
      const mockResponse = { data: 'test' };
      
      // Test each API endpoint
      const endpoints = [
        { method: 'get', url: '/strategies' },
        { method: 'post', url: '/refine-with-strategy', data: { prompt: 'test' } },
        { method: 'post', url: '/automatic-metaprompt', data: { prompt: 'test' } },
        { method: 'post', url: '/apply-prompt', data: { prompt: 'test' } }
      ];

      endpoints.forEach(endpoint => {
        mock[`on${endpoint.method.charAt(0).toUpperCase() + endpoint.method.slice(1)}`](
          `http://localhost:3002${endpoint.url}`
        ).reply(200, mockResponse);
      });

      // Import API service
      const apiService = require('../src/services/api').default;

      // Test each method
      const strategiesResponse = await apiService.getStrategies();
      expect(strategiesResponse.data).toEqual(mockResponse);

      const refineResponse = await apiService.refineWithStrategy('test', 'strategy1');
      expect(refineResponse.data).toEqual(mockResponse);

      const autoResponse = await apiService.automaticMetaprompt('test');
      expect(autoResponse.data).toEqual(mockResponse);

      const applyResponse = await apiService.applyPrompt('test');
      expect(applyResponse.data).toEqual(mockResponse);

      // Verify all requests went to MCP bridge
      expect(mock.history.get.length).toBe(1);
      expect(mock.history.post.length).toBe(3);
      expect(mock.history.get[0].url).toContain('localhost:3002');
      mock.history.post.forEach(req => {
        expect(req.url).toContain('localhost:3002');
      });
    });
  });
});