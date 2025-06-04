# Quick Start Guide

## 1. Install Dependencies

```bash
pip install mcp pydantic
```

## 2. Test the Server Locally

```bash
python test_server.py
```

## 3. Configure with Cursor

Add to your Cursor settings (usually in `~/.cursor/settings.json`):

```json
{
  "mcpServers": {
    "prompt-plus": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/Users/loic/prompt-plus-plus-mcp"
    }
  }
}
```

## 4. Use in Cursor

After configuration, you can use commands like:

- `Use the refine_prompt tool with prompt: "your prompt here" and strategy: "star"`
- `Use the auto_select_strategy tool with prompt: "your prompt here"`
- `Use the list_strategies tool`
- `Use the compare_strategies tool with prompt: "your prompt" and strategies: ["star", "verse", "physics"]`

## 5. Process Results

When you get a response with `instruction_for_cursor`, copy it to a new Cursor chat and ask Cursor to process it. The response will include:

- `initial_prompt_evaluation`: Analysis of your original prompt
- `refined_prompt`: The improved version
- `explanation_of_refinements`: What was changed and why

## Troubleshooting

If the server doesn't appear in Cursor:
1. Restart Cursor
2. Check the path in settings is correct
3. Ensure Python is in your PATH
4. Check for errors by running `python -m src.server` directly

## Available Strategies

- **star**: Best for complex, creative tasks
- **morphosis**: Good for simple, quick refinements
- **verse**: Excellent for technical prompts
- **physics**: Balanced approach for analysis
- **math**: Specialized for mathematical content
- And 5 more strategies!

Use `list_strategies` to see all available options.
