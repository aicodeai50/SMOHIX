type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function completeOpenAIChat(
  apiKey: string,
  messages: { role: string; content: string }[],
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

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(raw.slice(0, 400) || `openai_http_${res.status}`);
  }

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
    const raw = await res.text();
    throw new Error(raw.slice(0, 400) || `openai_http_${res.status}`);
  }

  const body = res.body;
  if (!body) {
    throw new Error("openai_no_body");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          /* ignore malformed chunk */
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data:")) {
        const data = trimmed.slice(5).trim();
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            /* ignore */
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
