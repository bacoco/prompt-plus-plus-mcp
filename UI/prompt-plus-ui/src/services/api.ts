import axios from 'axios';
import { io, Socket } from 'socket.io-client';
// Removed unused import

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

  // Automatic metaprompt selection
  async automaticMetaprompt(prompt: string): Promise<AutomaticMetapromptResult> {
    try {
      const response = await api.post('/mcp/prompt', {
        name: 'auto_refine',
        arguments: {
          user_prompt: prompt
        }
      });
      
      // Parse the auto_refine response
      let content = response.data.messages?.[0]?.content || '';
      
      // Handle MCP content format (could be string or object)
      if (typeof content === 'object' && content.text) {
        content = content.text;
      } else if (typeof content === 'object' && content.type === 'text') {
        content = content.text || '';
      }
      
      // Ensure content is a string
      content = String(content);
      
      // Extract the recommended metaprompt key from the response
      // The response should contain analysis and recommendation
      let recommendedKey = 'arpe'; // default
      let analysis = content;
      
      // Try to parse structured response if available
      if (response.data.recommended_metaprompt) {
        recommendedKey = response.data.recommended_metaprompt.key;
        
        // Format the analysis markdown
        const result = response.data;
        analysis = `
#### Selected MetaPrompt
- **Primary Choice**: ${result.recommended_metaprompt.name}
- *Description*: ${result.recommended_metaprompt.description}
- *Why This Choice*: ${result.recommended_metaprompt.explanation}
- *Similar Sample*: ${result.recommended_metaprompt.similar_sample || 'N/A'}
- *Customized Sample*: ${result.recommended_metaprompt.customized_sample || 'N/A'}

#### Alternative Option
- **Secondary Choice**: ${result.alternative_recommendation?.name || 'N/A'}
- *Why Consider This*: ${result.alternative_recommendation?.explanation || 'N/A'}
`;
      } else {
        // Try to extract key from content if not structured
        try {
          // Look for SELECTED STRATEGY in the response
          const strategyMatch = content.match(/SELECTED STRATEGY:\s*([^\n]+)/i);
          if (strategyMatch) {
            const strategyName = strategyMatch[1].trim();
            // Try to find matching key from strategy name
            const keyFromName = strategyName.toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_|_$/g, '');
            recommendedKey = keyFromName || 'arpe';
          }
          
          // Also try to extract reasoning and improvements
          const reasoningMatch = content.match(/REASONING:\s*([\s\S]*?)(?=REFINED PROMPT:|KEY IMPROVEMENTS:|$)/i);
          const improvementsMatch = content.match(/KEY IMPROVEMENTS:\s*([\s\S]*?)$/i);
          
          if (reasoningMatch || improvementsMatch) {
            analysis = `#### Auto-Selected Strategy\n${content}`;
          }
        } catch (e) {
          // If parsing fails, use the content as-is
          console.warn('Failed to parse auto_refine response:', e);
        }
      }
      
      return {
        analysis,
        recommendedKey
      };
    } catch (error) {
      console.error('Failed to get automatic metaprompt:', error);
      throw new Error(`Failed to analyze prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Refine prompt with specific strategy
  async refinePromptWithStrategy(prompt: string, strategy: string): Promise<PromptRefinerResult> {
    try {
      const response = await api.post('/mcp/prompt', {
        name: `refine_with_${strategy}`,
        arguments: {
          user_prompt: prompt
        }
      });
      
      // Parse MCP response
      let content = response.data.messages?.[0]?.content || '';
      
      // Handle MCP content format (could be string or object)
      if (typeof content === 'object' && content.text) {
        content = content.text;
      } else if (typeof content === 'object' && content.type === 'text') {
        content = content.text || '';
      }
      
      // Ensure content is a string
      content = String(content);
      
      // Try to parse structured sections
      let initialPromptEvaluation = '';
      let refinedPrompt = '';
      let explanationOfRefinements = '';
      
      // Look for section markers in the response
      const evaluationMatch = content.match(/(?:Initial Prompt Evaluation|Analysis):?\s*([\s\S]*?)(?=Refined Prompt:|$)/i);
      const refinedMatch = content.match(/(?:Refined Prompt|Improved Prompt):?\s*([\s\S]*?)(?=Explanation|Refinements:|$)/i);
      const explanationMatch = content.match(/(?:Explanation of Refinements|Refinements|Changes):?\s*([\s\S]*?)$/i);
      
      if (evaluationMatch) {
        initialPromptEvaluation = evaluationMatch[1].trim();
      } else {
        // Fallback: take first paragraph
        const firstParagraph = content.split('\n\n')[0];
        initialPromptEvaluation = firstParagraph || 'Prompt analysis completed.';
      }
      
      if (refinedMatch) {
        refinedPrompt = refinedMatch[1].trim();
      } else {
        // Fallback: look for quoted text or second paragraph
        const quotedMatch = content.match(/"([^"]+)"/);
        if (quotedMatch) {
          refinedPrompt = quotedMatch[1];
        } else {
          const paragraphs = content.split('\n\n');
          refinedPrompt = paragraphs[1] || prompt;
        }
      }
      
      if (explanationMatch) {
        explanationOfRefinements = explanationMatch[1].trim();
      } else {
        // Fallback: take last paragraph
        const paragraphs = content.split('\n\n');
        explanationOfRefinements = paragraphs[paragraphs.length - 1] || 'Refinement process completed.';
      }
      
      return {
        initialPromptEvaluation,
        refinedPrompt,
        explanationOfRefinements,
        fullResponse: response.data
      };
    } catch (error) {
      console.error('Failed to refine prompt:', error);
      throw new Error(`Failed to refine prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Apply prompt to model
  async applyPrompt(prompt: string, model: string): Promise<string> {
    try {
      const response = await api.post('/mcp/prompt', {
        name: 'apply_prompt',
        arguments: {
          prompt,
          model
        }
      });
      
      // Extract the model response
      let content = response.data.messages?.[0]?.content || '';
      
      // Handle MCP content format (could be string or object)
      if (typeof content === 'object' && content.text) {
        content = content.text;
      } else if (typeof content === 'object' && content.type === 'text') {
        content = content.text || '';
      }
      
      // Ensure content is a string
      content = String(content);
      
      return content;
    } catch (error) {
      console.error('Failed to apply prompt:', error);
      // Return informative error message
      return `**Error: Model Integration Not Available**\n\n` +
             `The prompt application feature requires:\n` +
             `1. An active MCP server connection\n` +
             `2. The 'apply_prompt' tool to be available\n` +
             `3. Access to the specified model (${model})\n\n` +
             `Please ensure your MCP server is running and properly configured.`;
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