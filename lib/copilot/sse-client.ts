/**
 * Parse Zentro copilot SSE (`data: {json}\\n\\n`) from a fetch body.
 * Events: `{ type: "delta", text }`, `{ type: "done", source? }`, `{ type: "error", message }`.
 */
export async function consumeCopilotSse(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<{ ok: true; source?: string } | { ok: false; message: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let carry = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      carry += decoder.decode(value, { stream: true });
      const blocks = carry.split(/\r?\n\r?\n/);
      carry = blocks.pop() ?? "";

      for (const block of blocks) {
        for (const line of block.split(/\r?\n/)) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const json = t.slice(5).trim();
          if (!json || json === "[DONE]") continue;
          let ev: { type?: string; text?: string; message?: string; source?: string };
          try {
            ev = JSON.parse(json) as typeof ev;
          } catch {
            continue;
          }
          if (ev.type === "delta" && typeof ev.text === "string") {
            onDelta(ev.text);
          }
          if (ev.type === "error") {
            return { ok: false, message: ev.message ?? "stream_error" };
          }
          if (ev.type === "done") {
            return { ok: true, source: typeof ev.source === "string" ? ev.source : undefined };
          }
        }
      }
    }

    if (carry.trim()) {
      for (const line of carry.split(/\r?\n/)) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const json = t.slice(5).trim();
        if (!json) continue;
        try {
          const ev = JSON.parse(json) as {
            type?: string;
            text?: string;
            message?: string;
            source?: string;
          };
          if (ev.type === "delta" && typeof ev.text === "string") onDelta(ev.text);
          if (ev.type === "error") {
            return { ok: false, message: ev.message ?? "stream_error" };
          }
          if (ev.type === "done") {
            return { ok: true, source: typeof ev.source === "string" ? ev.source : undefined };
          }
        } catch {
          /* ignore trailing garbage */
        }
      }
    }

    return { ok: true };
  } finally {
    reader.releaseLock();
  }
}
