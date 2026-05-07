/**
 * Generate HMAC-SHA256 signatures for /api/integrations/alerts webhook testing.
 *
 * Usage:
 *   node scripts/gen-alert-signature.mjs --secret "my-secret" --body '{"title":"test"}'
 *   node scripts/gen-alert-signature.mjs --secret "my-secret" --body-file payload.json
 *   node scripts/gen-alert-signature.mjs --secret "my-secret" --body-file payload.json --timestamp 1715000000
 *
 * Env fallback:
 *   ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET
 */
import fs from "node:fs";
import { createHmac } from "node:crypto";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    if (!next || next.startsWith("--")) {
      out[name] = "true";
      continue;
    }
    out[name] = next;
    i += 1;
  }
  return out;
}

function usageAndExit(message) {
  if (message) {
    console.error(`error: ${message}`);
  }
  console.log(`Usage:
  node scripts/gen-alert-signature.mjs --secret "<secret>" --body '{"title":"test"}'
  node scripts/gen-alert-signature.mjs --secret "<secret>" --body-file payload.json
  node scripts/gen-alert-signature.mjs --secret "<secret>" --body-file payload.json --timestamp 1715000000

Options:
  --secret       HMAC secret (fallback: ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET)
  --body         Raw JSON/body string
  --body-file    File path to raw body payload
  --timestamp    Optional timestamp for timestamped mode
`);
  process.exit(message ? 1 : 0);
}

function hmacHex(secret, value) {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

const args = parseArgs(process.argv);
if (args.help === "true") {
  usageAndExit();
}

const secret = (args.secret || process.env.ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET || "").trim();
if (!secret) {
  usageAndExit("missing --secret (or ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET)");
}

let body = "";
if (typeof args.body === "string") {
  body = args.body;
} else if (typeof args["body-file"] === "string") {
  const p = args["body-file"];
  if (!fs.existsSync(p)) {
    usageAndExit(`body file not found: ${p}`);
  }
  body = fs.readFileSync(p, "utf8");
} else {
  usageAndExit("provide --body or --body-file");
}

const rawSig = hmacHex(secret, body);
const ts = typeof args.timestamp === "string" ? args.timestamp.trim() : "";

console.log("Headers (raw-body mode):");
console.log(`X-Zentro-Signature: ${rawSig}`);
console.log(`X-Zentro-Signature: sha256=${rawSig}`);

if (ts) {
  const tsSig = hmacHex(secret, `${ts}.${body}`);
  console.log("");
  console.log("Headers (timestamp mode):");
  console.log(`X-Zentro-Signature-Timestamp: ${ts}`);
  console.log(`X-Zentro-Signature: ${tsSig}`);
  console.log(`X-Zentro-Signature: sha256=${tsSig}`);
}

