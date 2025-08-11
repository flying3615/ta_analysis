export type CacheKey = string;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  size?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
}

export class SimpleCache<T> {
  private store = new Map<CacheKey, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;

  constructor(private maxEntries: number = 100) {}

  get(key: CacheKey): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (typeof entry.ttl === 'number' && entry.ttl > 0) {
      const isExpired = Date.now() - entry.timestamp > entry.ttl;
      if (isExpired) {
        this.store.delete(key);
        this.misses++;
        return undefined;
      }
    }
    this.hits++;
    return entry.data;
  }

  set(key: CacheKey, data: T, options?: { ttl?: number; size?: number }): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl,
      size: options?.size,
    });
    this.pruneToCapacity();
  }

  async getOrFetch(
    key: CacheKey,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; size?: number }
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const data = await fetcher();
    this.set(key, data, options);
    return data;
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  size(): number {
    return this.store.size;
  }

  stats(): CacheStats {
    const totalEntries = this.store.size;
    const totalSize = Array.from(this.store.values()).reduce((acc, e) => acc + (e.size ?? 0), 0);
    const totalLookups = this.hits + this.misses;
    const hitRate = totalLookups > 0 ? this.hits / totalLookups : 0;
    return { hits: this.hits, misses: this.misses, hitRate, totalEntries, totalSize };
  }

  private pruneToCapacity(): void {
    if (this.store.size <= this.maxEntries) return;
    // 删除最老的条目
    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, this.store.size - this.maxEntries).map(e => e[0]);
    for (const k of toDelete) this.store.delete(k);
  }
}


