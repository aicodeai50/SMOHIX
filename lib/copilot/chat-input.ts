export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Validate untrusted JSON before using it as a conversation or incident lookup. */
export function parseCopilotInput(body: unknown):
  | { ok: true; thread: ChatTurn[]; lastUser: string; incidentId: string; stream: boolean }
  | { ok: false; error: string; status: number } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_body", status: 400 };
  }
  const b = body as Record<string, unknown>;
  if ((b.messages !== undefined && !Array.isArray(b.messages)) ||
      (b.message !== undefined && typeof b.message !== "string") ||
      (b.incidentId !== undefined && typeof b.incidentId !== "string")) {
    return { ok: false, error: "invalid_body", status: 400 };
  }
  const messages = (b.messages ?? []) as unknown[];
  const thread: ChatTurn[] = [];
  for (const entry of messages) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "invalid_messages", status: 400 };
    const m = entry as Record<string, unknown>;
    if ((m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return { ok: false, error: "invalid_messages", status: 400 };
    }
    if (m.content.trim()) thread.push({ role: m.role, content: m.content });
  }
  const lastUser = (typeof b.message === "string" && b.message.trim()) ||
    [...thread].reverse().find(m => m.role === "user")?.content.trim() || "";
  if (!lastUser) return { ok: false, error: "message_required", status: 400 };
  if (typeof b.message === "string" && b.message.trim() &&
      (thread.at(-1)?.role !== "user" || thread.at(-1)?.content.trim() !== lastUser)) {
    thread.push({ role: "user", content: lastUser });
  }
  if (thread.length > 100 || thread.some(m => m.content.length > 16_000) ||
      thread.reduce((total, m) => total + m.content.length, 0) > 128_000) {
    return { ok: false, error: "conversation_too_large", status: 413 };
  }
  const incidentId = typeof b.incidentId === "string" ? b.incidentId.trim() : "";
  if (incidentId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incidentId)) {
    return { ok: false, error: "invalid_incident_id", status: 400 };
  }
  return { ok: true, thread, lastUser, incidentId, stream: b.stream === true };
}
