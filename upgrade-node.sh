#!/bin/bash

echo "🚀 Installing NVM and upgrading Node.js..."

# Install NVM
echo "📦 Installing NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
echo "🔄 Reloading shell configuration..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install Node.js 18
echo "📦 Installing Node.js 18..."
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
echo "✅ Verification:"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

echo "🎉 Node.js upgrade complete!"
echo "🔄 Please restart Claude Desktop and test the MCP server."