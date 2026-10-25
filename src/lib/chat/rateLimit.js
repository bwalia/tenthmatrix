// Fixed-window counters in process memory. Per pod, reset on restart — the
// same trade-off as the engagement endpoints; good enough to stop a script.
// `now` is injectable for tests.
const buckets = new Map();
const starts = new Map();

export function rateLimit(key, limit, windowMs, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || now >= b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (now >= v.reset) buckets.delete(k);
    return { ok: true, retryAfterSec: 0 };
  }
  b.count += 1;
  return b.count <= limit ? { ok: true, retryAfterSec: 0 } : { ok: false, retryAfterSec: Math.ceil((b.reset - now) / 1000) };
}

/**
 * When `key` was first seen in the current period (per pod, like rateLimit).
 * A new period starts once `periodMs` has passed since the last one began.
 */
export function firstSeen(key, periodMs, now = Date.now()) {
  if (starts.size > 10_000) for (const [k, t] of starts) if (now - t > periodMs) starts.delete(k);
  const t = starts.get(key);
  if (t !== undefined && now - t <= periodMs) return t;
  starts.set(key, now);
  return now;
}
