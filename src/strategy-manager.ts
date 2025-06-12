import { readFileSync, readdirSync, statSync, watch, existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import type { StrategyInfo, CategoryMetadata } from './types.js';
import { Cache } from './cache.js';
import { logger } from './logger.js';
import { CollectionsManager } from './collections-manager.js';

export class StrategyManager {
  private strategies: Map<string, StrategyInfo> = new Map();
  private strategiesDir: string;
  private customPromptsDir?: string;
  private categoryMetadata: Map<string, CategoryMetadata> = new Map();
  private cache = new Cache<StrategyInfo | CategoryMetadata>(600000); // 10 minutes
  private fileWatcher?: ReturnType<typeof watch>;
  private customFileWatcher?: ReturnType<typeof watch>;
  private collectionsManager: CollectionsManager;

  constructor(strategiesDir?: string, customPromptsDir?: string) {
    try {
      if (!strategiesDir) {
        strategiesDir = this.findStrategiesDirectory();
      }
      
      this.strategiesDir = strategiesDir;
      this.customPromptsDir = customPromptsDir || this.findCustomPromptsDirectory();
      
      logger.info(`Loading built-in strategies from: ${this.strategiesDir}`);
      if (this.customPromptsDir && existsSync(this.customPromptsDir)) {
        logger.info(`Loading custom strategies from: ${this.customPromptsDir}`);
      }
      
      // Initialize collections manager
      this.collectionsManager = new CollectionsManager();
      
      this.loadStrategies();
      this.setupFileWatcher();
      
      const customCount = Array.from(this.strategies.values()).filter(s => s.source === 'custom').length;
      const builtInCount = this.strategies.size - customCount;
      logger.info(`Loaded ${this.strategies.size} strategies (${builtInCount} built-in, ${customCount} custom) across ${this.categoryMetadata.size} categories`);
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

  private findCustomPromptsDirectory(): string | undefined {
    // Check environment variable first
    const envPath = process.env.PROMPT_PLUS_CUSTOM_DIR;
    if (envPath && existsSync(envPath)) {
      return envPath;
    }

    // Check common locations
    const possiblePaths = [
      join(homedir(), '.prompt-plus-plus', 'custom-prompts'),
      join(homedir(), '.config', 'prompt-plus-plus', 'custom-prompts'),
      join(process.cwd(), 'custom-prompts'),
      './custom-prompts'
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        logger.info(`Found custom prompts directory at: ${path}`);
        return path;
      }
    }

    logger.debug('No custom prompts directory found');
    return undefined;
  }

  private setupFileWatcher(): void {
    try {
      this.fileWatcher = watch(this.strategiesDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          logger.info(`Built-in strategy file changed: ${filename}, reloading...`);
          this.cache.clear();
          this.loadStrategies();
        }
      });
      logger.debug('Built-in file watcher setup complete');
    } catch (error) {
      logger.warn('Could not setup built-in file watcher', { error: error instanceof Error ? error.message : String(error) });
    }

    // Setup custom prompts watcher if directory exists
    if (this.customPromptsDir && existsSync(this.customPromptsDir)) {
      try {
        this.customFileWatcher = watch(this.customPromptsDir, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith('.json')) {
            logger.info(`Custom strategy file changed: ${filename}, reloading...`);
            this.cache.clear();
            this.loadStrategies();
          }
        });
        logger.debug('Custom file watcher setup complete');
      } catch (error) {
        logger.warn('Could not setup custom file watcher', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  private loadStrategies(): void {
    try {
      // Clear existing data
      this.strategies.clear();
      this.categoryMetadata.clear();
      
      // Load built-in strategies
      this.loadStrategiesFromDirectory(this.strategiesDir, 'built-in');
      
      // Load custom strategies if directory exists
      if (this.customPromptsDir && existsSync(this.customPromptsDir)) {
        this.loadStrategiesFromDirectory(this.customPromptsDir, 'custom');
      }
      
      if (this.strategies.size === 0) {
        logger.warn('No strategies were loaded');
      }
    } catch (error) {
      const errorMessage = `Failed to load strategies: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  private loadStrategiesFromDirectory(dirPath: string, source: 'built-in' | 'custom' = 'built-in'): void {
    try {
      const files = readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = join(dirPath, file);
        
        try {
          const stat = statSync(filePath);
          
          if (stat.isDirectory()) {
            // Recursively load from subdirectories
            this.loadStrategiesFromDirectory(filePath, source);
          } else if (file.endsWith('.json')) {
            this.loadJsonFile(filePath, file, dirPath, source);
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

  private loadJsonFile(filePath: string, file: string, dirPath: string, source: 'built-in' | 'custom' = 'built-in'): void {
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
        this.loadCategoryMetadata(data as CategoryMetadata, dirPath, source);
      } else {
        this.loadStrategy(data, file, dirPath, source);
      }
    } catch (error) {
      logger.error(`Failed to load JSON file ${filePath}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private loadCategoryMetadata(data: CategoryMetadata, dirPath: string, source: 'built-in' | 'custom' = 'built-in'): void {
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

  private loadStrategy(data: any, file: string, dirPath: string, source: 'built-in' | 'custom' = 'built-in'): void {
    try {
      const key = file.replace('.json', '');
      
      // Extract category name from directory path
      const pathParts = dirPath.split('/');
      const categoryName = pathParts[pathParts.length - 1] || 'unknown';
      
      // For custom strategies, prefix with category to avoid conflicts
      const strategyKey = source === 'custom' ? `custom_${categoryName}_${key}` : key;
      
      // Validate required fields
      if (!data.name || !data.template) {
        logger.warn(`Invalid strategy ${strategyKey}: missing required fields (name, template)`);
        return;
      }
      
      const strategy: StrategyInfo = {
        key: strategyKey,
        name: data.name,
        description: data.description || '',
        examples: Array.isArray(data.examples) ? data.examples : [],
        template: data.template,
        category: categoryName,  // Always set category from directory name
        complexity: data.complexity,
        timeInvestment: data.time_investment,
        triggers: Array.isArray(data.triggers) ? data.triggers : undefined,
        bestFor: Array.isArray(data.best_for) ? data.best_for : undefined,
        source,
        customCategory: source === 'custom' ? categoryName : undefined
      };
      
      this.strategies.set(strategyKey, strategy);
      logger.debug(`Loaded ${source} strategy: ${strategyKey}`);
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

  // Custom prompts specific methods
  getCustomStrategies(): Map<string, StrategyInfo> {
    const customStrategies = new Map<string, StrategyInfo>();
    for (const [key, strategy] of this.strategies) {
      if (strategy.source === 'custom') {
        customStrategies.set(key, strategy);
      }
    }
    return customStrategies;
  }

  getBuiltInStrategies(): Map<string, StrategyInfo> {
    const builtInStrategies = new Map<string, StrategyInfo>();
    for (const [key, strategy] of this.strategies) {
      if (strategy.source !== 'custom') {
        builtInStrategies.set(key, strategy);
      }
    }
    return builtInStrategies;
  }

  getStrategiesBySource(source: 'built-in' | 'custom' | 'all' = 'all'): Map<string, StrategyInfo> {
    if (source === 'all') {
      return this.getAllStrategies();
    }
    
    const filteredStrategies = new Map<string, StrategyInfo>();
    for (const [key, strategy] of this.strategies) {
      if (strategy.source === source) {
        filteredStrategies.set(key, strategy);
      }
    }
    return filteredStrategies;
  }

  getCustomCategories(): string[] {
    const categories = new Set<string>();
    for (const strategy of this.strategies.values()) {
      if (strategy.source === 'custom' && strategy.customCategory) {
        categories.add(strategy.customCategory);
      }
    }
    return Array.from(categories);
  }

  // Collections management
  getCollectionsManager(): CollectionsManager {
    return this.collectionsManager;
  }

  getCollectionStrategies(collectionKey: string): Map<string, StrategyInfo> {
    const collection = this.collectionsManager.getCollection(collectionKey);
    if (!collection) {
      logger.warn(`Collection '${collectionKey}' not found`);
      return new Map();
    }

    const collectionStrategies = new Map<string, StrategyInfo>();
    for (const strategyKey of collection.strategies) {
      const strategy = this.strategies.get(strategyKey);
      if (strategy) {
        collectionStrategies.set(strategyKey, strategy);
      } else {
        logger.warn(`Strategy '${strategyKey}' in collection '${collectionKey}' not found`);
      }
    }

    return collectionStrategies;
  }

  validateCollectionStrategies(collectionKey: string): { valid: string[]; invalid: string[] } {
    const collection = this.collectionsManager.getCollection(collectionKey);
    if (!collection) {
      return { valid: [], invalid: [] };
    }

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const strategyKey of collection.strategies) {
      if (this.strategies.has(strategyKey)) {
        valid.push(strategyKey);
      } else {
        invalid.push(strategyKey);
      }
    }

    return { valid, invalid };
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
        logger.debug('Built-in file watcher closed');
      }
      if (this.customFileWatcher) {
        this.customFileWatcher.close();
        logger.debug('Custom file watcher closed');
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