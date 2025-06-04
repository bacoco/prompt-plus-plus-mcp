# Prompt++ MCP (Model Context Protocol) Server

An MCP server implementation of the Prompt++ prompt enhancement system. This server provides tools to refine and improve prompts using various metaprompt strategies loaded from individual JSON files.

## Features

- **10 Metaprompt Strategies**: Each strategy is stored in its own JSON file for easy customization
- **Automatic Strategy Selection**: AI-powered selection of the best strategy for your prompt
- **Strategy Comparison**: Compare multiple strategies to find the best fit
- **Local Processing**: No API dependencies, all processing happens locally
- **Modular Design**: Easy to add new strategies or modify existing ones

## Installation

1. Clone the repository:
```bash
git clone https://github.com/bacoco/prompt-plus-plus-mcp.git
cd prompt-plus-plus-mcp
```

2. Install dependencies:
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
│   ├── __init__.py
│   └── server.py         # Main MCP server
├── package.json          # MCP configuration
├── requirements.txt      # Python dependencies
└── test_server.py        # Local testing script
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

## MCP Tools

### refine_prompt
Refine a prompt using a specific metaprompt strategy.

**Parameters:**
- `prompt` (string): The prompt to refine
- `strategy` (string): The metaprompt strategy to use

### auto_select_strategy
Automatically select the best metaprompt strategy for a given prompt.

**Parameters:**
- `prompt` (string): The prompt to analyze

### list_strategies
List all available metaprompt strategies with descriptions.

### compare_strategies
Compare multiple strategies for a given prompt.

**Parameters:**
- `prompt` (string): The prompt to refine
- `strategies` (array): List of strategies to compare (optional)

## Usage with Cursor

1. Add to your Cursor settings:
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

2. Use the tools in Cursor:
   - The server returns structured responses with `instruction_for_cursor`
   - Copy the instruction to a new Cursor chat
   - Ask Cursor to process the metaprompt and return the JSON response

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