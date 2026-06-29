# Aria — Cloudflare Research Assistant

A Cloudflare Worker that combines streaming chat, conversation history, markdown export, and a background research workflow.

## Live URL

https://cf-ai-agent.rahiljain1366.workers.dev/

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Worker                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Router (src/index.ts)                                      │ │
│  │  GET /          → inline HTML chat UI                       │ │
│  │  POST /api/chat → Durable Object (streaming)               │ │
│  │  GET /api/history, /api/export, POST /api/clear → DO       │ │
│  │  POST /api/research → Workflow (start job)                  │ │
│  │  GET /api/research/:id → Workflow (poll status)             │ │
│  └───────────────────┬────────────────────┬───────────────────┘ │
│                      │                    │                      │
│  ┌───────────────────▼──────┐  ┌──────────▼──────────────────┐ │
│  │  ChatSession             │  │  ResearchWorkflow            │ │
│  │  Durable Object          │  │  Cloudflare Workflow         │ │
│  │  · SQLite message store  │  │  Step 1: sub-query gen       │ │
│  │  · Context compression   │  │  Step 2: fan-out search      │ │
│  │  · Auto title generation │  │  Step 3: angle summaries     │ │
│  │  · Markdown export       │  │  Step 4: final synthesis     │ │
│  └──────────────┬───────────┘  └──────────┬──────────────────┘ │
│                 └──────────────────────────┘                    │
│                              │                                   │
│               ┌──────────────▼──────────────────┐              │
│               │  Workers AI                      │              │
│               │  @cf/meta/llama-3.3-70b-instruct │              │
│               │  · Streaming chat responses      │              │
│               │  · Context summarization         │              │
│               │  · Title generation              │              │
│               │  · Research synthesis            │              │
│               └──────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Cloudflare Primitives Used

| Component | Primitive | Details |
|-----------|-----------|---------|
| **LLM** | Workers AI | Llama 3.3 70B — chat, compression, titles, research |
| **State** | Durable Objects + SQLite | Per-user persistent conversation history |
| **Async jobs** | Workflows | Multi-step research with retry and polling |
| **Coordination** | Worker | Routing, CORS, session management |
| **UI / Input** | Worker (inline HTML) | Streaming chat + research mode frontend |

## Features

### Chat Mode
- Streaming token-by-token responses via `text/event-stream`
- Persistent conversation history that survives page reloads
- Automatic context compression when conversations exceed 30 messages (older messages are summarized and stored separately)
- Auto-generated conversation title after the first exchange
- Markdown rendering: code blocks, lists, headers, blockquotes, bold

### Deep Research Mode
- Triggers a **Cloudflare Workflow** for async research jobs
- 4 orchestrated steps: sub-query generation → fan-out search → per-angle summaries → synthesis
- Real-time progress indicator in the UI; polls `/api/research/:id` for completion
- Returns a structured brief with sources

### Export
- Download the full conversation as a formatted `.md` file
- Includes the auto-generated title, timestamp, and any compressed context summary

## Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account (free tier works)
- Wrangler authenticated with `npx wrangler login`

### Install

```bash
npm install
```

### Authenticate

```bash
npx wrangler login
```

### Run locally

```bash
npm run dev
# Open http://localhost:8787
```

Local mode is the default dev command. It runs the Worker and Durable Object locally, but Workers AI is not available in local mode.

### Run remote dev

```bash
npm run dev-remote
```

Remote dev requires a registered `workers.dev` subdomain in your Cloudflare account.

### Deploy

```bash
npm run deploy
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Worker locally |
| `npm run dev-local` | Alias for local dev |
| `npm run dev-remote` | Start remote Wrangler dev |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run typecheck` | Type-check the TypeScript sources |

## File Structure

```
cf-ai-agent/
├── src/
│   ├── index.ts             # Worker entry point + router
│   ├── types.ts             # Shared Env interface
│   ├── ui.ts                # Chat UI shell
│   ├── ChatSession.ts       # Durable Object: memory, chat, export
│   ├── ResearchWorkflow.ts  # Workflow: 4-step research pipeline
│   └── lib/
│       ├── http.ts          # CORS + response helpers
│       ├── prompts.ts       # Shared prompt text and model ID
│       └── session.ts       # Session ID + cookie helpers
├── wrangler.toml            # Bindings: AI, DO, Workflow
├── package.json             # Scripts for local/remote dev, deploy, typecheck
├── tsconfig.json            # TypeScript compiler options
└── README.md
```

## Key Design Decisions

**Why Durable Objects instead of KV/D1 for session state?**
Each chat session gets its own DO instance co-located with the user's nearest Cloudflare PoP. Writes are strongly consistent within the instance, and the SQLite storage is transactional — no race conditions when the streaming response is saved concurrently via `waitUntil`.

**Why a Workflow for research vs. just a DO or Worker?**
The multi-step research task can take 20-60 seconds and involves 8+ LLM calls. Workflows provide durable execution with built-in retries on each step — if the Llama call for "fetch sources" fails transiently, only that step reruns. Workers have a 30s CPU limit and no step-level durability.

**Context compression strategy**
When a session hits 30 messages, the oldest 20 are summarized into bullet points by the LLM and stored as a `summary` string. The active context window always sees: system prompt + summary (if any) + last 20 messages. This keeps prompt size predictable while preserving important information.

## License

MIT
