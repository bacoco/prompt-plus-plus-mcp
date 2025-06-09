# Custom Prompts Example

This directory contains example custom prompt strategies that you can use as templates for creating your own.

## 📁 Directory Structure

```
custom-prompts-example/
├── my-team/                    # Team-specific strategies
│   ├── _metadata.json         # Category metadata
│   ├── code_review.json       # Code review strategy
│   └── standup.json           # Daily standup format
└── personal/                   # Personal productivity strategies
    ├── _metadata.json         # Category metadata
    └── email_professional.json # Professional email writer
```

## 🚀 How to Use Custom Prompts

### 1. Copy to Your Custom Directory

Copy this example directory to one of these locations:

```bash
# Option 1: Home directory (recommended)
cp -r custom-prompts-example ~/.prompt-plus-plus/custom-prompts

# Option 2: Config directory
cp -r custom-prompts-example ~/.config/prompt-plus-plus/custom-prompts

# Option 3: Current project
cp -r custom-prompts-example ./custom-prompts
```

### 2. Set Environment Variable (Optional)

```bash
export PROMPT_PLUS_CUSTOM_DIR="/path/to/your/custom-prompts"
```

### 3. Use Your Custom Strategies

Once loaded, your custom strategies will be available with a `[CUSTOM]` prefix:

```
# List all custom strategies
Use list_custom_strategies tool

# Use a custom strategy
Use refine_with_custom_my-team_code_review prompt with user_prompt: "Review this authentication code"

# Auto-refine with only custom strategies
Use auto_refine prompt with user_prompt: "Write standup update" and source: "custom"
```

## 📝 Creating Your Own Strategies

### Strategy JSON Format

Each strategy requires these fields:

```json
{
  "name": "Strategy Display Name",
  "description": "What this strategy does",
  "examples": ["Example use case 1", "Example use case 2"],
  "template": "Your metaprompt template with [Insert initial prompt here] placeholder",
  "triggers": ["keywords", "that", "activate", "this"],
  "best_for": ["use cases", "where this excels"],
  "complexity": "Low|Medium|High",
  "time_investment": "Low|Medium|High"
}
```

### Category Metadata Format

Each category folder should have a `_metadata.json`:

```json
{
  "category": "Category Name",
  "description": "What strategies in this category do",
  "use_cases": ["List of", "use cases"],
  "strategies": [
    {
      "key": "strategy_filename_without_json",
      "name": "Strategy Name",
      "description": "Brief description",
      "best_for": ["primary", "use", "cases"],
      "complexity": "Low|Medium|High",
      "time_investment": "Low|Medium|High"
    }
  ]
}
```

## 💡 Best Practices

1. **Organize by Purpose**: Group related strategies in categories
2. **Clear Naming**: Use descriptive file names (they become strategy keys)
3. **Rich Templates**: Include detailed instructions in your templates
4. **Examples**: Provide 2-3 clear examples for each strategy
5. **Metadata**: Always include `_metadata.json` for better organization

## 🎯 Example Use Cases

### Team Strategies
- Code review checklists
- Documentation templates
- Meeting formats
- Team-specific workflows

### Domain-Specific
- Legal document formats
- Medical report structures
- Financial analysis templates
- Academic writing guides

### Personal Productivity
- Email templates
- Note-taking formats
- Learning frameworks
- Project planning structures

## 🔄 Hot Reloading

The MCP server watches for changes in your custom prompts directory. When you add or modify strategies, they're automatically reloaded without restarting the server.

## 🎨 Tips for Great Custom Strategies

1. **Be Specific**: Target specific use cases rather than general ones
2. **Include Structure**: Provide clear frameworks and checklists
3. **Add Examples**: Show what good output looks like
4. **Guide Thinking**: Include questions and considerations
5. **Format Output**: Specify the desired output format

## 🤝 Sharing Strategies

Custom prompt libraries can be shared as Git repositories, making it easy for teams to collaborate on prompt engineering standards.