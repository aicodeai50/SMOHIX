import { completeReasoningChat } from "../lib/copilot/reasoning";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const prev = process.env.ZENTRO_REASONING_API_URL;
  process.env.ZENTRO_REASONING_API_URL = "";

  const withoutUrl = await completeReasoningChat([{ role: "user", content: "hello" }]);
  assert(withoutUrl === null, "no URL → null");

  process.env.ZENTRO_REASONING_API_URL = prev;
  console.log("test-copilot-reasoning: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
