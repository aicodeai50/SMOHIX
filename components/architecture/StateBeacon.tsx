import { appStatus } from "@/lib/app-typography";

export type StateBeaconTone =
  | "dormant"
  | "aware"
  | "active"
  | "attention"
  | "critical"
  | "verified"
  | "processing";

const toneClass: Record<StateBeaconTone, string> = {
  dormant: "smohix-beacon smohix-beacon--dormant",
  aware: "smohix-beacon smohix-beacon--aware",
  active: "smohix-beacon smohix-beacon--active",
  attention: "smohix-beacon smohix-beacon--attention",
  critical: "smohix-beacon smohix-beacon--critical",
  verified: "smohix-beacon smohix-beacon--verified",
  processing: "smohix-beacon smohix-beacon--processing",
};

/**
 * Living Architecture state indicator — geometry + label, never color alone.
 */
export function StateBeacon({
  label,
  tone = "aware",
  title,
  className = "",
}: {
  label: string;
  tone?: StateBeaconTone;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title ?? label}
      className={`inline-flex max-w-full items-center gap-1.5 ${toneClass[tone]} ${className}`.trim()}
    >
      <span className="smohix-beacon__mark" aria-hidden />
      <span className={`${appStatus} truncate`}>{label}</span>
    </span>
  );
}
