"use client";

import { useEffect, useRef, useState } from "react";

/** Default: built-in route (OpenAI if OPENAI_API_KEY, else offline brain). Override to hit /api/reasoning/... */
const proxyPath =
  process.env.NEXT_PUBLIC_COPILOT_PROXY_PATH?.trim() || "/api/copilot/chat";

type Msg = { role: "user" | "assistant"; content: string };

function extractAssistantText(text: string, status: number): string {
  if (!status.toString().startsWith("2")) {
    try {
      const j = JSON.parse(text) as { message?: string; error?: string };
      return j.message ?? j.error ?? (text || `HTTP ${status}`);
    } catch {
      return text || `HTTP ${status}`;
    }
  }
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    if (Array.isArray(j.choices)) {
      const c = (j.choices as { message?: { content?: string } }[])[0]?.message?.content;
      if (c && typeof c === "string") return c;
    }
    if (typeof j.message === "string") return j.message;
    if (typeof j.reply === "string") return j.reply;
    if (typeof j.content === "string") return j.content;
    return text.slice(0, 8000);
  } catch {
    return text.slice(0, 8000) || "(empty body)";
  }
}

export function CopilotChat() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, pending]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setErr(null);
    setPending(true);
    const thread = [...msgs, { role: "user" as const, content: text }];
    setMsgs(thread);
    setInput("");

    try {
      const payload = {
        messages: thread.map((m) => ({ role: m.role, content: m.content })),
        message: text,
      };
      const r = await fetch(proxyPath, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify(payload),
      });
      const raw = await r.text();
      const assistant = extractAssistantText(raw, r.status);
      setMsgs((m) => [...m, { role: "assistant", content: assistant }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {err ? (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200/90" role="alert">
          {err}
        </p>
      ) : null}
      <div className="max-h-[26rem] space-y-3 overflow-y-auto rounded-lg border border-border bg-background/40 p-4 font-mono text-sm">
        {msgs.length === 0 ? (
          <p className="text-muted">
            Ask about an incident or change window. This chat posts to{" "}
            <code className="text-accent">{proxyPath}</code>. With no{" "}
            <code className="text-accent">OPENAI_API_KEY</code>, a built-in offline copilot answers;
            add the key for GPT. Use <code className="text-accent">NEXT_PUBLIC_COPILOT_PROXY_PATH</code>{" "}
            to point at <code className="text-accent">/api/reasoning/v1/chat</code> instead.
          </p>
        ) : (
          msgs.map((m, i) => (
            <p key={`${i}-${m.role}`} className="whitespace-pre-wrap break-words">
              <span className={m.role === "user" ? "text-accent" : "text-muted"}>
                {m.role === "user" ? "You" : "Copilot"}:
              </span>{" "}
              <span className={m.role === "user" ? "text-foreground/90" : "text-muted"}>
                {m.content}
              </span>
            </p>
          ))
        )}
        {pending ? (
          <p className="animate-pulse text-xs text-muted">Thinking…</p>
        ) : null}
        <div ref={bottom} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask about an incident, service, or change window…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
        />
        <button
          type="button"
          disabled={pending || !input.trim()}
          onClick={() => void send()}
          className="rounded-lg bg-accent px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
