import Link from "next/link";

import { appMeta } from "@/lib/app-typography";
import type { GrcCalendarEvent } from "@/lib/compliance/grc-calendar";

const KIND_STYLE: Record<string, string> = {
  attestation_due: "bg-accent/20 text-accent border-accent/30",
  vendor_review: "bg-cyan-400/15 text-cyan-200 border-cyan-400/30",
  evidence_bundle: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
  recommended_bundle: "bg-emerald-400/10 text-emerald-300/90 border-emerald-400/25 border-dashed",
  assessment_checkpoint: "bg-violet-400/15 text-violet-200 border-violet-400/30",
  scheduled_digest: "bg-white/[0.06] text-muted border-white/[0.12]",
  scheduled_sla: "bg-white/[0.06] text-foreground/70 border-white/[0.12]",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function GrcCalendarMonthGrid({
  weeks,
  eventsByDay,
  todayKey,
}: {
  weeks: (string | null)[][];
  eventsByDay: Record<string, GrcCalendarEvent[]>;
  todayKey: string;
}) {
  return (
    <div className="overflow-x-auto">
      <div className={`grid grid-cols-7 gap-1 text-center ${appMeta} mb-2`}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((dayKey, di) => {
              if (!dayKey) {
                return <div key={di} className="min-h-[88px] rounded-lg bg-white/[0.02]" />;
              }
              const events = eventsByDay[dayKey] ?? [];
              const isToday = dayKey === todayKey;
              const dayNum = Number.parseInt(dayKey.slice(8, 10), 10);
              return (
                <div
                  key={dayKey}
                  className={`min-h-[88px] rounded-lg border px-1 py-1 ${
                    isToday
                      ? "border-accent/40 bg-accent/10"
                      : "border-white/[0.08] bg-surface/30"
                  }`}
                >
                  <p
                    className={`text-right text-[11px] font-semibold ${
                      isToday ? "text-accent" : "text-muted"
                    }`}
                  >
                    {dayNum}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {events.slice(0, 3).map((e) => (
                      <li key={e.id}>
                        <Link
                          href={e.href}
                          title={e.detail}
                          className={`block truncate rounded border px-1 py-0.5 text-[9px] leading-tight hover:opacity-90 ${
                            KIND_STYLE[e.kind] ?? "bg-white/[0.06] text-muted"
                          } ${e.status === "overdue" ? "ring-1 ring-danger/50" : ""}`}
                        >
                          {e.title}
                        </Link>
                      </li>
                    ))}
                    {events.length > 3 ? (
                      <li className="text-[9px] text-muted">+{events.length - 3} more</li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
