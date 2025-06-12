# MCP API Specifications

## Overview

The Prompt++ MCP Server implements the Model Context Protocol v1.0.0, exposing both prompts and tools for intelligent prompt refinement.

## Prompts API

### 1. Strategy-Specific Refinement

**Pattern**: `refine_with_{strategy_key}`

**Arguments**:
```typescript
{
  user_prompt: string; // Required - The prompt to refine
}
```

**Example Strategies**:
- `refine_with_star`: STAR method (Situation, Task, Action, Result)
- `refine_with_assumption_detector`: Critical thinking - identify assumptions
- `refine_with_architect`: Software architecture design
- `refine_with_delete_aggressively`: Vibe coding - minimal code principle

### 2. Auto Refinement

**Name**: `auto_refine`

**Arguments**:
```typescript
{
  user_prompt: string;      // Required - The prompt to refine
  source?: string;          // Optional - "all", "built-in", or "custom"
  collection?: string;      // Optional - Use specific collection
}
```

**Response**: Automatically selected and applied strategy with refined prompt

### 3. Compare Refinements

**Name**: `compare_refinements`

**Arguments**:
```typescript
{
  user_prompt: string;      // Required - The prompt to refine
  strategies?: string;      // Optional - Comma-separated strategy keys
}
```

**Response**: Detailed comparison of strategies with recommendations

### 4. Two-Step Refinement Workflow

#### Step 1: Prepare Refinement
**Name**: `prepare_refinement`

**Arguments**:
```typescript
{
  user_prompt: string;      // Required - The prompt to prepare
}
```

**Response**: Strategy selection and metaprompt instructions

#### Step 2: Execute Refinement
**Name**: `execute_refinement`

**Arguments**:
```typescript
{
  metaprompt_results: string;  // Required - Results from step 1
  original_prompt: string;     // Required - Original prompt for context
}
```

**Response**: Final refined prompt

### 5. Three-Step Guided Refinement

#### Step 1: Get Categories
**Name**: `step1_get_categories`

**Arguments**:
```typescript
{
  user_prompt: string;      // Required - For context
}
```

**Response**: Category list with selection guidance

#### Step 2: Get Strategies
**Name**: `step2_get_strategies`

**Arguments**:
```typescript
{
  category_name: string;    // Required - Selected category
  user_prompt: string;      // Required - For context
}
```

**Response**: Strategy list from category

#### Step 3: Execute Strategy
**Name**: `step3_execute_strategy`

**Arguments**:
```typescript
{
  strategy_key: string;     // Required - Selected strategy
  user_prompt: string;      // Required - To refine
}
```

**Response**: Refined prompt using selected strategy

## Tools API

### 1. List Strategies

**Name**: `list_strategies`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {}
}
```

**Response**:
```json
{
  "strategies": {
    "strategy_key": {
      "name": "Strategy Name",
      "description": "Description",
      "prompt_name": "refine_with_strategy_key",
      "examples": ["example1", "example2"],
      "complexity": "Low|Medium|High",
      "timeInvestment": "Low|Medium|High"
    }
  },
  "total_count": 44,
  "usage": "Usage instructions"
}
```

### 2. Get Strategy Details

**Name**: `get_strategy_details`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "strategy": {
      "type": "string",
      "enum": ["list of available strategies"],
      "description": "The strategy to get details for"
    }
  },
  "required": ["strategy"]
}
```

**Response**: Detailed strategy information including template preview

### 3. Discover Strategies

**Name**: `discover_strategies`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {}
}
```

**Response**: Complete category and strategy metadata for intelligent selection

### 4. Get Performance Metrics

**Name**: `get_performance_metrics`

**Response**:
```json
{
  "performance_metrics": {
    "selectionTime": 0,
    "strategyUsage": {},
    "averageResponseTime": 0,
    "errorCount": 0
  },
  "health_status": {
    "totalStrategies": 44,
    "customStrategies": 0,
    "categoriesLoaded": 5
  },
  "timestamp": "ISO-8601"
}
```

### 5. Health Check

**Name**: `health_check`

**Response**: Server status, strategy manager health, cache stats

### 6. List Custom Strategies

**Name**: `list_custom_strategies`

**Response**: User-defined strategies organized by category

### 7. List Collections

**Name**: `list_collections`

**Response**: All strategy collections with metadata

### 8. Manage Collection

**Name**: `manage_collection`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["create", "delete", "add_strategy", "remove_strategy", "update"]
    },
    "collection": {
      "type": "string",
      "description": "Collection key/identifier"
    },
    "name": {
      "type": "string",
      "description": "Collection display name (for create/update)"
    },
    "description": {
      "type": "string",
      "description": "Collection description (for create/update)"
    },
    "strategy": {
      "type": "string",
      "description": "Strategy key (for add/remove)"
    }
  },
  "required": ["action", "collection"]
}
```

## Response Formats

### Prompt Responses

All prompt responses follow MCP format:
```json
{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "Response content"
      }
    }
  ]
}
```

### Tool Responses

All tool responses follow MCP format:
```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON stringified response"
    }
  ]
}
```

## Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional context if available"
}
```

### Common Errors
- Strategy not found
- Invalid parameters
- Collection not found
- Strategy validation failed

## Rate Limiting

No built-in rate limiting - relies on MCP client implementation.

## Authentication

No authentication required - security handled by MCP transport layer.