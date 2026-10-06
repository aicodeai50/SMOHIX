import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mArticle, mBody, mCard, mH1, mH2 } from "@/lib/marketing-layout";

export const metadata: Metadata = { title: "SDK source preview", description: "Download Smohix JavaScript, TypeScript declarations, and Python source clients for documented HTTP endpoints." };

export default function SdkDocsPage() {
  return <><Header /><main id="main-content" className="flex-1"><div className={mArticle}>
    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Developer platform · Source preview</p>
    <h1 className={`mt-3 ${mH1}`}>Start with a working client.</h1>
    <p className={`mt-4 ${mBody}`}>Small, dependency-free clients for public health, product status, reasoning health, and alert ingestion. Download the source into your project. These are preview clients; npm and PyPI packages are not published.</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      <section className={`min-w-0 ${mCard}`}><h2 className={mH2}>JavaScript &amp; TypeScript</h2><p className={`mt-3 ${mBody}`}>Node.js 20 or later. Keep both files together for TypeScript declarations.</p>
        <p className="mt-4 flex flex-wrap gap-4"><a className="font-medium text-accent underline" href="/sdk/smohix.mjs" download>Download client</a><a className="font-medium text-accent underline" href="/sdk/smohix.d.mts" download>Download types</a></p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-border bg-surface p-4 text-xs text-foreground"><code>{`import { SmohixClient } from './smohix.mjs';

const client = new SmohixClient();
console.log(await client.health());
console.log(await client.productStatus());`}</code></pre>
      </section>
      <section className={`min-w-0 ${mCard}`}><h2 className={mH2}>Python</h2><p className={`mt-3 ${mBody}`}>Python 3.10 or later. Uses the standard library; no package installation required.</p>
        <p className="mt-4"><a className="font-medium text-accent underline" href="/sdk/smohix.py" download>Download client</a></p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-border bg-surface p-4 text-xs text-foreground"><code>{`from smohix import SmohixClient

client = SmohixClient()
print(client.health())
print(client.product_status())`}</code></pre>
      </section>
    </div>
    <section className={`mt-6 ${mCard}`}><h2 className={mH2}>Choose the right credential</h2>
      <p className={`mt-3 ${mBody}`}>Public reads send no credentials. Reasoning health uses a Smohix API key. Alert ingestion uses a separate workspace ingest token. If webhook signatures are required, supply the signing secret server-side.</p>
      <pre className="mt-5 overflow-x-auto rounded-lg border border-border bg-surface p-4 text-xs text-foreground"><code>{`const client = new SmohixClient({
  apiKey: process.env.SMOHIX_API_KEY,
  ingestToken: process.env.SMOHIX_INGEST_TOKEN,
  signingSecret: process.env.SMOHIX_ALERT_WEBHOOK_SIGNING_SECRET,
});
await client.reasoningHealth();
await client.ingestAlert({
  title: 'High CPU', severity: 'warning', service: 'api-gateway',
});`}</code></pre>
      <p className={`mt-4 ${mBody}`}>Python uses <code>api_key</code>, <code>ingest_token</code>, and <code>signing_secret</code>. Never put these credentials in browser code.</p>
    </section>
    <section className={`mt-6 ${mCard}`}><h2 className={mH2}>Explicit limits</h2>
      <p className={`mt-3 ${mBody}`}>Requests time out after 10 seconds by default. Redirects are rejected, and writes are never automatically retried. HTTP errors expose their status and response data. Supply an HTTPS origin; HTTP is accepted only for local loopback development.</p>
      <p className={`mt-3 ${mBody}`}>Console session routes, autonomous execution, Go wrappers, and a full versioned SDK remain outside this preview. Platform Copilot already supports incident context when configured; the separate Smohix AI app keeps its own boundary.</p>
      <p className="mt-4 flex flex-wrap gap-4"><Link className="text-accent underline" href="/docs/api">HTTP API reference</Link><Link className="text-accent underline" href="/playground">Request builder</Link><Link className="text-accent underline" href="/trust">Trust &amp; data boundaries</Link></p>
    </section>
  </div></main><Footer /></>;
}
