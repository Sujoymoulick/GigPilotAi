import { env } from '../config/env';

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

class MemoryCache implements ICache {
  private store = new Map<string, { value: any; expiresAt: number | null }>();

  public async get<T>(key: string): Promise<T | null> {
    const record = this.store.get(key);
    if (!record) return null;
    
    if (record.expiresAt && Date.now() > record.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return record.value as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async clear(): Promise<void> {
    this.store.clear();
  }
}

class UpstashRedisCache implements ICache {
  private url: string;
  private token: string;

  constructor(redisUrl: string) {
    // support both redis://... and https://... REST url styles for Upstash Redis
    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      // standard redis uri
      this.url = redisUrl;
      this.token = '';
    } else {
      this.url = redisUrl;
      this.token = process.env.REDIS_TOKEN || '';
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      if (this.url.startsWith('http')) {
        // HTTP Rest implementation
        const response = await fetch(`${this.url}/get/${key}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        const data = await response.json() as any;
        if (data && data.result) {
          return JSON.parse(data.result) as T;
        }
      }
      return null;
    } catch (err) {
      console.warn(`[Redis Cache GET Error for key ${key}]:`, err);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      if (this.url.startsWith('http')) {
        const payload = JSON.stringify(value);
        let path = `/set/${key}`;
        if (ttlSeconds) {
          path = `/set/${key}?ex=${ttlSeconds}`;
        }
        await fetch(`${this.url}${path}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
          body: payload
        });
      }
    } catch (err) {
      console.warn(`[Redis Cache SET Error for key ${key}]:`, err);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      if (this.url.startsWith('http')) {
        await fetch(`${this.url}/del/${key}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
      }
    } catch (err) {
      console.warn(`[Redis Cache DEL Error for key ${key}]:`, err);
    }
  }

  public async clear(): Promise<void> {
    // In rest, clear requires flushall
    try {
      if (this.url.startsWith('http')) {
        await fetch(`${this.url}/flushall`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
      }
    } catch (err) {
      console.warn('[Redis Cache FLUSH Error]:', err);
    }
  }
}

export const cache: ICache = env.REDIS_URL ? new UpstashRedisCache(env.REDIS_URL) : new MemoryCache();

if (!env.REDIS_URL) {
  console.log('⚠️  REDIS_URL not configured. Caching is operating in local In-Memory mode.');
} else {
  console.log('✅ Caching is configured with Upstash Redis.');
}
