import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/observability/logger";

import {
  duplicateFingerprint,
  generatePublicReference,
  type LeadStatus,
  type NormalizedLead,
} from "./leads";

export type StoredLead = {
  id: string;
  publicReference: string;
  createdAt: string;
};

export type ContactLeadRow = {
  id: string;
  public_reference: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  company: string;
  country: string;
  inquiry_type: string;
  problem_summary: string;
  budget_range: string | null;
  timeline: string | null;
  product_context: string | null;
  pilot_category: string | null;
  consent: boolean;
  source_path: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
};

/** Dev-only in-memory store when Supabase service role is unavailable. */
const devLeads: ContactLeadRow[] = [];

function isDevFallbackEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.ZENTRO_CONTACT_DEV_STORE === "1";
}

export function isContactStorageConfigured(): boolean {
  return Boolean(createServiceSupabaseClient()) || isDevFallbackEnabled();
}

export async function findRecentDuplicate(
  email: string,
  problemSummary: string,
): Promise<boolean> {
  const fingerprint = duplicateFingerprint(email, problemSummary);
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    if (isDevFallbackEnabled()) {
      return devLeads.some(
        (l) =>
          duplicateFingerprint(l.email, l.problem_summary) === fingerprint &&
          Date.now() - new Date(l.created_at).getTime() < 24 * 60 * 60 * 1000,
      );
    }
    return false;
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("contact_leads")
    .select("id, email, problem_summary, created_at")
    .gte("created_at", since)
    .eq("email", email.toLowerCase())
    .limit(20);

  if (error || !data) return false;

  return data.some(
    (row) => duplicateFingerprint(row.email, row.problem_summary) === fingerprint,
  );
}

export async function insertContactLead(lead: NormalizedLead): Promise<StoredLead> {
  const publicReference = generatePublicReference();
  const supabase = createServiceSupabaseClient();

  const row = {
    public_reference: publicReference,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    country: lead.country,
    inquiry_type: lead.inquiryType,
    problem_summary: lead.problemSummary,
    budget_range: lead.budgetRange,
    timeline: lead.timeline,
    product_context: lead.productContext,
    pilot_category: lead.pilotCategory,
    consent: lead.consent,
    source_path: lead.sourcePath,
    status: "new" as const,
    metadata: lead.metadata,
  };

  if (!supabase) {
    if (!isDevFallbackEnabled()) {
      throw new Error("STORAGE_UNAVAILABLE");
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    devLeads.unshift({
      id,
      created_at: now,
      updated_at: now,
      assigned_to: null,
      notes: null,
      ...row,
    });
    return { id, publicReference, createdAt: now };
  }

  const { data, error } = await supabase
    .from("contact_leads")
    .insert(row)
    .select("id, public_reference, created_at")
    .single();

  if (error || !data) {
    logEvent("error", "contact_stored", { code: "insert_failed" });
    throw new Error("STORAGE_FAILED");
  }

  return {
    id: data.id,
    publicReference: data.public_reference,
    createdAt: data.created_at,
  };
}

export async function listContactLeads(options: {
  page: number;
  limit: number;
  inquiryType?: string | null;
  status?: LeadStatus | null;
  search?: string | null;
}): Promise<{ rows: ContactLeadRow[]; total: number }> {
  const supabase = createServiceSupabaseClient();
  const offset = (options.page - 1) * options.limit;

  if (!supabase) {
    if (!isDevFallbackEnabled()) {
      return { rows: [], total: 0 };
    }
    let filtered = [...devLeads];
    if (options.inquiryType) {
      filtered = filtered.filter((r) => r.inquiry_type === options.inquiryType);
    }
    if (options.status) {
      filtered = filtered.filter((r) => r.status === options.status);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.public_reference.toLowerCase().includes(q),
      );
    }
    return {
      rows: filtered.slice(offset, offset + options.limit),
      total: filtered.length,
    };
  }

  let query = supabase
    .from("contact_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + options.limit - 1);

  if (options.inquiryType) {
    query = query.eq("inquiry_type", options.inquiryType);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.search) {
    const q = options.search.trim().slice(0, 100);
    query = query.or(`email.ilike.%${q}%,company.ilike.%${q}%,public_reference.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error || !data) {
    return { rows: [], total: 0 };
  }

  return { rows: data as ContactLeadRow[], total: count ?? data.length };
}

export async function updateContactLead(
  id: string,
  patch: { status?: LeadStatus; notes?: string | null; assignedTo?: string | null },
): Promise<boolean> {
  const supabase = createServiceSupabaseClient();
  const update: Record<string, unknown> = {};
  if (patch.status) update.status = patch.status;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;

  if (!supabase) {
    if (!isDevFallbackEnabled()) return false;
    const row = devLeads.find((l) => l.id === id);
    if (!row) return false;
    if (patch.status) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes;
    if (patch.assignedTo !== undefined) row.assigned_to = patch.assignedTo;
    row.updated_at = new Date().toISOString();
    return true;
  }

  const { error } = await supabase.from("contact_leads").update(update).eq("id", id);
  return !error;
}
