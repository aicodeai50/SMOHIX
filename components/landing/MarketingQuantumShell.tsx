import { CosmicNebula } from "@/components/landing/CosmicNebula";
import { QuantumDimension } from "@/components/landing/QuantumDimension";

export function MarketingQuantumShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="zentro-quantum-realm zentro-universe-realm relative">
      <CosmicNebula />
      <QuantumDimension />
      <div className="zentro-singularity-field pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
