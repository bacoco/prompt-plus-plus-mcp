import { logger } from './logger.js';

// Schema definitions for strategy validation
const STRATEGY_SCHEMA = {
  type: 'object',
  required: ['name', 'template'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    examples: { type: 'array', items: { type: 'string' } },
    template: { type: 'string', minLength: 1 },
    complexity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Medium-High'] },
    time_investment: { type: 'string', enum: ['Low', 'Medium', 'High', 'Medium-High'] },
    triggers: { type: 'array', items: { type: 'string' } },
    best_for: { type: 'array', items: { type: 'string' } }
  }
};

const CATEGORY_METADATA_SCHEMA = {
  type: 'object',
  required: ['category', 'description'],
  properties: {
    category: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    use_cases: { type: 'array', items: { type: 'string' } },
    strategies: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'name', 'description'],
        properties: {
          key: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          best_for: { type: 'array', items: { type: 'string' } },
          complexity: { type: 'string' },
          time_investment: { type: 'string' },
          triggers: { type: 'array', items: { type: 'string' } },
          output_focus: { type: 'string' }
        }
      }
    }
  }
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SchemaValidator {
  validateStrategy(data: any): ValidationResult {
    return this.validate(data, STRATEGY_SCHEMA, 'Strategy');
  }

  validateCategoryMetadata(data: any): ValidationResult {
    return this.validate(data, CATEGORY_METADATA_SCHEMA, 'Category metadata');
  }

  private validate(data: any, schema: any, context: string): ValidationResult {
    const errors: string[] = [];

    try {
      // Basic type validation
      if (schema.type === 'object' && (typeof data !== 'object' || data === null)) {
        errors.push(`${context} must be an object`);
        return { valid: false, errors };
      }

      // Required fields validation
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in data)) {
            errors.push(`${context} missing required field: ${field}`);
          }
        }
      }

      // Properties validation
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties) as [string, any][]) {
          if (prop in data) {
            const propErrors = this.validateProperty(data[prop], propSchema, `${context}.${prop}`);
            errors.push(...propErrors);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Schema validation error', { error: error instanceof Error ? error.message : String(error) });
      errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors };
    }
  }

  private validateProperty(value: any, schema: any, context: string): string[] {
    const errors: string[] = [];

    // Type validation
    if (schema.type) {
      const expectedType = schema.type;
      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (actualType !== expectedType) {
        errors.push(`${context} expected ${expectedType}, got ${actualType}`);
        return errors; // Stop further validation if type is wrong
      }
    }

    // String validations
    if (schema.type === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${context} must be at least ${schema.minLength} characters long`);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${context} must be one of: ${schema.enum.join(', ')}`);
      }
    }

    // Array validations
    if (schema.type === 'array') {
      if (schema.items) {
        value.forEach((item: any, index: number) => {
          const itemErrors = this.validateProperty(item, schema.items, `${context}[${index}]`);
          errors.push(...itemErrors);
        });
      }
    }

    // Object validations
    if (schema.type === 'object' && schema.properties) {
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in value)) {
            errors.push(`${context} missing required field: ${field}`);
          }
        }
      }

      for (const [prop, propSchema] of Object.entries(schema.properties) as [string, any][]) {
        if (prop in value) {
          const propErrors = this.validateProperty(value[prop], propSchema, `${context}.${prop}`);
          errors.push(...propErrors);
        }
      }
    }

    return errors;
  }

  // Utility method to validate common JSON structure
  isValidJSON(text: string): { valid: boolean; error?: string } {
    try {
      JSON.parse(text);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON'
      };
    }
  }
}