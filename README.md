# Prompt++ MCP Server

An MCP (Model Context Protocol) server that enhances prompts using various metaprompt strategies. Features intelligent strategy selection and a two-step refinement workflow.

## 🚀 Features

- **🎯 Two-Step Workflow**: Prepare → Execute → Refine for controlled enhancement
- **🧠 44 Metaprompt Strategies**: Comprehensive collection including AI Core Principles and Vibe Coding Rules
- **🤖 Smart Strategy Selection**: Automatically picks the best approach for your prompt  
- **⚡ TypeScript**: Type-safe implementation with official MCP SDK
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

## ⚙️ Configuration

### Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prompt-plus-plus": {
      "command": "prompt-plus-plus-mcp"
    }
  }
}
}
```

### Claude Code
The server works automatically with Claude Code once installed globally.

## 📚 Available Strategies

### Core Strategies (10)
- **ECHO (star)**: Comprehensive multi-stage refinement
- **Done**: Structured approach with role-playing
- **Physics**: Balanced scientific analysis
- **Morphosis**: Quick refinement for simple prompts
- **Verse**: Technical prompt enhancement
- **Math**: Mathematical and formal reasoning
- **Phor**: Flexible technique combination
- **Bolism**: Optimization-focused refinement
- **Arpe**: Advanced reasoning and proofs
- **Touille**: General-purpose refinement

### Software Development (4)
- **Architect**: System design and software architecture
- **Boomerang**: Iterative development with feedback loops
- **Reviewer**: Code review and quality assurance
- **DevOps**: CI/CD and infrastructure automation

### Advanced Thinking (6)
- **Metacognitive**: Self-reflective thinking and bias analysis
- **Adversarial**: Red-blue team attack/defense methodology
- **Fractal**: Recursive decomposition across scales
- **Quantum**: Parallel possibility exploration
- **Temporal**: Multi-timeline analysis
- **Synthesis**: Cross-domain concept fusion

### AI Core Principles (13)
- **Assumption Detector**: Challenge hidden assumptions
- **Devil's Advocate**: Generate systematic counterarguments
- **Ripple Effect Analyzer**: Trace cascading consequences
- **Perspective Multiplier**: Analyze through multiple stakeholder lenses
- **Evidence Seeker**: Demand concrete evidence and validation
- **Pattern Recognizer**: Identify recurring patterns and anti-patterns
- **Root Cause Analyzer**: Drill down to fundamental causes
- **Constraint Identifier**: Map and challenge limiting constraints
- **Paradox Navigator**: Resolve contradictory requirements
- **Tradeoff Tracker**: Make implicit sacrifices explicit
- **Context Expander**: Broaden frame to prevent local optimization
- **Precision Questioner**: Transform vague into precise specifications
- **Time Capsule Test**: Project decisions across time horizons

### Vibe Coding Rules (11)
- **Start from Template**: Leverage proven boilerplates and patterns
- **Use Agent Mode**: Optimize AI-assisted development workflows
- **Write Tests First**: Implement TDD for clarity and quality
- **Keep Files Small**: Maintain modular, readable code structure
- **Run Locally, Test Frequently**: Establish rapid feedback loops
- **Follow Existing Patterns**: Maintain consistency and conventions
- **Delete Aggressively**: Remove dead code and complexity
- **Ship Small Changes**: Deploy incremental, safe changes
- **Collaborate Early and Often**: Engage stakeholders throughout
- **Refactor Continuously**: Improve structure as part of development
- **Document Intent**: Focus on why, not how

## 🎯 Usage

### Basic Usage
Use the `auto_refine` prompt to automatically select the best strategy:

```
Use the auto_refine prompt with user_prompt: "write a story about AI"
```

### Two-Step Workflow
For more control, use the two-step process:

1. **Prepare**: Analyze and select strategy
```
Use the prepare_refinement prompt with user_prompt: "your prompt here"
```

2. **Execute**: Process the metaprompt and get final result
```
Use the execute_refinement prompt with metaprompt_results: "..." and original_prompt: "..."
```

### Specific Strategies
Use any strategy directly:

```
Use the refine_with_star prompt with user_prompt: "your prompt here"
```

### Strategy Information
Get details about available strategies:

```
Use the list_strategies tool
Use the get_strategy_details tool with strategy: "star"
```

## 🔧 Development

### Adding New Strategies
1. Create a new JSON file in the appropriate `metaprompts/` subdirectory:
   - `core_strategies/` - General-purpose refinement approaches
   - `software_development/` - Development-focused strategies  
   - `advanced_thinking/` - Complex reasoning frameworks
   - `ai_core_principles/` - Critical thinking enhancement
   - `vibe_coding_rules/` - AI-assisted development patterns
2. Follow the existing format with `name`, `description`, `template`, and `examples`
3. The server automatically loads all JSON files from the metaprompts directory tree

### Testing
```bash
npm test
```

### Building
```bash
npm run build
```

## 📁 Project Structure

```
prompt-plus-plus-mcp/
├── src/                          # TypeScript source code
│   ├── index.ts                 # Main MCP server
│   ├── strategy-manager.ts      # Strategy loading logic
│   ├── prompt-refiner.ts        # Auto-selection heuristics
│   └── types.ts                # Type definitions
├── metaprompts/                 # Strategy definitions (JSON)
│   ├── core_strategies/         # 10 foundational strategies
│   ├── software_development/    # 4 dev-focused strategies
│   ├── advanced_thinking/       # 6 ultrathink strategies
│   ├── ai_core_principles/      # 13 critical thinking frameworks
│   └── vibe_coding_rules/       # 11 AI-assisted development patterns
├── dist/                        # Compiled JavaScript
└── package.json                # Package configuration
```

## 🤝 Contributing

Contributions welcome! Please feel free to:
- Add new metaprompt strategies
- Improve the auto-selection heuristics
- Enhance documentation
- Report issues or suggest improvements

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/prompt-plus-plus-mcp)
- [GitHub Repository](https://github.com/bacoco/prompt-plus-plus-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)