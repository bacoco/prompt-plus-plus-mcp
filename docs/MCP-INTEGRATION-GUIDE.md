# MCP Server Integration Guide

## Overview

This guide documents the enhanced MCP server implementation with improved error handling, validation, caching, and developer experience features following the SPARC methodology.

## New Features Implemented

### 1. Comprehensive Error Handling

**Error Classes** (`src/errors.ts`):
- `BaseError` - Base class with context, severity, and sanitization
- `ValidationError` - Input validation failures
- `MCPProtocolError` - Protocol-level errors
- `StrategyError` - Strategy execution errors
- `CacheError` - Cache operation failures
- `TimeoutError` - Operation timeouts
- `ConfigurationError` - Configuration issues

**Error Handler** (`src/error-handler.ts`):
- Centralized error processing
- Recovery strategies
- Error metrics tracking
- Severity-based logging
- Production error suppression

**Usage Example**:
```typescript
import { handleError, errorHandler } from './error-handler.js';
import { ValidationError, ErrorCode } from './errors.js';

// Register recovery strategy
errorHandler.registerRecovery(ErrorCode.CACHE_ERROR, async (error) => {
  // Clear cache and retry
  cache.clear();
  return { recovered: true };
});

// Handle errors in operations
const result = await handleError(async () => {
  // Your operation here
  if (!isValid) {
    throw new ValidationError('Invalid input', { field: 'strategy' });
  }
  return processStrategy();
}, { operation: 'strategy-processing' });
```

### 2. Input Validation System

**Validation Schemas** (`src/validation-schemas.ts`):
- Zod-based schema validation
- Comprehensive schemas for all tools and prompts
- Custom validators for strategy keys and templates
- Type-safe validation results

**Integration**:
```typescript
import { validateToolInput, validatePromptArgs } from './validation-schemas.js';

// In tool handler
const validatedArgs = validateToolInput(toolName, args);

// In prompt handler
const validatedPrompt = validatePromptArgs(promptName, args);
```

### 3. Performance Optimization

**LRU Cache** (`src/lru-cache.ts`):
- Efficient O(1) operations
- TTL support for cache expiration
- Hit/miss statistics
- Batch operations
- Memory-efficient doubly linked list

**Usage**:
```typescript
import { LRUCache } from './lru-cache.js';

const cache = new LRUCache<string, StrategyInfo>(100, 300000); // 100 items, 5min TTL

// Set with custom TTL
cache.set('key', value, 600000); // 10 minute TTL

// Get with automatic LRU update
const value = cache.get('key');

// Check statistics
const stats = cache.getStats();
console.log(`Cache hit rate: ${stats.hitRate}`);
```

### 4. Testing Infrastructure

**Error Tests** (`tests/unit/errors.test.ts`):
- Comprehensive error class testing
- Error handler behavior verification
- Recovery strategy testing
- Metrics tracking validation

**Test Helpers**:
```typescript
// Mock transport for testing
const mockTransport = new MockMCPTransport();
const server = new PromptPlusMCPServer();
server.setTransport(mockTransport);

// Test error scenarios
expect(() => server.handleTool('invalid')).toThrow(ValidationError);
```

## Integration Steps

### 1. Update Dependencies

```bash
npm install zod
```

### 2. Import Enhanced Components

```typescript
// In your main server file
import { errorHandler, handleError } from './error-handler.js';
import { ValidationError, createError, ErrorCode } from './errors.js';
import { validateToolInput, validatePromptArgs } from './validation-schemas.js';
import { LRUCache } from './lru-cache.js';
```

### 3. Wrap Operations with Error Handling

```typescript
// Before
try {
  const result = await operation();
  return result;
} catch (error) {
  logger.error('Operation failed', error);
  throw error;
}

// After
return handleError(async () => {
  const result = await operation();
  return result;
}, { context: 'operation-name' });
```

### 4. Add Validation

```typescript
// Tool handler
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return handleError(async () => {
    const validatedArgs = validateToolInput(request.params.name, request.params.arguments);
    // Process with validated args
  });
});
```

### 5. Implement Caching

```typescript
class StrategyManager {
  private cache = new LRUCache<string, StrategyInfo>(100);
  
  getStrategy(key: string): StrategyInfo | null {
    // Check cache first
    let strategy = this.cache.get(key);
    if (strategy) return strategy;
    
    // Load and cache
    strategy = this.loadStrategy(key);
    if (strategy) {
      this.cache.set(key, strategy);
    }
    return strategy;
  }
}
```

## Configuration

### Environment Variables

```bash
# Enable debug mode
DEBUG=true

# Set custom prompts directory
PROMPT_PLUS_CUSTOM_DIR=/path/to/custom/prompts

# Production mode
NODE_ENV=production
```

### Error Recovery Configuration

```typescript
// Configure error handler
errorHandler.setSuppressInProduction(true);

// Register recovery strategies
errorHandler.registerRecovery(ErrorCode.TIMEOUT_ERROR, async (error) => {
  // Retry with exponential backoff
  await delay(1000 * Math.pow(2, retryCount));
  return retry();
});
```

## Development Workflow

### 1. Run with Debug Mode

```bash
DEBUG=true npm run dev
```

### 2. Monitor Performance

```typescript
// Get performance metrics
const metrics = server.getPerformanceMetrics();
console.log('Average response time:', metrics.averageResponseTime);
console.log('Cache hit rate:', metrics.cacheHitRate);
```

### 3. Test Error Scenarios

```bash
# Run error handling tests
npm test -- errors.test.ts
```

## Best Practices

1. **Always validate input** before processing
2. **Use specific error types** for different scenarios
3. **Implement recovery strategies** for transient failures
4. **Monitor cache performance** and adjust capacity
5. **Log errors with context** for debugging
6. **Test error paths** as thoroughly as success paths

## Migration from Previous Version

1. Replace generic error throws with specific error types
2. Add validation schemas for new tools/prompts
3. Implement caching for frequently accessed data
4. Update tests to use new error classes
5. Configure error recovery strategies

## Troubleshooting

### Common Issues

**Validation Errors**:
- Check schema definitions match expected input
- Ensure required fields are provided
- Validate enum values are correct

**Cache Misses**:
- Monitor cache statistics
- Adjust capacity if needed
- Check TTL settings

**Error Recovery Failures**:
- Review recovery strategy logic
- Check error context for details
- Monitor recovery metrics

## Performance Monitoring

```typescript
// Enable performance tracking
const monitor = new PerformanceMonitor();

// Track operation
monitor.track('strategy-selection', async () => {
  return selectStrategy(prompt);
});

// Get metrics
const report = monitor.getReport();
console.log('P95 latency:', report.p95);
```

## Next Steps

1. Implement remaining SPARC modes from CLAUDE.md
2. Add comprehensive integration tests
3. Create performance benchmarks
4. Build interactive documentation
5. Set up continuous monitoring

For more details on SPARC methodology, see the [CLAUDE.md](../CLAUDE.md) configuration file.