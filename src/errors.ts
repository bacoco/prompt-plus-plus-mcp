export enum ErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MCP_PROTOCOL_ERROR = 'MCP_PROTOCOL_ERROR',
  STRATEGY_NOT_FOUND = 'STRATEGY_NOT_FOUND',
  STRATEGY_ERROR = 'STRATEGY_ERROR',
  WORKFLOW_ERROR = 'WORKFLOW_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  CACHE_CAPACITY_EXCEEDED = 'CACHE_CAPACITY_EXCEEDED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  [key: string]: any;
  operation?: string;
  input?: any;
  timestamp?: string;
  severity?: ErrorSeverity;
}

export class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly severity: ErrorSeverity;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context: ErrorContext = {},
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.severity = context.severity || ErrorSeverity.MEDIUM;
    this.cause = cause;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.sanitizeContext()
    };
  }

  private sanitizeContext(): ErrorContext {
    const sanitized: ErrorContext = {};
    
    for (const [key, value] of Object.entries(this.context)) {
      // Don't include sensitive information
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Truncate large objects
        sanitized[key] = JSON.stringify(value).substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.VALIDATION_ERROR, context);
  }
}

export class MCPProtocolError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.MCP_PROTOCOL_ERROR, {
      ...context,
      severity: ErrorSeverity.HIGH
    });
  }
}

export class StrategyError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.STRATEGY_ERROR, context);
  }
}

export class CacheError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.CACHE_ERROR, context);
  }
}

export class TimeoutError extends BaseError {
  constructor(message: string, timeout: number, context?: ErrorContext) {
    super(message, ErrorCode.TIMEOUT_ERROR, {
      ...context,
      timeout,
      severity: ErrorSeverity.HIGH
    });
  }
}

export class ConfigurationError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.CONFIGURATION_ERROR, {
      ...context,
      severity: ErrorSeverity.CRITICAL
    });
  }
}

// Error utilities
export function isPromptPlusError(error: any): error is BaseError {
  return error instanceof BaseError;
}

export function createError(
  code: ErrorCode,
  message: string,
  context?: ErrorContext
): BaseError {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return new ValidationError(message, context);
    case ErrorCode.MCP_PROTOCOL_ERROR:
      return new MCPProtocolError(message, context);
    case ErrorCode.STRATEGY_ERROR:
      return new StrategyError(message, context);
    case ErrorCode.CACHE_ERROR:
      return new CacheError(message, context);
    case ErrorCode.CONFIGURATION_ERROR:
      return new ConfigurationError(message, context);
    default:
      return new BaseError(message, code, context);
  }
}

export function wrapError(
  error: Error | unknown,
  code: ErrorCode,
  context?: ErrorContext
): BaseError {
  if (isPromptPlusError(error)) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;
  
  return new BaseError(message, code, context, cause);
}