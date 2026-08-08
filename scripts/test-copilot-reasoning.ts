import { completeReasoningChat } from "../lib/copilot/reasoning";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const prevSh = process.env.REACT_APP_SH_BACKEND_API;
  const prevSmohix = process.env.SMOHIX_REASONING_API_URL;
  const prevLegacy = process.env.ZENTRO_REASONING_API_URL;
  process.env.REACT_APP_SH_BACKEND_API = "";
  process.env.SMOHIX_REASONING_API_URL = "";
  process.env.ZENTRO_REASONING_API_URL = "";

  const withoutUrl = await completeReasoningChat([{ role: "user", content: "hello" }]);
  assert(withoutUrl === null, "no URL → null");

  if (prevSh !== undefined) process.env.REACT_APP_SH_BACKEND_API = prevSh;
  else delete process.env.REACT_APP_SH_BACKEND_API;
  if (prevSmohix !== undefined) process.env.SMOHIX_REASONING_API_URL = prevSmohix;
  else delete process.env.SMOHIX_REASONING_API_URL;
  if (prevLegacy !== undefined) process.env.ZENTRO_REASONING_API_URL = prevLegacy;
  else delete process.env.ZENTRO_REASONING_API_URL;
  console.log("test-copilot-reasoning: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
