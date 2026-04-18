import { hasSupabaseAuth } from "@/lib/supabase/env";

/** Minimal environment flags (NOC-style, no instructional copy). */
export function EnvStatusStrip() {
  const supabase = hasSupabaseAuth();
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());

  return (
    <div className="border-b border-white/[0.05] bg-black/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-1 px-4 py-2.5 font-mono text-[11px] text-muted sm:px-6">
        <span className="text-foreground/45">Runtime</span>
        <span>
          <span className="text-foreground/45">Supabase</span>{" "}
          <span className={supabase ? "text-emerald-400/90" : "text-muted"}>
            {supabase ? "configured" : "not configured"}
          </span>
        </span>
        <span>
          <span className="text-foreground/45">OpenAI</span>{" "}
          <span className={openai ? "text-emerald-400/90" : "text-muted"}>
            {openai ? "configured" : "not configured"}
          </span>
        </span>
      </div>
    </div>
  );
}
