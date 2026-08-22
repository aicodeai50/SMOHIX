/**
 * Console typography — mirrors marketing tokens (`lib/marketing-layout.ts`) so app routes
 * share the same type scale and rhythm as public pages.
 */

/** Page-level section heading inside console content. */
export const appPageSectionTitle = "text-[1.625rem] font-semibold tracking-tight text-foreground";

/** Display-scale console title (Hub, Overview). */
export const appDisplay = "smohix-display smohix-headline text-[2rem] sm:text-[2.35rem]";

/** Card / panel title (20px). */
export const appPanelTitle = "text-xl font-semibold tracking-tight text-foreground";

/** Signal / metadata strip. */
export const appSignal = "smohix-signal-meta";

/** Primary body copy (15px). */
export const appBody = "text-[0.9375rem] leading-relaxed";

/** Secondary / meta copy (13px). */
export const appMeta = "text-[13px] leading-relaxed text-muted";

/** Uppercase rail / group label. */
export const appOverline = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted";

/** System metric / numeric emphasis. */
export const appMetric = "smohix-metric-band__value text-foreground";

/** Status chip label (pair with tone classes — never color alone). */
export const appStatus = "text-[10px] font-semibold uppercase tracking-[0.12em]";

/** Form field label (13px, muted). */
export const appLabel = "text-[13px] font-medium text-muted";
