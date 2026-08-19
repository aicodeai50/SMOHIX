/** Legacy gradient HQ mark colors — retained only for deprecated SmohixMark reference file. */
const LEGACY_GRADIENT_MARK_COLORS = {
  backgroundStart: "#0b0f14",
  backgroundMid: "#121922",
  backgroundEnd: "#0a1018",
  glyph: "#5ee1ff",
  border: "rgba(255,255,255,0.09)",
} as const;

type MarkSvgProps = {
  gradientId?: string;
};

/** @deprecated Legacy gradient HQ mark — superseded by Precision Plate (`components/brand/hq/`). */
export function SmohixMarkSvgPaths({ gradientId = "smohix-official-bg" }: MarkSvgProps) {
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor={LEGACY_GRADIENT_MARK_COLORS.backgroundStart} />
          <stop offset="0.5" stopColor={LEGACY_GRADIENT_MARK_COLORS.backgroundMid} />
          <stop offset="1" stopColor={LEGACY_GRADIENT_MARK_COLORS.backgroundEnd} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill={`url(#${gradientId})`} />
      <rect
        width="32"
        height="32"
        rx="6"
        fill="none"
        stroke={LEGACY_GRADIENT_MARK_COLORS.border}
        strokeWidth="1"
      />
      <path
        d="M9.35 10.35h13.3M22.65 10.35L9.35 21.65M9.35 21.65h13.3"
        stroke={LEGACY_GRADIENT_MARK_COLORS.glyph}
        strokeWidth="1.78"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/** @deprecated Legacy OG content — superseded by `HqMarkOgContent`. */
export function SmohixMarkOgContent({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <SmohixMarkSvgPaths gradientId="smohix-official-bg" />
      </svg>
    </div>
  );
}
