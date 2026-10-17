import type { ProductStatusResult } from "./types";



/** Stream only the existing public projection, never health response diagnostics. */
export function publicStatusSnapshot(products: ProductStatusResult[]) {
  return { products: products.map(({ productId, label, status, detail, lastChecked, href }) =>
    ({ productId, label, status, detail, lastChecked, href })) };
}

export function createPublicStatusStream(
  signal: AbortSignal,
  readSnapshot: () => Promise<ProductStatusResult[]>,
  options: { lifetimeMs?: number; tickMs?: number; onClose?: () => void } = {},
): ReadableStream<Uint8Array> {
  let dispose = () => {};
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let busy = false;
      let previous = "";
      const timers: { tick?: ReturnType<typeof setInterval>; deadline?: ReturnType<typeof setTimeout> } = {};
      const write = (value: string) => { if (!closed) controller.enqueue(encoder.encode(value)); };
      const cleanup = (close: boolean) => {
        if (closed) return;
        closed = true;
        clearInterval(timers.tick);
        clearTimeout(timers.deadline);
        signal.removeEventListener("abort", onAbort);
        options.onClose?.();
        if (close) controller.close();
      };
      const onAbort = () => cleanup(true);
      dispose = () => cleanup(false);
      if (signal.aborted) { cleanup(true); return; }
      signal.addEventListener("abort", onAbort, { once: true });
      const publish = async () => {
        if (closed || busy) return;
        busy = true;
        try {
          const payload = JSON.stringify(publicStatusSnapshot(await readSnapshot()));
          if (payload !== previous) {
            write(`event: snapshot\ndata: ${payload}\n\n`);
            previous = payload;
          }
        } catch {
          write('event: unavailable\ndata: {"message":"Service checks are temporarily unavailable."}\n\n');
        } finally { busy = false; }
      };
      write("retry: 5000\n: connected\n\n");
      void publish();
      timers.tick = setInterval(() => { write(": heartbeat\n\n"); void publish(); }, options.tickMs ?? 15_000);
      timers.deadline = setTimeout(() => {
        write("event: reconnect\ndata: {}\n\n");
        cleanup(true);
      }, options.lifetimeMs ?? 55_000);
    },
    cancel() { dispose(); },
  });
}

const connections = new Map<string, number>();
let active = 0;
/** Process-local capacity guard; rate limiting remains shared when Redis is configured. */
export function acquireStatusConnection(key: string): (() => void) | null {
  if (active >= 128 || (connections.get(key) ?? 0) >= 4) return null;
  active++;
  connections.set(key, (connections.get(key) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    active--;
    const remaining = (connections.get(key) ?? 1) - 1;
    if (remaining <= 0) connections.delete(key);
    else connections.set(key, remaining);
  };
}
