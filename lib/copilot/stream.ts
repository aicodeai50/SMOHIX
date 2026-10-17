export const COPILOT_UNAVAILABLE_MESSAGE = "Copilot could not complete this response. Please try again.";

type CopilotEvent = { type: "delta"; text: string } | { type: "done"; source: string };

/** Disconnecting a browser aborts the provider request; errors stay server-private. */
export function createCopilotStream(signal: AbortSignal, generate: (signal: AbortSignal) => AsyncGenerator<CopilotEvent>) {
  const upstream = new AbortController();
  let dispose = () => upstream.abort();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const timers: { heartbeat?: ReturnType<typeof setInterval> } = {};
      const encoder = new TextEncoder();
      const finish = (close: boolean) => {
        if (closed) return;
        closed = true;
        clearInterval(timers.heartbeat);
        signal.removeEventListener("abort", onAbort);
        upstream.abort();
        if (close) controller.close();
      };
      const onAbort = () => finish(true);
      dispose = () => finish(false);
      if (signal.aborted) { finish(true); return; }
      signal.addEventListener("abort", onAbort, { once: true });
      timers.heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15_000);
      void (async () => {
        try {
          for await (const event of generate(upstream.signal)) {
            if (closed) break;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        } catch {
          if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: COPILOT_UNAVAILABLE_MESSAGE })}\n\n`));
        } finally { finish(true); }
      })();
    },
    cancel() { dispose(); },
  });
}
