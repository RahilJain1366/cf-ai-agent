import { ChatSession } from "./ChatSession";
import { ResearchWorkflow } from "./ResearchWorkflow";
import { htmlPage } from "./ui";
import { Env } from "./types";
import { addCors, badRequest, corsHeaders, jsonResponse, notFound } from "./lib/http";
import { getSessionId, sessionCookie } from "./lib/session";

export { ChatSession, ResearchWorkflow };

async function handleResearchStart(request: Request, env: Env, origin: string): Promise<Response> {
  const payload = (await request.json()) as { query?: string; sessionId?: string } | null;
  const query = payload?.query;
  const bodySessionId = payload?.sessionId;

  if (!query?.trim()) {
    return addCors(badRequest("Query required"), origin);
  }

  const sessionId = bodySessionId || request.headers.get("X-Session-Id") || getSessionId(request);
  const instance = await env.RESEARCH_WORKFLOW.create({ params: { query, sessionId } });

  return addCors(jsonResponse({ instanceId: instance.id, status: "running" }), origin);
}

async function handleResearchStatus(pathname: string, env: Env, origin: string): Promise<Response> {
  const instanceId = pathname.split("/api/research/")[1];

  try {
    const instance = await env.RESEARCH_WORKFLOW.get(instanceId);
    return addCors(jsonResponse(await instance.status()), origin);
  } catch {
    return addCors(notFound("Instance not found"), origin);
  }
}

async function proxyToDurableObject(request: Request, env: Env, pathname: string, origin: string): Promise<Response> {
  const sessionId = request.headers.get("X-Session-Id") || getSessionId(request);
  const doId = env.CHAT_SESSION.idFromName(sessionId);
  const stub = env.CHAT_SESSION.get(doId);

  const proxiedUrl = new URL(request.url);
  proxiedUrl.pathname = pathname.replace("/api", "");

  const doRequest = new Request(proxiedUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  return addCors(await stub.fetch(doRequest), origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const sessionId = getSessionId(request);
      return new Response(htmlPage, {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Set-Cookie": sessionCookie(sessionId),
          ...corsHeaders(origin),
        },
      });
    }

    if (url.pathname === "/api/research" && request.method === "POST") {
      return handleResearchStart(request, env, origin);
    }

    if (url.pathname.startsWith("/api/research/") && request.method === "GET") {
      return handleResearchStatus(url.pathname, env, origin);
    }

    if (url.pathname.startsWith("/api/")) {
      return proxyToDurableObject(request, env, url.pathname, origin);
    }

    return notFound();
  },
};
