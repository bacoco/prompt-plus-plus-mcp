# Prompt++ UI Test Suite

This directory contains comprehensive tests for the Prompt++ UI to ensure all data is dynamically loaded from the MCP server and no static data is being used.

## Test Structure

```
test/
├── mcp-bridge.test.js      # Tests for MCP bridge endpoints
├── components.test.js      # React component tests
├── integration.test.js     # Full integration tests
├── run-tests.js           # Test runner script
├── jest.setup.js          # Jest configuration
├── package.json           # Test dependencies
└── README.md              # This file
```

## Test Coverage

### 1. MCP Bridge Tests (`mcp-bridge.test.js`)
- ✅ GET /strategies endpoint
- ✅ POST /refine-with-strategy endpoint
- ✅ POST /automatic-metaprompt endpoint
- ✅ POST /apply-prompt endpoint
- ✅ Error handling for all endpoints
- ✅ Data validation to ensure no static data

### 2. Component Tests (`components.test.js`)
- ✅ PromptRefiner component with dynamic strategy loading
- ✅ StrategyExplorer component with category grouping
- ✅ Dashboard component with real-time updates
- ✅ API service methods verification

### 3. Integration Tests (`integration.test.js`)
- ✅ End-to-end refinement workflow
- ✅ Automatic strategy selection
- ✅ Concurrent request handling
- ✅ Performance and caching tests
- ✅ Error recovery scenarios

## Prerequisites

Before running tests, ensure you have:

1. **MCP Server** installed and configured
2. **MCP Bridge** server set up in the UI directory
3. **Node.js** version 16 or higher
4. **npm** or **yarn** package manager

## Installation

```bash
# Navigate to test directory
cd /Users/loic/prompt-plus-plus-mcp/UI/test

# Install test dependencies
npm install
```

## Running Tests

### Option 1: Automated Test Runner (Recommended)

The test runner automatically checks if services are running and provides instructions if they're not:

```bash
./run-tests.js
```

Or with npm:

```bash
npm run test:all
```

### Option 2: Manual Service Start + Tests

1. **Start MCP Server** (in a separate terminal):
```bash
cd /Users/loic/prompt-plus-plus-mcp
npm run start:mcp
```

2. **Start MCP Bridge** (in another terminal):
```bash
cd /Users/loic/prompt-plus-plus-mcp/UI
npm run start:bridge
```

3. **Run Tests**:
```bash
cd /Users/loic/prompt-plus-plus-mcp/UI/test

# Run all tests
npm test

# Run specific test suites
npm run test:mcp-bridge     # Bridge endpoint tests only
npm run test:components     # Component tests only
npm run test:integration    # Integration tests only

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## What Tests Verify

### Dynamic Data Loading
All tests ensure that:
- ❌ No hardcoded strategy data exists in the UI
- ❌ No static mock data is used in production code
- ✅ All data comes from MCP server via the bridge
- ✅ Strategies are loaded dynamically on component mount
- ✅ Refinements are processed by MCP, not locally

### Key Verification Points

1. **Strategy Loading**: Tests verify that strategies are fetched from `/strategies` endpoint
2. **Refinement Processing**: Confirms refinements go through MCP server
3. **Error States**: Ensures proper error handling when MCP is unavailable
4. **Real-time Updates**: Validates that data refreshes from server

## Interpreting Results

### Success Output
```
✓ MCP Server is running at http://localhost:3001/health
✓ MCP Bridge is running at http://localhost:3002/health
✓ MCP Bridge tests passed!
✓ Component tests passed!
✓ Integration tests passed!
✓ All tests passed successfully!
ℹ The UI is correctly loading all data from MCP server
ℹ No static data is being used
```

### Common Issues

1. **Services Not Running**
   - The test runner will prompt you to start required services
   - Follow the provided commands to start MCP and Bridge servers

2. **Port Conflicts**
   - Ensure ports 3001 (MCP) and 3002 (Bridge) are available
   - Kill any processes using these ports

3. **Test Timeouts**
   - Integration tests may take longer on first run
   - Increase timeout in jest.setup.js if needed

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: |
    cd UI/test
    npm install

- name: Start services
  run: |
    npm run start:mcp &
    npm run start:bridge &
    sleep 10  # Wait for services

- name: Run tests
  run: |
    cd UI/test
    npm test
```

## Debugging Tests

1. **Enable verbose logging**:
```bash
DEBUG=* npm test
```

2. **Run single test**:
```bash
npm test -- --testNamePattern="should load strategies dynamically"
```

3. **Check service logs**:
- MCP Server logs: Check terminal running `npm run start:mcp`
- Bridge logs: Check terminal running `npm run start:bridge`

## Adding New Tests

When adding new features, ensure tests verify:
1. Data comes from MCP (not hardcoded)
2. Error states are handled properly
3. Loading states work correctly
4. Cache behavior is appropriate

Example test structure:
```javascript
test('should load data from MCP', async () => {
  // Mock MCP response
  mock.onGet('/endpoint').reply(200, { data: 'from-mcp' });
  
  // Render component
  render(<Component />);
  
  // Verify data is displayed
  await waitFor(() => {
    expect(screen.getByText('from-mcp')).toBeInTheDocument();
  });
  
  // Ensure no static data
  expect(screen.queryByText('STATIC')).not.toBeInTheDocument();
});
```

## Support

For issues or questions:
1. Check service logs for errors
2. Verify MCP server is properly configured
3. Ensure all dependencies are installed
4. Review test output for specific failures

Happy testing! 🚀