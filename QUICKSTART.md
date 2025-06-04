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

## ✨ Available Prompts
- `prepare_refinement` + `execute_refinement` (two-step)
- `auto_refine` (one-step)
- `refine_with_star` (comprehensive)
- `refine_with_verse` (technical)
- `refine_with_math` (mathematical)
- `compare_refinements` (compare strategies)
- `list_strategies` (see all options)

## 🎉 You're Ready!
Your prompts will now be enhanced automatically! 

Need help? Check the [full README](README.md) for detailed documentation.
