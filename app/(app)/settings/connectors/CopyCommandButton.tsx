"use client";

import { useState } from "react";

type CopyCommandButtonProps = {
  content: string;
  idleLabel?: string;
  copiedLabel?: string;
};

export function CopyCommandButton({
  content,
  idleLabel = "Copy",
  copiedLabel = "Copied",
}: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(content);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1300);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:border-accent/40 hover:text-foreground"
      aria-live="polite"
    >
      {copied ? copiedLabel : idleLabel}
    </button>
  );
}

type DownloadPayloadButtonProps = {
  filename: string;
  content: string;
  label?: string;
};

export function DownloadPayloadButton({
  filename,
  content,
  label = "Download payload",
}: DownloadPayloadButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        const blob = new Blob([content], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:border-accent/40 hover:text-foreground"
    >
      {label}
    </button>
  );
}
