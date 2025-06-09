export interface StrategyInfo {
  key: string;
  name: string;
  description: string;
  examples: string[];
  template: string;
  category?: string;
  complexity?: 'Low' | 'Medium' | 'High' | 'Medium-High';
  timeInvestment?: 'Low' | 'Medium' | 'High' | 'Medium-High';
  triggers?: string[];
  bestFor?: string[];
  source?: 'built-in' | 'custom';
  customCategory?: string;
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

export interface CategoryMetadata {
  category: string;
  description: string;
  use_cases: string[];
  strategies: StrategyMetadata[];
}

export interface StrategyMetadata {
  key: string;
  name: string;
  description: string;
  best_for: string[];
  complexity: string;
  time_investment: string;
  triggers?: string[];
  output_focus?: string;
}

export interface PerformanceMetrics {
  selectionTime: number;
  strategyUsage: Record<string, number>;
  averageResponseTime: number;
  errorCount: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}