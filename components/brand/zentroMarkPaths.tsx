import { BRAND_MARK_COLORS } from "@/lib/brand";

type MarkSvgProps = {
  gradientId?: string;
};

/** Official Zentro mark paths — mirrors `app/icon.svg` exactly. */
export function ZentroMarkSvgPaths({ gradientId = "zentro-official-bg" }: MarkSvgProps) {
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor={BRAND_MARK_COLORS.backgroundStart} />
          <stop offset="0.5" stopColor={BRAND_MARK_COLORS.backgroundMid} />
          <stop offset="1" stopColor={BRAND_MARK_COLORS.backgroundEnd} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill={`url(#${gradientId})`} />
      <rect
        width="32"
        height="32"
        rx="6"
        fill="none"
        stroke={BRAND_MARK_COLORS.border}
        strokeWidth="1"
      />
      <path
        d="M9.35 10.35h13.3M22.65 10.35L9.35 21.65M9.35 21.65h13.3"
        stroke={BRAND_MARK_COLORS.glyph}
        strokeWidth="1.78"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/** JSX for `next/og` ImageResponse — fixed gradient id (no hooks). */
export function ZentroMarkOgContent({ size }: { size: number }) {
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
        <ZentroMarkSvgPaths gradientId="zentro-official-bg" />
      </svg>
    </div>
  );
}
