"use client";

import { useEffect, useState } from "react";

import { StateBeacon } from "@/components/architecture";

const FEED = [
  { tone: "text-foreground/88", text: "ingest · webhook collapsed into incident #8841" },
  { tone: "text-foreground/85", text: "surface · 3 critical paths on auth-api" },
  { tone: "text-foreground/88", text: "guard · approval gate · rollback armed" },
  { tone: "text-warning", text: "exposure · cert api-gateway expires in 12d" },
  { tone: "text-foreground/88", text: "audit · append-only · governance.staffing_sla_*" },
  { tone: "text-foreground/85", text: "execute · dry-run passed · awaiting operator" },
] as const;

const METRICS = [
  { label: "Incidents", value: "12", spark: "↓ 3" },
  { label: "Exposure", value: "2", spark: "crit" },
  { label: "Approvals", value: "5", spark: "queue" },
  { label: "Audit 24h", value: "1.2k", spark: "live" },
] as const;

const REGIONS = ["us-east", "eu-west", "ap-south", "global"] as const;

function formatRegion(region: string): string {
  return region.toUpperCase();
}

function formatHealth(health: number): string {
  return health >= 99.9 ? "healthy" : `${health.toFixed(2)}%`;
}

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
  const region = REGIONS[regionIndex];

  return (
    <div className="smohix-live-command relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
      <p className="smohix-live-command__operational-label">Operational command</p>
      <div className="smohix-live-command__frame">
        <header className="smohix-live-command__header">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <StateBeacon label="Live command" tone="active" />
            <span className="smohix-live-command__region">
              {formatRegion(region)} · {formatHealth(health)}
            </span>
          </div>
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
        </div>

        <footer className="smohix-live-command__footer">
          <span>Operator authority required</span>
          <span>Append-only audit</span>
          <span>Guarded execution</span>
        </footer>
      </div>
      <p className="smohix-live-command__preview-note">
        Command console preview — sign in for your org
      </p>
    </div>
  );
}
