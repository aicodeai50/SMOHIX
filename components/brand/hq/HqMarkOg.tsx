import {
  HQ_DOMAIN_SUFFIX_PATHS,
  HQ_DOMAIN_VIEWBOX,
  HQ_FRAME_PATHS,
  HQ_FRAME_STROKE,
  HQ_LETTER_PATHS,
  HQ_MARK_VIEWBOX,
  HQ_MICRO_PATHS,
  HQ_MICRO_VIEWBOX,
  HQ_STROKE,
} from "@/lib/brand/hq/geometry";

type OgStrokeProps = {
  stroke?: string;
};

/** Precision Plate wordmark for `next/og` ImageResponse (fixed colors, no CSS variables). */
export function HqMarkOgContent({
  width = 420,
  height = 132,
  stroke = "#eef0f4",
}: { width?: number; height?: number } & OgStrokeProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={HQ_MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke={stroke} strokeWidth={HQ_FRAME_STROKE} strokeLinecap="square">
        <path d={HQ_FRAME_PATHS.topLeft} />
        <path d={HQ_FRAME_PATHS.bottomRight} />
      </g>
      <g stroke={stroke} strokeWidth={HQ_STROKE} strokeLinecap="round" strokeLinejoin="round">
        {Object.values(HQ_LETTER_PATHS).map((d) => (
          <path key={d.slice(0, 12)} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** Optional domain lockup for larger OG contexts. */
export function HqDomainLockupOgContent({
  width = 520,
  height = 128,
  stroke = "#eef0f4",
}: { width?: number; height?: number } & OgStrokeProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={HQ_DOMAIN_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke={stroke} strokeWidth={HQ_FRAME_STROKE} strokeLinecap="square">
        <path d={HQ_FRAME_PATHS.topLeft} />
        <path d={HQ_FRAME_PATHS.bottomRight} />
      </g>
      <g stroke={stroke} strokeWidth={HQ_STROKE} strokeLinecap="round" strokeLinejoin="round">
        {Object.values(HQ_LETTER_PATHS).map((d) => (
          <path key={`w-${d.slice(0, 12)}`} d={d} />
        ))}
      </g>
      <g
        stroke={stroke}
        strokeWidth={HQ_STROKE * 0.88}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
      >
        <path d={HQ_DOMAIN_SUFFIX_PATHS.dot} />
        <path d={HQ_DOMAIN_SUFFIX_PATHS.r} />
        <path d={HQ_DOMAIN_SUFFIX_PATHS.u} />
        <path d={HQ_DOMAIN_SUFFIX_PATHS.n} />
      </g>
    </svg>
  );
}

/** HQ micro-mark for Apple touch icon and compact OG badges. */
export function HqMicroMarkOgContent({
  size = 120,
  stroke = "#eef0f4",
  background = "#06070b",
  padding = 0.18,
}: {
  size?: number;
  background?: string;
  padding?: number;
} & OgStrokeProps) {
  const inner = Math.round(size * (1 - padding * 2));
  const offset = Math.round((size - inner) / 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        borderRadius: Math.round(size * 0.14),
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox={HQ_MICRO_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ margin: offset }}
      >
        <g stroke={stroke} strokeWidth={1.35} strokeLinecap="square">
          <path d={HQ_MICRO_PATHS.frame} />
          <path d={HQ_MICRO_PATHS.base} />
          <path d={HQ_MICRO_PATHS.rail} />
          <path d={HQ_MICRO_PATHS.tick} strokeLinecap="round" />
        </g>
        <path
          d={HQ_MICRO_PATHS.sHook}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
