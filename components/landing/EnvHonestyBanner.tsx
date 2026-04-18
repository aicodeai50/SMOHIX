import { hasSupabaseAuth } from "@/lib/supabase/env";

/** One-line reality check when optional backends are not wired (avoids “nothing works” surprise). */
export function EnvHonestyBanner() {
  const supabase = hasSupabaseAuth();
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (supabase && openai) return null;

  const parts: string[] = [];
  if (!openai) {
    parts.push(
      "Copilot uses the built-in replies until the server has OPENAI_API_KEY (GPT is optional).",
    );
  }
  if (!supabase) {
    parts.push(
      "Account-wide data and sign-in require NEXT_PUBLIC_SUPABASE_URL and anon key; until then the console runs in session/local mode.",
    );
  }

  return (
    <div className="border-b border-white/[0.06] bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <p className="text-center text-[13px] leading-relaxed text-muted">
          <span className="font-medium text-foreground/80">Setup note. </span>
          {parts.join(" ")}
        </p>
      </div>
    </div>
  );
}
