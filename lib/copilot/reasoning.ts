import { getShBackendApiUrl } from "@/lib/backend-urls";

const TIMEOUT_MS = 60_000;

export type ReasoningChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function extractReasoningText(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  if (typeof record.reply === "string" && record.reply.trim()) {
    return record.reply;
  }
  if (typeof record.content === "string" && record.content.trim()) {
    return record.content;
  }
  if (Array.isArray(record.choices)) {
    const choice = (record.choices as { message?: { content?: string } }[])[0]?.message
      ?.content;
    if (typeof choice === "string" && choice.trim()) {
      return choice;
    }
  }
  return null;
}

/** Server-side call to SH backend /v1/chat (no browser CORS). */
export async function completeReasoningChat(
  messages: ReasoningChatMessage[],
): Promise<{ text: string } | null> {
  const base = getShBackendApiUrl();
  if (!base) {
    return null;
  }

  try {
    const res = await fetch(`${base}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json: unknown = await res.json();
      const text = extractReasoningText(json);
      return text ? { text } : null;
    }

    const text = (await res.text()).trim();
    return text ? { text } : null;
  } catch {
    return null;
  }
}
