"use client";

export function ExecutiveSummaryPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20 print:hidden"
    >
      Print summary
    </button>
  );
}
