"use client";

import { useEffect, useState } from "react";

import { StateBeacon } from "@/components/architecture";

const FEED = [
  { tone: "text-accent", text: "ingest · webhook collapsed into incident #8841" },
  { tone: "text-foreground/85", text: "surface · 3 critical paths on auth-api" },
  { tone: "text-accent", text: "guard · approval gate · rollback armed" },
  { tone: "text-warning", text: "exposure · cert api-gateway expires in 12d" },
  { tone: "text-accent", text: "audit · append-only · governance.staffing_sla_*" },
  { tone: "text-foreground/85", text: "execute · dry-run passed · awaiting operator" },
] as const;

const METRICS = [
  { label: "Incidents", value: "12", spark: "↓ 3" },
  { label: "Exposure", value: "2", spark: "crit" },
  { label: "Approvals", value: "5", spark: "queue" },
  { label: "Audit 24h", value: "1.2k", spark: "live" },
] as const;

const REGIONS = ["us-east", "eu-west", "ap-south", "global"] as const;

export function FutureCommandCore() {
  const [lineIndex, setLineIndex] = useState(0);
  const [regionIndex, setRegionIndex] = useState(0);
  const [health, setHealth] = useState(99.97);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % FEED.length);
    }, 2800);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const dim = window.setInterval(() => {
      setRegionIndex((i) => (i + 1) % REGIONS.length);
      setHealth(99.9 + Math.random() * 0.09);
    }, 4000);
    return () => window.clearInterval(dim);
  }, []);

  const activeLine = FEED[lineIndex];

  return (
    <div className="smohix-live-command relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
      <div className="smohix-live-command__frame">
        <header className="smohix-live-command__header">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <StateBeacon label="Live command" tone="active" />
            <span className="smohix-live-command__region">
              {REGIONS[regionIndex]} · {health.toFixed(2)}% health
            </span>
          </div>
          <span className="smohix-live-command__coord" aria-hidden>
            CMD·01
          </span>
        </header>

        <div className="smohix-live-command__metrics">
          {METRICS.map((m) => (
            <div key={m.label} className="smohix-live-command__metric">
              <p className="smohix-live-command__metric-label">{m.label}</p>
              <p className="smohix-live-command__metric-value">{m.value}</p>
              <p className="smohix-live-command__metric-spark">{m.spark}</p>
            </div>
          ))}
        </div>

        <div className="smohix-live-command__signal">
          <p className="smohix-live-command__signal-label">Current signal</p>
          <p className={`smohix-live-command__signal-line ${activeLine.tone}`}>{activeLine.text}</p>
          <div className="smohix-live-command__signal-queue" aria-hidden>
            {FEED.slice(0, 3).map((line, i) => (
              <span
                key={line.text}
                className={`smohix-live-command__signal-ghost ${i === lineIndex % 3 ? "is-active" : ""}`}
              />
            ))}
          </div>
        </div>

        <footer className="smohix-live-command__footer">
          <span>Operator authority required</span>
          <span>Append-only audit</span>
          <span>Guarded execution</span>
        </footer>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted/75">
        Command console preview — sign in for your org
      </p>
    </div>
  );
}
