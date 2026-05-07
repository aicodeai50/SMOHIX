import type { Metadata } from "next";
import Link from "next/link";

import { DemoVideoEmbed } from "@/components/docs/DemoVideoEmbed";
import { InteractiveProductDemo } from "@/components/docs/InteractiveProductDemo";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { DEMO_SCENES } from "@/lib/docs/demo-scenes";
import { getDemoVideoEmbed } from "@/lib/docs/demo-video-embed";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

/** Read at request time so deploy env (Railway, etc.) can change without rebuilding. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product demo",
  description: `Interactive walkthrough and recording guide for ${SITE_BRAND_NAME}.`,
};

export default function DocsDemoPage() {
  const videoEmbed = getDemoVideoEmbed(
    process.env.DEMO_VIDEO_URL ?? process.env.NEXT_PUBLIC_DEMO_VIDEO_URL,
  );

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">For users & teams</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Product demo</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {videoEmbed ? (
              <>
                Video below uses{" "}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-accent/90">
                  DEMO_VIDEO_URL
                </code>
                . Use any AI tool → export or upload to YouTube / Loom → paste the watch or share link. The interactive
                tour stays underneath for hands-on exploration.
              </>
            ) : (
              <>
                Set{" "}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-accent/90">
                  DEMO_VIDEO_URL
                </code>{" "}
                (YouTube, Loom, Vimeo, or direct MP4) to show your AI-generated walkthrough here — or use the interactive
                tour below without a video.
              </>
            )}
          </p>

          {videoEmbed ? <DemoVideoEmbed embed={videoEmbed} /> : null}

          <InteractiveProductDemo />

          <section className="mt-14 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Recording a real video later</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>Use a demo tenant or scrubbed data — no production secrets.</li>
              <li>
                Hide browser bookmarks bar; use a clean profile or incognito if extensions might leak data.
              </li>
              <li>
                1080p, 30fps is enough; narrate in one continuous take or edit chapter markers per scene below.
              </li>
              <li>
                Export finished MP4; upload to your help center or embed on `/changelog` or marketing as needed.
              </li>
            </ul>
          </section>

          <ol className="mt-12 space-y-12">
            {DEMO_SCENES.map((scene, idx) => (
              <li key={scene.id} className="border-t border-white/[0.06] pt-10 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-xs font-mono text-muted">Scene {idx + 1}</span>
                  <h2 className="text-lg font-semibold text-foreground">{scene.title}</h2>
                  <span className="text-xs text-muted">~{scene.durationMin}</span>
                </div>
                <p className="mt-2 text-xs font-mono text-accent/90">{scene.route}</p>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Do</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                      {scene.do.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Say (guide)</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                      {scene.say.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-14 text-sm text-muted">
            <Link href="/docs" className="font-medium text-accent hover:underline">
              ← Learn hub
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
