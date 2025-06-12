# Prompt++ MCP UI

A modern React-based user interface for the Prompt++ MCP Server that directly communicates with the MCP server through an HTTP bridge.

## Architecture

The UI consists of three main components:

1. **MCP Server** - The core prompt refinement engine
2. **HTTP Bridge** - Translates HTTP requests to MCP protocol
3. **React UI** - Modern web interface

```
┌─────────────┐     HTTP      ┌──────────────┐     MCP      ┌─────────────┐
│   React UI  │ <-----------> │ HTTP Bridge  │ <---------> │ MCP Server  │
│ (port 5173) │               │ (port 3001)  │    stdio    │             │
└─────────────┘               └──────────────┘             └─────────────┘
```

## Quick Start

### Method 1: Using npm scripts (Recommended)

From the root directory:

```bash
# Start everything with one command
npm run ui

# Or start components separately:
npm run ui:bridge  # Start MCP HTTP bridge
npm run ui:dev     # Start React dev server
```

### Method 2: Using the shell script

```bash
cd UI
./start-ui.sh
```

This will:
1. Build the MCP server
2. Start the MCP HTTP bridge on port 3001
3. Start the React UI on port 5173

### Method 3: Manual startup

```bash
# Terminal 1: Build and start MCP bridge
npm run build
node UI/mcp-http-bridge.cjs

# Terminal 2: Start UI
cd UI/prompt-plus-ui
npm run dev
```

## Features

### Direct MCP Integration
- No need for a separate API server
- Direct communication with MCP server via HTTP bridge
- Real-time updates via WebSocket

### Visual Prompt Explorer
- Browse 44+ built-in strategies
- Advanced filtering by category, complexity, and features
- Visual indicators for variables, examples, and success rates
- Rich prompt visualization with syntax highlighting

### Interactive Testing Lab
- Side-by-side prompt comparison
- Real-time refinement with selected strategies
- Auto-refine mode for instant feedback
- Monaco Editor integration

### Strategy Management
- Create custom strategies
- Organize strategies into collections
- Track usage metrics and success rates
- Export/import functionality

## HTTP Bridge API

The HTTP bridge exposes the following endpoints:

### Strategies
- `GET /strategies` - List all strategies
- `GET /strategies/:id` - Get specific strategy
- `GET /strategies/search?q=query` - Search strategies
- `POST /refine` - Refine a prompt

### Metrics
- `GET /metrics` - Get usage metrics
- `GET /health` - Check server health

### Collections
- `GET /collections` - List collections
- `POST /collections` - Create collection

## Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Project Structure
```
UI/
├── mcp-http-bridge.cjs    # HTTP to MCP bridge server
├── claude-processor.js    # Claude API integration for metaprompts
├── start-ui.sh            # Startup script
├── api-server.cjs         # Legacy API server (deprecated)
├── .env.example           # Environment variable template
└── prompt-plus-ui/        # React application
    ├── src/
    │   ├── components/    # UI components
    │   ├── services/      # API services
    │   └── store/         # State management
    └── package.json
```

### Environment Variables

Create a `.env` file in `UI/prompt-plus-ui/`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
```

#### Claude API Integration (Optional)

To enable automatic processing of metaprompt templates, create a `.env` file in the `UI/` directory:

```bash
cp .env.example .env
```

Then add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from: https://console.anthropic.com/

With the API key configured:
- Metaprompt templates will be automatically processed through Claude
- You'll get actual refined prompts instead of just templates
- Processing happens seamlessly in the background

Without the API key:
- Templates will be displayed as-is
- You can manually copy and process them with Claude

### Building for Production

```bash
cd UI/prompt-plus-ui
npm run build
```

The built files will be in `UI/prompt-plus-ui/dist/`.

## Troubleshooting

### Port conflicts
If you get port already in use errors:

```bash
# Kill processes on specific ports
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### MCP server not starting
- Ensure the MCP server is built: `npm run build`
- Check the console for error messages
- Verify the path to `dist/index.js` is correct

### UI not loading
- Check browser console for errors
- Ensure HTTP bridge is running on port 3001
- Verify CORS settings if running on different ports

## Future Enhancements

- [ ] Electron app for native desktop experience
- [ ] Direct MCP WebSocket connection (no HTTP bridge)
- [ ] Strategy versioning and history
- [ ] Collaborative strategy sharing
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom visualizations

## License

MIT