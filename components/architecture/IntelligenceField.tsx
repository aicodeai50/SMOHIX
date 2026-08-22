/**
 * Smohix Intelligence Field — sparse, intentional computation atmosphere.
 * Prefer CSS. Optional SVG nodes for hero/command surfaces.
 */
export function IntelligenceField({
  className = "",
  animate = true,
  withNodes = false,
}: {
  className?: string;
  animate?: boolean;
  withNodes?: boolean;
}) {
  return (
    <div
      className={`smohix-intelligence-field ${animate ? "smohix-intelligence-field--animate" : ""} ${className}`.trim()}
      aria-hidden
    >
      {withNodes ? (
        <svg
          className="absolute inset-0 h-full w-full max-w-full opacity-40 [overflow:hidden]"
          viewBox="0 0 400 240"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <g stroke="rgba(16,185,129,0.18)" strokeWidth="0.6" fill="none">
            <path d="M48 72 L120 96 L188 64" />
            <path d="M220 120 L290 88 L340 140" />
            <path d="M80 170 L160 150 L240 180" />
          </g>
          <g fill="rgba(244,244,245,0.35)">
            <circle cx="48" cy="72" r="1.6" />
            <circle cx="120" cy="96" r="1.4" />
            <circle cx="188" cy="64" r="1.6" />
            <circle cx="220" cy="120" r="1.3" />
            <circle cx="290" cy="88" r="1.5" />
            <circle cx="340" cy="140" r="1.4" />
            <circle cx="80" cy="170" r="1.3" />
            <circle cx="160" cy="150" r="1.5" />
            <circle cx="240" cy="180" r="1.4" />
          </g>
        </svg>
      ) : null}
    </div>
  );
}
