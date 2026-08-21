/** Thin coordinate divider between operational layers. */
export function CoordinateDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`my-6 flex items-center gap-3 ${className}`.trim()}
      role="separator"
      aria-hidden
    >
      <span className="font-mono text-[10px] tracking-widest text-muted/50">00</span>
      <div className="smohix-horizon flex-1" />
      <span className="font-mono text-[10px] tracking-widest text-muted/50">01</span>
    </div>
  );
}
