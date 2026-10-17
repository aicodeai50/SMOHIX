import assert from "node:assert/strict";
import { acquireStatusConnection, createPublicStatusStream, publicStatusSnapshot } from "../lib/status/stream";
import type { ProductStatusResult } from "../lib/status/types";

const snapshot: ProductStatusResult[] = [{ productId: "smohix-platform", label: "Smohix", status: "operational", detail: "Service availability checked.", href: "/platform", lastChecked: new Date().toISOString() }];

async function main() {
  const held = Array.from({ length: 4 }, () => acquireStatusConnection("same-client"));
  assert.ok(held.every(Boolean));
  assert.equal(acquireStatusConnection("same-client"), null, "per-client capacity is bounded");
  held[0]!(); held[0]!();
  const again = acquireStatusConnection("same-client");
  assert.ok(again, "release is idempotent and frees capacity");
  for (const release of held) release?.();
  again();
  const total = Array.from({ length: 128 }, (_, i) => acquireStatusConnection(`client-${i}`));
  assert.ok(total.every(Boolean));
  assert.equal(acquireStatusConnection("overflow"), null, "global stream capacity is bounded");
  for (const release of total) release?.();
  const privateInput = [{ ...snapshot[0], diagnostic: "postgres://private-password@railway.internal" }];
  assert.doesNotMatch(JSON.stringify(publicStatusSnapshot(privateInput)), /diagnostic|private-password|railway.internal/);

  let closed = 0;
  const abort = new AbortController();
  let current = snapshot;
  const reader = createPublicStatusStream(abort.signal, async () => current, { tickMs: 10, lifetimeMs: 2000, onClose: () => closed++ }).getReader();
  const decoder = new TextDecoder();
  const readUntil = async (wanted: string) => {
    let text = "";
    while (!text.includes(wanted)) {
      const chunk = await reader.read();
      assert.equal(chunk.done, false, "stream remains open until requested event");
      text += decoder.decode(chunk.value);
    }
    return text;
  };
  const first = await readUntil("event: snapshot");
  assert.match(first, /retry: 5000/);
  assert.match(first, /operational/);
  current = [{ ...snapshot[0], status: "unavailable", lastChecked: new Date(Date.now() + 1).toISOString() }];
  const changed = await readUntil('"status":"unavailable"');
  assert.match(changed, /event: snapshot/);
  await reader.cancel();
  abort.abort();
  assert.equal(closed, 1, "cancellation and abort release the connection once");

  let failures = 0;
  const retryReader = createPublicStatusStream(new AbortController().signal, async () => {
    if (++failures === 1) throw new Error("postgres://secret@private.backend");
    return snapshot;
  }, { tickMs: 10, lifetimeMs: 60 }).getReader();
  let retried = "";
  for (;;) {
    const chunk = await retryReader.read();
    if (chunk.done) break;
    retried += decoder.decode(chunk.value);
  }
  assert.match(retried, /event: unavailable/);
  assert.match(retried, /event: snapshot/);
  assert.match(retried, /event: reconnect/);
  assert.doesNotMatch(retried, /postgres:|secret|private.backend/);
  assert.equal((retried.match(/event: snapshot/g) ?? []).length, 1, "unchanged cached snapshots are not repeatedly sent");

  const alreadyAborted = new AbortController(); alreadyAborted.abort();
  const empty = createPublicStatusStream(alreadyAborted.signal, async () => { throw new Error("must not run"); }).getReader();
  assert.equal((await empty.read()).done, true);
  let resolveLate!: (value: ProductStatusResult[]) => void;
  const late = createPublicStatusStream(new AbortController().signal, () => new Promise(resolve => { resolveLate = resolve; })).getReader();
  await late.cancel();
  resolveLate(snapshot);
  await new Promise(resolve => setTimeout(resolve, 0));
  console.log("test-status-stream: public updates, recovery, limits, privacy and cancellation passed");
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
