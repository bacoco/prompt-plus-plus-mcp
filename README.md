# Prompt++ MCP Server

A powerful MCP (Model Context Protocol) server that enhances prompts using 10 different metaprompt strategies. Features a two-step refinement workflow for maximum control and quality.

## 🚀 Features

- **🎯 Two-Step Workflow**: Prepare → Execute → Refine for ultimate control
- **🧠 10 Metaprompt Strategies**: Each optimized for different prompt types
- **🤖 Auto Strategy Selection**: AI picks the best strategy for your prompt  
- **⚡ TypeScript**: Modern, type-safe implementation with official MCP SDK
- **🔧 Easy Integration**: Works with Claude Desktop and Claude Code
- **📦 Zero Dependencies**: No external APIs, runs completely locally
- **🎨 Customizable**: Easy to add new strategies via JSON files

## 📦 Installation

### From npm (Recommended)
```bash
npm install -g prompt-plus-plus-mcp
```

### From Source
```bash
git clone https://github.com/bacoco/prompt-plus-plus-mcp.git
cd prompt-plus-plus-mcp
npm install
npm run build
```

## 📁 Project Structure

```
prompt-plus-plus-mcp/
├── metaprompts/           # 10 strategy JSON files
│   ├── star.json         # ECHO method - comprehensive refinement
│   ├── done.json         # Role-playing approach
│   ├── physics.json      # Scientific analysis
│   ├── verse.json        # Technical prompts
│   ├── math.json         # Mathematical reasoning
│   └── ...              # 5 more strategies
├── src/
│   ├── index.ts          # Main MCP server
│   ├── strategy-manager.ts
│   ├── prompt-refiner.ts
│   └── types.ts
├── dist/                 # Compiled JavaScript
└── package.json          # npm configuration
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

## 🏃 Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Or if installed globally
prompt-plus-plus-mcp
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

## 🔧 Setup Instructions

### **Claude Desktop**

1. **Install globally:**
```bash
npm install -g prompt-plus-plus-mcp
```

2. **Add to Claude Desktop config:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "prompt-plus-plus": {
      "command": "prompt-plus-plus-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

3. **Restart Claude Desktop**

### **Claude Code**

```bash
# Install globally first
npm install -g prompt-plus-plus-mcp

# Add to Claude Code
claude mcp add prompt-plus-plus --scope user -- prompt-plus-plus-mcp

# Verify installation
claude mcp list
```

## 🎯 Two-Step Workflow Usage

### **The Power of Two Steps:**
1. **`prepare_refinement`**: Analyzes your prompt + returns metaprompt execution instructions
2. **Execute metaprompt**: Process the metaprompt manually in Claude
3. **`execute_refinement`**: Takes metaprompt results → returns final polished prompt

### **Why Two Steps?**
- 🎛️ **Full Control**: See exactly what metaprompt will be used
- 🔍 **Transparency**: Understand the refinement process
- ✨ **Quality**: Get cleaner, more polished final outputs
- 🛠️ **Flexibility**: Can modify the approach between steps

## 📝 Example Usage

### Two-Step Refinement
```
1. Use prompt: prepare_refinement
   Input: "Write a Python function to sort a list"

2. Claude returns metaprompt instructions
   
3. Execute the metaprompt manually in Claude

4. Use prompt: execute_refinement
   Input: [metaprompt results] + [original prompt]
   
5. Get final polished prompt ready to use!
```

### Quick One-Step
```
Use prompt: auto_refine
Input: "Write a Python function to sort a list"
Result: Direct refined prompt
```

## 🤝 Contributing

### Adding New Strategies
Create a JSON file in `metaprompts/`:
```json
{
  "name": "Your Strategy Name",
  "description": "When to use this strategy",
  "examples": ["Example prompt 1", "Example prompt 2"],
  "template": "Your metaprompt template with [Insert initial prompt here] placeholder"
}
```

### Other Contributions
- 🧠 Improve auto-selection algorithm
- 🔍 Enhance strategy comparison logic  
- 📚 Add more examples and documentation
- 🐛 Fix bugs and improve performance

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Credits

Based on the original [Prompt++](https://huggingface.co/spaces/baconnier/prompt-plus-plus) project by baconnier.

## 📊 npm Package

```bash
npm install -g prompt-plus-plus-mcp
```

[![npm version](https://badge.fury.io/js/prompt-plus-plus-mcp.svg)](https://badge.fury.io/js/prompt-plus-plus-mcp)
[![Downloads](https://img.shields.io/npm/dm/prompt-plus-plus-mcp.svg)](https://npmjs.org/package/prompt-plus-plus-mcp)