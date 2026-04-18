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
