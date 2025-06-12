import type { Strategy, Collection, RefinementResult } from './api';

// This service will attempt to use the MCP server if available,
// otherwise fall back to the mock API server

class MCPApiService {
  private baseUrl: string = 'http://localhost:3001';
  private wsUrl: string = 'http://localhost:3002';
  
  constructor() {
    // Check if we have a custom MCP endpoint
    const mcpEndpoint = import.meta.env.VITE_MCP_ENDPOINT;
    if (mcpEndpoint) {
      this.baseUrl = mcpEndpoint;
    }
  }

  async checkMCPServer(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getStrategies(): Promise<Strategy[]> {
    try {
      const response = await fetch(`${this.baseUrl}/strategies`);
      if (!response.ok) throw new Error('Failed to fetch strategies');
      return await response.json();
    } catch (error) {
      console.error('Error fetching strategies:', error);
      // Return empty array or throw based on your preference
      return [];
    }
  }

  async getStrategy(id: string): Promise<Strategy> {
    const response = await fetch(`${this.baseUrl}/strategies/${id}`);
    if (!response.ok) throw new Error('Strategy not found');
    return await response.json();
  }

  async refinePrompt(prompt: string, strategy?: string): Promise<RefinementResult> {
    const response = await fetch(`${this.baseUrl}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, strategy })
    });
    
    if (!response.ok) throw new Error('Failed to refine prompt');
    return await response.json();
  }

  async searchStrategies(query: string): Promise<Strategy[]> {
    const response = await fetch(`${this.baseUrl}/strategies/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  }

  async getCollections(): Promise<Collection[]> {
    const response = await fetch(`${this.baseUrl}/collections`);
    if (!response.ok) return [];
    return await response.json();
  }

  async createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    const response = await fetch(`${this.baseUrl}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collection)
    });
    
    if (!response.ok) throw new Error('Failed to create collection');
    return await response.json();
  }

  async getMetrics(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return await response.json();
  }
}

export const mcpApiService = new MCPApiService();