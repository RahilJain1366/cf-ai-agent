export function getSessionId(request: Request): string {
  const headerSessionId = request.headers.get("X-Session-Id");
  if (headerSessionId) {
    return headerSessionId;
  }

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/session_id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : crypto.randomUUID();
}

export function sessionCookie(sessionId: string): string {
  return `session_id=${sessionId}; Path=/; SameSite=Lax; Max-Age=604800`;
}
