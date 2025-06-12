# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Running the MCP Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Option 1: Using npx (recommended for Claude Desktop)
npx -y prompt-plus-plus-mcp

# Option 2: Global installation
npm install -g prompt-plus-plus-mcp
prompt-plus-plus-mcp
```

### Claude Desktop Configuration

**Option 1: Using npx (Recommended)**
```json
{
  "mcpServers": {
    "prompt-plus-plus": {
      "command": "npx",
      "args": [
        "-y",
        "prompt-plus-plus-mcp"
      ]
    }
  }
}
```

**Option 2: Global Installation**
```json
{
  "mcpServers": {
    "prompt-plus-plus": {
      "command": "prompt-plus-plus-mcp"
    }
  }
}
```

### Testing

```bash
# Install dependencies
npm install

# Build and test
npm run build

# Run in development mode to test
npm run dev
```

## Architecture: Closed-Loop Meta-Prompting

This MCP server enables **Claude Code to self-enhance prompts** through a closed-loop meta-prompting system. No external APIs or manual copying required.

### How It Works

1. **MCP Prompts**: The server exposes prompts (not tools) that Claude can execute internally
2. **Meta-Processing**: Claude processes the meta-prompts to generate refined versions
3. **Zero-Copy Workflow**: Everything happens within Claude's execution context

### Core Components

1. **Strategy Manager (`src/strategy-manager.ts`)**
   - Loads metaprompt templates from organized JSON directories
   - Manages 44+ enhancement strategies across 5 categories
   - Loads category metadata for intelligent strategy discovery
   - Type-safe strategy management

2. **Prompt Refiner (`src/prompt-refiner.ts`)**
   - Implements intelligent strategy selection with 44+ strategies
   - Enhanced keyword matching for AI Core Principles and Vibe Coding Rules
   - Scores strategies based on prompt characteristics
   - Handles strategy comparison logic

3. **MCP Server (`src/index.ts`)**
   - Exposes MCP prompts for each of 44+ strategies
   - Implements two-step refinement workflow
   - Provides metadata-driven strategy discovery via `discover_strategies` tool
   - Built with official MCP TypeScript SDK

## Available MCP Prompts

### Strategy-Specific Prompts (44+ Available)

**Core Strategies (10)**
- `refine_with_star`: Comprehensive multi-stage refinement (ECHO method)
- `refine_with_done`: Structured approach with role-playing
- `refine_with_physics`: Balanced scientific analysis
- `refine_with_morphosis`: Quick refinement for simple prompts
- `refine_with_verse`: Technical prompt enhancement
- `refine_with_math`: Mathematical and formal reasoning
- Plus 4 more...

**AI Core Principles (13)**
- `refine_with_assumption_detector`: Challenge hidden assumptions
- `refine_with_devils_advocate`: Generate systematic counterarguments
- `refine_with_ripple_effect`: Analyze cascading consequences
- `refine_with_evidence_seeker`: Demand concrete validation
- Plus 9 more critical thinking frameworks...

**Vibe Coding Rules (11)**
- `refine_with_write_tests_first`: TDD workflow optimization
- `refine_with_use_agent_mode`: AI-assisted development patterns
- `refine_with_ship_small_changes`: Incremental delivery strategies
- `refine_with_refactor_continuously`: Ongoing code improvement
- Plus 7 more development workflow patterns...

**Software Development (4)**
- `refine_with_architect`: System design and architecture
- `refine_with_reviewer`: Code review and QA frameworks
- `refine_with_devops`: CI/CD and infrastructure automation
- `refine_with_boomerang`: Iterative development cycles

**Advanced Thinking (6)**
- `refine_with_quantum`: Parallel possibility exploration
- `refine_with_synthesis`: Creative concept fusion
- `refine_with_temporal`: Multi-timeline analysis
- Plus 3 more sophisticated reasoning frameworks...

### Special Prompts
- `auto_refine`: Automatically selects best strategy and refines
- `compare_refinements`: Compares multiple strategies for a prompt

### Two-Step Workflow Prompts
- `prepare_refinement`: Step 1 - Analyzes user prompt and returns metaprompt execution instructions
- `execute_refinement`: Step 2 - Processes metaprompt results and returns final refined prompt

### Support Tools  
- `discover_strategies`: **NEW** - Get comprehensive metadata about all strategy categories for intelligent selection
- `list_strategies`: Lists all available strategies with basic info
- `get_strategy_details`: Gets details about a specific strategy

## Usage Examples

### One-Step Workflow (Original)
When Claude Code uses the original workflow:

1. **User**: "Refine my prompt: Write a Python function"
2. **Claude**: Uses `auto_refine` prompt with the user's input
3. **MCP Server**: Returns meta-prompt with best strategy
4. **Claude**: Internally processes the meta-prompt
5. **Result**: Enhanced prompt with clear requirements, examples, and structure

### Two-Step Workflow (Recommended)
When Claude Code uses the two-step workflow:

1. **User**: "Refine my prompt: Write a Python function"
2. **Claude**: Uses `prepare_refinement` prompt with the user's input
3. **MCP Server**: Returns metaprompt execution instructions and selected strategy
4. **Claude**: Executes the metaprompt internally
5. **Claude**: Uses `execute_refinement` prompt with the metaprompt results
6. **MCP Server**: Returns final refined prompt with improvements summary
7. **Result**: Clean, polished prompt ready for execution

### Enhanced Metadata-Driven Workflow (New)
When Claude Code uses intelligent strategy discovery:

1. **User**: "I need help with a complex decision about microservices"
2. **Claude**: Uses `discover_strategies` tool to get all strategy metadata
3. **MCP Server**: Returns comprehensive category descriptions and strategy details
4. **Claude**: Analyzes metadata and selects `refine_with_devils_advocate` based on decision-making context
5. **Claude**: Uses selected strategy prompt
6. **MCP Server**: Returns targeted refinement using Devil's Advocate methodology
7. **Result**: Systematically enhanced prompt with counterarguments and risk analysis

### **NEW: 3-Step Intelligent Workflow (Recommended)**
The most intelligent and precise workflow with automatic LLM-guided selection:

1. **User**: "Refine my prompt: Create a microservices architecture for an e-commerce platform"
2. **Claude**: Uses `step1_get_categories` prompt with user's input
3. **MCP Server**: Returns all strategy categories with descriptions and use cases
4. **Claude**: Analyzes categories and selects "Software Development" based on the architectural context
5. **Claude**: Uses `step2_get_strategies` prompt with selected category and user's input
6. **MCP Server**: Returns all strategies from Software Development category with detailed metadata
7. **Claude**: Analyzes strategies and selects "architect" for system design focus
8. **Claude**: Uses `step3_execute_strategy` prompt with selected strategy and user's input
9. **MCP Server**: Returns the refined prompt using the Architect methodology
10. **Result**: Precisely targeted architectural prompt with system design considerations

## Workflow Benefits

### One-Step Workflow
- **No Manual Steps**: Everything automated within Claude
- **Context Preservation**: Full conversation context maintained
- **Strategy Intelligence**: Automatic selection based on prompt type
- **Iterative Enhancement**: Can refine multiple times with different strategies

### Two-Step Workflow
- **Explicit Control**: Claude Code has explicit control over each step
- **Transparent Process**: Clear visibility into strategy selection and metaprompt execution
- **Flexible Execution**: Can inspect metaprompt before execution or modify approach
- **Cleaner Output**: Final step produces polished, ready-to-use prompts
- **Better Error Handling**: Can catch and handle issues at each step independently

### **3-Step Workflow (NEW - RECOMMENDED)**
- **Maximum Precision**: LLM analyzes and selects at each decision point
- **Intelligent Category Selection**: Reviews all 5 categories to find best fit
- **Optimal Strategy Matching**: Examines specific strategies within chosen category
- **No Manual Selection**: LLM makes informed choices based on prompt analysis
- **Transparent Decision Making**: Clear reasoning at each step
- **Best Strategy Fit**: Ensures most appropriate enhancement methodology is applied

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