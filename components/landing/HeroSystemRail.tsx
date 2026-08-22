/**
 * Hero bottom system rail — architectural layer flow, not footer labels.
 */
const LAYERS = [
  { id: "platform", label: "Platform" },
  { id: "intelligence", label: "Intelligence" },
  { id: "authority", label: "Human authority" },
  { id: "execution", label: "Execution / audit" },
] as const;

export function HeroSystemRail() {
  return (
    <div className="smohix-oe-hero__system-rail" aria-label="System layers">
      {LAYERS.map((layer, index) => (
        <div key={layer.id} className="smohix-oe-hero__system-rail__step">
          <span className="smohix-oe-hero__system-rail__label">{layer.label}</span>
          {index < LAYERS.length - 1 ? (
            <span className="smohix-oe-hero__system-rail__connector" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}
