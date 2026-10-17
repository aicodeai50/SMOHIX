import assert from "node:assert/strict";
import { completeOpenAIChat, streamOpenAIChatDeltas } from "../lib/copilot/openai";
import { createCopilotStream, COPILOT_UNAVAILABLE_MESSAGE } from "../lib/copilot/stream";
import { readCopilotBody } from "../lib/copilot/body";

async function main() {
  const originalFetch = globalThis.fetch;
  const messages = [{ role: "user", content: "hello" }];
  try {
    let bodyCancelled = false;
    globalThis.fetch = async (_url, init) => {
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      assert.ok(init?.signal);
      const encoder = new TextEncoder();
      return new Response(new ReadableStream({
        start(controller) {
          const text = 'data: {"choices":[{"delta":{"content":"Hello 🌍"}}]}\n\ndata: [DONE]\n\n';
          const bytes = encoder.encode(text);
          for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3));
        },
        cancel() { bodyCancelled = true; },
      }));
    };
    const deltas: string[] = [];
    for await (const delta of streamOpenAIChatDeltas("test-only", messages)) deltas.push(delta);
    assert.equal(deltas.join(""), "Hello 🌍", "split UTF-8 stream frames are reassembled");
    assert.equal(bodyCancelled, true, "provider body is cancelled when DONE arrives");
    globalThis.fetch = async () => new Response("postgres://secret@private-provider", { status: 401 });
    await assert.rejects(completeOpenAIChat("test-only", messages), { message: "model_unavailable" });
    await assert.rejects(async () => { for await (const delta of streamOpenAIChatDeltas("test-only", messages)) void delta; }, { message: "model_unavailable" });
    globalThis.fetch = async () => new Response('data: {"choices":[{"delta":{"content":"Partial"}}]}\n\n');
    await assert.rejects(async () => { for await (const delta of streamOpenAIChatDeltas("test-only", messages)) void delta; }, { message: "model_stream_interrupted" });

    globalThis.fetch = async () => new Response('data: {"choices":[{"delta":{"content":"Final"}}]}\n\ndata: [DONE]');
    let final = "";
    for await (const text of streamOpenAIChatDeltas("test-only", messages)) final += text;
    assert.equal(final, "Final", "DONE without a trailing newline terminates correctly");
    globalThis.fetch = async () => new Response('data: {"error":{"message":"private-provider-secret"}}\n\n');
    await assert.rejects(async () => { for await (const delta of streamOpenAIChatDeltas("test-only", messages)) void delta; }, { message: "model_unavailable" });

    let upstreamSignal: AbortSignal | undefined;
    const reader = createCopilotStream(new AbortController().signal, async function* (signal) {
      upstreamSignal = signal;
      yield { type: "delta", text: "hello" };
      await new Promise<void>(resolve => signal.addEventListener("abort", () => resolve(), { once: true }));
    }).getReader();
    assert.match(new TextDecoder().decode((await reader.read()).value), /hello/);
    await reader.cancel();
    assert.equal(upstreamSignal?.aborted, true, "browser cancellation aborts model work");
    const safe = createCopilotStream(new AbortController().signal, async function* () {
      yield { type: "delta", text: "A partial response" };
      throw new Error("postgres://secret@private-provider");
    });
    const safeText = await new Response(safe).text();
    assert.match(safeText, /"type":"error"/);
    assert.ok(safeText.includes(COPILOT_UNAVAILABLE_MESSAGE));
    assert.doesNotMatch(safeText, /postgres:|secret|private-provider|"type":"done"/);
    const aborted = new AbortController(); aborted.abort();
    let started = false;
    const empty = createCopilotStream(aborted.signal, async function* () { started = true; yield { type: "done", source: "offline" }; });
    assert.equal(await new Response(empty).text(), "");
    assert.equal(started, false);
    assert.deepEqual(await readCopilotBody(new Request("https://smohix.run", { method: "POST", body: '{"message":"hello"}' })), { message: "hello" });
    await assert.rejects(readCopilotBody(new Request("https://smohix.run", { method: "POST", body: "x".repeat(512_001) })), { message: "body_too_large" });
    console.log("test-copilot-stream: incremental output, cancellation, interrupted responses, bounded input and private errors passed");
  } finally { globalThis.fetch = originalFetch; }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
