type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function completeOpenAIChat(
  apiKey: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): Promise<string> {
  const model =
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";

  const normalized: ChatMessage[] = messages
    .filter((m) => m.content && (m.role === "user" || m.role === "assistant"))
    .slice(-24)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).slice(0, 12_000),
    }));

  if (!normalized.length) {
    throw new Error("no_messages");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.any([AbortSignal.timeout(60_000), ...(signal ? [signal] : [])]),
    redirect: "error",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: normalized,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    await res.body?.cancel();
    throw new Error("model_unavailable");
  }
  const raw = await res.text();

  let parsed: { choices?: { message?: { content?: string } }[] };
  try {
    parsed = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
  } catch {
    throw new Error("openai_invalid_json");
  }

  const text = parsed.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("openai_empty_completion");
  }
  return text;
}

/** Yields text deltas from OpenAI chat completions (`stream: true`). */
export async function* streamOpenAIChatDeltas(
  apiKey: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, undefined> {
  const model =
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";

  const normalized = messages
    .filter((m) => m.content && (m.role === "user" || m.role === "assistant"))
    .slice(-24)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).slice(0, 12_000),
    }));

  if (!normalized.length) {
    throw new Error("no_messages");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.any([AbortSignal.timeout(60_000), ...(signal ? [signal] : [])]),
    redirect: "error",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: normalized,
      max_tokens: 1200,
      stream: true,
    }),
  });

  if (!res.ok) {
    await res.body?.cancel();
    throw new Error("model_unavailable");
  }

  const body = res.body;
  if (!body) {
    throw new Error("openai_no_body");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;
  let sawText = false;
  const consume = (line: string): { done?: boolean; text?: string } => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return {};
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") {
      if (!sawText) throw new Error("model_empty_completion");
      return { done: true };
    }
    let parsed: { error?: unknown; choices?: { delta?: { content?: string; refusal?: string }; finish_reason?: string | null }[] };
    try { parsed = JSON.parse(data); } catch { throw new Error("model_invalid_stream"); }
    if (parsed.error) throw new Error("model_unavailable");
    if (parsed.choices?.some(choice => choice.finish_reason)) finished = true;
    const text = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.delta?.refusal;
    if (typeof text === "string" && text) { sawText = true; return { text }; }
    return {};
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 128_000) throw new Error("model_invalid_stream");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const event = consume(line);
        if (event.done) return;
        if (event.text) yield event.text;
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) {
      const event = consume(buffer);
      if (event.done) return;
      if (event.text) yield event.text;
    }
    if (!finished || !sawText) throw new Error("model_stream_interrupted");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
