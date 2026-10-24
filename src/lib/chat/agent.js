import Anthropic from '@anthropic-ai/sdk';
import { chatConfig } from './config';
import { executeTool } from './executor';
import { SYSTEM_PROMPT } from './systemPrompt';
import { TOOLS, TOOL_NAMES } from './tools';

let client = null;
const anthropic = () => (client ||= new Anthropic({ apiKey: chatConfig.apiKey, maxRetries: 2, timeout: 60_000 }));

// Render order is tools → system, so one breakpoint here caches both.
const SYSTEM = [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }];

const LABELS = { search_site: 'Searching our articles', record_requirements: 'Noting that', submit_enquiry: 'Sending your enquiry' };

/** Bounded, well-formed replay of prior turns (plain text only, starts with a user turn). */
function buildHistory(history) {
  const out = [];
  let used = 0;
  for (let i = history.length - 1; i >= 0 && out.length < 20; i--) {
    const h = history[i];
    const content = String(h?.content || '').trim();
    if (!content || (h.role !== 'user' && h.role !== 'assistant')) continue;
    if (used + content.length > 20_000) break;
    used += content.length;
    out.unshift({ role: h.role, content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

/**
 * Manual tool-use loop, streamed: text deltas go straight to the browser via
 * emit(), tool calls run between turns. Capped at chatConfig.maxTurns.
 */
export async function runAgent({ history, message, contextNote, toolCtx, emit, signal }) {
  const userContent = contextNote ? `${contextNote}\n\n${message}` : message;
  const messages = [...buildHistory(history), { role: 'user', content: userContent }];
  let finalText = '';
  let jsonRetries = 0;

  for (let turn = 0; turn < chatConfig.maxTurns; turn++) {
    if (signal?.aborted) break;
    const stream = anthropic().messages.stream(
      {
        model: chatConfig.model,
        max_tokens: 8000,
        system: SYSTEM,
        tools: TOOLS,
        messages,
        thinking: { type: 'adaptive' },
        output_config: { effort: chatConfig.effort },
      },
      { signal },
    );

    let turnText = '';
    stream.on('text', (delta) => {
      turnText += delta;
      emit({ type: 'text', data: { delta } });
    });

    let msg;
    try {
      msg = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // Eager input streaming: tool input the SDK can't parse rejects finalMessage().
      // Re-issue that turn (bounded); typed API errors and aborts go to the caller.
      if (err instanceof Anthropic.APIError || signal?.aborted || jsonRetries++ >= 2) throw err;
      continue;
    }
    if (turnText) finalText += (finalText ? '\n\n' : '') + turnText;

    if (msg.stop_reason === 'refusal') {
      const note = "Sorry, I can't help with that. I'm happy to talk about AI agents for your business and how TenthMatrix works.";
      emit({ type: 'text', data: { delta: (turnText ? '\n\n' : '') + note } });
      break;
    }
    if (msg.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: msg.content });
      continue;
    }
    const toolUses = msg.content.filter((b) => b.type === 'tool_use');
    if (toolUses.length === 0) break;
    if (msg.stop_reason === 'max_tokens') {
      // A tool input cut off at max_tokens can parse as a valid partial object: never run it.
      emit({ type: 'error', data: { message: 'The reply was cut short. Please try again.', code: 'TRUNCATED' } });
      break;
    }

    messages.push({ role: 'assistant', content: msg.content });
    const results = [];
    for (const tu of toolUses) {
      const label = LABELS[tu.name] || tu.name;
      if (tu.name !== 'record_requirements') emit({ type: 'tool', data: { name: tu.name, status: 'running', label } });
      const out = TOOL_NAMES.has(tu.name)
        ? await executeTool(tu.name, tu.input, toolCtx)
        : { content: JSON.stringify({ error: `unknown tool ${tu.name}` }), isError: true };
      if (tu.name !== 'record_requirements') emit({ type: 'tool', data: { name: tu.name, status: out.isError ? 'error' : 'done', label } });
      if (tu.name === 'submit_enquiry' && !out.isError) emit({ type: 'enquiry', data: { sent: true } });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out.content, ...(out.isError ? { is_error: true } : {}) });
    }
    // All results in one user message keeps parallel tool use working.
    messages.push({ role: 'user', content: results });
  }
  return { text: finalText };
}

/** User-safe message for an SDK error. Most specific first. */
export function describeAgentError(err) {
  if (err instanceof Anthropic.RateLimitError) return { message: 'The assistant is busy right now. Please try again in a moment.', code: 'LLM_RATE_LIMITED' };
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError)
    return { message: 'The assistant is offline. You can still reach us through Start a project.', code: 'CHAT_OFFLINE' };
  if (err instanceof Anthropic.BadRequestError) return { message: "The assistant couldn't process that conversation. Please start a new chat.", code: 'LLM_BAD_REQUEST' };
  if (err instanceof Anthropic.APIConnectionError) return { message: "Couldn't reach the assistant. Please try again.", code: 'LLM_UNREACHABLE' };
  if (err instanceof Anthropic.APIError) return { message: 'The assistant hit a problem. Please try again.', code: 'LLM_ERROR' };
  if (err?.name === 'AbortError') return { message: 'Request cancelled.', code: 'ABORTED' };
  return { message: 'Something went wrong. Please try again.', code: 'ERROR' };
}
