import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { getComplianceControl } from "@/lib/compliance/catalog";
import {
  buildVendorControlEvidenceRows,
  summarizeVendorEvidence,
} from "@/lib/third-party-risk/evidence";
import {
  inheritControlIdsForVendor,
  isVendorCategory,
  isVendorRiskTier,
  isVendorStatus,
} from "@/lib/third-party-risk/inheritance";
import type {
  ThirdPartyVendorRow,
  VendorCategory,
  VendorControlSource,
  VendorRiskTier,
  VendorStatus,
} from "@/lib/third-party-risk/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DbVendor = {
  id: string;
  org_id: string;
  name: string;
  category: VendorCategory;
  risk_tier: VendorRiskTier;
  status: VendorStatus;
  review_due_at: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
};

async function syncInheritedControls(
  supabase: SupabaseClient,
  vendorId: string,
  riskTier: VendorRiskTier,
  category: VendorCategory,
): Promise<void> {
  const inheritedIds = inheritControlIdsForVendor(riskTier, category);

  const { data: existing } = await supabase
    .from("third_party_vendor_controls")
    .select("control_id, source")
    .eq("vendor_id", vendorId);

  const explicit = new Set(
    (existing ?? [])
      .filter((r) => r.source === "explicit")
      .map((r) => r.control_id as string),
  );

  await supabase
    .from("third_party_vendor_controls")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("source", "inherited");

  const toInsert = inheritedIds
    .filter((id) => getComplianceControl(id))
    .map((control_id) => ({
      vendor_id: vendorId,
      control_id,
      source: "inherited" as VendorControlSource,
    }));

  if (toInsert.length > 0) {
    await supabase.from("third_party_vendor_controls").upsert(toInsert, {
      onConflict: "vendor_id,control_id",
    });
  }

  for (const controlId of explicit) {
    if (!getComplianceControl(controlId)) continue;
    await supabase.from("third_party_vendor_controls").upsert(
      {
        vendor_id: vendorId,
        control_id: controlId,
        source: "explicit",
      },
      { onConflict: "vendor_id,control_id" },
    );
  }
}

async function loadVendorControls(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  vendorId: string,
): Promise<ThirdPartyVendorRow["controls"]> {
  const { data } = await supabase
    .from("third_party_vendor_controls")
    .select("control_id, source")
    .eq("vendor_id", vendorId);

  const controlIds = (data ?? []).map((r) => ({
    controlId: r.control_id as string,
    source: r.source as VendorControlSource,
  }));

  return buildVendorControlEvidenceRows(userId, orgId, controlIds);
}

export async function listThirdPartyVendors(
  userId: string,
  orgId: string,
  supabase?: SupabaseClient,
): Promise<ThirdPartyVendorRow[]> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("third_party_vendors")
    .select(
      "id, org_id, name, category, risk_tier, status, review_due_at, contact_email, notes, created_at",
    )
    .eq("org_id", orgId)
    .order("risk_tier", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data) return [];

  const rows: ThirdPartyVendorRow[] = [];
  for (const raw of data as DbVendor[]) {
    const controls = await loadVendorControls(client, userId, orgId, raw.id);
    const summary = summarizeVendorEvidence(controls);
    rows.push({
      id: raw.id,
      orgId: raw.org_id,
      name: raw.name,
      category: raw.category,
      riskTier: raw.risk_tier,
      status: raw.status,
      reviewDueAt: raw.review_due_at,
      contactEmail: raw.contact_email,
      notes: raw.notes,
      createdAt: raw.created_at,
      controls,
      controlCount: controls.length,
      ...summary,
    });
  }
  return rows;
}

export type CreateVendorResult =
  | { ok: true; vendorId: string }
  | { ok: false; reason: string };

export async function createThirdPartyVendor(
  userId: string,
  orgId: string,
  input: {
    name: string;
    category: VendorCategory;
    riskTier: VendorRiskTier;
    status?: VendorStatus;
    reviewDueAtIso?: string | null;
    contactEmail?: string | null;
    notes?: string | null;
  },
  supabase?: SupabaseClient,
): Promise<CreateVendorResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, reason: "Vendor name is required." };
  if (!isVendorCategory(input.category)) return { ok: false, reason: "Invalid category." };
  if (!isVendorRiskTier(input.riskTier)) return { ok: false, reason: "Invalid risk tier." };
  const status = input.status ?? "active";
  if (!isVendorStatus(status)) return { ok: false, reason: "Invalid status." };

  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("third_party_vendors")
    .insert({
      org_id: orgId,
      name,
      category: input.category,
      risk_tier: input.riskTier,
      status,
      review_due_at: input.reviewDueAtIso ?? null,
      contact_email: input.contactEmail?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "Could not create vendor." };
  }

  const vendorId = data.id as string;
  await syncInheritedControls(client, vendorId, input.riskTier, input.category);

  const inherited = inheritControlIdsForVendor(input.riskTier, input.category);
  await appendAuditEvent({
    event_type: "governance.third_party_vendor_created",
    user_id: userId,
    org_id: orgId,
    details: {
      vendor_id: vendorId,
      name,
      risk_tier: input.riskTier,
      category: input.category,
      inherited_control_count: inherited.length,
    },
  });

  return { ok: true, vendorId };
}

export type UpdateVendorResult = { ok: true } | { ok: false; reason: string };

export async function updateThirdPartyVendor(
  userId: string,
  orgId: string,
  vendorId: string,
  input: {
    riskTier?: VendorRiskTier;
    category?: VendorCategory;
    status?: VendorStatus;
    reviewDueAtIso?: string | null;
    notes?: string | null;
  },
  supabase?: SupabaseClient,
): Promise<UpdateVendorResult> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data: existing, error: fetchErr } = await client
    .from("third_party_vendors")
    .select("id, org_id, risk_tier, category")
    .eq("id", vendorId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (fetchErr || !existing) return { ok: false, reason: "Vendor not found." };

  const riskTier = (input.riskTier ?? existing.risk_tier) as VendorRiskTier;
  const category = (input.category ?? existing.category) as VendorCategory;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    risk_tier: riskTier,
    category,
  };
  if (input.status !== undefined) patch.status = input.status;
  if (input.reviewDueAtIso !== undefined) patch.review_due_at = input.reviewDueAtIso;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;

  const { error } = await client.from("third_party_vendors").update(patch).eq("id", vendorId);
  if (error) return { ok: false, reason: error.message };

  if (input.riskTier !== undefined || input.category !== undefined) {
    await syncInheritedControls(client, vendorId, riskTier, category);
    await appendAuditEvent({
      event_type: "governance.third_party_vendor_controls_synced",
      user_id: userId,
      org_id: orgId,
      details: {
        vendor_id: vendorId,
        risk_tier: riskTier,
        category,
        inherited_control_count: inheritControlIdsForVendor(riskTier, category).length,
      },
    });
  }

  return { ok: true };
}
