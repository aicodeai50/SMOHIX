import { readCopilotBody } from "@/lib/copilot/body";
import { COPILOT_UNAVAILABLE_MESSAGE, createCopilotStream } from "@/lib/copilot/stream";
import { NextResponse } from "next/server";

import { enforceCopilotChatAccess } from "@/lib/copilot/chat-guard";
import { parseCopilotInput } from "@/lib/copilot/chat-input";
import { buildIncidentCopilotContext } from "@/lib/copilot/incident-context";
import { buildOfflineReply } from "@/lib/copilot/offline-reply";
import { completeOpenAIChat, streamOpenAIChatDeltas } from "@/lib/copilot/openai";
import { completeReasoningChat } from "@/lib/copilot/reasoning";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
    body = await readCopilotBody(req);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "body_too_large";
    return NextResponse.json({ error: tooLarge ? "conversation_too_large" : "invalid_json" }, { status: tooLarge ? 413 : 400 });
  }

  const input = parseCopilotInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: input.status });
  const { thread, lastUser, incidentId } = input;
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

  const wantStream = input.stream;

  if (wantStream) {
    const stream = createCopilotStream(req.signal, async function* (signal) {
      if (openaiKey) {
        for await (const delta of streamOpenAIChatDeltas(openaiKey, thread, signal)) {
          yield { type: "delta", text: delta };
        }
        yield { type: "done", source: "openai" };
        return;
      }
      const reasoning = await completeReasoningChat(thread, signal);
      if (signal.aborted) return;
      if (reasoning) {
        yield { type: "delta", text: reasoning.text };
        yield { type: "done", source: "reasoning" };
        return;
      }
      yield { type: "delta", text: buildOfflineReply(lastUser, thread) };
      yield { type: "done", source: "offline" };
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  if (openaiKey) {
    try {
      const text = await completeOpenAIChat(openaiKey, thread, req.signal);
      return NextResponse.json({ message: text, source: "openai" });
    } catch {
      return NextResponse.json(
        { error: "model_unavailable", message: COPILOT_UNAVAILABLE_MESSAGE },
        { status: 502 },
      );
    }
  }

  const reasoning = await completeReasoningChat(thread, req.signal);
  if (reasoning) {
    return NextResponse.json({ message: reasoning.text, source: "reasoning" });
  }

  const offline = buildOfflineReply(lastUser, thread);
  return NextResponse.json({ message: offline, source: "offline" });
}
