import { IntelligenceField } from "@/components/architecture";

/**
 * Marketing shell aligned to Living Architecture — restrained field, no nebula/quantum FX.
 */
export function MarketingQuantumShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="smohix-spatial-grid relative overflow-hidden">
      <IntelligenceField className="opacity-40" animate={false} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
