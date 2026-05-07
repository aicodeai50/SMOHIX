import type { DemoVideoEmbed as EmbedModel } from "@/lib/docs/demo-video-embed";

type Props = {
  embed: EmbedModel;
};

export function DemoVideoEmbed({ embed }: Props) {
  return (
    <section className="mt-10" aria-label="Video demo">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Video walkthrough</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Hosted player — drop in a link from your AI video tool (export → YouTube / Loom) or set{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-accent/90">
              DEMO_VIDEO_URL
            </code>{" "}
            (server env — no secret; avoids rebuild when you change the link).
          </p>
        </div>
      </div>

      <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-xl border border-white/[0.1] bg-black/40 shadow-[0_0_40px_-12px_rgba(94,225,255,0.15)]">
        {embed.kind === "iframe" ? (
          <iframe
            src={embed.src}
            title="Product demo video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />
        ) : (
          <video
            src={embed.src}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>
    </section>
  );
}
