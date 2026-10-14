import { unstable_cache } from 'next/cache';

export async function runCached(fn, keyParts, options) {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return await fn();
  }
  const cached = unstable_cache(fn, keyParts, options);
  return await cached();
}

export async function cacheByKey(keyParts, options, fn) {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return await fn();
  }
  const cached = unstable_cache(fn, keyParts, options);
  return await cached();
}
