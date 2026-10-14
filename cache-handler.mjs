/**
 * Redis-backed ISR cache handler for the standalone (K3S) server.
 *
 * Why: Next's default ISR cache is per-pod on local disk. With more than one
 * replica (the prod HPA allows up to 100), `revalidateTag` would only bust the
 * pod that received the request and pods would serve inconsistent versions.
 * A shared Redis cache makes tag revalidation global and keeps a scaled-out
 * fleet coherent. See docs/migration-k3s-isr.md (Phase 3).
 *
 * Safety: an in-process LRU tier sits behind Redis, so a Redis outage degrades
 * to per-pod caching rather than a hard failure, and a missing REDIS_URL falls
 * back to local-only (correct for a single replica / local prod build).
 */
import { CacheHandler } from '@fortedigital/nextjs-cache-handler';
import createLruHandler from '@fortedigital/nextjs-cache-handler/local-lru';
import createRedisHandler from '@fortedigital/nextjs-cache-handler/redis-strings';
import { createClient } from '@redis/client';

CacheHandler.onCreation(async () => {
  const localHandler = createLruHandler();

  // No Redis configured → local-only (single replica / build / dev).
  if (!process.env.REDIS_URL) {
    return { handlers: [localHandler] };
  }

  let client;
  try {
    // connectTimeout bounds boot: a black-hole REDIS_URL must not stall the
    // first render for the OS default (~minutes) — fall back to LRU quickly.
    client = createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: 1000 } });
    // Never let a Redis error crash the server; the LRU tier keeps serving.
    client.on('error', (e) => console.warn('cache-handler: redis error:', e?.message || e));
    await client.connect();

    const redisHandler = createRedisHandler({
      client,
      keyPrefix: 'tm:isr:',
      timeoutMs: 1000,
    });

    // Redis first (shared across replicas), LRU as an in-process fallback.
    return { handlers: [redisHandler, localHandler] };
  } catch (e) {
    console.warn('cache-handler: Redis unavailable, using local LRU only:', e?.message || e);
    // Don't leave a client auto-reconnecting in the background.
    try { await client?.quit(); } catch { /* already down */ }
    return { handlers: [localHandler] };
  }
});

export default CacheHandler;
