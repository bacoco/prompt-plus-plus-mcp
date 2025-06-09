import type { ComparisonResult } from './types.js';
import type { StrategyManager } from './strategy-manager.js';
import { StrategySelector } from './strategy-selector.js';
import { logger } from './logger.js';

export class PromptRefiner {
  private strategySelector: StrategySelector;

  constructor(private strategyManager: StrategyManager) {
    this.strategySelector = new StrategySelector(strategyManager);
  }

  autoSelectStrategy(prompt: string) {
    return this.strategySelector.autoSelectStrategy(prompt);
  }

  compareStrategies(prompt: string, strategyKeys?: string[]): ComparisonResult {
    try {
      if (!strategyKeys) {
        // Auto-select top 3 strategies
        const autoSelection = this.strategySelector.autoSelectStrategy(prompt);
        strategyKeys = [
          autoSelection.recommended_strategy,
          autoSelection.alternative,
          "physics" // Default third option
        ];
        // Ensure uniqueness
        strategyKeys = [...new Set(strategyKeys)].slice(0, 3);
      }

      const comparisons: Record<string, any> = {};
      for (const key of strategyKeys) {
        const strategy = this.strategyManager.getStrategy(key);
        if (strategy) {
          const score = this.strategySelector.scoreStrategyFit(prompt, strategy);
          comparisons[key] = {
            name: strategy.name,
            suitability: score.suitability,
            complexity: score.complexity,
            strengths: score.strengths
          };
        }
      }

      // Determine best match
      const bestKey = Object.keys(comparisons).reduce((a, b) => 
        comparisons[a].suitability > comparisons[b].suitability ? a : b
      );

      return {
        prompt,
        comparisons,
        recommendation: bestKey,
        reasoning: `Based on the analysis, '${comparisons[bestKey].name}' is the best fit due to its ${comparisons[bestKey].strengths.join(', ')}`
      };
    } catch (error) {
      logger.error('Error comparing strategies', { error: error instanceof Error ? error.message : String(error) });
      
      // Return a fallback comparison
      return {
        prompt,
        comparisons: {
          done: {
            name: "Done Prompt",
            suitability: 70,
            complexity: 50,
            strengths: ["general purpose", "reliable fallback"]
          }
        },
        recommendation: "done",
        reasoning: "Fallback strategy selected due to comparison error"
      };
    }
  }

  getPerformanceMetrics() {
    return this.strategySelector.getPerformanceMetrics();
  }

  resetMetrics() {
    this.strategySelector.resetMetrics();
  }
}