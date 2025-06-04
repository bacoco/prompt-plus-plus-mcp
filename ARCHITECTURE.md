# Prompt++ MCP - Architecture Overview

## Overview

This MCP server provides prompt enhancement capabilities through 10 different metaprompt strategies, each designed for specific use cases.

## Directory Structure

```
prompt-plus-plus-mcp/
├── metaprompts/              # Individual strategy files
│   ├── arpe.json            # Advanced reasoning and proof engineering
│   ├── bolism.json          # Autoregressive language model optimization
│   ├── done.json            # Structured role-playing with advanced techniques
│   ├── math.json            # Mathematical and formal proofs
│   ├── morphosis.json       # Quick, simplified refinements
│   ├── phor.json            # Flexible technique combination
│   ├── physics.json         # Balanced scientific structuring
│   ├── star.json            # Comprehensive multi-stage (ECHO)
│   ├── touille.json         # General-purpose refinement
│   └── verse.json           # Logical flow enhancement
├── src/
│   ├── __init__.py
│   └── server.py            # MCP server implementation
├── package.json             # MCP configuration
├── requirements.txt         # Python dependencies
├── test_metaprompts.py      # Metaprompt validation script
└── test_server.py           # Server testing script
```

## Metaprompt Structure

Each metaprompt JSON file contains:

```json
{
  "name": "Strategy Display Name",
  "description": "When and why to use this strategy",
  "examples": ["Example prompt 1", "Example prompt 2"],
  "template": "The actual metaprompt template with [Insert initial prompt here] placeholder"
}
```

## Strategy Selection Guide

### Creative/Complex Tasks
- **star (ECHO)**: Best for comprehensive, multi-stage refinement
- **done**: Structured approach with role-playing

### Technical/Scientific
- **physics**: Balanced approach for scientific prompts
- **verse**: Logical structure enhancement
- **math**: Specialized for mathematical proofs

### Quick Tasks
- **morphosis**: Simple, fast refinements
- **phor**: Flexible technique combination

### Specialized
- **bolism**: Autoregressive model optimization
- **arpe**: Advanced reasoning and proofs
- **touille**: General-purpose refinement

## Adding New Strategies

1. Create a new JSON file in `metaprompts/` directory
2. Follow the structure above
3. Include `[Insert initial prompt here]` placeholder in template
4. The server will automatically load it on startup

## Customizing Existing Strategies

Simply edit the corresponding JSON file in the `metaprompts/` directory. Changes take effect when the server restarts.

## Credits

Based on the original [Prompt++](https://huggingface.co/spaces/baconnier/prompt-plus-plus) project by baconnier.
