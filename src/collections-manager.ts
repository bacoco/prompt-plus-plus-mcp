import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import type { CollectionsConfig, StrategyCollection } from './types.js';
import { logger } from './logger.js';

export class CollectionsManager {
  private collectionsPath: string;
  private collections: CollectionsConfig = { collections: {} };

  constructor(collectionsPath?: string) {
    this.collectionsPath = collectionsPath || this.getDefaultCollectionsPath();
    this.loadCollections();
  }

  private getDefaultCollectionsPath(): string {
    // Check environment variable first
    const envPath = process.env.PROMPT_PLUS_COLLECTIONS_FILE;
    if (envPath) {
      return envPath;
    }

    // Default to user's home directory
    return join(homedir(), '.prompt-plus-plus', 'collections.json');
  }

  private loadCollections(): void {
    try {
      if (existsSync(this.collectionsPath)) {
        const content = readFileSync(this.collectionsPath, 'utf-8');
        this.collections = JSON.parse(content);
        logger.info(`Loaded ${Object.keys(this.collections.collections).length} collections from ${this.collectionsPath}`);
      } else {
        logger.debug('No collections file found, starting with empty collections');
      }
    } catch (error) {
      logger.warn('Failed to load collections file', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private saveCollections(): void {
    try {
      // Ensure directory exists
      const dir = dirname(this.collectionsPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.collectionsPath, JSON.stringify(this.collections, null, 2));
      logger.info(`Saved collections to ${this.collectionsPath}`);
    } catch (error) {
      logger.error('Failed to save collections', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  // Get all collections
  getAllCollections(): Record<string, StrategyCollection> {
    return { ...this.collections.collections };
  }

  // Get a specific collection
  getCollection(name: string): StrategyCollection | undefined {
    return this.collections.collections[name];
  }

  // Create a new collection
  createCollection(key: string, name: string, description: string): void {
    if (this.collections.collections[key]) {
      throw new Error(`Collection '${key}' already exists`);
    }

    this.collections.collections[key] = {
      name,
      description,
      strategies: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    this.saveCollections();
    logger.info(`Created collection: ${key}`);
  }

  // Add strategy to collection
  addStrategyToCollection(collectionKey: string, strategyKey: string): void {
    const collection = this.collections.collections[collectionKey];
    if (!collection) {
      throw new Error(`Collection '${collectionKey}' not found`);
    }

    if (!collection.strategies.includes(strategyKey)) {
      collection.strategies.push(strategyKey);
      collection.updated = new Date().toISOString();
      this.saveCollections();
      logger.info(`Added strategy '${strategyKey}' to collection '${collectionKey}'`);
    }
  }

  // Remove strategy from collection
  removeStrategyFromCollection(collectionKey: string, strategyKey: string): void {
    const collection = this.collections.collections[collectionKey];
    if (!collection) {
      throw new Error(`Collection '${collectionKey}' not found`);
    }

    const index = collection.strategies.indexOf(strategyKey);
    if (index > -1) {
      collection.strategies.splice(index, 1);
      collection.updated = new Date().toISOString();
      this.saveCollections();
      logger.info(`Removed strategy '${strategyKey}' from collection '${collectionKey}'`);
    }
  }

  // Delete a collection
  deleteCollection(key: string): void {
    if (!this.collections.collections[key]) {
      throw new Error(`Collection '${key}' not found`);
    }

    delete this.collections.collections[key];
    this.saveCollections();
    logger.info(`Deleted collection: ${key}`);
  }

  // Update collection metadata
  updateCollection(key: string, updates: Partial<StrategyCollection>): void {
    const collection = this.collections.collections[key];
    if (!collection) {
      throw new Error(`Collection '${key}' not found`);
    }

    if (updates.name !== undefined) collection.name = updates.name;
    if (updates.description !== undefined) collection.description = updates.description;
    collection.updated = new Date().toISOString();

    this.saveCollections();
    logger.info(`Updated collection: ${key}`);
  }

  // Get collection names
  getCollectionNames(): string[] {
    return Object.keys(this.collections.collections);
  }

  // Get strategies in a collection
  getCollectionStrategies(collectionKey: string): string[] {
    const collection = this.collections.collections[collectionKey];
    return collection ? [...collection.strategies] : [];
  }

  // Export collections (for backup)
  exportCollections(): CollectionsConfig {
    return JSON.parse(JSON.stringify(this.collections));
  }

  // Import collections (restore from backup)
  importCollections(config: CollectionsConfig): void {
    this.collections = JSON.parse(JSON.stringify(config));
    this.saveCollections();
    logger.info('Imported collections successfully');
  }
}