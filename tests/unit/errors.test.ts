import { describe, it, expect, beforeEach } from 'vitest';
import {
  BaseError,
  ValidationError,
  ConfigurationError,
  StrategyError,
  WorkflowError,
  CacheError,
  ErrorCode,
  ErrorSeverity,
  ErrorContext,
  isPromptPlusError,
  createError,
  wrapError,
  ErrorHandler
} from '../../src/errors';

describe('Custom Error Classes', () => {
  describe('BaseError', () => {
    it('should create a base error with all properties', () => {
      const error = new BaseError('Test error', ErrorCode.UNKNOWN_ERROR, {
        severity: ErrorSeverity.HIGH,
        context: { user: 'test' },
        cause: new Error('Original error')
      });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context).toEqual({ user: 'test' });
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.stack).toBeDefined();
    });

    it('should use default severity if not provided', () => {
      const error = new BaseError('Test error', ErrorCode.UNKNOWN_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should serialize to JSON properly', () => {
      const error = new BaseError('Test error', ErrorCode.UNKNOWN_ERROR, {
        context: { operation: 'test' }
      });

      const json = error.toJSON();
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('code');
      expect(json).toHaveProperty('severity');
      expect(json).toHaveProperty('context');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('stack');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field information', () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        value: 'not-an-email',
        constraints: { format: 'email' }
      });

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.context?.field).toBe('email');
      expect(error.context?.value).toBe('not-an-email');
      expect(error.context?.constraints).toEqual({ format: 'email' });
    });

    it('should handle multiple validation errors', () => {
      const errors = [
        { field: 'name', message: 'Required field' },
        { field: 'age', message: 'Must be a number' }
      ];

      const error = new ValidationError('Multiple validation errors', {
        errors,
        severity: ErrorSeverity.LOW
      });

      expect(error.context?.errors).toEqual(errors);
      expect(error.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error with config path', () => {
      const error = new ConfigurationError('Invalid configuration', {
        configPath: 'strategies.timeout',
        expectedType: 'number',
        actualType: 'string',
        value: 'not-a-number'
      });

      expect(error.code).toBe(ErrorCode.CONFIGURATION_ERROR);
      expect(error.context?.configPath).toBe('strategies.timeout');
      expect(error.context?.expectedType).toBe('number');
      expect(error.context?.actualType).toBe('string');
    });

    it('should handle missing configuration', () => {
      const error = new ConfigurationError('Missing required configuration', {
        configPath: 'api.key',
        required: true,
        severity: ErrorSeverity.CRITICAL
      });

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.context?.required).toBe(true);
    });
  });

  describe('StrategyError', () => {
    it('should create strategy error with strategy details', () => {
      const error = new StrategyError('Strategy execution failed', {
        strategyKey: 'test_strategy',
        strategyName: 'Test Strategy',
        phase: 'execution',
        input: { prompt: 'test' }
      });

      expect(error.code).toBe(ErrorCode.STRATEGY_ERROR);
      expect(error.context?.strategyKey).toBe('test_strategy');
      expect(error.context?.phase).toBe('execution');
    });

    it('should handle strategy not found error', () => {
      const error = new StrategyError('Strategy not found', {
        strategyKey: 'non_existent',
        availableStrategies: ['strategy1', 'strategy2'],
        code: ErrorCode.STRATEGY_NOT_FOUND
      });

      expect(error.code).toBe(ErrorCode.STRATEGY_NOT_FOUND);
      expect(error.context?.availableStrategies).toEqual(['strategy1', 'strategy2']);
    });
  });

  describe('WorkflowError', () => {
    it('should create workflow error with step information', () => {
      const error = new WorkflowError('Workflow step failed', {
        workflowName: 'auto_refine',
        currentStep: 'strategy_selection',
        totalSteps: 3,
        completedSteps: 1,
        input: { user_prompt: 'test' }
      });

      expect(error.code).toBe(ErrorCode.WORKFLOW_ERROR);
      expect(error.context?.currentStep).toBe('strategy_selection');
      expect(error.context?.completedSteps).toBe(1);
    });

    it('should handle workflow timeout', () => {
      const error = new WorkflowError('Workflow timeout', {
        workflowName: 'compare_refinements',
        timeout: 30000,
        elapsed: 35000,
        code: ErrorCode.WORKFLOW_TIMEOUT
      });

      expect(error.code).toBe(ErrorCode.WORKFLOW_TIMEOUT);
      expect(error.context?.timeout).toBe(30000);
      expect(error.context?.elapsed).toBe(35000);
    });
  });

  describe('CacheError', () => {
    it('should create cache error with operation details', () => {
      const error = new CacheError('Cache operation failed', {
        operation: 'get',
        key: 'strategy_metadata',
        reason: 'Corrupted data'
      });

      expect(error.code).toBe(ErrorCode.CACHE_ERROR);
      expect(error.context?.operation).toBe('get');
      expect(error.context?.key).toBe('strategy_metadata');
    });

    it('should handle cache capacity error', () => {
      const error = new CacheError('Cache capacity exceeded', {
        operation: 'set',
        currentSize: 1000,
        maxSize: 900,
        code: ErrorCode.CACHE_CAPACITY_EXCEEDED
      });

      expect(error.code).toBe(ErrorCode.CACHE_CAPACITY_EXCEEDED);
      expect(error.context?.currentSize).toBe(1000);
      expect(error.context?.maxSize).toBe(900);
    });
  });

  describe('Error Utilities', () => {
    it('should check if error is PromptPlusError', () => {
      const customError = new ValidationError('Test');
      const regularError = new Error('Regular error');

      expect(isPromptPlusError(customError)).toBe(true);
      expect(isPromptPlusError(regularError)).toBe(false);
      expect(isPromptPlusError(null)).toBe(false);
      expect(isPromptPlusError(undefined)).toBe(false);
    });

    it('should create appropriate error based on code', () => {
      const validationErr = createError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        { field: 'test' }
      );

      const configErr = createError(
        ErrorCode.CONFIGURATION_ERROR,
        'Config invalid',
        { configPath: 'test.path' }
      );

      expect(validationErr).toBeInstanceOf(ValidationError);
      expect(configErr).toBeInstanceOf(ConfigurationError);
    });

    it('should wrap non-PromptPlus errors', () => {
      const originalError = new Error('Original message');
      const wrapped = wrapError(originalError, ErrorCode.UNKNOWN_ERROR, {
        operation: 'test'
      });

      expect(wrapped).toBeInstanceOf(BaseError);
      expect(wrapped.message).toContain('Original message');
      expect(wrapped.cause).toBe(originalError);
      expect(wrapped.context?.operation).toBe('test');
    });

    it('should not double-wrap PromptPlus errors', () => {
      const error = new ValidationError('Test error');
      const wrapped = wrapError(error, ErrorCode.UNKNOWN_ERROR);

      expect(wrapped).toBe(error);
    });
  });

  describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;
    let mockLogger: any;

    beforeEach(() => {
      mockLogger = {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
      };
      errorHandler = new ErrorHandler(mockLogger);
    });

    it('should handle errors based on severity', async () => {
      const criticalError = new BaseError('Critical', ErrorCode.UNKNOWN_ERROR, {
        severity: ErrorSeverity.CRITICAL
      });

      const lowError = new ValidationError('Low severity', {
        severity: ErrorSeverity.LOW
      });

      await errorHandler.handle(criticalError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL'),
        expect.any(Object)
      );

      await errorHandler.handle(lowError);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should execute recovery strategies', async () => {
      const recoveryFn = vi.fn().mockResolvedValue('recovered');
      errorHandler.registerRecovery(ErrorCode.CACHE_ERROR, recoveryFn);

      const cacheError = new CacheError('Cache failed');
      const result = await errorHandler.handle(cacheError);

      expect(recoveryFn).toHaveBeenCalledWith(cacheError);
      expect(result).toBe('recovered');
    });

    it('should track error metrics', () => {
      const error1 = new ValidationError('Test 1');
      const error2 = new ValidationError('Test 2');
      const error3 = new StrategyError('Test 3');

      errorHandler.handle(error1);
      errorHandler.handle(error2);
      errorHandler.handle(error3);

      const metrics = errorHandler.getMetrics();
      expect(metrics.total).toBe(3);
      expect(metrics.byCode[ErrorCode.VALIDATION_ERROR]).toBe(2);
      expect(metrics.byCode[ErrorCode.STRATEGY_ERROR]).toBe(1);
    });

    it('should respect error suppression in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      errorHandler.setSuppressInProduction(true);
      const error = new ValidationError('Should be suppressed');

      const result = await errorHandler.handle(error);
      expect(result).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});