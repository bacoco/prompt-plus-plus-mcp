#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

const logSection = (title) => {
  console.log('\n' + chalk.blue('='.repeat(60)));
  console.log(chalk.blue.bold(title));
  console.log(chalk.blue('='.repeat(60)) + '\n');
};

const logSuccess = (message) => console.log(chalk.green('✓ ') + message);
const logError = (message) => console.log(chalk.red('✗ ') + message);
const logInfo = (message) => console.log(chalk.yellow('ℹ ') + message);

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};

const checkService = async (url, serviceName) => {
  const axios = require('axios');
  try {
    await axios.get(url, { timeout: 5000 });
    logSuccess(`${serviceName} is running at ${url}`);
    return true;
  } catch (error) {
    logError(`${serviceName} is not accessible at ${url}`);
    return false;
  }
};

const main = async () => {
  logSection('Prompt++ MCP UI Test Runner');

  try {
    // Step 1: Check if services are already running
    logSection('Checking Services Status');
    
    const mcpRunning = await checkService('http://localhost:3001/health', 'MCP Server');
    const bridgeRunning = await checkService('http://localhost:3002/health', 'MCP Bridge');

    if (!mcpRunning || !bridgeRunning) {
      logSection('Starting Required Services');
      
      if (!mcpRunning) {
        logInfo('Starting MCP Server...');
        logInfo('Please run in a separate terminal:');
        console.log(chalk.cyan('  cd /Users/loic/prompt-plus-plus-mcp'));
        console.log(chalk.cyan('  npm run start:mcp'));
        console.log();
      }

      if (!bridgeRunning) {
        logInfo('Starting MCP Bridge...');
        logInfo('Please run in a separate terminal:');
        console.log(chalk.cyan('  cd /Users/loic/prompt-plus-plus-mcp/UI'));
        console.log(chalk.cyan('  npm run start:bridge'));
        console.log();
      }

      logInfo('Waiting for services to start...');
      logInfo('Press Ctrl+C to cancel\n');

      // Wait for services with timeout
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mcpReady = await checkService('http://localhost:3001/health', 'MCP Server');
        const bridgeReady = await checkService('http://localhost:3002/health', 'MCP Bridge');

        if (mcpReady && bridgeReady) {
          logSuccess('All services are running!');
          break;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Services failed to start within timeout period');
        }
      }
    } else {
      logSuccess('All services are already running!');
    }

    // Step 2: Run tests
    logSection('Running Tests');

    // Run unit tests
    logInfo('Running MCP Bridge tests...');
    await runCommand('npm', ['test', '--', 'mcp-bridge.test.js'], {
      cwd: path.join(__dirname, '..')
    });
    logSuccess('MCP Bridge tests passed!');

    // Run component tests
    logInfo('Running React component tests...');
    await runCommand('npm', ['test', '--', 'components.test.js'], {
      cwd: path.join(__dirname, '..')
    });
    logSuccess('Component tests passed!');

    // Run integration tests (optional - requires more setup)
    logInfo('Running integration tests...');
    await runCommand('npm', ['test', '--', 'integration.test.js'], {
      cwd: path.join(__dirname, '..')
    });
    logSuccess('Integration tests passed!');

    // Step 3: Summary
    logSection('Test Results Summary');
    logSuccess('All tests passed successfully!');
    logInfo('The UI is correctly loading all data from MCP server');
    logInfo('No static data is being used');

  } catch (error) {
    logSection('Error');
    logError(error.message);
    console.error(error);
    process.exit(1);
  }
};

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n');
  logInfo('Test runner interrupted');
  process.exit(0);
});

// Run the test suite
main().catch(error => {
  logError('Fatal error:');
  console.error(error);
  process.exit(1);
});