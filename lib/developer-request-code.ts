import type { DeveloperExample } from "./developer-journey";

/** Generate from endpoint metadata so POST bodies and credential boundaries survive format changes. */
export function buildDeveloperCode(example: DeveloperExample, base: string, typescript = false): string {
  const lines: string[] = [];
  const tokenName = example.auth === "api-key" ? "SMOHIX_API_KEY" : "SMOHIX_INGEST_TOKEN";
  if (example.auth === "api-key" || example.auth === "ingest-token") {
    lines.push("// Run server-side; keep credentials out of browser code.",
      `const token = process.env.${tokenName};`, `if (!token) throw new Error("Missing ${tokenName}");`, "");
  }
  if (example.auth === "session") lines.push("// Run from the signed-in Smohix browser session. Do not copy session cookies.");
  lines.push(`const res = await fetch(${JSON.stringify(base.replace(/\/$/, "") + example.path)}, {`,
    `  method: ${JSON.stringify(example.method ?? "GET")},`,
    ...(example.auth === "session" ? ['  credentials: "include",'] : []),
    '  redirect: "error",', '  signal: AbortSignal.timeout(10000),');
  if (example.auth === "api-key" || example.auth === "ingest-token" || example.body) {
    lines.push("  headers: {",
      ...((example.auth === "api-key" || example.auth === "ingest-token") ? ['    Authorization: `Bearer ${token}`,'] : []),
      ...(example.body ? ['    "Content-Type": "application/json",'] : []), "  },");
  }
  if (example.body) lines.push(`  body: JSON.stringify(${JSON.stringify(example.body, null, 2).replaceAll("\n", "\n  ")}),`);
  lines.push("});", 'if (!res.ok) throw new Error(`HTTP ${res.status}`);',
    typescript ? "const data: unknown = await res.json();" : "const data = await res.json();", "console.log(data);");
  return lines.join("\n");
}
