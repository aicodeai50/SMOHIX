/** Subtle atmospheric backdrop — one soft glow, no particle noise. */
export function CosmicNebula() {
  return (
    <div className="zentro-cosmic-nebula pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="zentro-nebula-veil zentro-nebula-veil--cyan" />
      <div className="zentro-ascension-horizon" />
    </div>
  );
}
