import { ExecutionBadge } from "@/components/guardrails/ExecutionBadge";
import {
  dryRunOutcomePresentation,
  type ExecutionOutcomeTone,
} from "@/lib/guardrails/execution-outcome";

const toneMap: Record<
  ExecutionOutcomeTone,
  "neutral" | "info" | "warn" | "success" | "danger" | "muted"
> = {
  neutral: "neutral",
  info: "info",
  warn: "warn",
  success: "success",
  danger: "danger",
  muted: "muted",
};

export function ExecutionOutcomeBadge({
  ok,
  robotConfigured,
  title,
}: {
  ok: boolean;
  robotConfigured: boolean;
  title?: string;
}) {
  const { label, tone } = dryRunOutcomePresentation(ok, robotConfigured);
  return (
    <ExecutionBadge tone={toneMap[tone]} title={title}>
      {label}
    </ExecutionBadge>
  );
}
