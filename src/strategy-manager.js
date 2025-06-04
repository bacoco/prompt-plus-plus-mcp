import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
export class StrategyManager {
    constructor(strategiesDir) {
        this.strategies = new Map();
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
                    }
                    catch (err) {
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
        }
        catch (error) {
            console.error('❌ StrategyManager constructor error:', error);
            throw error;
        }
    }
    loadStrategies() {
        try {
            const files = readdirSync(this.strategiesDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            for (const file of jsonFiles) {
                try {
                    const filePath = join(this.strategiesDir, file);
                    const content = readFileSync(filePath, 'utf-8');
                    const data = JSON.parse(content);
                    const key = file.replace('.json', '');
                    const strategy = {
                        key,
                        name: data.name || key,
                        description: data.description || '',
                        examples: data.examples || [],
                        template: data.template || ''
                    };
                    this.strategies.set(key, strategy);
                }
                catch (error) {
                    console.error(`Error loading strategy ${file}:`, error);
                }
            }
        }
        catch (error) {
            throw new Error(`Strategies directory not found: ${this.strategiesDir}`);
        }
    }
    getStrategy(key) {
        return this.strategies.get(key);
    }
    getAllStrategies() {
        return new Map(this.strategies);
    }
    getStrategyNames() {
        return Array.from(this.strategies.keys());
    }
    listStrategies() {
        const result = {};
        for (const [key, strategy] of this.strategies) {
            result[key] = {
                name: strategy.name,
                description: strategy.description
            };
        }
        return result;
    }
    getStrategyExamples() {
        const examples = [];
        for (const [key, strategy] of this.strategies) {
            for (const example of strategy.examples) {
                examples.push([example, key]);
            }
        }
        return examples;
    }
}
