import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import type { StrategyInfo } from './types.js';

export class StrategyManager {
  private strategies: Map<string, StrategyInfo> = new Map();
  private strategiesDir: string;
  private categoryMetadata: Map<string, any> = new Map();

  constructor(strategiesDir?: string) {
    try {
      if (!strategiesDir) {
        // Find project root by looking for package.json
        let currentPath = resolve(import.meta.url.replace('file://', ''));
        while (currentPath !== '/') {
          const parentPath = resolve(currentPath, '..');
          try {
            if (readdirSync(parentPath).includes('package.json')) {
              strategiesDir = join(parentPath, 'metaprompts');
              break;
            }
          } catch (err) {
            console.error(`Error reading directory ${parentPath}:`, err);
          }
          currentPath = parentPath;
        }
        if (!strategiesDir) {
          strategiesDir = 'metaprompts';
        }
      }
      
      this.strategiesDir = strategiesDir;
      console.error(`🔍 Loading strategies from: ${this.strategiesDir}`);
      this.loadStrategies();
      console.error(`✅ Loaded ${this.strategies.size} strategies`);
    } catch (error) {
      console.error('❌ StrategyManager constructor error:', error);
      throw error;
    }
  }

  private loadStrategies(): void {
    try {
      this.loadStrategiesFromDirectory(this.strategiesDir);
    } catch (error) {
      throw new Error(`Strategies directory not found: ${this.strategiesDir}`);
    }
  }

  private loadStrategiesFromDirectory(dirPath: string): void {
    try {
      const files = readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = join(dirPath, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
          // Recursively load from subdirectories
          this.loadStrategiesFromDirectory(filePath);
        } else if (file.endsWith('.json')) {
          try {
            const content = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            if (file === '_metadata.json') {
              // Load category metadata
              const categoryName = dirPath.split('/').pop() || 'unknown';
              this.categoryMetadata.set(categoryName, data);
            } else {
              // Load strategy
              const key = file.replace('.json', '');
              
              const strategy: StrategyInfo = {
                key,
                name: data.name || key,
                description: data.description || '',
                examples: data.examples || [],
                template: data.template || ''
              };
              
              this.strategies.set(key, strategy);
            }
          } catch (error) {
            console.error(`Error loading strategy ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  }

  getStrategy(key: string): StrategyInfo | undefined {
    return this.strategies.get(key);
  }

  getAllStrategies(): Map<string, StrategyInfo> {
    return new Map(this.strategies);
  }

  getStrategyNames(): string[] {
    return Array.from(this.strategies.keys());
  }

  listStrategies(): Record<string, { name: string; description: string }> {
    const result: Record<string, { name: string; description: string }> = {};
    for (const [key, strategy] of this.strategies) {
      result[key] = {
        name: strategy.name,
        description: strategy.description
      };
    }
    return result;
  }

  getStrategyExamples(): Array<[string, string]> {
    const examples: Array<[string, string]> = [];
    for (const [key, strategy] of this.strategies) {
      for (const example of strategy.examples) {
        examples.push([example, key]);
      }
    }
    return examples;
  }

  getCategoryMetadata(): Map<string, any> {
    return new Map(this.categoryMetadata);
  }

  getAllCategoriesMetadata(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [categoryName, metadata] of this.categoryMetadata) {
      result[categoryName] = metadata;
    }
    return result;
  }

  getCategoryStrategies(categoryName: string): Record<string, StrategyInfo> {
    const result: Record<string, StrategyInfo> = {};
    const categoryPath = join(this.strategiesDir, categoryName);
    
    for (const [key, strategy] of this.strategies) {
      // Check if strategy belongs to this category by checking its file path
      const strategyFiles = this.getStrategyFilesInCategory(categoryPath);
      if (strategyFiles.includes(key)) {
        result[key] = strategy;
      }
    }
    return result;
  }

  private getStrategyFilesInCategory(categoryPath: string): string[] {
    try {
      const files = readdirSync(categoryPath);
      return files
        .filter(file => file.endsWith('.json') && file !== '_metadata.json')
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error(`Error reading category directory ${categoryPath}:`, error);
      return [];
    }
  }

  getCategoryNames(): string[] {
    return Array.from(this.categoryMetadata.keys());
  }
}