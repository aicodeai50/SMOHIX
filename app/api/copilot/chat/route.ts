import { NextResponse } from "next/server";

import { enforceCopilotChatAccess } from "@/lib/copilot/chat-guard";
import { buildIncidentCopilotContext } from "@/lib/copilot/incident-context";
import { buildOfflineReply } from "@/lib/copilot/offline-reply";
import { completeOpenAIChat, streamOpenAIChatDeltas } from "@/lib/copilot/openai";
import { completeReasoningChat } from "@/lib/copilot/reasoning";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function sseLine(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Copilot chat: OpenAI when OPENAI_API_KEY is set; else reasoning service when
 * REACT_APP_SH_BACKEND_API is set; else offline guided replies.
 * JSON: `{ message: string }`. With `{ stream: true }`, responds with `text/event-stream`
 * (`delta` / `done` / `error` events).
 */
export async function POST(req: Request) {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const guard = await enforceCopilotChatAccess(req, {
    cloudModelEnabled: Boolean(openaiKey),
  });
  if (guard) {
    return guard;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as {
    messages?: { role?: string; content?: string }[];
    message?: string;
    stream?: boolean;
    incidentId?: string;
  };

  const messages = Array.isArray(b.messages) ? b.messages : [];
  const lastFromArray = [...messages].reverse().find((m) => m.role === "user" && m.content);
  const lastUser =
    (typeof b.message === "string" && b.message.trim()) ||
    (typeof lastFromArray?.content === "string" ? lastFromArray.content.trim() : "");

  if (!lastUser) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }

  const thread: ChatTurn[] =
    messages.length > 0
      ? messages
          .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content),
          }))
      : [{ role: "user", content: lastUser }];

  const incidentId = typeof b.incidentId === "string" ? b.incidentId.trim() : "";
  if (incidentId && hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const context = await buildIncidentCopilotContext({ incidentId, userId: user.id });
    if (context) {
      thread.unshift({
        role: "user",
        content: `Incident context for this chat:\n\n${context}`,
      });
    }
  }

  const wantStream = b.stream === true;

  if (wantStream) {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (openaiKey) {
            for await (const delta of streamOpenAIChatDeltas(openaiKey, thread)) {
              controller.enqueue(sseLine({ type: "delta", text: delta }));
            }
            controller.enqueue(sseLine({ type: "done", source: "openai" }));
            return;
          }

          const reasoning = await completeReasoningChat(thread);
          if (reasoning) {
            controller.enqueue(sseLine({ type: "delta", text: reasoning.text }));
            controller.enqueue(sseLine({ type: "done", source: "reasoning" }));
            return;
          }

          const offline = buildOfflineReply(lastUser, thread);
          controller.enqueue(sseLine({ type: "delta", text: offline }));
          controller.enqueue(sseLine({ type: "done", source: "offline" }));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "copilot_stream_failed";
          controller.enqueue(sseLine({ type: "error", message: msg }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  if (openaiKey) {
    try {
      const text = await completeOpenAIChat(openaiKey, thread);
      return NextResponse.json({ message: text, source: "openai" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "openai_error";
      return NextResponse.json(
        { error: "openai_failed", message: msg },
        { status: 502 },
      );
    }
  }

  const reasoning = await completeReasoningChat(thread);
  if (reasoning) {
    return NextResponse.json({ message: reasoning.text, source: "reasoning" });
  }

  const offline = buildOfflineReply(lastUser, thread);
  return NextResponse.json({ message: offline, source: "offline" });
}
