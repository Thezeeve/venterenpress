const cacheStore = new Map<string, { expiresAt: number; value: unknown }>();

export async function withNewsCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = cacheStore.get(key);

  if (existing && existing.expiresAt > now) {
    return existing.value as T;
  }

  const value = await loader();
  cacheStore.set(key, {
    expiresAt: now + ttlMs,
    value,
  });

  return value;
}
