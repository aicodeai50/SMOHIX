/** Subtle atmospheric backdrop — one soft glow, no particle noise. */
export function CosmicNebula() {
  return (
    <div className="smohix-cosmic-nebula pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="smohix-nebula-veil smohix-nebula-veil--cyan" />
      <div className="smohix-ascension-horizon" />
    </div>
  );
}
