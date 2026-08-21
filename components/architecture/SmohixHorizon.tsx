/**
 * Smohix Horizon — restrained architectural boundary light.
 */
export function SmohixHorizon({
  className = "",
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <div
      className={`smohix-horizon ${className}`.trim()}
      role={decorative ? "presentation" : undefined}
      aria-hidden={decorative ? true : undefined}
    />
  );
}
