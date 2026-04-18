"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { consumeCopilotSse } from "@/lib/copilot/sse-client";

/** Default assistant route; optional public env override for a custom JSON backend. */
const proxyPath =
  process.env.NEXT_PUBLIC_COPILOT_PROXY_PATH?.trim() || "/api/copilot/chat";

const useBuiltInCopilotRoute = proxyPath === "/api/copilot/chat";

type Msg = { role: "user" | "assistant"; content: string };

type ThreadRow = { id: string; title: string | null; updated_at: string };

function formatThreadDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

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

export function CopilotChat({
  persistSession = false,
}: {
  /** When true and the user is signed in, threads and messages persist for this workspace. */
  persistSession?: boolean;
}) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThreadRef = useRef<string | null>(null);
  const [persistErr, setPersistErr] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeThreadRef.current = activeThreadId;
  }, [activeThreadId]);

  const refreshThreads = useCallback(async () => {
    if (!persistSession) return;
    try {
      const r = await fetch("/api/copilot/threads", { credentials: "include" });
      const j = (await r.json()) as { threads?: ThreadRow[] };
      setThreads(j.threads ?? []);
    } catch {
      /* ignore */
    }
  }, [persistSession]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, pending]);

  useEffect(() => {
    if (!persistSession) return;
    const t = window.setTimeout(() => {
      void refreshThreads();
    }, 0);
    return () => window.clearTimeout(t);
  }, [persistSession, refreshThreads]);

  async function loadThread(id: string) {
    setPersistErr(null);
    try {
      const r = await fetch(`/api/copilot/threads/${id}/messages`, {
        credentials: "include",
      });
      if (!r.ok) {
        setPersistErr("Could not load thread.");
        return;
      }
      const j = (await r.json()) as {
        messages?: { role: string; content: string }[];
      };
      const list = (j.messages ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      setMsgs(list);
      activeThreadRef.current = id;
      setActiveThreadId(id);
    } catch {
      setPersistErr("Could not load thread.");
    }
  }

  function newConversation() {
    setMsgs([]);
    activeThreadRef.current = null;
    setActiveThreadId(null);
    setPersistErr(null);
  }

  async function persistExchange(userText: string, assistantText: string) {
    if (!persistSession) return;
    setPersistErr(null);
    try {
      let tid = activeThreadRef.current;
      if (!tid) {
        const r = await fetch("/api/copilot/threads", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: userText.slice(0, 80) }),
        });
        const j = (await r.json()) as { id?: string; message?: string; error?: string };
        if (!r.ok || !j.id) {
          setPersistErr(j.message ?? j.error ?? "Could not create thread.");
          return;
        }
        tid = j.id;
        activeThreadRef.current = tid;
        setActiveThreadId(tid);
      }

      const r2 = await fetch(`/api/copilot/threads/${tid}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userText, assistant: assistantText }),
      });
      if (!r2.ok) {
        const j2 = (await r2.json()) as { message?: string };
        setPersistErr(j2.message ?? "Could not save messages.");
        return;
      }
      await refreshThreads();
    } catch {
      setPersistErr("Save failed.");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setErr(null);
    setPending(true);
    const thread = [...msgs, { role: "user" as const, content: text }];
    setMsgs(thread);
    setInput("");

    const payload = {
      messages: thread.map((m) => ({ role: m.role, content: m.content })),
      message: text,
    };

    try {
      const r = await fetch(proxyPath, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: useBuiltInCopilotRoute
            ? "text/event-stream, application/json"
            : "application/json, text/plain, */*",
        },
        body: JSON.stringify(
          useBuiltInCopilotRoute ? { ...payload, stream: true } : payload,
        ),
      });

      const ct = r.headers.get("content-type") ?? "";

      if (useBuiltInCopilotRoute && r.ok && ct.includes("text/event-stream") && r.body) {
        let accumulated = "";
        setMsgs((m) => [...m, { role: "assistant", content: "" }]);

        const result = await consumeCopilotSse(r.body, (delta) => {
          accumulated += delta;
          const acc = accumulated;
          setMsgs((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { role: "assistant", content: acc };
            }
            return next;
          });
        });

        if (!result.ok) {
          setErr(result.message);
          setMsgs((m) => {
            const last = m[m.length - 1];
            if (last?.role === "assistant" && !last.content) return m.slice(0, -1);
            return m;
          });
        } else if (persistSession) {
          void persistExchange(text, accumulated);
        }
      } else {
        const raw = await r.text();
        const assistant = extractAssistantText(raw, r.status);
        setMsgs((m) => [...m, { role: "assistant", content: assistant }]);
        if (persistSession && r.ok) {
          void persistExchange(text, assistant);
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
      {persistSession ? (
        <aside className="flex w-full shrink-0 flex-col rounded-xl border border-border bg-surface/70 p-3 shadow-sm lg:w-60">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground/90">Threads</span>
            <button
              type="button"
              onClick={newConversation}
              className="rounded-lg border border-border bg-background/30 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
            >
              New chat
            </button>
          </div>
          <ul className="mt-3 max-h-44 space-y-0.5 overflow-y-auto lg:max-h-[min(24rem,calc(100vh-16rem))]">
            {threads.length === 0 ? (
              <li className="rounded-lg px-2 py-3 text-center text-[11px] leading-relaxed text-muted">
                No saved threads yet. Send a message to start one.
              </li>
            ) : null}
            {threads.map((t) => {
              const sub = formatThreadDate(t.updated_at);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => void loadThread(t.id)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                      activeThreadId === t.id
                        ? "bg-accent-dim/90 text-foreground shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                        : "text-muted hover:bg-surface-elevated/70 hover:text-foreground"
                    }`}
                  >
                    <span className="line-clamp-2 text-xs font-medium leading-snug">
                      {t.title?.trim() || "Untitled conversation"}
                    </span>
                    {sub ? (
                      <span className="mt-0.5 block text-[10px] text-muted opacity-90">
                        {sub}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {persistErr ? (
            <p className="mt-3 rounded-lg border border-warning/25 bg-warning-dim/50 px-2 py-1.5 text-[11px] leading-snug text-warning">
              {persistErr}
            </p>
          ) : (
            <p className="mt-3 text-[10px] leading-relaxed text-muted">
              If history never appears, your workspace may still be finishing data setup — check
              Settings or try again later.
            </p>
          )}
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {err ? (
          <p
            className="rounded-xl border border-danger/25 bg-danger-dim/80 px-3.5 py-2.5 text-sm leading-relaxed text-danger"
            role="alert"
          >
            {err}
          </p>
        ) : null}
        <div
          className="max-h-[min(28rem,70vh)] space-y-4 overflow-y-auto rounded-xl border border-border bg-background/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {msgs.length === 0 ? (
            <div className="space-y-3 text-sm leading-relaxed text-muted">
              <p className="text-foreground/85">
                Describe a symptom, incident, or change. Copilot suggests checks and next steps you
                can accept, edit, or discard.
              </p>
              {persistSession ? (
                <p className="text-xs">
                  Signed in: each conversation can be saved in your thread list when persistence is
                  enabled for this workspace.
                </p>
              ) : null}
            </div>
          ) : (
            msgs.map((m, i) => (
              <div
                key={`${i}-${m.role}-${m.content.slice(0, 12)}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                    m.role === "user"
                      ? "border border-accent/30 bg-accent-dim/85 text-foreground shadow-[0_0_24px_-10px_rgba(94,225,255,0.35)]"
                      : "border border-white/[0.08] bg-white/[0.04] text-foreground/92 backdrop-blur-sm"
                  }`}
                >
                  <span className="sr-only">{m.role === "user" ? "You said: " : "Copilot: "}</span>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {pending ? (
            <div className="flex justify-start" aria-busy="true" aria-label="Copilot is responding">
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                </span>
                <span className="text-xs text-muted">Generating response…</span>
              </div>
            </div>
          ) : null}
          <div ref={bottom} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="sr-only" htmlFor="copilot-input">
            Message
          </label>
          <textarea
            id="copilot-input"
            value={input}
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Describe what you're seeing…"
            className="min-h-[2.75rem] min-w-0 flex-1 resize-y rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 outline-none transition-shadow ring-ring/40 focus:ring-2"
          />
          <button
            type="button"
            disabled={pending || !input.trim()}
            onClick={() => void send()}
            className="h-11 shrink-0 rounded-xl bg-accent px-5 text-sm font-semibold text-background shadow-sm transition-[opacity,box-shadow] hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
