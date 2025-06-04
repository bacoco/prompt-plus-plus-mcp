export interface StrategyInfo {
  key: string;
  name: string;
  description: string;
  examples: string[];
  template: string;
}

export interface AutoSelectionResult {
  user_query: string;
  recommended_strategy: string;
  strategy_name: string;
  reason: string;
  alternative: string;
  alternative_name: string;
  prompt_characteristics: {
    word_count: number;
    detected_type: string;
  };
}

export interface StrategyScore {
  suitability: number;
  complexity: number;
  strengths: string[];
}

export interface ComparisonResult {
  prompt: string;
  comparisons: Record<string, {
    name: string;
    suitability: number;
    complexity: number;
    strengths: string[];
  }>;
  recommendation: string;
  reasoning: string;
}