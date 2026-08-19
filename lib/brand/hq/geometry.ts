/**
 * Smohix HQ corporate identity — "Flow Mark"
 *
 * Custom geometric S from two open flowing strokes + cyan registration dot.
 * Visual reference: approved Smohix HQ logo (smohix.run headquarters).
 * Distinct from Smohix AI Aperture S (ai.smohix.run).
 */

/** Primary symbol canvas — S + registration dot. */
export const HQ_SYMBOL_VIEWBOX = "0 0 100 100";

/** Favicon / micro symbol canvas. */
export const HQ_MICRO_VIEWBOX = "0 0 32 32";

/** Horizontal wordmark canvas (symbol + smohix.run text area). */
export const HQ_WORDMARK_VIEWBOX = "0 0 220 40";

/** Vertical brand lockup canvas. */
export const HQ_LOCKUP_VIEWBOX = "0 0 100 128";

export const HQ_CONCEPT_NAME = "Flow Mark" as const;

/** Cyan/teal registration dot — shared accent with ".run" suffix. */
export const HQ_ACCENT_COLOR = "#5ee1ff";

/** Symbol stroke weight at master scale. */
export const HQ_SYMBOL_STROKE = 8.25;

/** Micro symbol stroke — heavier relative weight for 16–32px. */
export const HQ_MICRO_STROKE = 2.85;

/**
 * Upper S stroke — open terminal at upper-right.
 * Lower S stroke — open terminal at lower-left.
 * Paths traced from approved reference geometry (original vector, not font outlines).
 */
export const HQ_S_UPPER_PATH =
  "M 72 13 C 48 13 28 26 24 42 C 22 50 26 54 33 56";

export const HQ_S_LOWER_PATH =
  "M 28 87 C 52 87 72 74 76 58 C 78 50 74 46 67 44";

/** Registration dot — center-left / lower-middle of the S gap. */
export const HQ_REGISTRATION_DOT = { cx: 30, cy: 62, r: 5.4 } as const;

/** Micro-scale paths (32×32) — simplified for favicon legibility. */
export const HQ_MICRO_S_UPPER_PATH =
  "M 23 4.2 C 15.4 4.2 9 8.3 7.7 13.4 C 7 16 8.3 17.3 10.6 17.9";

export const HQ_MICRO_S_LOWER_PATH =
  "M 9 27.8 C 16.6 27.8 23 23.7 24.3 18.6 C 25 16 23.7 14.7 21.4 14.1";

export const HQ_MICRO_REGISTRATION_DOT = { cx: 9.6, cy: 19.8, r: 1.7 } as const;

/** Optional rounded-square container for app-icon presentations. */
export const HQ_CONTAINER_RADIUS = 14;

export const HQ_CONTAINER_PATH =
  "M 14 0 H 86 A 14 14 0 0 1 100 14 V 86 A 14 14 0 0 1 86 100 H 14 A 14 14 0 0 1 0 86 V 14 A 14 14 0 0 1 14 0 Z";

/** Static asset paths for the official HQ corporate identity on smohix.run. */
export const HQ_ASSET_PATHS = {
  masterMark: "/brand/hq/smohix-hq-mark.svg",
  domainLockup: "/brand/hq/smohix-hq-domain.svg",
  microMark: "/brand/hq/smohix-hq-micro.svg",
  microLight: "/brand/hq/smohix-hq-micro-light.svg",
  markLight: "/brand/hq/smohix-hq-mark-light.svg",
} as const;

/** Smohix AI Aperture S path — reference only for distinctness tests. */
export const AI_APERTURE_S_PATH =
  "M7 2h18a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm2.5 6h13a2 2 0 0 1 2 2v1.25a2 2 0 0 1-2 2h-8.25v1h8.25a2.75 2.75 0 0 1 2.75 2.75V22a2.75 2.75 0 0 1-2.75 2.75h-13A2.75 2.75 0 0 1 6.75 22v-1.25A2 2 0 0 1 8.75 18.75h8.25v-1H8.75a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z";

/** @deprecated Precision Plate — retained for migration tests only. */
export const LEGACY_PRECISION_PLATE_FRAME = {
  topLeft: "M3 38V6H102",
  bottomRight: "M3 38H137V17",
} as const;
