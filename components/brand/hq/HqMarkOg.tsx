import {
  HQ_ACCENT_COLOR,
  HQ_CONTAINER_PATH,
  HQ_MICRO_REGISTRATION_DOT,
  HQ_MICRO_S_LOWER_PATH,
  HQ_MICRO_S_UPPER_PATH,
  HQ_MICRO_STROKE,
  HQ_MICRO_VIEWBOX,
  HQ_REGISTRATION_DOT,
  HQ_S_LOWER_PATH,
  HQ_S_UPPER_PATH,
  HQ_SYMBOL_STROKE,
  HQ_SYMBOL_VIEWBOX,
} from "@/lib/brand/hq/geometry";

type OgProps = {
  stroke?: string;
  accent?: string;
  background?: string;
};

function FlowSymbolPaths({
  micro,
  stroke,
  accent,
  strokeWidth,
}: {
  micro: boolean;
  stroke: string;
  accent: string;
  strokeWidth: number;
}) {
  const upper = micro ? HQ_MICRO_S_UPPER_PATH : HQ_S_UPPER_PATH;
  const lower = micro ? HQ_MICRO_S_LOWER_PATH : HQ_S_LOWER_PATH;
  const dot = micro ? HQ_MICRO_REGISTRATION_DOT : HQ_REGISTRATION_DOT;

  return (
    <>
      <path
        d={upper}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={lower}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={accent} />
    </>
  );
}

/** Flow Mark symbol for `next/og` ImageResponse. */
export function HqMarkOgContent({
  size = 160,
  stroke = "#f4f4f5",
  accent = HQ_ACCENT_COLOR,
}: { size?: number } & OgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={HQ_SYMBOL_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <FlowSymbolPaths
        micro={false}
        stroke={stroke}
        accent={accent}
        strokeWidth={HQ_SYMBOL_STROKE}
      />
    </svg>
  );
}

/** Vertical lockup for OpenGraph / Twitter — S + Smohix + smohix.run. */
export function HqLockupOgContent({
  symbolSize = 200,
  stroke = "#f4f4f5",
  accent = HQ_ACCENT_COLOR,
}: { symbolSize?: number } & OgProps) {
  const textSize = Math.round(symbolSize * 0.22);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: Math.round(symbolSize * 0.14),
      }}
    >
      <HqMarkOgContent size={symbolSize} stroke={stroke} accent={accent} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: Math.round(symbolSize * 0.06),
        }}
      >
        <span
          style={{
            display: "flex",
            fontSize: textSize,
            fontWeight: 600,
            letterSpacing: "0.03em",
            color: stroke,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          Smohix
        </span>
        <span
          style={{
            display: "flex",
            fontSize: Math.round(textSize * 0.72),
            fontWeight: 600,
            letterSpacing: "0.04em",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <span style={{ color: stroke }}>smohix</span>
          <span style={{ color: accent }}>.run</span>
        </span>
      </div>
    </div>
  );
}

/** @deprecated Use HqLockupOgContent — kept for import compat. */
export function HqDomainLockupOgContent(props: Parameters<typeof HqLockupOgContent>[0]) {
  return <HqLockupOgContent {...props} />;
}

/** HQ symbol for Apple touch icon — rounded dark container, S only (no text). */
export function HqMicroMarkOgContent({
  size = 180,
  stroke = "#f4f4f5",
  accent = HQ_ACCENT_COLOR,
  background = "#06070b",
  padding = 0.16,
}: {
  size?: number;
  background?: string;
  padding?: number;
} & OgProps) {
  const inner = Math.round(size * (1 - padding * 2));
  const radius = Math.round(size * 0.14);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        borderRadius: radius,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox={HQ_MICRO_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <FlowSymbolPaths
          micro
          stroke={stroke}
          accent={accent}
          strokeWidth={HQ_MICRO_STROKE}
        />
      </svg>
    </div>
  );
}

/** Symbol-only export with optional container for static SVG generation. */
export function HqSymbolOgContent({
  size = 120,
  stroke = "#f4f4f5",
  accent = HQ_ACCENT_COLOR,
  showContainer = false,
  background = "#06070b",
}: { size?: number; showContainer?: boolean; background?: string } & OgProps) {
  if (!showContainer) {
    return <HqMarkOgContent size={size} stroke={stroke} accent={accent} />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        borderRadius: size * 0.14,
      }}
    >
      <svg
        width={size * 0.68}
        height={size * 0.68}
        viewBox={HQ_SYMBOL_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={HQ_CONTAINER_PATH} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <FlowSymbolPaths
          micro={false}
          stroke={stroke}
          accent={accent}
          strokeWidth={HQ_SYMBOL_STROKE}
        />
      </svg>
    </div>
  );
}
