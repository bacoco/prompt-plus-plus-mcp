import type { Logger } from './types.js';

class SimpleLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.error(`🔍 [DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  }

  info(message: string, meta?: any): void {
    console.error(`ℹ️ [INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }

  warn(message: string, meta?: any): void {
    console.error(`⚠️ [WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }

  error(message: string, meta?: any): void {
    console.error(`❌ [ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }
}

export const logger = new SimpleLogger();