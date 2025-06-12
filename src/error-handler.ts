import { BaseError, ErrorCode, ErrorSeverity, isPromptPlusError } from './errors.js';
import { logger } from './logger.js';

interface ErrorMetrics {
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  lastError?: BaseError;
}

type RecoveryStrategy = (error: BaseError) => Promise<any>;

export class ErrorHandler {
  private metrics: ErrorMetrics = {
    total: 0,
    byCode: {},
    bySeverity: {}
  };
  
  private recoveryStrategies = new Map<ErrorCode, RecoveryStrategy>();
  private suppressInProduction = false;
  private customLogger: any;
  
  constructor(customLogger?: any) {
    this.customLogger = customLogger || logger;
  }
  
  setSuppressInProduction(suppress: boolean): void {
    this.suppressInProduction = suppress;
  }
  
  registerRecovery(code: ErrorCode, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(code, strategy);
  }
  
  async handle(error: Error | BaseError | unknown): Promise<any> {
    const promptPlusError = this.normalizeError(error);
    
    // Update metrics
    this.updateMetrics(promptPlusError);
    
    // Log error based on severity
    this.logError(promptPlusError);
    
    // Attempt recovery if available
    const recovery = this.recoveryStrategies.get(promptPlusError.code);
    if (recovery) {
      try {
        return await recovery(promptPlusError);
      } catch (recoveryError) {
        this.customLogger.error('Recovery strategy failed', {
          originalError: promptPlusError.code,
          recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
        });
      }
    }
    
    // In production, suppress errors if configured
    if (this.suppressInProduction && process.env.NODE_ENV === 'production') {
      this.customLogger.info('Error suppressed in production', {
        code: promptPlusError.code
      });
      return undefined;
    }
    
    // Re-throw for upstream handling
    throw promptPlusError;
  }
  
  private normalizeError(error: Error | BaseError | unknown): BaseError {
    if (isPromptPlusError(error)) {
      return error;
    }
    
    if (error instanceof Error) {
      return new BaseError(
        error.message,
        ErrorCode.UNKNOWN_ERROR,
        {
          originalError: error.name,
          stack: error.stack
        },
        error
      );
    }
    
    return new BaseError(
      String(error),
      ErrorCode.UNKNOWN_ERROR,
      { originalValue: error }
    );
  }
  
  private updateMetrics(error: BaseError): void {
    this.metrics.total++;
    this.metrics.byCode[error.code] = (this.metrics.byCode[error.code] || 0) + 1;
    this.metrics.bySeverity[error.severity] = (this.metrics.bySeverity[error.severity] || 0) + 1;
    this.metrics.lastError = error;
  }
  
  private logError(error: BaseError): void {
    const logData = {
      code: error.code,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp.toISOString()
    };
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.customLogger.error(`CRITICAL: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        this.customLogger.error(error.message, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.customLogger.warn(error.message, logData);
        break;
      case ErrorSeverity.LOW:
        this.customLogger.info(error.message, logData);
        break;
    }
  }
  
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }
  
  resetMetrics(): void {
    this.metrics = {
      total: 0,
      byCode: {},
      bySeverity: {}
    };
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Convenience method for handling errors in routes
export async function handleError<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const baseError = isPromptPlusError(error) 
      ? error 
      : new BaseError(
          error instanceof Error ? error.message : String(error),
          ErrorCode.UNKNOWN_ERROR,
          context
        );
    
    return errorHandler.handle(baseError);
  }
}