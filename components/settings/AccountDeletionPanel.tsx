"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";

export function AccountDeletionPanel({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function requestDeletion() {
    if (confirm !== "DELETE") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/user/account/delete-request", { method: "POST" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
      setOpen(false);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Request account deletion
      </Button>
      {status === "done" ? (
        <p className="mt-2 text-xs text-muted">
          Deletion request received. We will email {email} within 48 hours.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-2 text-xs text-danger">Could not submit request. Contact support.</p>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete your account"
        description="This permanently removes your workspace data. Type DELETE to confirm."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirm !== "DELETE" || status === "loading"}
              onClick={requestDeletion}
            >
              {status === "loading" ? "Submitting…" : "Confirm deletion"}
            </Button>
          </>
        }
      >
        <Input
          label='Type "DELETE" to confirm'
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
        />
      </Modal>
    </>
  );
}
