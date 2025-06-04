import type { AutoSelectionResult, ComparisonResult, StrategyScore } from './types.js';
import type { StrategyManager } from './strategy-manager.js';

export class PromptRefiner {
  constructor(private strategyManager: StrategyManager) {}

  autoSelectStrategy(prompt: string): AutoSelectionResult {
    const promptLower = prompt.toLowerCase();
    const wordCount = prompt.split(/\s+/).length;
    
    let recommendedKey: string;
    let reason: string;
    
    // Heuristics for strategy selection
    if (this.hasKeywords(promptLower, ["story", "creative", "narrative", "fiction"])) {
      recommendedKey = "star";
      reason = "Comprehensive approach ideal for creative and narrative tasks";
    } else if (this.hasKeywords(promptLower, ["code", "programming", "technical", "implement", "function"])) {
      recommendedKey = "verse";
      reason = "Structured approach excellent for technical and coding tasks";
    } else if (this.hasKeywords(promptLower, ["math", "proof", "equation", "theorem", "formula"])) {
      recommendedKey = "math";
      reason = "Specialized approach for mathematical and formal reasoning";
    } else if (this.hasKeywords(promptLower, ["analyze", "compare", "evaluate", "scientific"])) {
      recommendedKey = "physics";
      reason = "Balanced analytical approach for scientific analysis";
    } else if (this.hasKeywords(promptLower, ["optimize", "improve", "enhance", "refine"])) {
      recommendedKey = "bolism";
      reason = "Optimization-focused approach for improvement tasks";
    } else if (wordCount < 15) {
      recommendedKey = "morphosis";
      reason = "Simple and efficient approach for short prompts";
    } else if (wordCount > 50) {
      recommendedKey = "star";
      reason = "Comprehensive approach for complex, detailed prompts";
    } else {
      recommendedKey = "done";
      reason = "Well-rounded approach with role-playing and advanced techniques";
    }

    const strategy = this.strategyManager.getStrategy(recommendedKey);
    
    // Determine alternative
    const alternatives: Record<string, string> = {
      "star": "verse",
      "verse": "physics", 
      "math": "arpe",
      "physics": "verse",
      "morphosis": "phor",
      "done": "star",
      "bolism": "touille",
      "arpe": "math",
      "phor": "morphosis",
      "touille": "done"
    };
    
    const alternativeKey = alternatives[recommendedKey] || "star";
    const alternativeStrategy = this.strategyManager.getStrategy(alternativeKey);
    
    return {
      user_query: prompt,
      recommended_strategy: recommendedKey,
      strategy_name: strategy?.name || recommendedKey,
      reason,
      alternative: alternativeKey,
      alternative_name: alternativeStrategy?.name || alternativeKey,
      prompt_characteristics: {
        word_count: wordCount,
        detected_type: this.detectPromptType(promptLower)
      }
    };
  }

  compareStrategies(prompt: string, strategyKeys?: string[]): ComparisonResult {
    if (!strategyKeys) {
      // Auto-select top 3 strategies
      const autoSelection = this.autoSelectStrategy(prompt);
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
        const score = this.scoreStrategyFit(prompt, strategy);
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
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private detectPromptType(promptLower: string): string {
    if (this.hasKeywords(promptLower, ["story", "creative", "narrative"])) {
      return "creative";
    } else if (this.hasKeywords(promptLower, ["code", "programming", "technical"])) {
      return "technical";
    } else if (this.hasKeywords(promptLower, ["math", "proof", "equation"])) {
      return "mathematical";
    } else if (this.hasKeywords(promptLower, ["analyze", "scientific", "research"])) {
      return "analytical";
    } else {
      return "general";
    }
  }

  private scoreStrategyFit(prompt: string, strategy: any): StrategyScore {
    const promptLower = prompt.toLowerCase();
    const descriptionLower = strategy.description.toLowerCase();
    
    let suitability = 50; // Base score
    let complexity = 50;
    const strengths: string[] = [];
    
    // Check for keywords that match strategy strengths
    if (descriptionLower.includes("creative") || descriptionLower.includes("story")) {
      if (this.hasKeywords(promptLower, ["story", "creative", "narrative", "fiction"])) {
        suitability += 20;
        strengths.push("creative focus");
      }
    }
    
    if (descriptionLower.includes("technical") || descriptionLower.includes("code")) {
      if (this.hasKeywords(promptLower, ["code", "technical", "programming", "algorithm"])) {
        suitability += 20;
        strengths.push("technical expertise");
      }
    }
    
    if (descriptionLower.includes("math")) {
      if (this.hasKeywords(promptLower, ["math", "equation", "proof", "theorem"])) {
        suitability += 30;
        strengths.push("mathematical reasoning");
      }
    }
    
    if (descriptionLower.includes("scientific")) {
      if (this.hasKeywords(promptLower, ["scientific", "research", "hypothesis", "experiment"])) {
        suitability += 20;
        strengths.push("scientific approach");
      }
    }
    
    const wordCount = prompt.split(/\s+/).length;
    
    if (descriptionLower.includes("comprehensive") || descriptionLower.includes("multi-stage")) {
      if (wordCount > 30) {
        suitability += 15;
        strengths.push("handles complex prompts");
      }
    }
    
    if (descriptionLower.includes("simple") || descriptionLower.includes("quick")) {
      if (wordCount < 20) {
        suitability += 15;
        strengths.push("efficient for simple tasks");
      }
    }
    
    // Complexity scoring
    if (wordCount > 50) {
      complexity = 80;
    } else if (wordCount < 20) {
      complexity = 30;
    } else {
      complexity = 50;
    }
    
    // Ensure suitability stays within bounds
    suitability = Math.min(100, suitability);
    
    if (strengths.length === 0) {
      strengths.push("general purpose");
    }
    
    return {
      suitability,
      complexity,
      strengths
    };
  }
}