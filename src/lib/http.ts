export function corsHeaders(origin = "*"): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    "Access-Control-Max-Age": "86400",
  };
}

export function addCors(response: Response, origin: string): Response {
  const wrapped = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    wrapped.headers.set(key, value);
  }
  return wrapped;
}

export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, init);
}

export function badRequest(message: string): Response {
  return new Response(message, { status: 400 });
}

export function notFound(message = "Not found"): Response {
  return new Response(message, { status: 404 });
}
