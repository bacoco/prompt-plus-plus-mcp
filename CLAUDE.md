# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Running the MCP Server

#### TypeScript/Node.js Version (Recommended)
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

#### Python Version (Legacy)
```bash
# Activate virtual environment first
source mcp_env/bin/activate
python -m src.server
```

### Testing

#### TypeScript/Node.js Version
```bash
# Install dependencies
npm install

# Build and test
npm run build

# Run in development mode to test
npm run dev
```

#### Python Version (Legacy)
```bash
# Install dependencies first
pip install -r requirements.txt

# Test the server functionality locally
python test_server.py

# Test metaprompt loading
python test_metaprompts.py
```

## Architecture: Closed-Loop Meta-Prompting

This MCP server enables **Claude Code to self-enhance prompts** through a closed-loop meta-prompting system. No external APIs or manual copying required.

### How It Works

1. **MCP Prompts**: The server exposes prompts (not tools) that Claude can execute internally
2. **Meta-Processing**: Claude processes the meta-prompts to generate refined versions
3. **Zero-Copy Workflow**: Everything happens within Claude's execution context

### Core Components

#### TypeScript/Node.js Implementation (Recommended)
1. **Strategy Manager (`src/strategy-manager.ts`)**
   - Loads metaprompt templates from JSON files
   - Manages 10 different enhancement strategies
   - Type-safe strategy management

2. **Prompt Refiner (`src/prompt-refiner.ts`)**
   - Implements heuristic-based strategy selection
   - Scores strategies based on prompt characteristics
   - Handles strategy comparison logic

3. **MCP Server (`src/index.ts`)**
   - Exposes MCP prompts for each strategy
   - Implements two-step refinement workflow
   - Built with official MCP TypeScript SDK

#### Python Implementation (Legacy)
1. **Strategy Manager (`src/core/strategy_manager.py`)**
2. **Prompt Refiner (`src/core/prompt_refiner.py`)**  
3. **MCP Server (`src/server.py`)**

## Available MCP Prompts

### Strategy-Specific Prompts
- `refine_with_star`: Comprehensive multi-stage refinement (ECHO method)
- `refine_with_done`: Structured approach with role-playing
- `refine_with_physics`: Balanced scientific analysis
- `refine_with_morphosis`: Quick refinement for simple prompts
- `refine_with_verse`: Technical prompt enhancement
- `refine_with_math`: Mathematical and formal reasoning
- `refine_with_phor`: Flexible technique combination
- `refine_with_bolism`: Optimization-focused refinement
- `refine_with_arpe`: Advanced reasoning and proofs
- `refine_with_touille`: General-purpose refinement

### Special Prompts
- `auto_refine`: Automatically selects best strategy and refines
- `compare_refinements`: Compares multiple strategies for a prompt

### Two-Step Workflow Prompts
- `prepare_refinement`: Step 1 - Analyzes user prompt and returns metaprompt execution instructions
- `execute_refinement`: Step 2 - Processes metaprompt results and returns final refined prompt

### Support Tools
- `list_strategies`: Lists all available strategies
- `get_strategy_details`: Gets details about a specific strategy

## Usage Examples

### One-Step Workflow (Original)
When Claude Code uses the original workflow:

1. **User**: "Refine my prompt: Write a Python function"
2. **Claude**: Uses `auto_refine` prompt with the user's input
3. **MCP Server**: Returns meta-prompt with best strategy
4. **Claude**: Internally processes the meta-prompt
5. **Result**: Enhanced prompt with clear requirements, examples, and structure

### Two-Step Workflow (New)
When Claude Code uses the new two-step workflow:

1. **User**: "Refine my prompt: Write a Python function"
2. **Claude**: Uses `prepare_refinement` prompt with the user's input
3. **MCP Server**: Returns metaprompt execution instructions and selected strategy
4. **Claude**: Executes the metaprompt internally
5. **Claude**: Uses `execute_refinement` prompt with the metaprompt results
6. **MCP Server**: Returns final refined prompt with improvements summary
7. **Result**: Clean, polished prompt ready for execution

## Workflow Benefits

### Original One-Step Workflow
- **No Manual Steps**: Everything automated within Claude
- **Context Preservation**: Full conversation context maintained
- **Strategy Intelligence**: Automatic selection based on prompt type
- **Iterative Enhancement**: Can refine multiple times with different strategies

### New Two-Step Workflow
- **Explicit Control**: Claude Code has explicit control over each step
- **Transparent Process**: Clear visibility into strategy selection and metaprompt execution
- **Flexible Execution**: Can inspect metaprompt before execution or modify approach
- **Cleaner Output**: Final step produces polished, ready-to-use prompts
- **Better Error Handling**: Can catch and handle issues at each step independently

## Adding New Strategies

Create a JSON file in `metaprompts/`:
```json
{
  "name": "Strategy Name",
  "description": "When to use this strategy",
  "examples": ["Example prompt 1", "Example prompt 2"],
  "template": "Meta-prompt template with [Insert initial prompt here] placeholder"
}
```

The server automatically creates a corresponding MCP prompt: `refine_with_[filename]`

## Technical Details

### Prompt Message Format
The server returns `PromptMessage` objects containing:
- Instructions for Claude to act as a prompt engineer
- The selected meta-prompt template
- Expected JSON response format
- Context about why the strategy was chosen

### Heuristic Selection
Strategy selection based on:
- Keywords (creative, technical, mathematical)
- Prompt length (word count)
- Domain detection (code, analysis, narrative)
- Complexity assessment

### No External Dependencies
- Removed all HuggingFace/API requirements
- Pure Python with MCP SDK only
- All processing happens within Claude's runtime