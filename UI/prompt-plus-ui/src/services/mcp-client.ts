import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import type { Strategy, RefinementResult } from './api';

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected: boolean = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // Spawn the MCP server process
      const serverProcess = spawn('node', [
        '../../dist/index.js'
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Create transport
      this.transport = new StdioClientTransport({
        stdin: serverProcess.stdin,
        stdout: serverProcess.stdout,
        stderr: serverProcess.stderr
      });

      // Create client
      this.client = new Client({
        name: 'prompt-plus-ui',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Connect
      await this.client.connect(this.transport);
      this.connected = true;
      console.log('Connected to MCP server');

      // List available tools
      const tools = await this.client.listTools();
      console.log('Available tools:', tools);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
      this.client = null;
      this.transport = null;
    }
  }

  async getStrategies(): Promise<Strategy[]> {
    if (!this.client || !this.connected) {
      await this.connect();
    }

    try {
      // Call the list_strategies tool
      const result = await this.client!.callTool({
        name: 'list_strategies',
        arguments: {}
      });

      // Parse the result
      const strategies = JSON.parse(result.content[0].text);
      
      // Transform to our Strategy format
      return strategies.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        content: s,
        usageCount: Math.floor(Math.random() * 100), // Mock for now
        avgResponseTime: Math.floor(Math.random() * 200) + 50,
        successRate: 0.8 + Math.random() * 0.2
      }));
    } catch (error) {
      console.error('Failed to get strategies:', error);
      throw error;
    }
  }

  async getStrategy(id: string): Promise<Strategy | null> {
    if (!this.client || !this.connected) {
      await this.connect();
    }

    try {
      // Call the get_strategy tool
      const result = await this.client!.callTool({
        name: 'get_strategy',
        arguments: { strategy_id: id }
      });

      const strategy = JSON.parse(result.content[0].text);
      if (!strategy) return null;

      return {
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        category: strategy.category,
        content: strategy,
        usageCount: Math.floor(Math.random() * 100),
        avgResponseTime: Math.floor(Math.random() * 200) + 50,
        successRate: 0.8 + Math.random() * 0.2
      };
    } catch (error) {
      console.error('Failed to get strategy:', error);
      return null;
    }
  }

  async refinePrompt(prompt: string, strategy?: string): Promise<RefinementResult> {
    if (!this.client || !this.connected) {
      await this.connect();
    }

    const startTime = Date.now();

    try {
      // Call the refine_prompt tool
      const result = await this.client!.callTool({
        name: 'refine_prompt',
        arguments: {
          prompt,
          strategy,
          // You can add other options here based on what the MCP server supports
          verbose: true
        }
      });

      const refinedContent = result.content[0].text;
      const endTime = Date.now();

      // Parse the result - the actual format depends on your MCP server
      return {
        refinedPrompt: refinedContent,
        strategy: strategy || 'auto-selected',
        confidence: 0.85 + Math.random() * 0.15,
        suggestions: [
          'Consider adding more context',
          'Structure improved for clarity',
          'Enhanced with strategic framework'
        ],
        refinementTime: endTime - startTime
      };
    } catch (error) {
      console.error('Failed to refine prompt:', error);
      throw error;
    }
  }

  async searchStrategies(query: string): Promise<Strategy[]> {
    const allStrategies = await this.getStrategies();
    const lowercaseQuery = query.toLowerCase();
    
    return allStrategies.filter(s =>
      s.name.toLowerCase().includes(lowercaseQuery) ||
      s.description.toLowerCase().includes(lowercaseQuery) ||
      s.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getMetrics(): Promise<any> {
    const strategies = await this.getStrategies();
    
    return {
      totalStrategies: strategies.length,
      totalRefinements: Math.floor(Math.random() * 1000) + 500,
      avgResponseTime: Math.floor(Math.random() * 100) + 50,
      topStrategies: strategies.slice(0, 5).map(s => ({
        id: s.id,
        name: s.name,
        usageCount: s.usageCount || 0
      })),
      recentActivity: [
        { time: '2 mins ago', action: 'Refined', strategy: 'ARPE Framework' },
        { time: '5 mins ago', action: 'Refined', strategy: 'STAR Method' },
        { time: '10 mins ago', action: 'Refined', strategy: 'Meta-Cognitive' },
      ]
    };
  }
}

// Singleton instance
export const mcpClient = new MCPClient();