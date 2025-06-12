import { logger } from './logger.js';

interface LRUNode<K, V> {
  key: K;
  value: V;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
  timestamp: number;
  ttl?: number;
}

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V> | null;
  private tail: LRUNode<K, V> | null;
  private defaultTtl: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(capacity: number = 100, defaultTtl: number = 300000) {
    this.capacity = capacity;
    this.defaultTtl = defaultTtl;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  private addToFront(node: LRUNode<K, V>): void {
    node.prev = null;
    node.next = this.head;
    
    if (this.head) {
      this.head.prev = node;
    }
    
    this.head = node;
    
    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToFront(node: LRUNode<K, V>): void {
    if (node === this.head) return;
    
    this.removeNode(node);
    this.addToFront(node);
  }

  private evictLRU(): void {
    if (!this.tail) return;
    
    const node = this.tail;
    this.removeNode(node);
    this.cache.delete(node.key);
  }

  set(key: K, value: V, ttl?: number): void {
    // Remove existing node if present
    if (this.cache.has(key)) {
      const node = this.cache.get(key)!;
      this.removeNode(node);
      this.cache.delete(key);
    }
    
    // Create new node
    const node: LRUNode<K, V> = {
      key,
      value,
      prev: null,
      next: null,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    };
    
    // Add to cache and front of list
    this.cache.set(key, node);
    this.addToFront(node);
    
    // Evict if over capacity
    if (this.cache.size > this.capacity) {
      this.evictLRU();
    }
  }

  get(key: K): V | null {
    const node = this.cache.get(key);
    
    if (!node) {
      this.misses++;
      return null;
    }
    
    // Check TTL
    const age = Date.now() - node.timestamp;
    if (node.ttl && age > node.ttl) {
      this.removeNode(node);
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    // Move to front (most recently used)
    this.moveToFront(node);
    this.hits++;
    
    return node.value;
  }

  has(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    
    const age = Date.now() - node.timestamp;
    if (node.ttl && age > node.ttl) {
      this.removeNode(node);
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    
    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; capacity: number; hitRate: number; hits: number; misses: number } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hitRate,
      hits: this.hits,
      misses: this.misses
    };
  }

  // Batch operations for efficiency
  mget(keys: K[]): (V | null)[] {
    return keys.map(key => this.get(key));
  }

  mset(entries: Array<[K, V, number?]>): void {
    for (const [key, value, ttl] of entries) {
      this.set(key, value, ttl);
    }
  }
}