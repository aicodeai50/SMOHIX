"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { hasMaxBlastToken, parseMaxBlastScope } from "@/lib/approvals/policy-scope";
import { cleanedPolicyReviewQueryString } from "@/lib/approvals/policy-review-url";

type Props = {
  fieldId: string;
  initialValue?: string;
  clearValidationParamsOnEdit?: boolean;
  className: string;
  helperClassName: string;
  acceptButtonClassName: string;
  rejectButtonClassName: string;
};

export function PolicyReviewerNotesField({
  fieldId,
  initialValue = "",
  clearValidationParamsOnEdit = false,
  className,
  helperClassName,
  acceptButtonClassName,
  rejectButtonClassName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const clearedOnce = useRef(false);
  const [value, setValue] = useState(initialValue);
  const parsed = useMemo(() => parseMaxBlastScope(value), [value]);
  const hasScopeToken = useMemo(() => hasMaxBlastToken(value), [value]);
  const invalidMaxBlastScope = hasScopeToken && !parsed;
  const acceptDisabledReason = invalidMaxBlastScope
    ? "Cannot accept: invalid max blast scope. Use service, cluster, region, or global."
    : undefined;
  const validationHintId = `policy-max-blast-validation-${fieldId}`;

  return (
    <>
      <input
        name="notes"
        maxLength={280}
        value={value}
        onChange={(e) => {
          if (clearValidationParamsOnEdit && !clearedOnce.current) {
            const q = cleanedPolicyReviewQueryString(searchParams.toString());
            router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
            clearedOnce.current = true;
          }
          setValue(e.target.value);
        }}
        placeholder="Reviewer notes (optional: max-blast: region)"
        className={className}
      />
      <p className={`w-full ${helperClassName} text-muted`}>
        Policy scope helper: add{" "}
        <span className="font-mono text-foreground/80">max-blast: service|cluster|region|global</span>{" "}
        in notes to enforce blast-radius caps during execution.
      </p>
      {value.trim() ? (
        <p className="w-full rounded-md border border-accent/25 bg-accent/[0.09] px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-accent/95">
          {parsed ? `Will enforce max blast: ${parsed}` : "No max blast scope parsed from notes"}
        </p>
      ) : null}
      {invalidMaxBlastScope ? (
        <p
          id={validationHintId}
          className="w-full rounded-md border border-danger/40 bg-danger-dim/35 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-danger"
        >
          Invalid max blast scope. Use service, cluster, region, or global.
        </p>
      ) : null}
      <button
        type="submit"
        name="decision"
        value="accepted"
        disabled={invalidMaxBlastScope}
        title={acceptDisabledReason}
        aria-describedby={invalidMaxBlastScope ? validationHintId : undefined}
        className={acceptButtonClassName}
      >
        Accept
      </button>
      <button
        type="submit"
        name="decision"
        value="rejected"
        className={rejectButtonClassName}
      >
        Reject
      </button>
    </>
  );
}
