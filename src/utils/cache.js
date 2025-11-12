/**
 * High-Performance Caching System
 * LRU cache with TTL support for optimizing repeated operations
 */

class Cache {
  constructor(maxSize = 1000, defaultTTL = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // milliseconds
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Set a value in cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  /**
   * Get a value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: parseFloat(hitRate),
      utilization: (this.cache.size / this.maxSize * 100).toFixed(2)
    };
  }

  /**
   * Get or compute value (memoization)
   */
  async getOrCompute(key, computeFn, ttl = this.defaultTTL) {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Compute and cache
    const value = await computeFn();
    this.set(key, value, ttl);
    return value;
  }
}

/**
 * Global cache instances for different systems
 */
const caches = {
  perception: new Cache(500, 5000),    // 5s TTL for perception data
  pathfinding: new Cache(100, 30000),  // 30s TTL for paths
  blocks: new Cache(1000, 60000),      // 1min TTL for block data
  entities: new Cache(200, 2000),      // 2s TTL for entity data
  inventory: new Cache(50, 10000),     // 10s TTL for inventory data
  decisions: new Cache(100, 3000),     // 3s TTL for decisions
};

/**
 * Auto-cleanup every minute
 */
setInterval(() => {
  let totalCleaned = 0;
  for (const cache of Object.values(caches)) {
    totalCleaned += cache.cleanup();
  }

  if (totalCleaned > 0 && process.env.DEBUG_CACHE) {
    console.log(`[Cache] Cleaned ${totalCleaned} expired entries`);
  }
}, 60000);

/**
 * Print cache statistics
 */
function printCacheStats() {
  console.log("\n=== Cache Statistics ===");

  for (const [name, cache] of Object.entries(caches)) {
    const stats = cache.getStats();
    console.log(`${name}:`, {
      size: `${stats.size}/${stats.maxSize}`,
      hitRate: `${stats.hitRate}%`,
      hits: stats.hits,
      misses: stats.misses
    });
  }

  console.log("=======================\n");
}

module.exports = {
  Cache,
  caches,
  printCacheStats
};
