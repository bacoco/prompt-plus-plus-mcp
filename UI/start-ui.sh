#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Prompt++ MCP UI...${NC}"

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Build the MCP server if needed
echo -e "${GREEN}Building MCP server...${NC}"
cd .. && npm run build

# Start the MCP HTTP bridge
echo -e "${GREEN}Starting MCP HTTP bridge...${NC}"
cd UI && node mcp-http-bridge.cjs &
BRIDGE_PID=$!

# Wait for bridge to start
sleep 2

# Start the UI dev server
echo -e "${GREEN}Starting UI dev server...${NC}"
cd /Users/loic/prompt-plus-plus-mcp/UI/prompt-plus-ui && npm run dev &
UI_PID=$!

echo -e "${BLUE}Prompt++ UI is starting...${NC}"
echo -e "${GREEN}✓ MCP HTTP Bridge: http://localhost:3001${NC}"
echo -e "${GREEN}✓ WebSocket Server: http://localhost:3002${NC}"
echo -e "${GREEN}✓ UI: http://localhost:5173${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BRIDGE_PID $UI_PID 2>/dev/null; exit" INT
wait