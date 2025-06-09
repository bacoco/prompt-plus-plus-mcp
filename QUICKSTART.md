# 🚀 Quick Start Guide

Get up and running with Prompt++ MCP server in 2 minutes! Now with **44+ strategies** and **3 intelligent workflows**.

## ⚡ Installation Options

### Option 1: Global Install (Recommended)
```bash
npm install -g prompt-plus-plus-mcp
```

### Option 2: No Installation (npx)
Uses `npx` for automatic execution - no installation needed!

## 🔧 Setup

### Claude Desktop
1. **Edit config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add configuration:**

**For global install:**
```json
{
  "mcpServers": {
    "prompt-plus-plus": {
      "command": "prompt-plus-plus-mcp"
    }
  }
}
```

**For npx usage:**
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

## ✅ Verify Setup

Test if the server is working:
```
Use health_check tool
```

Should show: `"server_status": "running"` with 44+ strategies loaded.

## 🎯 Three Ways to Use Prompt++

### 🚀 **Auto-Refine** (Fastest - 1 step)
Perfect for most use cases:
```
Use auto_refine prompt with user_prompt: "Write a Python function to process user data"
```

**What happens**: AI automatically selects best strategy from 44+ options and enhances your prompt.

### 🎛️ **Two-Step Workflow** (Controlled - 2 steps)
For more control over the process:

**Step 1**: Prepare refinement
```
Use prepare_refinement prompt with user_prompt: "Write a Python function to process user data"
```

**Step 2**: Execute refinement
```
Use execute_refinement prompt with metaprompt_results: "..." and original_prompt: "Write a Python function to process user data"
```

### 🎯 **Three-Step Intelligent** (Most Precise - 3 steps)
Let Claude intelligently choose category and strategy:

**Step 1**: Category selection
```
Use step1_get_categories prompt with user_prompt: "Write a Python function to process user data"
```

**Step 2**: Strategy selection  
```
Use step2_get_strategies prompt with category_name: "software_development" and user_prompt: "Write a Python function to process user data"
```

**Step 3**: Execute strategy
```
Use step3_execute_strategy prompt with strategy_key: "boomerang" and user_prompt: "Write a Python function to process user data"
```

## 🎨 Example: Before & After

### Before
```
"Write a Python function to process user data"
```

### After (Auto-Enhanced)
```
Create a robust data processing function with the following specifications:

**Core Requirements:**
- Function name: processUserData()
- Input validation for all parameters  
- Comprehensive error handling with specific error types
- Return type annotations and documentation

**Implementation Details:**
- Use TypeScript for type safety
- Include input sanitization for security
- Add logging for debugging purposes
- Handle edge cases (null, undefined, empty objects)

**Testing Requirements:**
- Unit tests for valid inputs
- Error case testing  
- Performance benchmarks for large datasets
- Integration tests with sample data

**Quality Assurance:**
- Follow existing code patterns in the project
- Use consistent naming conventions
- Implement defensive programming practices
```

## 🔍 Discovery Tools

### Explore All 44+ Strategies
```
Use discover_strategies tool
```

### List Strategies by Category
```
Use list_strategies tool
```

### Get Strategy Details
```
Use get_strategy_details tool with strategy: "assumption_detector"
```

### Compare Multiple Strategies
```
Use compare_refinements prompt with user_prompt: "your prompt" and strategies: "star,physics,boomerang"
```

## 📚 Strategy Categories (44+ Total)

### 🔧 **Core Strategies** (10)
General-purpose enhancement:
- `refine_with_star` - Comprehensive analysis
- `refine_with_done` - Structured approach  
- `refine_with_physics` - Balanced scientific method
- `refine_with_morphosis` - Quick improvements

### 💻 **Software Development** (4)  
Code-focused strategies:
- `refine_with_architect` - System design
- `refine_with_boomerang` - Iterative development
- `refine_with_reviewer` - Code quality
- `refine_with_devops` - Infrastructure

### 🎯 **AI Core Principles** (13)
Critical thinking frameworks:
- `refine_with_assumption_detector` - Challenge assumptions
- `refine_with_devils_advocate` - Counter-arguments
- `refine_with_evidence_seeker` - Demand proof
- `refine_with_root_cause_analyzer` - Find root causes

### 🤖 **Vibe Coding Rules** (11)
AI-assisted development:
- `refine_with_write_tests_first` - TDD approach
- `refine_with_use_agent_mode` - AI collaboration
- `refine_with_ship_small_changes` - Incremental delivery
- `refine_with_refactor_continuously` - Code improvement

### 🧠 **Advanced Thinking** (6)
Sophisticated reasoning:
- `refine_with_quantum` - Parallel possibilities
- `refine_with_synthesis` - Concept fusion
- `refine_with_temporal` - Time-aware analysis
- `refine_with_metacognitive` - Self-reflection

## 🔧 Advanced Features

### Performance Monitoring
```
Use get_performance_metrics tool
```

### Health Checks
```
Use health_check tool
```

### Direct Strategy Application
```
Use refine_with_[strategy_name] prompt with user_prompt: "your prompt"
```

## 🎉 You're Ready!

Your prompts will now be intelligently enhanced using:
- ✅ **44+ specialized strategies** across 5 categories
- ✅ **Sub-millisecond selection** with 95%+ accuracy  
- ✅ **Enterprise-grade performance** with caching and monitoring
- ✅ **Multiple workflow patterns** for different use cases

## 📖 Next Steps

- **[Full Documentation](README.md)** - Complete feature overview
- **[User Guide](USER_GUIDE.md)** - Detailed examples and workflows  
- **[Architecture Guide](ARCHITECTURE.md)** - Technical implementation details

Need help? The server includes comprehensive error handling and fallback strategies!