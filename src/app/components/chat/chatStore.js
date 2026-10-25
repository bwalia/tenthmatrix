// The chat lives in sessionStorage so it survives page loads within a visit.
// Shared by the dock and the enquiry form (which prefills from it).
const STORE_KEY = 'tm_chat_v1';

export const readChat = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const writeChat = (v) => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(v));
  } catch {
    /* private mode: chat still works, just not across reloads */
  }
};

/** What the visitor typed in the chat, oldest first, for the enquiry form. */
export const chatNotes = (max = 4000) =>
  (readChat()?.items || [])
    .filter((it) => it.role === 'user' && typeof it.content === 'string' && it.content.trim())
    .map((it) => it.content.trim())
    .join('\n\n')
    .slice(0, max);
