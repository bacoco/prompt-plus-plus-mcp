# 🚀 Quick Start Guide

Get up and running with Prompt++ MCP server in 2 minutes!

## ⚡ No Installation Needed!

Just configure and use - `npx` handles everything automatically!

## 🔧 Setup

### Claude Desktop
1. **Edit config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add this configuration:**
```json
{
  "mcpServers": {
    "prompt-plus-plus": {
      "command": "npx",
      "args": ["prompt-plus-plus-mcp"],
      "env": {}
    }
  }
}
```

3. **Restart Claude Desktop** ✅

### Claude Code
```bash
claude mcp add prompt-plus-plus --scope user -- npx prompt-plus-plus-mcp
```

## 🎯 Usage

### Two-Step Refinement (Recommended)
1. **Use `prepare_refinement` prompt**
   - Input: "Write a Python function to calculate fibonacci"
   - Output: Metaprompt execution instructions

2. **Execute the metaprompt in Claude**

3. **Use `execute_refinement` prompt**
   - Input: The metaprompt results + original prompt
   - Output: Final polished prompt ready to use!

### Quick One-Step
- **Use `auto_refine` prompt**
  - Input: Your prompt
  - Output: Directly refined prompt

## ✨ Available Tools & Prompts

### 🔍 Strategy Discovery
- `discover_strategies` (tool) - Get comprehensive metadata about all 44+ strategies
- `list_strategies` (tool) - Simple list of all strategies
- `get_strategy_details` (tool) - Details about specific strategy

### 🎯 Refinement Prompts
- `prepare_refinement` + `execute_refinement` (two-step workflow)
- `auto_refine` (one-step automatic selection)
- `compare_refinements` (compare multiple strategies)

### 📚 44+ Specific Strategies
- **Core Strategies**: `refine_with_star`, `refine_with_verse`, `refine_with_math`, etc.
- **AI Core Principles**: `refine_with_assumption_detector`, `refine_with_devils_advocate`, etc.
- **Vibe Coding Rules**: `refine_with_write_tests_first`, `refine_with_use_agent_mode`, etc.
- **Software Development**: `refine_with_architect`, `refine_with_reviewer`, etc.
- **Advanced Thinking**: `refine_with_quantum`, `refine_with_synthesis`, etc.

## 🎉 You're Ready!
Your prompts will now be enhanced automatically! 

Need help? Check the [full README](README.md) for detailed documentation.
