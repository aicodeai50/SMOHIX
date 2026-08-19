/**
 * Smohix HQ corporate identity — "Precision Plate"
 *
 * Custom vector geometry for smohix.run headquarters branding.
 * Distinct from Smohix AI Aperture S (product identity at ai.smohix.run).
 */

/** Primary framed wordmark canvas. */
export const HQ_MARK_VIEWBOX = "0 0 140 44";

/** Domain lockup canvas (smohix.run). */
export const HQ_DOMAIN_VIEWBOX = "0 0 178 44";

/** Micro-mark / favicon canvas. */
export const HQ_MICRO_VIEWBOX = "0 0 32 32";

export const HQ_CONCEPT_NAME = "Precision Plate" as const;

/** Shared design tokens — monochrome-first; color is optional accent only. */
export const HQ_STROKE = 1.45;
export const HQ_FRAME_STROKE = 1.2;

/**
 * Structural open frame — top-right open; right rail stops short (registration break).
 * Segments align to letter cap-height and baseline rhythm.
 */
export const HQ_FRAME_PATHS = {
  topLeft: "M3 38V6H102",
  bottomRight: "M3 38H137V17",
} as const;

/**
 * Custom stroke letterforms for "smohix" — not font outlines.
 * Drawn as open paths; rendered with round caps for refinement at large sizes.
 */
export const HQ_LETTER_PATHS = {
  s: "M13 26.5C13 22.8 15.6 21 18.8 21C21.6 21 23.4 22.4 23.4 24.2C23.4 25.8 22 26.8 20 27.1C22.6 27.5 24.2 29 24.2 31.2C24.2 34.2 21.4 36 17.8 36C14 36 11.6 33.6 11.6 30.2C11.6 28.2 12.6 26.8 14 26.2",
  m: "M29 36V24.2M29 24.2C29 22.2 30.8 20.8 32.8 20.8C34.8 20.8 36 21.8 36 23.6V36M36 23.6C36 21.6 37.8 20.8 39.8 20.8C41.8 20.8 43 21.8 43 23.6V36",
  o: "M48.5 28.2A4.8 4.8 0 1 0 48.6 28.2",
  h: "M56 36V21.2M56 27.4C56 24.6 58.2 22.6 61.2 22.6C64.2 22.6 66.4 24.6 66.4 27.4V36",
  i: "M70 36V25.2M70 21.6V20.4",
  x: "M75 36L81.2 24.2M81.2 36L75 24.2",
} as const;

/** Domain suffix — lighter secondary geometry for ".run" */
export const HQ_DOMAIN_SUFFIX_PATHS = {
  dot: "M92.2 33.2V32",
  r: "M95 36V29.2M95 29.2C95 27 96.8 25.6 99 25.6C101.2 25.6 102.6 27 102.6 29.2V36M99 29.2V36",
  u: "M106 36V29.4C106 27.2 107.6 25.8 109.8 25.8C112 25.8 113.4 27.2 113.4 29.4V36",
  n: "M116.2 36V29.4C116.2 27.2 117.8 25.8 120 25.8C122.2 25.8 123.6 27.2 123.6 29.4V36M120 25.8V23.4",
} as const;

/**
 * HQ micro-mark — open plate corner + derived "s" hook + registration tick.
 * NOT the Smohix AI Aperture S block geometry.
 */
export const HQ_MICRO_PATHS = {
  frame: "M4 26V8H21",
  base: "M4 26H23",
  rail: "M23 26V17.5",
  tick: "M6.5 11.5V13.5",
  sHook: "M11.5 15.2C9.2 15.2 8 16.6 8 18.2C8 19.8 9.3 20.8 11.4 20.8C13.2 20.8 14.2 19.6 14.2 18.4",
} as const;

/** Static asset paths for the official HQ corporate identity on smohix.run. */
export const HQ_ASSET_PATHS = {
  masterMark: "/brand/hq/smohix-hq-mark.svg",
  domainLockup: "/brand/hq/smohix-hq-domain.svg",
  microMark: "/brand/hq/smohix-hq-micro.svg",
} as const;

/** Smohix AI Aperture S path — reference only for distinctness tests. */
export const AI_APERTURE_S_PATH =
  "M7 2h18a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm2.5 6h13a2 2 0 0 1 2 2v1.25a2 2 0 0 1-2 2h-8.25v1h8.25a2.75 2.75 0 0 1 2.75 2.75V22a2.75 2.75 0 0 1-2.75 2.75h-13A2.75 2.75 0 0 1 6.75 22v-1.25A2 2 0 0 1 8.75 18.75h8.25v-1H8.75a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z";
