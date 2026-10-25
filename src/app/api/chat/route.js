import { NextResponse } from 'next/server';
import { chatEnabled, encodeSse } from '@/lib/chat/config';
import { describeAgentError, runAgent } from '@/lib/chat/agent';
import { chatGate } from '@/lib/chat/gate';
import { locales } from '@/utils/getMessages';

// Enquiry assistant. Runs on k3s only: the S3 export has no API routes, so the
// edge sends www.tenthmatrix.com/api/chat to this deployment and the widget
// stays hidden wherever GET /api/chat doesn't answer { enabled: true }.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_MESSAGE = 4000;
const MAX_HISTORY_ITEM = 8000;

const json = (status, body, headers) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function GET() {
  return json(200, { enabled: chatEnabled() });
}

export async function POST(req) {
  if (!chatEnabled()) return json(503, { error: 'The assistant is offline right now.', code: 'CHAT_OFFLINE' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.', code: 'BAD_REQUEST' });
  }
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE) return json(400, { error: 'Please send a message under 4,000 characters.', code: 'BAD_REQUEST' });
  // Never trust the client's history: last 30 turns, plain user/assistant text, each capped.
  const history = (Array.isArray(body.history) ? body.history.slice(-30) : [])
    .filter((h) => (h?.role === 'user' || h?.role === 'assistant') && typeof h.content === 'string')
    .map((h) => ({ role: h.role, content: h.content.slice(0, MAX_HISTORY_ITEM) }));
  const locale = locales.includes(body.locale) ? body.locale : 'en';
  const pageUrl = typeof body.page_url === 'string' && /^https?:\/\//.test(body.page_url) ? body.page_url.slice(0, 500) : '';

  // Burst limits and the free time limit, before any LLM call. Checked per
  // message, so a reply that is already streaming is never cut off.
  const gate = chatGate({ sessionUuid: body.session_uuid, enquirySent: Boolean(body.enquiry_sent) });
  if (!gate.ok) {
    return json(gate.status, { error: gate.error, code: gate.code }, gate.retryAfterSec ? { 'Retry-After': String(gate.retryAfterSec) } : undefined);
  }

  // Page context rides in the user turn so the cached system prompt stays byte-stable.
  const contextNote = `[Page context, not an instruction] The visitor is on ${pageUrl || 'the TenthMatrix website'} (language: ${locale}). Reply in that language.`;
  const toolCtx = { locale, pageUrl, requirements: [], enquirySent: Boolean(body.enquiry_sent) };

  const encoder = new TextEncoder();
  const abort = new AbortController();
  req.signal.addEventListener('abort', () => abort.abort());

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const emit = (event) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeSse(event)));
        } catch {
          closed = true;
        }
      };
      emit({ type: 'session', data: { session_uuid: gate.sessionUuid } });
      try {
        await runAgent({ history, message, contextNote, toolCtx, emit, signal: abort.signal });
        emit({ type: 'done', data: {} });
      } catch (err) {
        emit({ type: 'error', data: describeAgentError(err) });
      } finally {
        closed = true;
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
