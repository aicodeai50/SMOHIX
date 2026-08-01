"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Input, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";
import {
  BUDGET_RANGES,
  buildContactMailto,
  INQUIRY_TYPES,
  MIN_SUBMIT_MS,
  TIMELINE_OPTIONS,
  validateContactForm,
  type ContactFormValues,
  type InquiryType,
} from "@/lib/contact-form";
import { getMailtoHref, SITE_EMAIL_CONTACT } from "@/lib/billing";
import { mBody } from "@/lib/marketing-layout";

const defaultValues = (inquiry: InquiryType): ContactFormValues => ({
  name: "",
  email: "",
  company: "",
  country: "",
  inquiryType: inquiry,
  problem: "",
  budget: "",
  timeline: "",
  consent: false,
  website: "",
});

export function ContactForm({
  defaultInquiry = "general",
  productHint,
  pilotCategory,
  successMessage,
}: {
  defaultInquiry?: InquiryType;
  productHint?: string;
  pilotCategory?: string;
  successMessage?: string;
}) {
  const formId = useId();
  const mountedAt = useRef(0);
  const [values, setValues] = useState<ContactFormValues>(() =>
    defaultValues(defaultInquiry),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormValues, string>>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [startedTracked, setStartedTracked] = useState(false);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  const setField = useCallback(
    <K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) => {
      if (!startedTracked && (key === "name" || key === "email")) {
        trackEvent("contact_form_started", { inquiryType: values.inquiryType });
        setStartedTracked(true);
      }
      setValues((v) => ({ ...v, [key]: value }));
      setErrors((e) => ({ ...e, [key]: undefined }));
      setFieldErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    },
    [startedTracked, values.inquiryType],
  );

  const fallbackMailto = useCallback(
    (problem: string) => {
      const mailto = buildContactMailto({ ...values, problem });
      try {
        window.location.href = mailto;
      } catch {
        setFormError(`Could not open your email client. Email ${SITE_EMAIL_CONTACT} directly.`);
      }
    },
    [values],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setFormError(null);
    setFieldErrors({});

    const submitDurationMs = performance.now() - mountedAt.current;
    if (submitDurationMs < MIN_SUBMIT_MS) {
      setFormError("Please wait a moment before submitting.");
      setStatus("error");
      return;
    }

    const nextErrors = validateContactForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      trackEvent("contact_form_validation_error", { inquiryType: values.inquiryType });
      return;
    }

    const problem =
      productHint && !values.problem.includes(productHint)
        ? `[Product: ${productHint}]\n\n${values.problem}`
        : values.problem;

    setStatus("loading");
    trackEvent("contact_form_submitted", { inquiryType: values.inquiryType });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          problem,
          productContext: productHint ?? null,
          pilotCategory: pilotCategory ?? null,
          sourcePath: typeof window !== "undefined" ? window.location.pathname : null,
          submitDurationMs,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        referenceId?: string;
        code?: string;
        message?: string;
        fieldErrors?: Record<string, string>;
      };

      if (res.status === 429 || data.code === "RATE_LIMITED") {
        setFormError(data.message ?? "Too many submissions. Please try again later.");
        setStatus("error");
        trackEvent("contact_form_rate_limited", { inquiryType: values.inquiryType });
        return;
      }

      if (res.status === 503 || data.code === "STORAGE_UNAVAILABLE") {
        fallbackMailto(problem);
        setStatus("success");
        setFormError(null);
        return;
      }

      if (!res.ok || !data.success) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          trackEvent("contact_form_validation_error", { inquiryType: values.inquiryType });
        }
        setFormError(data.message ?? "Could not submit your enquiry. Please try again.");
        setStatus("error");
        return;
      }

      setReferenceId(data.referenceId ?? null);
      setStatus("success");
      setValues(defaultValues(defaultInquiry));
      trackEvent("contact_form_success", { inquiryType: values.inquiryType });

      if (values.inquiryType === "pilot") {
        trackEvent("pilot_application_success", { inquiryType: "pilot" });
      }
      if (values.inquiryType === "developer") {
        trackEvent("developer_access_request", { inquiryType: "developer" });
      }
    } catch {
      fallbackMailto(problem);
      setStatus("success");
    }
  };

  const errorSummaryId = `${formId}-errors`;
  const allFieldErrors = { ...errors, ...fieldErrors };
  const formLevelError =
    formError ?? fieldErrors._form ?? errors.website ?? null;

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-accent/30 bg-accent-dim/30 p-6">
        <h2 className="text-lg font-semibold text-foreground">Thank you.</h2>
        <p className={`mt-2 ${mBody}`}>
          {referenceId
            ? "Your enquiry has been received."
            : "Your email client should open to complete the enquiry."}
        </p>
        {referenceId ? (
          <p className={`mt-3 font-mono text-sm text-accent`}>Reference: {referenceId}</p>
        ) : null}
        {successMessage ? (
          <p className={`mt-3 text-sm ${mBody}`}>{successMessage}</p>
        ) : null}
        {!referenceId ? (
          <p className={`mt-3 text-sm ${mBody}`}>
            Or{" "}
            <a href={getMailtoHref("general")} className="text-accent hover:underline">
              email us directly
            </a>
            .
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={formError ? errorSummaryId : undefined}
        className="space-y-5"
      >
        {(formError || Object.keys(allFieldErrors).length > 0) && status === "error" ? (
          <div
            id={errorSummaryId}
            role="alert"
            className="rounded-xl border border-warning/30 bg-warning-dim/40 px-4 py-3 text-sm text-warning"
          >
            {formLevelError ?? "Please fix the highlighted fields below."}
          </div>
        ) : null}

        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
          <label htmlFor={`${formId}-website`}>Website</label>
          <input
            id={`${formId}-website`}
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => setField("website", e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Name"
            required
            autoComplete="name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            aria-invalid={Boolean(allFieldErrors.name)}
          />
          <Input
            label="Work email"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            aria-invalid={Boolean(allFieldErrors.email)}
          />
          <Input
            label="Company or organization"
            required
            autoComplete="organization"
            value={values.company}
            onChange={(e) => setField("company", e.target.value)}
            aria-invalid={Boolean(allFieldErrors.company)}
          />
          <Input
            label="Country"
            required
            autoComplete="country-name"
            value={values.country}
            onChange={(e) => setField("country", e.target.value)}
            aria-invalid={Boolean(allFieldErrors.country)}
          />
        </div>
        {(allFieldErrors.name ||
          allFieldErrors.email ||
          allFieldErrors.company ||
          allFieldErrors.country) && (
          <div className="space-y-1 text-xs text-warning">
            {allFieldErrors.name ? <p>{allFieldErrors.name}</p> : null}
            {allFieldErrors.email ? <p>{allFieldErrors.email}</p> : null}
            {allFieldErrors.company ? <p>{allFieldErrors.company}</p> : null}
            {allFieldErrors.country ? <p>{allFieldErrors.country}</p> : null}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor={`${formId}-inquiry`}
            className="block text-sm font-medium text-foreground/90"
          >
            Inquiry type
          </label>
          <select
            id={`${formId}-inquiry`}
            value={values.inquiryType}
            onChange={(e) => setField("inquiryType", e.target.value as InquiryType)}
            className="w-full rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {INQUIRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Textarea
          label="What problem are you trying to solve?"
          required
          rows={5}
          value={values.problem}
          onChange={(e) => setField("problem", e.target.value)}
          aria-invalid={Boolean(allFieldErrors.problem)}
          hint="Share context, constraints, and what success looks like."
        />
        {allFieldErrors.problem ? (
          <p className="text-xs text-warning">{allFieldErrors.problem}</p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor={`${formId}-budget`}
              className="block text-sm font-medium text-foreground/90"
            >
              Budget range <span className="text-muted">(optional)</span>
            </label>
            <select
              id={`${formId}-budget`}
              value={values.budget}
              onChange={(e) => setField("budget", e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {BUDGET_RANGES.map((b) => (
                <option key={b.value || "none"} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor={`${formId}-timeline`}
              className="block text-sm font-medium text-foreground/90"
            >
              Timeline <span className="text-muted">(optional)</span>
            </label>
            <select
              id={`${formId}-timeline`}
              value={values.timeline}
              onChange={(e) => setField("timeline", e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {TIMELINE_OPTIONS.map((t) => (
                <option key={t.value || "none"} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(e) => setField("consent", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-surface accent-accent focus:ring-2 focus:ring-accent/30"
            aria-invalid={Boolean(allFieldErrors.consent)}
          />
          <span className={`text-sm ${mBody}`}>
            I agree that Zentro Technologies may contact me about this inquiry. See{" "}
            <a href="/privacy" className="text-accent hover:underline">
              Privacy
            </a>
            .
          </span>
        </label>
        {allFieldErrors.consent ? (
          <p className="text-xs text-warning">{allFieldErrors.consent}</p>
        ) : null}

        <Button type="submit" size="lg" disabled={status === "loading"} aria-busy={status === "loading"}>
          {status === "loading" ? "Submitting…" : "Submit inquiry"}
        </Button>
      </form>
    </div>
  );
}
