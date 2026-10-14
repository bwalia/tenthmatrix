/* global process */
/**
 * Likes + comments store for the blog API routes.
 *
 * Workstation's original routes wrote straight into the committed blog JSON,
 * which cannot work in the standalone container (read-only image, N replicas)
 * and dirties git locally. This keeps one small JSON file per slug in
 * ENGAGEMENT_STORE_DIR (default <cwd>/.data/engagement, gitignored), falling
 * back to the OS temp dir when that is not writable.
 *
 * It is per-pod and non-durable on k3s unless ENGAGEMENT_STORE_DIR points at a
 * mounted volume. TODO: move to an OpsAPI public endpoint (namespace
 * `tenthmatrix`) once one exists; the route contracts can stay as they are.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const SLUG_RE = /^[a-z0-9_][a-z0-9_-]{0,159}$/i;
let storeDir = null;

function dir() {
  if (storeDir) return storeDir;
  const candidates = [
    process.env.ENGAGEMENT_STORE_DIR,
    path.join(process.cwd(), '.data', 'engagement'),
    path.join(os.tmpdir(), 'tenthmatrix-engagement'),
  ].filter(Boolean);
  for (const d of candidates) {
    try {
      fs.mkdirSync(d, { recursive: true });
      fs.accessSync(d, fs.constants.W_OK);
      storeDir = d;
      return d;
    } catch {
      /* try next */
    }
  }
  throw new Error('no writable engagement store directory');
}

export const isValidSlug = (slug) => typeof slug === 'string' && SLUG_RE.test(slug);

function file(slug) {
  return path.join(dir(), `${slug}.json`);
}

export function read(slug) {
  try {
    const data = JSON.parse(fs.readFileSync(file(slug), 'utf8'));
    return {
      likes: Number.isFinite(data.likes) ? data.likes : 0,
      comments: Array.isArray(data.comments) ? data.comments : [],
    };
  } catch {
    return { likes: 0, comments: [] };
  }
}

function write(slug, data) {
  const target = file(slug);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, target); // atomic replace
}

export function like(slug, action) {
  const data = read(slug);
  data.likes = action === 'like' ? data.likes + 1 : Math.max(0, data.likes - 1);
  write(slug, data);
  return data.likes;
}

export function addComment(slug, { name, comment }) {
  const data = read(slug);
  data.comments.push({
    id: crypto.randomUUID(),
    name,
    comment,
    created_at: new Date().toISOString(),
  });
  data.comments = data.comments.slice(-200); // bound file size
  write(slug, data);
  return data.comments;
}

/** Tiny in-memory per-key limiter (per pod). */
const hits = new Map();
export function rateLimited(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > limit;
}

export function clientKey(req) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'anon';
}
