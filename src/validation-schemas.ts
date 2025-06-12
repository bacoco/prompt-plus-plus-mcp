import { z } from 'zod';

// Common schemas
export const NonEmptyStringSchema = z.string().min(1, 'String cannot be empty');
export const StrategyKeySchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid strategy key format');

// Tool input schemas
export const ListStrategiesSchema = z.object({});

export const GetStrategyDetailsSchema = z.object({
  strategy: StrategyKeySchema
});

export const DiscoverStrategiesSchema = z.object({});

export const GetPerformanceMetricsSchema = z.object({});

export const HealthCheckSchema = z.object({});

export const ListCustomStrategiesSchema = z.object({});

export const ListCollectionsSchema = z.object({});

export const ManageCollectionSchema = z.object({
  action: z.enum(['create', 'delete', 'add_strategy', 'remove_strategy', 'update']),
  collection: StrategyKeySchema,
  name: z.string().optional(),
  description: z.string().optional(),
  strategy: StrategyKeySchema.optional()
});

// Prompt argument schemas
export const UserPromptSchema = z.object({
  user_prompt: NonEmptyStringSchema
});

export const AutoRefineSchema = z.object({
  user_prompt: NonEmptyStringSchema,
  source: z.enum(['all', 'built-in', 'custom']).optional(),
  collection: z.string().optional()
});

export const CompareRefinementsSchema = z.object({
  user_prompt: NonEmptyStringSchema,
  strategies: z.string().optional()
});

export const PrepareRefinementSchema = z.object({
  user_prompt: NonEmptyStringSchema
});

export const ExecuteRefinementSchema = z.object({
  metaprompt_results: NonEmptyStringSchema,
  original_prompt: NonEmptyStringSchema
});

export const Step1GetCategoriesSchema = z.object({
  user_prompt: NonEmptyStringSchema
});

export const Step2GetStrategiesSchema = z.object({
  category_name: NonEmptyStringSchema,
  user_prompt: NonEmptyStringSchema
});

export const Step3ExecuteStrategySchema = z.object({
  strategy_key: StrategyKeySchema,
  user_prompt: NonEmptyStringSchema
});

// Custom strategy schema
export const CustomStrategySchema = z.object({
  name: NonEmptyStringSchema,
  description: z.string().min(10, 'Description must be at least 10 characters'),
  template: z.string()
    .min(50, 'Template must be at least 50 characters')
    .refine(
      (val) => val.includes('[Insert initial prompt here]'),
      'Template must contain placeholder: [Insert initial prompt here]'
    ),
  examples: z.array(z.string()).min(1, 'At least one example is required'),
  complexity: z.enum(['Low', 'Medium', 'High', 'Medium-High']).default('Medium'),
  timeInvestment: z.enum(['Low', 'Medium', 'High', 'Medium-High']).default('Medium'),
  triggers: z.array(z.string()).optional(),
  bestFor: z.array(z.string()).optional(),
  customCategory: z.string().optional()
});

// Category metadata schema
export const CategoryMetadataSchema = z.object({
  description: z.string(),
  use_cases: z.array(z.string()).min(1)
});

// Collection schema
export const CollectionSchema = z.object({
  name: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  strategies: z.array(StrategyKeySchema),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional()
});

// Request validation
export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0').optional(),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.any()
});

// Tool schemas map
export const TOOL_SCHEMAS = {
  list_strategies: ListStrategiesSchema,
  get_strategy_details: GetStrategyDetailsSchema,
  discover_strategies: DiscoverStrategiesSchema,
  get_performance_metrics: GetPerformanceMetricsSchema,
  health_check: HealthCheckSchema,
  list_custom_strategies: ListCustomStrategiesSchema,
  list_collections: ListCollectionsSchema,
  manage_collection: ManageCollectionSchema
} as const;

// Prompt schemas map
export const PROMPT_SCHEMAS = {
  auto_refine: AutoRefineSchema,
  compare_refinements: CompareRefinementsSchema,
  prepare_refinement: PrepareRefinementSchema,
  execute_refinement: ExecuteRefinementSchema,
  step1_get_categories: Step1GetCategoriesSchema,
  step2_get_strategies: Step2GetStrategiesSchema,
  step3_execute_strategy: Step3ExecuteStrategySchema
} as const;

// Validation helper
export function validateToolInput(toolName: string, input: unknown): unknown {
  const schema = TOOL_SCHEMAS[toolName as keyof typeof TOOL_SCHEMAS];
  if (!schema) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  
  return result.data;
}

export function validatePromptArgs(promptName: string, args: unknown): unknown {
  // Handle strategy-specific prompts
  if (promptName.startsWith('refine_with_')) {
    return UserPromptSchema.parse(args);
  }
  
  const schema = PROMPT_SCHEMAS[promptName as keyof typeof PROMPT_SCHEMAS];
  if (!schema) {
    throw new Error(`Unknown prompt: ${promptName}`);
  }
  
  const result = schema.safeParse(args);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  
  return result.data;
}