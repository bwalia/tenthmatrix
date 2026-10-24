// Server-side chat settings (Vault tenthmatrix/<env>/config → pod env).
// Imported only by src/app/api/chat; the assistant is offline unless
// ANTHROPIC_API_KEY is set.
const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

export const chatConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  // Cheapest current model; enquiry chat doesn't need more.
  model: process.env.CHAT_MODEL || 'claude-haiku-5-5',
  // Chat does well at low effort (Haiku 5.5 would default to medium).
  effort: process.env.CHAT_EFFORT || 'low',
  maxTurns: num(process.env.CHAT_MAX_TURNS, 6),
  opsapiUrl: (process.env.OPSAPI_URL || 'https://api.tenthmatrix.com/').replace(/\/?$/, '/'),
  leadsNamespace: process.env.NEXT_PUBLIC_LEADS_NAMESPACE || 'tenthmatrix',
};

export function chatEnabled() {
  return Boolean(chatConfig.apiKey) && process.env.CHAT_ENABLED !== 'false';
}

/** SSE frame for one chat event: { type, data }. */
export function encodeSse(event) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}
