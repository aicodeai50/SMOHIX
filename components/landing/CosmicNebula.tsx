/** Pure-CSS cosmic backdrop — nebula veils, light pillars, ascension horizon. */
export function CosmicNebula() {
  return (
    <div className="zentro-cosmic-nebula pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="zentro-nebula-veil zentro-nebula-veil--cyan" />
      <div className="zentro-nebula-veil zentro-nebula-veil--violet" />
      <div className="zentro-nebula-veil zentro-nebula-veil--emerald" />
      <div className="zentro-light-pillar zentro-light-pillar--left" />
      <div className="zentro-light-pillar zentro-light-pillar--right" />
      <div className="zentro-ascension-horizon" />
      <div className="zentro-star-dust" />
    </div>
  );
}
