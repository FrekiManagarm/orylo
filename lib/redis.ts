import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set in environment variables",
      );
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

/**
 * Get value from cache
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    console.error(`❌ Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with optional TTL (in seconds)
 */
export async function cacheSet(
  key: string,
  value: any,
  ttl: number = 3600,
): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`❌ Redis SET error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete key from cache
 */
export async function cacheDel(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`❌ Redis DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Add item to queue (using list)
 */
export async function queueAdd(queueName: string, item: any): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.rpush(queueName, JSON.stringify(item));
    return true;
  } catch (error) {
    console.error(`❌ Redis RPUSH error for queue ${queueName}:`, error);
    return false;
  }
}

/**
 * Pop item from queue (FIFO)
 */
export async function queuePop<T = any>(queueName: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const item = await client.lpop<string>(queueName);

    if (!item) return null;

    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`❌ Redis LPOP error for queue ${queueName}:`, error);
    return null;
  }
}

/**
 * Get queue length
 */
export async function queueLength(queueName: string): Promise<number> {
  try {
    const client = getRedisClient();
    return await client.llen(queueName);
  } catch (error) {
    console.error(`❌ Redis LLEN error for queue ${queueName}:`, error);
    return 0;
  }
}

/**
 * Increment counter with optional expiry
 */
export async function increment(
  key: string,
  ttl?: number,
): Promise<number | null> {
  try {
    const client = getRedisClient();
    const value = await client.incr(key);

    if (ttl) {
      await client.expire(key, ttl);
    }

    return value;
  } catch (error) {
    console.error(`❌ Redis INCR error for key ${key}:`, error);
    return null;
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error("❌ Redis not available:", error);
    return false;
  }
}

// Cache key helpers
export const CacheKeys = {
  fraudAnalysis: (paymentIntentId: string) =>
    `fraud:analysis:${paymentIntentId}`,
  organizationSettings: (orgId: string) => `org:settings:${orgId}`,
  stripeConnection: (orgId: string) => `stripe:connection:${orgId}`,
  rateLimit: (orgId: string, window: string) => `ratelimit:${orgId}:${window}`,
};

// Queue names
export const QueueNames = {
  fraudAnalysis: "queue:fraud-analysis",
  webhookRetry: "queue:webhook-retry",
  alerts: "queue:alerts",
};

