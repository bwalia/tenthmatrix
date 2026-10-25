import { randomUUID } from 'node:crypto';
import { CHAT_FREE_MINUTES, CHAT_FREE_RESET_HOURS } from './limits.js';
import { firstSeen, rateLimit } from './rateLimit.js';

// Limits checked before any LLM call. Keyed per chat session, never per IP: on
// k3s1 the pod sees the svclb address (10.42.x.x) for every visitor, so an IP
// key would make all visitors share one clock and one burst budget.
const WINDOW_MS = 30 * 60 * 1000;
const SESSION_LIMIT = 40; // messages per chat session per window: stops a script, not a person typing
const SITE_LIMIT = 300; // all visitors combined per pod per window: a cost cap
const FREE_MS = CHAT_FREE_MINUTES * 60 * 1000;
const FREE_RESET_MS = CHAT_FREE_RESET_HOURS * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const busy = (retryAfterSec) => ({
  ok: false,
  status: 429,
  code: 'RATE_LIMITED',
  error: `You're sending messages quickly. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
  retryAfterSec,
});

/**
 * Burst limits, then the free time limit, for one message. A missing or
 * malformed session id gets a fresh one (the route returns it to the widget),
 * so its clock starts now.
 */
export function chatGate({ sessionUuid, enquirySent = false, now = Date.now() }) {
  const session = typeof sessionUuid === 'string' && UUID_RE.test(sessionUuid) ? sessionUuid.toLowerCase() : randomUUID();

  const site = rateLimit('chat:site', SITE_LIMIT, WINDOW_MS, now);
  if (!site.ok) return busy(site.retryAfterSec);
  const sess = rateLimit(`chat:s:${session}`, SESSION_LIMIT, WINDOW_MS, now);
  if (!sess.ok) return busy(sess.retryAfterSec);

  if (now - firstSeen(`chat:free:s:${session}`, FREE_RESET_MS, now) > FREE_MS) {
    return {
      ok: false,
      status: 403,
      code: 'CHAT_TIME_LIMIT',
      error: enquirySent
        ? `You've used your ${CHAT_FREE_MINUTES} minutes with our assistant. Your enquiry is with our team; to talk sooner, book a call.`
        : `You've used your ${CHAT_FREE_MINUTES} minutes with our assistant. To keep talking, send us an enquiry or book a call — a person will reply.`,
      retryAfterSec: 0,
    };
  }
  return { ok: true, sessionUuid: session };
}
