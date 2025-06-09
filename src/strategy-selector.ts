import type { PerformanceMetrics } from './types.js';
import { logger } from './logger.js';

export class StrategySelector {
  private performanceMetrics: PerformanceMetrics = {
    selectionTime: 0,
    strategyUsage: {},
    averageResponseTime: 0,
    errorCount: 0
  };

  constructor() {
    logger.info('StrategySelector initialized for metrics tracking only - LLM makes all selection decisions');
  }

  // Track usage for analytics (called by workflows when LLM selects strategies)
  recordStrategyUsage(strategyKey: string, selectionTime: number = 0): void {
    this.performanceMetrics.strategyUsage[strategyKey] = (this.performanceMetrics.strategyUsage[strategyKey] || 0) + 1;
    if (selectionTime > 0) {
      this.performanceMetrics.selectionTime = (this.performanceMetrics.selectionTime + selectionTime) / 2;
    }
    logger.debug(`Strategy usage recorded: ${strategyKey}`, { selectionTime });
  }

  recordError(): void {
    this.performanceMetrics.errorCount++;
    logger.debug('Error recorded in strategy selection metrics');
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  resetMetrics(): void {
    this.performanceMetrics = {
      selectionTime: 0,
      strategyUsage: {},
      averageResponseTime: 0,
      errorCount: 0
    };
    logger.info('Performance metrics reset');
  }

  // Get top used strategies for analytics
  getTopStrategies(limit: number = 5): Array<{ strategy: string; usage: number }> {
    return Object.entries(this.performanceMetrics.strategyUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([strategy, usage]) => ({ strategy, usage }));
  }
}