# Prompt++ MCP Implementation Plan

## Problem Analysis

The current MCP implementation is not working correctly because:

1. **No LLM Integration**: The MCP server doesn't actually call an LLM to process prompts
2. **Templates Not Applied**: The metaprompt templates exist but aren't being used to transform prompts
3. **Missing Core Logic**: The refinement process returns template descriptions instead of refined prompts

## Original Prompt++ Architecture

```
User Input → Metaprompt Selection → LLM Call with Template → Refined Output
```

Key components:
- **PromptRefiner class**: Manages LLM interactions
- **Metaprompt templates**: Complex multi-step refinement instructions
- **HuggingFace InferenceClient**: Sends prompts to actual LLMs
- **Three main functions**:
  1. `automatic_metaprompt()`: Uses router to select best strategy
  2. `refine_prompt()`: Applies selected template via LLM
  3. `apply_prompt()`: Tests prompts on chosen model

## Tasks to Implement

### 1. Add LLM Integration to MCP Server
**File**: `src/prompt-refiner.ts`

- [ ] Add HuggingFace API integration or OpenAI client
- [ ] Create `callLLM()` method that sends prompts to actual models
- [ ] Handle API keys securely via environment variables

### 2. Fix Refinement Logic
**File**: `src/prompt-refiner.ts`

- [ ] Update `refinePrompt()` to:
  - Get the full metaprompt template
  - Replace `[Insert initial prompt here]` with user's prompt
  - Send complete prompt to LLM
  - Parse the JSON response correctly
- [ ] Return properly formatted results matching original structure

### 3. Implement Automatic Metaprompt Selection
**File**: `src/prompt-refiner.ts`

- [ ] Create proper `automaticMetaprompt()` that:
  - Uses the metaprompt router template
  - Calls LLM to analyze and select best strategy
  - Returns formatted analysis and selected key

### 4. Add Apply Prompt Functionality
**File**: `src/index.ts`

- [ ] Create `apply_prompt` tool that:
  - Takes prompt and model as input
  - Calls specified model via LLM API
  - Returns formatted response

### 5. Update MCP HTTP Bridge
**File**: `UI/mcp-http-bridge.cjs`

- [ ] Remove mock responses completely
- [ ] Ensure proper error handling for LLM failures
- [ ] Add streaming support for long responses

### 6. Environment Configuration
**Files**: `.env.example`, `README.md`

- [ ] Add required environment variables:
  ```
  HUGGINGFACE_API_KEY=your_key_here
  # or
  OPENAI_API_KEY=your_key_here
  ```
- [ ] Update documentation with setup instructions

## Implementation Steps

### Step 1: Add LLM Client to MCP Server
```typescript
// src/llm-client.ts
import { HfInference } from '@huggingface/inference';
// or
import OpenAI from 'openai';

export class LLMClient {
  private client: HfInference | OpenAI;
  
  constructor(apiKey: string) {
    // Initialize chosen LLM client
  }
  
  async chat(messages: Message[], options: ChatOptions): Promise<string> {
    // Implement chat completion
  }
}
```

### Step 2: Update PromptRefiner to Use LLM
```typescript
// src/prompt-refiner.ts
export class PromptRefiner {
  private llmClient: LLMClient;
  
  async refinePrompt(prompt: string, strategyKey: string): Promise<RefinementResult> {
    const template = this.strategyManager.getStrategy(strategyKey)?.template;
    const fullPrompt = template.replace('[Insert initial prompt here]', prompt);
    
    const messages = [
      { role: 'system', content: 'You are an expert at refining and extending prompts.' },
      { role: 'user', content: fullPrompt }
    ];
    
    const response = await this.llmClient.chat(messages, {
      maxTokens: 3000,
      temperature: 0.8
    });
    
    return this.parseResponse(response);
  }
}
```

### Step 3: Test Integration
- [ ] Test with simple prompts first
- [ ] Verify JSON parsing works correctly
- [ ] Test all metaprompt strategies
- [ ] Ensure UI displays results properly

## Expected Results

After implementation, the flow should be:

1. User enters prompt in UI
2. Clicks "Automatic Choice" → MCP calls LLM with router → Returns best strategy
3. Clicks "Refine Prompt" → MCP applies full metaprompt template via LLM → Returns refined prompt
4. Clicks "Apply Prompts" → MCP tests both prompts on selected model → Shows comparison

## Alternative: Direct Integration

If MCP integration proves too complex, consider:
- Using the original Python backend directly
- Creating a Node.js port of the Python PromptRefiner
- Using a hybrid approach with Python subprocess

## Success Criteria

- [ ] Automatic metaprompt selection returns meaningful analysis
- [ ] Refinement produces substantially improved prompts
- [ ] All 10 metaprompt strategies work correctly
- [ ] UI shows proper formatted responses
- [ ] No hardcoded or mock data