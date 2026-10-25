import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { firstSeen } from '../src/lib/chat/rateLimit.js';
import { chatGate } from '../src/lib/chat/gate.js';
import { CHAT_FREE_MINUTES, CHAT_FREE_RESET_HOURS } from '../src/lib/chat/limits.js';

const MIN = 60 * 1000;
const T0 = Date.UTC(2026, 9, 25, 12);

test('firstSeen: same key within the period returns the first time', () => {
  assert.equal(firstSeen('a', 10 * MIN, T0), T0);
  assert.equal(firstSeen('a', 10 * MIN, T0 + 3 * MIN), T0);
  assert.equal(firstSeen('a', 10 * MIN, T0 + 10 * MIN), T0);
});

test('firstSeen: after the period a new period starts', () => {
  assert.equal(firstSeen('b', 10 * MIN, T0), T0);
  assert.equal(firstSeen('b', 10 * MIN, T0 + 10 * MIN + 1), T0 + 10 * MIN + 1);
  assert.equal(firstSeen('b', 10 * MIN, T0 + 15 * MIN), T0 + 10 * MIN + 1);
});

test('firstSeen: different keys are independent', () => {
  assert.equal(firstSeen('c', 10 * MIN, T0), T0);
  assert.equal(firstSeen('d', 10 * MIN, T0 + 4 * MIN), T0 + 4 * MIN);
  assert.equal(firstSeen('c', 10 * MIN, T0 + 5 * MIN), T0);
});

test('chatGate: a session is cut off after the free minutes, other sessions are not', () => {
  const s1 = randomUUID();
  assert.equal(chatGate({ sessionUuid: s1, now: T0 }).ok, true);
  assert.equal(chatGate({ sessionUuid: s1, now: T0 + CHAT_FREE_MINUTES * MIN }).ok, true);

  const late = T0 + CHAT_FREE_MINUTES * MIN + 1000;
  const blocked = chatGate({ sessionUuid: s1, now: late });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.code, 'CHAT_TIME_LIMIT');
  assert.match(blocked.error, /send us an enquiry or book a call/);

  // Visitors never share a clock: another session, and one with no session, at the same moment.
  assert.equal(chatGate({ sessionUuid: randomUUID(), now: late }).ok, true);
  const fresh = chatGate({ now: late });
  assert.equal(fresh.ok, true);
  assert.match(fresh.sessionUuid, /^[0-9a-f-]{36}$/);
  assert.notEqual(fresh.sessionUuid, s1);
});

test('chatGate: the enquiry-sent message only offers a call', () => {
  const s = randomUUID();
  chatGate({ sessionUuid: s, now: T0 });
  const r = chatGate({ sessionUuid: s, enquirySent: true, now: T0 + 6 * MIN });
  assert.equal(r.code, 'CHAT_TIME_LIMIT');
  assert.match(r.error, /book a call/);
  assert.doesNotMatch(r.error, /send us an enquiry/);
});

test('chatGate: the free time starts again after the reset period', () => {
  const s = randomUUID();
  chatGate({ sessionUuid: s, now: T0 });
  assert.equal(chatGate({ sessionUuid: s, now: T0 + 6 * MIN }).ok, false);
  assert.equal(chatGate({ sessionUuid: s, now: T0 + CHAT_FREE_RESET_HOURS * 60 * MIN + 1 }).ok, true);
});

test('chatGate: a malformed session id gets a fresh one instead of a shared key', () => {
  const a = chatGate({ sessionUuid: 'x', now: T0 });
  const b = chatGate({ sessionUuid: 'x', now: T0 });
  assert.equal(a.ok && b.ok, true);
  assert.notEqual(a.sessionUuid, b.sessionUuid);
});

test('chatGate: per-session burst limit (40 per 30 minutes)', () => {
  const s = randomUUID();
  const t = T0 + 48 * 60 * MIN; // a fresh window for the site-wide counter too
  for (let i = 0; i < 40; i++) assert.equal(chatGate({ sessionUuid: s, now: t }).ok, true);
  const r = chatGate({ sessionUuid: s, now: t });
  assert.equal(r.status, 429);
  assert.equal(r.code, 'RATE_LIMITED');
  assert.equal(chatGate({ sessionUuid: randomUUID(), now: t }).ok, true);
});
