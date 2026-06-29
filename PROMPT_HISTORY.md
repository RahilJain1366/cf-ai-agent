# Aria — Cloudflare AI Agent Build Log

_Prompt history for optional assignment submission_

---

## Prompt 1

**User:** Optional Assignment: Please share GitHub repo URL for the project here. We plan to fast track candidates who complete an assignment to build a type of AI-powered application on Cloudflare. An AI-powered application should include the following components:

- LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
- Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
- User input via chat or voice (recommend using Pages or Realtime)
- Memory or state

Find additional documentation here: https://developers.cloudflare.com/agents/

Note: AI-assisted coding is encouraged, but you have to submit prompt history.

**Assistant:** Built a complete AI-powered Cloudflare application — **Aria**, an AI research assistant — with all 4 required components:

| Component | Cloudflare Primitive |
|---|---|
| LLM | Workers AI (Llama 3.3 70B) |
| Coordination | Worker (Router) |
| UI / User Input | Worker (inline HTML streaming chat) |
| Memory / State | Durable Objects + SQLite |

**Files created:**
- `wrangler.toml` — bindings for AI, Durable Object, Workflow
- `src/index.ts` — Worker entry point and router
- `src/ChatSession.ts` — Durable Object with persistent message history and context compression
- `src/ui.ts` — full chat UI as a TypeScript string
- `README.md` — architecture docs and prompt history

---

## Prompt 2

**User:** Continue building

**Assistant:** Added three major features:

1. **`ResearchWorkflow.ts`** — Cloudflare Workflow with 4 durable steps:
   - Step 1: Generate sub-queries from the topic
   - Step 2: Fan-out to fetch search results in parallel
   - Step 3: Summarize each angle independently
   - Step 4: Synthesize a final research brief

2. **Upgraded `ChatSession.ts`**:
   - Auto-generates conversation title via LLM after first exchange
   - New `/export` endpoint — returns full conversation as downloadable `.md`
   - Uses `ctx.storage` / `ctx.waitUntil` (correct Durable Object pattern)

3. **Upgraded UI**:
   - Chat / ⚗ Deep Research mode tabs
   - Research card with live 4-step progress indicator
   - Polls `/api/research/:id` until complete, renders synthesized brief with sources
   - Export button, conversation title in header

4. **`src/types.ts`** — shared `Env` interface imported everywhere

**Updated `wrangler.toml`** to add `[[workflows]]` binding for `ResearchWorkflow`.

---

## Prompt 3

**User:** I am able to run it locally but I need to run using the cloudflare workers.dev subdomain. I have never used it, so tell me step by step on how to use it.

**Assistant:** Step-by-step deployment guide:

1. `npx wrangler login` — authenticate with Cloudflare
2. `npx wrangler deploy` — compiles TypeScript, uploads Worker, prints live URL
3. Open `https://cf-ai-agent.<subdomain>.workers.dev`

If subdomain not registered: go to `https://dash.cloudflare.com` → Workers & Pages → pick a subdomain name → save.

---

## Prompt 4

**User:** Running locally, getting error:
```
env.AI  AI  not supported
▲ [WARNING] AI bindings always access remote resources
```

**Assistant:** Fixed `wrangler.toml` — added `remote = true` to the AI binding:

```toml
[ai]
binding = "AI"
remote = true
```

Workers AI has no local emulation — it always runs on Cloudflare's GPU infrastructure. `remote = true` proxies just the AI calls to Cloudflare while keeping everything else local.

---

## Prompt 5

**User:** Getting new error:
```
▲ [WARNING] SQLite in Durable Objects is only supported in local mode.
✘ [ERROR] You need to register a workers.dev subdomain before running the dev command in remote mode.
```

**Assistant:** Two fixes:

1. **Register subdomain** at `https://dash.cloudflare.com/.../workers/onboarding`

2. **Changed `wrangler.toml`** migration from `new_sqlite_classes` to `new_classes`:

```toml
[[migrations]]
tag = "v1"
new_classes = ["ChatSession"]
```

SQLite-backed Durable Objects can't run in remote dev mode — standard `new_classes` works in both local and remote. The `ctx.storage.get/put` API used in `ChatSession.ts` is standard Durable Object KV storage, so no code changes were needed.

---

## Prompt 6

**User:** I am able to run it locally but I need to run using the cloudflare workers.dev subdomain. How do I proceed?

**Assistant:** Confirmed that `npx wrangler dev --remote` is the right approach once logged in. Explained the difference between local dev vs deployed:

| | Local | Deployed |
|---|---|---|
| URL | `localhost:8787` | `cf-ai-agent.yourname.workers.dev` |
| Durable Objects | Local memory (lost on restart) | Persistent in Cloudflare |
| Shareable | No | Yes |

For submission: `npx wrangler deploy` then push to GitHub with the live URL in the README.

---

## Prompt 7

**User:** Deployment is working — https://cf-ai-agent.rahiljain1366.workers.dev/

**Assistant:** Confirmed deployment. Advised testing:
- Chat: send a message, verify streaming
- Research: use ⚗ tab, verify 4-step progress card

For debugging: `npx wrangler tail` streams live logs from the deployed worker.

For GitHub submission:
```bash
git init && git add . && git commit -m "Initial commit: Aria AI assistant on Cloudflare"
gh repo create cf-ai-agent --public --source=. --push
```

---

## Prompt 8

**User:** I am not able to see any response.

**Assistant:** Ran `npx wrangler tail`, found the error:
```
Uncaught SyntaxError: Invalid regular expression: missing
```

**Root cause:** The entire HTML UI was embedded as a TypeScript template literal. Regex patterns like `/\n\n+/g` inside a JS string inside a TS template literal got double-escaped to `\\\\n`, producing invalid regexes in the browser.

**Fix:** Moved HTML to a standalone `public/index.html` file (no escaping layer), updated `src/ui.ts` to import it, added a `[[rules]]` block to `wrangler.toml` to bundle `.html` files as Text modules:

```toml
[[rules]]
type = "Text"
globs = ["**/*.html"]
fallthrough = true
```

```ts
// src/ui.ts
import htmlPage from "../public/index.html";
export { htmlPage };
```

The `formatMessage` function was also rewritten with clean, unescaped regex patterns.

---

## Prompt 9

**User:** Done, working. It was a code change and I itself fixed. Create a md file of the chat.

**Assistant:** Created this file.

---

## Final Architecture

```
Cloudflare Worker (src/index.ts)
├── GET /                    → serves public/index.html
├── POST /api/chat           → ChatSession DO (streaming)
├── GET  /api/history        → ChatSession DO
├── POST /api/clear          → ChatSession DO
├── GET  /api/export         → ChatSession DO (markdown download)
├── POST /api/research       → ResearchWorkflow (start)
└── GET  /api/research/:id   → ResearchWorkflow (poll)

ChatSession (Durable Object)
├── Persistent message history (ctx.storage)
├── Automatic context compression at 30 messages
├── LLM-generated conversation title
└── Markdown export

ResearchWorkflow (Cloudflare Workflow)
├── Step 1: Generate sub-queries
├── Step 2: Fan-out search (parallel)
├── Step 3: Summarize per angle
└── Step 4: Synthesize final brief

Workers AI
└── @cf/meta/llama-3.3-70b-instruct-fp8-fast
```

## Live URL

https://cf-ai-agent.rahiljain1366.workers.dev/