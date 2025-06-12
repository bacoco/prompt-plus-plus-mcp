import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { metapromptRouter } from '../constants/metapromptRouter';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Strategy {
  id: string;
  name: string;
  description: string;
  category: string;
  content: any;
  usageCount?: number;
  avgResponseTime?: number;
  successRate?: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  strategies: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RefinementResult {
  refinedPrompt: string;
  strategy: string;
  confidence: number;
  suggestions: string[];
  refinementTime: number;
}

export interface PromptRefinerResult {
  initialPromptEvaluation: string;
  refinedPrompt: string;
  explanationOfRefinements: string;
  fullResponse: any;
}

export interface AutomaticMetapromptResult {
  analysis: string;
  recommendedKey: string;
}

class MCPApiService {
  private socket: Socket | null = null;

  // Strategy methods
  async getStrategies(): Promise<Strategy[]> {
    const response = await api.get('/strategies');
    return response.data;
  }

  async getStrategy(id: string): Promise<Strategy> {
    const response = await api.get(`/strategies/${id}`);
    return response.data;
  }

  async searchStrategies(query: string): Promise<Strategy[]> {
    const response = await api.get('/strategies/search', { params: { q: query } });
    return response.data;
  }

  async createCustomStrategy(strategy: Omit<Strategy, 'id'>): Promise<Strategy> {
    const response = await api.post('/strategies/custom', strategy);
    return response.data;
  }

  async updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy> {
    const response = await api.put(`/strategies/${id}`, updates);
    return response.data;
  }

  async deleteStrategy(id: string): Promise<void> {
    await api.delete(`/strategies/${id}`);
  }

  // Refinement methods
  async refinePrompt(prompt: string, strategy?: string): Promise<RefinementResult> {
    const response = await api.post('/refine', { prompt, strategy });
    return response.data;
  }

  // Automatic metaprompt selection (matching prompt_refiner.py)
  async automaticMetaprompt(prompt: string): Promise<AutomaticMetapromptResult> {
    try {
      // This simulates the automatic_metaprompt function from prompt_refiner.py
      // In production, this would call the actual MCP server
      const response = await api.post('/automatic-metaprompt', {
        prompt,
        routerTemplate: metapromptRouter.replace('[Insert initial prompt here]', prompt)
      });
      
      // Parse the response to match the expected format
      const result = response.data;
      
      // Format the analysis markdown like the Python version
      const analysis = `
#### Selected MetaPrompt
- **Primary Choice**: ${result.recommended_metaprompt.name}
- *Description*: ${result.recommended_metaprompt.description}
- *Why This Choice*: ${result.recommended_metaprompt.explanation}
- *Similar Sample*: ${result.recommended_metaprompt.similar_sample}
- *Customized Sample*: ${result.recommended_metaprompt.customized_sample}

#### Alternative Option
- **Secondary Choice**: ${result.alternative_recommendation.name}
- *Why Consider This*: ${result.alternative_recommendation.explanation}
`;
      
      return {
        analysis,
        recommendedKey: result.recommended_metaprompt.key
      };
    } catch (error) {
      // For now, use local logic as fallback (will be replaced with actual MCP call)
      return this.localAutomaticMetaprompt(prompt);
    }
  }

  // Local fallback for automatic metaprompt selection
  private async localAutomaticMetaprompt(prompt: string): Promise<AutomaticMetapromptResult> {
    // This is a simplified version that mimics the router behavior
    const promptLower = prompt.toLowerCase();
    
    let recommendedKey = 'arpe';
    let primaryChoice = { name: 'ARPE Framework', description: '', explanation: '' };
    let alternativeChoice = { name: 'STAR Method', explanation: '' };
    
    if (promptLower.includes('comprehensive') || promptLower.includes('curriculum') || promptLower.includes('detailed analysis')) {
      recommendedKey = 'comprehensive_multistage';
      primaryChoice = {
        name: 'Comprehensive Multi-Stage Refinement',
        description: 'Use this method for a thorough, multi-stage refinement process.',
        explanation: 'Your prompt requires in-depth analysis and exploration of alternatives.'
      };
    } else if (promptLower.includes('explain') || promptLower.includes('describe')) {
      recommendedKey = 'star';
      primaryChoice = {
        name: 'STAR Method',
        description: 'Structured approach for explanatory tasks.',
        explanation: 'Based on the explanatory nature of your prompt, the STAR method provides clear structure.'
      };
    } else if (promptLower.includes('create') || promptLower.includes('design')) {
      recommendedKey = 'morphosis';
      primaryChoice = {
        name: 'Structured Evolution',
        description: 'Iterative refinement for creative tasks.',
        explanation: 'For creative and design tasks, Structured Evolution provides iterative refinement.'
      };
    }
    
    const analysis = `
#### Selected MetaPrompt
- **Primary Choice**: ${primaryChoice.name}
- *Description*: ${primaryChoice.description}
- *Why This Choice*: ${primaryChoice.explanation}
- *Similar Sample*: Based on keyword analysis
- *Customized Sample*: Tailored to your specific prompt

#### Alternative Option
- **Secondary Choice**: ${alternativeChoice.name}
- *Why Consider This*: ${alternativeChoice.explanation || 'Provides an alternative structured approach'}
`;
    
    return { analysis, recommendedKey };
  }

  // Refine prompt with specific strategy (matching prompt_refiner.py)
  async refinePromptWithStrategy(prompt: string, strategy: string): Promise<PromptRefinerResult> {
    try {
      const response = await api.post(`/refine-with-strategy`, {
        prompt,
        strategy
      });
      
      return {
        initialPromptEvaluation: response.data.initialPromptEvaluation,
        refinedPrompt: response.data.refinedPrompt,
        explanationOfRefinements: response.data.explanationOfRefinements,
        fullResponse: response.data.fullResponse
      };
    } catch (error) {
      // Fallback to MCP bridge
      return this.refinePromptViaMCP(prompt, strategy);
    }
  }

  // Apply prompt to model (matching prompt_refiner.py)
  async applyPrompt(prompt: string, model: string): Promise<string> {
    try {
      const response = await api.post('/apply-prompt', {
        prompt,
        model,
        systemPrompt: 'You are a markdown formatting expert.'
      });
      
      return response.data.output;
    } catch (error) {
      // Fallback response for demo
      return `**Model Response (${model})**\n\n${prompt}\n\n*This is a simulated response. In production, this would be the actual model output formatted in markdown.*`;
    }
  }

  // Fallback method using MCP bridge
  private async refinePromptViaMCP(prompt: string, strategy: string): Promise<PromptRefinerResult> {
    try {
      const response = await api.post('/mcp/prompt', {
        name: `refine_with_${strategy}`,
        arguments: {
          user_prompt: prompt
        }
      });
      
      // Parse MCP response format
      const content = response.data.messages?.[0]?.content || '';
      const sections = content.split('\n\n');
      
      return {
        initialPromptEvaluation: sections[0] || 'Prompt analysis completed.',
        refinedPrompt: sections[1] || prompt,
        explanationOfRefinements: sections[2] || 'Refinement process completed.',
        fullResponse: response.data
      };
    } catch (error) {
      throw new Error(`Failed to refine prompt: ${error}`);
    }
  }

  async testStrategy(strategyId: string, testPrompt: string): Promise<RefinementResult> {
    const response = await api.post(`/strategies/${strategyId}/test`, { prompt: testPrompt });
    return response.data;
  }

  // Collection methods
  async getCollections(): Promise<Collection[]> {
    const response = await api.get('/collections');
    return response.data;
  }

  async createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    const response = await api.post('/collections', collection);
    return response.data;
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const response = await api.put(`/collections/${id}`, updates);
    return response.data;
  }

  async deleteCollection(id: string): Promise<void> {
    await api.delete(`/collections/${id}`);
  }

  // Metrics methods
  async getMetrics(): Promise<{
    totalStrategies: number;
    totalRefinements: number;
    avgResponseTime: number;
    topStrategies: Strategy[];
    recentActivity: any[];
  }> {
    const response = await api.get('/metrics');
    return response.data;
  }

  // WebSocket methods
  connectWebSocket(onUpdate?: (data: any) => void): void {
    if (this.socket) return;

    this.socket = io(WS_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('refinement:update', (data) => {
      if (onUpdate) onUpdate(data);
    });

    this.socket.on('metrics:update', (data) => {
      if (onUpdate) onUpdate(data);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Real-time refinement
  startRefinementSession(sessionId: string): void {
    if (this.socket) {
      this.socket.emit('refinement:start', { sessionId });
    }
  }

  sendRefinementUpdate(sessionId: string, prompt: string): void {
    if (this.socket) {
      this.socket.emit('refinement:update', { sessionId, prompt });
    }
  }

  endRefinementSession(sessionId: string): void {
    if (this.socket) {
      this.socket.emit('refinement:end', { sessionId });
    }
  }
}

export const mcpApi = new MCPApiService();