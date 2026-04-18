import { NextResponse } from "next/server";

import { buildOfflineReply } from "@/lib/copilot/offline-reply";
import { completeOpenAIChat } from "@/lib/copilot/openai";

export const runtime = "nodejs";

/**
 * Copilot chat: prefers OpenAI when OPENAI_API_KEY is set; otherwise returns offline guidance.
 * No Supabase required. Same JSON shape as many proxies: `{ message: string }`.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as {
    messages?: { role?: string; content?: string }[];
    message?: string;
  };

  const messages = Array.isArray(b.messages) ? b.messages : [];
  const lastFromArray = [...messages].reverse().find((m) => m.role === "user" && m.content);
  const lastUser =
    (typeof b.message === "string" && b.message.trim()) ||
    (typeof lastFromArray?.content === "string" ? lastFromArray.content.trim() : "");

  if (!lastUser) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }

  const thread =
    messages.length > 0
      ? messages
          .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content),
          }))
      : [{ role: "user" as const, content: lastUser }];

  const key = process.env.OPENAI_API_KEY?.trim();
  if (key) {
    try {
      const text = await completeOpenAIChat(key, thread);
      return NextResponse.json({ message: text, source: "openai" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "openai_error";
      return NextResponse.json(
        { error: "openai_failed", message: msg },
        { status: 502 },
      );
    }
  }

  const offline = buildOfflineReply(lastUser, thread);
  return NextResponse.json({ message: offline, source: "offline" });
}
