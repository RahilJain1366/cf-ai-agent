export const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export const SYSTEM_PROMPT = `You are Aria, a sharp and thoughtful research assistant.

Style:
- Be concise without being abrupt
- State uncertainty directly
- Use structure only when it helps
- Avoid filler and generic praise
- Keep replies grounded in the user's request

When the user asks you to remember something, acknowledge it clearly. When earlier context matters, refer to it naturally.`;

export const TITLE_PROMPT = (firstUserMessage: string) =>
  `Generate a short 3-6 word title for a conversation that begins with: "${firstUserMessage.slice(0, 200)}"\n\nReturn only the title.`;

export const SUMMARY_PROMPT = (messages: string) =>
  `Summarize this conversation in 3-5 bullet points, keeping the most useful details and decisions:\n\n${messages}`;

export const SUB_QUERY_PROMPT = (query: string) =>
  `Generate 3 distinct search sub-queries to research: "${query}"\n\nCover: definition or overview, practical use cases, and current developments. Return only a JSON array of strings.`;

export const SEARCH_RESULT_PROMPT = (subQuery: string) =>
  `Simulate 2 search results for: "${subQuery}". Return only JSON with title, url, and snippet fields.`;

export const ANGLE_SUMMARY_PROMPT = (angle: string, context: string) =>
  `Summarize these search results about "${angle}" in 2-3 concise sentences:\n\n${context}`;

export const SYNTHESIS_PROMPT = (query: string, combined: string) =>
  `Write a cohesive research brief about "${query}" using the angles below. Start with a short executive summary, then 3-4 paragraphs of synthesis.\n\n${combined}`;
