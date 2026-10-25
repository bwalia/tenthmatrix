// Free chat time for anonymous visitors. Shared by the API route and the chat
// widget copy, so what the page says and what the server does can't drift.

/** Minutes of chat a visitor gets from their first message in a chat session. */
export const CHAT_FREE_MINUTES = 5;
/** Hours before that chat session's free time starts again. */
export const CHAT_FREE_RESET_HOURS = 24;
