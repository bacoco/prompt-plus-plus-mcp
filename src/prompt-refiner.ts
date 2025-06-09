import type { StrategyManager } from './strategy-manager.js';
import { StrategySelector } from './strategy-selector.js';
import { logger } from './logger.js';

export class PromptRefiner {
  private strategySelector: StrategySelector;

  constructor(private strategyManager: StrategyManager) {
    this.strategySelector = new StrategySelector();
  }

  // Keep minimal interface for backward compatibility and metrics
  getPerformanceMetrics() {
    return this.strategySelector.getPerformanceMetrics();
  }

  resetMetrics() {
    this.strategySelector.resetMetrics();
  }

  // Deprecated: This method is no longer used since LLM makes all decisions
  // Kept for backward compatibility only
  autoSelectStrategy(prompt: string) {
    logger.warn('autoSelectStrategy is deprecated - LLM now makes all strategy decisions');
    return {
      user_query: prompt,
      recommended_strategy: "done",
      strategy_name: "Done Prompt",
      reason: "LLM-driven selection now used instead of hardcoded logic",
      alternative: "star",
      alternative_name: "ECHO Prompt",
      prompt_characteristics: {
        word_count: prompt.split(/\s+/).length,
        detected_type: "general"
      }
    };
  }
}