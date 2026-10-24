import fs from 'node:fs';
import path from 'node:path';
import Fuse from 'fuse.js';
import { chatConfig } from './config';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : null);

let fuse = null;
function searchIndex() {
  if (fuse) return fuse;
  const file = path.join(process.cwd(), 'public', 'data', 'search-index.json');
  const items = JSON.parse(fs.readFileSync(file, 'utf8')).filter((i) => i?.slug && !/^__/.test(i.slug));
  fuse = new Fuse(items, {
    keys: [{ name: 'title', weight: 3 }, { name: 'tags', weight: 2 }, { name: 'excerpt', weight: 1 }],
    threshold: 0.35,
    ignoreLocation: true,
  });
  return fuse;
}

const ROUTES = { blog: 'docs/blogs', article: 'articles', insight: 'insights' };

function searchSite(input, ctx) {
  const query = str(input?.query, 120);
  if (!query) return { error: 'query is required' };
  const hits = searchIndex().search(query, { limit: 5 }).map(({ item }) => ({
    title: item.title,
    url: `/${ctx.locale}/${ROUTES[item.type] || 'articles'}/${item.slug}`,
    excerpt: String(item.excerpt || '').slice(0, 280),
  }));
  return { results: hits };
}

function recordRequirements(input, ctx) {
  const notes = str(input?.notes, 2000);
  if (!notes) return { error: 'notes is required' };
  ctx.requirements.push(notes);
  return { recorded: true };
}

const splitName = (full) => {
  const parts = full.split(/\s+/);
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') || undefined };
};

async function submitEnquiry(input, ctx) {
  const name = str(input?.name, 120);
  const email = str(input?.email, 200);
  const summary = str(input?.summary, 4000);
  if (!name || !email || !summary) return { error: 'name, email and summary are required' };
  if (!EMAIL_RE.test(email)) return { error: 'that email address does not look valid; ask the visitor to check it' };
  if (input?.consent !== true) return { error: 'the visitor has not agreed to be contacted; ask them first' };
  if (ctx.enquirySent) return { error: 'an enquiry was already sent in this chat' };

  const notes = ctx.requirements.length ? `\n\nNotes from the chat:\n${ctx.requirements.join('\n')}` : '';
  const company = str(input?.company, 200);
  const res = await fetch(`${chatConfig.opsapiUrl}api/v2/public/leads/${chatConfig.leadsNamespace}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      ...splitName(name),
      email,
      phone: str(input?.phone, 40) || undefined,
      comments: `[Chat enquiry${company ? ` · ${company}` : ''}]\n${summary}${notes}`,
      source: 'tenthmatrix-chat',
      channel: 'chat',
      landing_page_url: ctx.pageUrl || undefined,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) return { error: 'the enquiry could not be sent right now; suggest the form at /start-a-project' };
  ctx.enquirySent = true;
  return { sent: true };
}

const HANDLERS = { search_site: searchSite, record_requirements: recordRequirements, submit_enquiry: submitEnquiry };

/** Runs one tool call. Never throws: failures become an is_error tool_result. */
export async function executeTool(name, input, ctx) {
  const handler = HANDLERS[name];
  if (!handler) return { content: JSON.stringify({ error: `unknown tool ${name}` }), isError: true };
  try {
    const out = await handler(input, ctx);
    return { content: JSON.stringify(out), isError: Boolean(out?.error) };
  } catch {
    return { content: JSON.stringify({ error: 'tool failed; carry on without it' }), isError: true };
  }
}
