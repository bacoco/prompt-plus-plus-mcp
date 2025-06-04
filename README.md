# Prompt++ MCP (Model Context Protocol) Server

An MCP server implementation of the Prompt++ prompt enhancement system. This server provides prompts to refine and improve user prompts using various metaprompt strategies loaded from individual JSON files.

## Features

- **10 Metaprompt Strategies**: Each strategy is stored in its own JSON file for easy customization
- **Two-Step Workflow**: Prepare metaprompt instructions, then execute and refine
- **Automatic Strategy Selection**: AI-powered selection of the best strategy for your prompt
- **Strategy Comparison**: Compare multiple strategies to find the best fit
- **TypeScript Implementation**: Modern, type-safe implementation with official MCP SDK
- **Local Processing**: No API dependencies, all processing happens locally
- **Modular Design**: Easy to add new strategies or modify existing ones

## Installation

### TypeScript/Node.js Version (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/bacoco/prompt-plus-plus-mcp.git
cd prompt-plus-plus-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Python Version (Legacy)

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Project Structure

```
prompt-plus-plus-mcp/
├── metaprompts/           # Individual JSON files for each strategy
│   ├── star.json         # ECHO Prompt
│   ├── done.json         # Done Prompt
│   ├── physics.json      # Physics Prompt
│   └── ...              # Other strategies
├── src/
│   ├── index.ts          # Main MCP server (TypeScript)
│   ├── strategy-manager.ts
│   ├── prompt-refiner.ts
│   ├── types.ts
│   ├── server.py         # Legacy Python server
│   └── core/             # Legacy Python modules
├── dist/                 # Compiled TypeScript
├── package.json          # Node.js/MCP configuration
├── tsconfig.json         # TypeScript configuration
├── requirements.txt      # Python dependencies (legacy)
└── test_server.py        # Python testing script (legacy)
```

## Available Strategies

1. **star (ECHO Prompt)**: Comprehensive multi-stage refinement for complex prompts
2. **done (Done Prompt)**: Structured approach with role-playing and advanced techniques
3. **physics (Physics Prompt)**: Balanced approach between structure and advanced techniques
4. **morphosis (Morphosis Prompt)**: Simplified approach for straightforward prompts
5. **verse (Verse Prompt)**: Analyzes and improves prompt's strengths and weaknesses
6. **phor (Phor Prompt)**: Advanced approach combining multiple prompt engineering techniques
7. **bolism (Bolism Prompt)**: Optimized for autoregressive language models
8. **math (Math Prompt)**: Specialized for mathematical and formal proofs
9. **arpe (Arpe Prompt)**: Advanced reasoning and proof engineering approach
10. **touille (Touille Prompt)**: General-purpose prompt refinement

## Running the Server

### TypeScript/Node.js Version
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Python Version (Legacy)
```bash
# Activate virtual environment first
source mcp_env/bin/activate
python -m src.server
```

## MCP Prompts

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

## Usage with Claude Code

### TypeScript/Node.js Version (Recommended)
1. Add to your MCP configuration:
```json
{
  "mcpServers": {
    "prompt-plus": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/prompt-plus-plus-mcp"
    }
  }
}
```

### Python Version (Legacy)
```json
{
  "mcpServers": {
    "prompt-plus": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/path/to/prompt-plus-plus-mcp"
    }
  }
}
```

## Two-Step Workflow Usage

1. **Step 1**: Use `prepare_refinement` prompt with your prompt
2. **Step 2**: Execute the returned metaprompt manually
3. **Step 3**: Use `execute_refinement` prompt with the results
4. **Result**: Get a clean, polished final prompt

## Example Usage

### Refine a Prompt
```
Use the refine_prompt tool with:
- prompt: "Write a story about AI"
- strategy: "star"
```

### Auto-select Strategy
```
Use the auto_select_strategy tool with:
- prompt: "Explain quantum computing"
```

## Response Format

All refinements return JSON with:
```json
{
  "initial_prompt_evaluation": "Analysis of the original prompt",
  "refined_prompt": "The improved version of the prompt",
  "explanation_of_refinements": "Detailed explanation of improvements made"
}
```

## Contributing

Feel free to contribute by:
- Adding new metaprompt strategies (create a new JSON file in `metaprompts/`)
- Improving the auto-selection algorithm
- Enhancing the comparison logic
- Adding more examples
- Modifying existing strategies by editing their JSON files

### Adding a New Strategy

1. Create a new JSON file in the `metaprompts/` directory:
```json
{
  "name": "Your Strategy Name",
  "description": "Description of when to use this strategy",
  "examples": ["Example prompt 1", "Example prompt 2"],
  "template": "Your metaprompt template with [Insert initial prompt here] placeholder"
}
```

2. The strategy will be automatically loaded when the server starts.

## License

MIT License

## Credits

Based on the original [Prompt++](https://huggingface.co/spaces/baconnier/prompt-plus-plus) project by baconnier.