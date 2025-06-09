import { readFileSync, readdirSync, statSync, watch } from 'fs';
import { join, resolve } from 'path';
import type { StrategyInfo, CategoryMetadata } from './types.js';
import { Cache } from './cache.js';
import { logger } from './logger.js';

export class StrategyManager {
  private strategies: Map<string, StrategyInfo> = new Map();
  private strategiesDir: string;
  private categoryMetadata: Map<string, CategoryMetadata> = new Map();
  private cache = new Cache<StrategyInfo | CategoryMetadata>(600000); // 10 minutes
  private fileWatcher?: ReturnType<typeof watch>;

  constructor(strategiesDir?: string) {
    try {
      if (!strategiesDir) {
        strategiesDir = this.findStrategiesDirectory();
      }
      
      this.strategiesDir = strategiesDir;
      logger.info(`Loading strategies from: ${this.strategiesDir}`);
      
      this.loadStrategies();
      this.setupFileWatcher();
      
      logger.info(`Loaded ${this.strategies.size} strategies across ${this.categoryMetadata.size} categories`);
    } catch (error) {
      logger.error('StrategyManager initialization failed', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to initialize StrategyManager: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private findStrategiesDirectory(): string {
    try {
      // Find project root by looking for package.json
      let currentPath = resolve(import.meta.url.replace('file://', ''));
      while (currentPath !== '/') {
        const parentPath = resolve(currentPath, '..');
        try {
          if (readdirSync(parentPath).includes('package.json')) {
            return join(parentPath, 'metaprompts');
          }
        } catch (err) {
          logger.debug(`Could not read directory ${parentPath}`, { error: err });
        }
        currentPath = parentPath;
      }
      return 'metaprompts';
    } catch (error) {
      logger.warn('Could not find project root, using default metaprompts directory');
      return 'metaprompts';
    }
  }

  private setupFileWatcher(): void {
    try {
      this.fileWatcher = watch(this.strategiesDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          logger.info(`Strategy file changed: ${filename}, reloading...`);
          this.cache.clear();
          this.loadStrategies();
        }
      });
      logger.debug('File watcher setup complete');
    } catch (error) {
      logger.warn('Could not setup file watcher', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private loadStrategies(): void {
    try {
      // Clear existing data
      this.strategies.clear();
      this.categoryMetadata.clear();
      
      this.loadStrategiesFromDirectory(this.strategiesDir);
      
      if (this.strategies.size === 0) {
        logger.warn('No strategies were loaded');
      }
    } catch (error) {
      const errorMessage = `Failed to load strategies from ${this.strategiesDir}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  private loadStrategiesFromDirectory(dirPath: string): void {
    try {
      const files = readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = join(dirPath, file);
        
        try {
          const stat = statSync(filePath);
          
          if (stat.isDirectory()) {
            // Recursively load from subdirectories
            this.loadStrategiesFromDirectory(filePath);
          } else if (file.endsWith('.json')) {
            this.loadJsonFile(filePath, file, dirPath);
          }
        } catch (error) {
          logger.warn(`Could not process file ${filePath}`, { error: error instanceof Error ? error.message : String(error) });
        }
      }
    } catch (error) {
      const errorMessage = `Failed to read directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  private loadJsonFile(filePath: string, file: string, dirPath: string): void {
    try {
      // Check cache first
      const cacheKey = `file:${filePath}`;
      let data = this.cache.get(cacheKey);
      
      if (!data) {
        const content = readFileSync(filePath, 'utf-8');
        if (!content.trim()) {
          logger.warn(`Empty JSON file: ${filePath}`);
          return;
        }
        
        try {
          data = JSON.parse(content);
          this.cache.set(cacheKey, data as any);
        } catch (parseError) {
          logger.error(`Invalid JSON in file ${filePath}`, { error: parseError instanceof Error ? parseError.message : String(parseError) });
          return;
        }
      }
      
      if (file === '_metadata.json') {
        this.loadCategoryMetadata(data as CategoryMetadata, dirPath);
      } else {
        this.loadStrategy(data, file);
      }
    } catch (error) {
      logger.error(`Failed to load JSON file ${filePath}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private loadCategoryMetadata(data: CategoryMetadata, dirPath: string): void {
    try {
      const categoryName = dirPath.split('/').pop() || 'unknown';
      
      // Validate required fields
      if (!data.category || !data.description) {
        logger.warn(`Invalid category metadata in ${dirPath}: missing required fields`);
        return;
      }
      
      this.categoryMetadata.set(categoryName, data);
      logger.debug(`Loaded category metadata: ${categoryName}`);
    } catch (error) {
      logger.error(`Failed to load category metadata from ${dirPath}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private loadStrategy(data: any, file: string): void {
    try {
      const key = file.replace('.json', '');
      
      // Validate required fields
      if (!data.name || !data.template) {
        logger.warn(`Invalid strategy ${key}: missing required fields (name, template)`);
        return;
      }
      
      const strategy: StrategyInfo = {
        key,
        name: data.name,
        description: data.description || '',
        examples: Array.isArray(data.examples) ? data.examples : [],
        template: data.template,
        complexity: data.complexity,
        timeInvestment: data.time_investment,
        triggers: Array.isArray(data.triggers) ? data.triggers : undefined,
        bestFor: Array.isArray(data.best_for) ? data.best_for : undefined
      };
      
      this.strategies.set(key, strategy);
      logger.debug(`Loaded strategy: ${key}`);
    } catch (error) {
      logger.error(`Failed to load strategy from ${file}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  getStrategy(key: string): StrategyInfo | undefined {
    const strategy = this.strategies.get(key);
    if (!strategy) {
      logger.debug(`Strategy not found: ${key}`);
    }
    return strategy;
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

  getCategoryMetadata(): Map<string, CategoryMetadata> {
    return new Map(this.categoryMetadata);
  }

  getAllCategoriesMetadata(): Record<string, CategoryMetadata> {
    const result: Record<string, CategoryMetadata> = {};
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
      logger.error(`Error reading category directory ${categoryPath}`, { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  getCategoryNames(): string[] {
    return Array.from(this.categoryMetadata.keys());
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
    logger.info('Strategy cache cleared');
  }

  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size()
    };
  }

  // Cleanup resources
  destroy(): void {
    try {
      if (this.fileWatcher) {
        this.fileWatcher.close();
        logger.debug('File watcher closed');
      }
      this.cache.clear();
      this.strategies.clear();
      this.categoryMetadata.clear();
      logger.info('StrategyManager destroyed');
    } catch (error) {
      logger.error('Error during StrategyManager cleanup', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Health check
  isHealthy(): boolean {
    return this.strategies.size > 0 && this.categoryMetadata.size > 0;
  }

  getHealthStatus(): { healthy: boolean; strategiesCount: number; categoriesCount: number; cacheSize: number } {
    return {
      healthy: this.isHealthy(),
      strategiesCount: this.strategies.size,
      categoriesCount: this.categoryMetadata.size,
      cacheSize: this.cache.size()
    };
  }
}