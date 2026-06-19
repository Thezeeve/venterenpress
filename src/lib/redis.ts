import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

redis.on("error", () => {
  // Redis is optional in local validation flows; callers should handle unavailable cache/queue operations gracefully.
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function safeCacheGet<T>(key: string): Promise<T | null> {
  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function safeCacheSet(key: string, value: unknown, ttlSeconds = 60) {
  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    return null;
  }
}

export async function safeQueuePush(key: string, value: string) {
  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    await redis.lpush(key, value);
    return true;
  } catch {
    return false;
  }
}
