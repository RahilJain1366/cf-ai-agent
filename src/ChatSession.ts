import { DurableObject, DurableObjectState } from "cloudflare:workers";
import { AI_MODEL, SUMMARY_PROMPT, SYSTEM_PROMPT, TITLE_PROMPT } from "./lib/prompts";
import { Env } from "./types";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface SessionState {
  messages: Message[];
  summary: string;
  title: string;
  createdAt: number;
  lastActiveAt: number;
}

const SESSION_STORAGE_KEY = "session";
const MAX_CONTEXT_MESSAGES = 20;
const COMPRESSION_THRESHOLD = 30;

function createSessionState(): SessionState {
  const now = Date.now();
  return {
    messages: [],
    summary: "",
    title: "",
    createdAt: now,
    lastActiveAt: now,
  };
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/^['"]|['"]$/g, "");
}

function parseWorkerStreamChunk(chunk: string): string {
  let text = "";

  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ") || line === "data: [DONE]") {
      continue;
    }

    try {
      const data = JSON.parse(line.slice(6)) as { response?: string };
      if (data.response) {
        text += data.response;
      }
    } catch {
      continue;
    }
  }

  return text;
}

export class ChatSession extends DurableObject<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  private async loadSession(): Promise<SessionState> {
    const stored = await this.ctx.storage.get<SessionState>(SESSION_STORAGE_KEY);
    if (stored) {
      return stored;
    }

    const fresh = createSessionState();
    await this.ctx.storage.put(SESSION_STORAGE_KEY, fresh);
    return fresh;
  }

  private async saveSession(session: SessionState): Promise<void> {
    await this.ctx.storage.put(SESSION_STORAGE_KEY, session);
  }

  private async summarizeIfNeeded(session: SessionState): Promise<void> {
    if (session.messages.length <= COMPRESSION_THRESHOLD) {
      return;
    }

    const preserved = session.messages.slice(0, 20);
    const transcript = preserved.map((message) => `${message.role}: ${message.content}`).join("\n");

    try {
      const result = (await this.env.AI.run(AI_MODEL, {
        messages: [{ role: "user", content: SUMMARY_PROMPT(transcript) }],
        max_tokens: 300,
      })) as { response: string };

      session.summary = session.summary
        ? `${session.summary}\n\nEarlier:\n${result.response}`
        : `Earlier:\n${result.response}`;
      session.messages = session.messages.slice(20);
    } catch {
      session.messages = session.messages.slice(10);
    }
  }

  private async generateTitle(session: SessionState): Promise<void> {
    const firstUserMessage = session.messages.find((message) => message.role === "user");
    if (!firstUserMessage) {
      return;
    }

    try {
      const result = (await this.env.AI.run(AI_MODEL, {
        messages: [{ role: "user", content: TITLE_PROMPT(firstUserMessage.content) }],
        max_tokens: 30,
      })) as { response: string };

      const fresh = await this.loadSession();
      fresh.title = normalizeTitle(result.response);
      await this.saveSession(fresh);
    } catch {
      return;
    }
  }

  private async appendMessage(role: "user" | "assistant", content: string): Promise<void> {
    const session = await this.loadSession();
    session.messages.push({ role, content, timestamp: Date.now() });
    session.lastActiveAt = Date.now();

    if (!session.title && role === "assistant" && session.messages.length >= 2) {
      this.ctx.waitUntil(this.generateTitle(session));
    }

    await this.summarizeIfNeeded(session);
    await this.saveSession(session);
  }

  private async createStream(userMessage: string): Promise<ReadableStream> {
    await this.appendMessage("user", userMessage);
    const session = await this.loadSession();

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (session.summary) {
      messages.push({
        role: "system",
        content: `Context from earlier in this conversation:\n${session.summary}`,
      });
    }

    messages.push(
      ...session.messages.slice(-MAX_CONTEXT_MESSAGES).map(({ role, content }) => ({
        role,
        content,
      }))
    );

    const stream = (await this.env.AI.run(AI_MODEL, {
      messages,
      stream: true,
      max_tokens: 1024,
    })) as ReadableStream;

    const [clientStream, storageStream] = stream.tee();
    this.ctx.waitUntil(this.collectAndPersist(storageStream));
    return clientStream;
  }

  private async collectAndPersist(stream: ReadableStream): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        fullResponse += parseWorkerStreamChunk(decoder.decode(value, { stream: true }));
      }
    } finally {
      reader.releaseLock();
    }

    if (fullResponse) {
      await this.appendMessage("assistant", fullResponse);
    }
  }

  private async clearSession(): Promise<void> {
    await this.saveSession(createSessionState());
  }

  private async exportMarkdown(): Promise<string> {
    const session = await this.loadSession();
    const title = session.title || "Aria Conversation";
    const date = new Date(session.createdAt).toISOString().split("T")[0];

    const sections: string[] = [`# ${title}`, "", `_Exported from Aria on ${date}_`, ""];

    if (session.summary) {
      sections.push("---", "", "**Earlier context:**", session.summary, "", "---", "");
    }

    for (const message of session.messages) {
      const time = new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const speaker = message.role === "user" ? "**You**" : "**Aria**";
      sections.push(`${speaker} _(${time})_`, "", message.content, "", "---", "");
    }

    return sections.join("\n");
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/chat" && request.method === "POST") {
      const payload = (await request.json()) as { message?: string } | null;
      const message = payload?.message;
      if (!message?.trim()) {
        return new Response("Message required", { status: 400 });
      }

      const stream = await this.createStream(message);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname === "/history" && request.method === "GET") {
      return Response.json(await this.loadSession());
    }

    if (url.pathname === "/clear" && request.method === "POST") {
      await this.clearSession();
      return Response.json({ success: true });
    }

    if (url.pathname === "/export" && request.method === "GET") {
      const md = await this.exportMarkdown();
      const session = await this.loadSession();
      const filename = (session.title || "aria-conversation")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      return new Response(md, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${filename}.md"`,
        },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
