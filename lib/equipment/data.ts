import { createServerSupabaseClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function toIntOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOrNull(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export type CertificateRow = {
  id: string;
  name: string;
  environment: string | null;
  issuer: string | null;
  expiresAt: string | null;
  ownerHint: string | null;
  autoRenew: boolean;
};

export async function listCertificatesForUser(userId: string): Promise<CertificateRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("asset_certificates")
      .select("id, name, environment, issuer, expires_at, owner_hint, auto_renew")
      .eq("user_id", userId)
      .order("expires_at", { ascending: true, nullsFirst: false });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      environment: (row.environment as string | null) ?? null,
      issuer: (row.issuer as string | null) ?? null,
      expiresAt: (row.expires_at as string | null) ?? null,
      ownerHint: (row.owner_hint as string | null) ?? null,
      autoRenew: Boolean(row.auto_renew),
    }));
  } catch {
    return [];
  }
}

export async function createCertificateForUser(
  userId: string,
  input: {
    name: string;
    environment?: string;
    cn?: string;
    sans?: string;
    issuer?: string;
    expiresAt?: string;
    ownerHint?: string;
    autoRenew?: boolean;
    notes?: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, reason: "Name is required." };
  try {
    const supabase = await createServerSupabaseClient();
    const sans = (input.sans ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);
    const { error } = await supabase.from("asset_certificates").insert({
      user_id: userId,
      name: name.slice(0, 200),
      environment: input.environment?.trim().slice(0, 120) || null,
      cn: input.cn?.trim().slice(0, 255) || null,
      sans,
      issuer: input.issuer?.trim().slice(0, 200) || null,
      expires_at: toDateOrNull(input.expiresAt),
      owner_hint: input.ownerHint?.trim().slice(0, 200) || null,
      auto_renew: Boolean(input.autoRenew),
      notes: input.notes?.trim().slice(0, 4000) || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create certificate." };
  }
}

export async function deleteCertificateForUser(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(id)) return { ok: false, reason: "Invalid certificate id." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("asset_certificates").delete().eq("id", id).eq("user_id", userId);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Delete failed." };
  }
}

export type SecretRow = {
  id: string;
  name: string;
  secretType: string;
  environment: string | null;
  nextRotateAt: string | null;
  rotationPolicyDays: number;
};

export async function listSecretsForUser(userId: string): Promise<SecretRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("asset_secrets")
      .select("id, name, secret_type, environment, next_rotate_at, rotation_policy_days")
      .eq("user_id", userId)
      .order("next_rotate_at", { ascending: true, nullsFirst: false });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      secretType: row.secret_type as string,
      environment: (row.environment as string | null) ?? null,
      nextRotateAt: (row.next_rotate_at as string | null) ?? null,
      rotationPolicyDays: Number(row.rotation_policy_days ?? 90),
    }));
  } catch {
    return [];
  }
}

export async function createSecretForUser(
  userId: string,
  input: {
    name: string;
    secretType?: string;
    environment?: string;
    rotationPolicyDays?: string;
    lastRotatedAt?: string;
    nextRotateAt?: string;
    ownerHint?: string;
    notes?: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, reason: "Name is required." };
  try {
    const supabase = await createServerSupabaseClient();
    const rotation = toIntOrNull(input.rotationPolicyDays) ?? 90;
    const { error } = await supabase.from("asset_secrets").insert({
      user_id: userId,
      name: name.slice(0, 200),
      secret_type: (input.secretType ?? "api_key").slice(0, 30),
      environment: input.environment?.trim().slice(0, 120) || null,
      rotation_policy_days: Math.max(1, rotation),
      last_rotated_at: toDateOrNull(input.lastRotatedAt),
      next_rotate_at: toDateOrNull(input.nextRotateAt),
      owner_hint: input.ownerHint?.trim().slice(0, 200) || null,
      notes: input.notes?.trim().slice(0, 4000) || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create secret." };
  }
}

export async function deleteSecretForUser(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(id)) return { ok: false, reason: "Invalid secret id." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("asset_secrets").delete().eq("id", id).eq("user_id", userId);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Delete failed." };
  }
}

export type BackupPolicyRow = {
  id: string;
  name: string;
  assetScope: string | null;
  enabled: boolean;
  ownerHint: string | null;
};

export async function listBackupPoliciesForUser(userId: string): Promise<BackupPolicyRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("backup_policies")
      .select("id, name, asset_scope, enabled, owner_hint")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      assetScope: (row.asset_scope as string | null) ?? null,
      enabled: Boolean(row.enabled),
      ownerHint: (row.owner_hint as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function createBackupPolicyForUser(
  userId: string,
  input: {
    name: string;
    assetScope?: string;
    rpoTargetMinutes?: string;
    rtoTargetMinutes?: string;
    retentionDays?: string;
    ownerHint?: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, reason: "Name is required." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("backup_policies").insert({
      user_id: userId,
      name: name.slice(0, 200),
      asset_scope: input.assetScope?.trim().slice(0, 200) || null,
      rpo_target_minutes: toIntOrNull(input.rpoTargetMinutes),
      rto_target_minutes: toIntOrNull(input.rtoTargetMinutes),
      retention_days: toIntOrNull(input.retentionDays),
      owner_hint: input.ownerHint?.trim().slice(0, 200) || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create backup policy." };
  }
}

export async function deleteBackupPolicyForUser(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(id)) return { ok: false, reason: "Invalid backup policy id." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("backup_policies").delete().eq("id", id).eq("user_id", userId);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Delete failed." };
  }
}

export type NetworkDeviceRow = {
  id: string;
  hostname: string;
  deviceRole: string | null;
  site: string | null;
  firmwareVersion: string | null;
  environment: string | null;
};

export async function listNetworkDevicesForUser(userId: string): Promise<NetworkDeviceRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("network_devices")
      .select("id, hostname, device_role, site, firmware_version, environment")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      hostname: row.hostname as string,
      deviceRole: (row.device_role as string | null) ?? null,
      site: (row.site as string | null) ?? null,
      firmwareVersion: (row.firmware_version as string | null) ?? null,
      environment: (row.environment as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function createNetworkDeviceForUser(
  userId: string,
  input: {
    hostname: string;
    deviceRole?: string;
    vendor?: string;
    model?: string;
    serialNumber?: string;
    mgmtIp?: string;
    site?: string;
    environment?: string;
    firmwareVersion?: string;
    ownerHint?: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const hostname = input.hostname.trim();
  if (!hostname) return { ok: false, reason: "Hostname is required." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("network_devices").insert({
      user_id: userId,
      hostname: hostname.slice(0, 200),
      device_role: input.deviceRole?.trim().slice(0, 120) || null,
      vendor: input.vendor?.trim().slice(0, 120) || null,
      model: input.model?.trim().slice(0, 120) || null,
      serial_number: input.serialNumber?.trim().slice(0, 120) || null,
      mgmt_ip: input.mgmtIp?.trim().slice(0, 100) || null,
      site: input.site?.trim().slice(0, 120) || null,
      environment: input.environment?.trim().slice(0, 120) || null,
      firmware_version: input.firmwareVersion?.trim().slice(0, 120) || null,
      owner_hint: input.ownerHint?.trim().slice(0, 200) || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create network device." };
  }
}

export async function deleteNetworkDeviceForUser(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(id)) return { ok: false, reason: "Invalid network device id." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("network_devices").delete().eq("id", id).eq("user_id", userId);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Delete failed." };
  }
}

export type AccessRuleRow = {
  id: string;
  ruleName: string;
  minMfaCoveragePercent: number | null;
  blockHighRiskWithoutApproval: boolean;
  enabled: boolean;
};

export type AccessSnapshotRow = {
  id: string;
  capturedAt: string;
  mfaCoveragePercent: number | null;
  privilegedAccountsTotal: number | null;
  privilegedAccountsMfaEnabled: number | null;
  stalePrivilegedAccounts: number | null;
  sourceSystem: string | null;
};

export async function listAccessRulesForUser(userId: string): Promise<AccessRuleRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("access_policy_rules")
      .select("id, rule_name, min_mfa_coverage_percent, block_high_risk_without_approval, enabled")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      ruleName: row.rule_name as string,
      minMfaCoveragePercent: row.min_mfa_coverage_percent == null ? null : Number(row.min_mfa_coverage_percent),
      blockHighRiskWithoutApproval: Boolean(row.block_high_risk_without_approval),
      enabled: Boolean(row.enabled),
    }));
  } catch {
    return [];
  }
}

export async function listAccessSnapshotsForUser(userId: string): Promise<AccessSnapshotRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("access_posture_snapshots")
      .select(
        "id, captured_at, mfa_coverage_percent, privileged_accounts_total, privileged_accounts_mfa_enabled, stale_privileged_accounts, source_system",
      )
      .eq("user_id", userId)
      .order("captured_at", { ascending: false })
      .limit(8);
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      capturedAt: row.captured_at as string,
      mfaCoveragePercent: row.mfa_coverage_percent == null ? null : Number(row.mfa_coverage_percent),
      privilegedAccountsTotal: row.privileged_accounts_total == null ? null : Number(row.privileged_accounts_total),
      privilegedAccountsMfaEnabled:
        row.privileged_accounts_mfa_enabled == null ? null : Number(row.privileged_accounts_mfa_enabled),
      stalePrivilegedAccounts:
        row.stale_privileged_accounts == null ? null : Number(row.stale_privileged_accounts),
      sourceSystem: (row.source_system as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function createAccessRuleForUser(
  userId: string,
  input: {
    ruleName: string;
    minMfaCoveragePercent?: string;
    blockHighRiskWithoutApproval?: boolean;
    enabled?: boolean;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const ruleName = input.ruleName.trim();
  if (!ruleName) return { ok: false, reason: "Rule name is required." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("access_policy_rules").insert({
      user_id: userId,
      rule_name: ruleName.slice(0, 200),
      min_mfa_coverage_percent: toNumberOrNull(input.minMfaCoveragePercent),
      block_high_risk_without_approval: Boolean(input.blockHighRiskWithoutApproval),
      enabled: input.enabled !== false,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create access rule." };
  }
}

export async function createAccessSnapshotForUser(
  userId: string,
  input: {
    capturedAt?: string;
    mfaCoveragePercent?: string;
    privilegedAccountsTotal?: string;
    privilegedAccountsMfaEnabled?: string;
    stalePrivilegedAccounts?: string;
    sourceSystem?: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("access_posture_snapshots").insert({
      user_id: userId,
      captured_at: toDateOrNull(input.capturedAt) ?? new Date().toISOString(),
      mfa_coverage_percent: toNumberOrNull(input.mfaCoveragePercent),
      privileged_accounts_total: toIntOrNull(input.privilegedAccountsTotal),
      privileged_accounts_mfa_enabled: toIntOrNull(input.privilegedAccountsMfaEnabled),
      stale_privileged_accounts: toIntOrNull(input.stalePrivilegedAccounts),
      source_system: input.sourceSystem?.trim().slice(0, 120) || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create access snapshot." };
  }
}

export async function deleteAccessRuleForUser(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(id)) return { ok: false, reason: "Invalid rule id." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("access_policy_rules").delete().eq("id", id).eq("user_id", userId);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Delete failed." };
  }
}

export type ChangeWindowRow = {
  id: string;
  title: string;
  environment: string | null;
  riskLevel: string;
  startsAt: string;
  endsAt: string;
  requiresApproval: boolean;
};

export async function listChangeWindowsForUser(userId: string): Promise<ChangeWindowRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("change_windows")
      .select("id, title, environment, risk_level, starts_at, ends_at, requires_approval")
      .eq("user_id", userId)
      .order("starts_at", { ascending: true });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      environment: (row.environment as string | null) ?? null,
      riskLevel: row.risk_level as string,
      startsAt: row.starts_at as string,
      endsAt: row.ends_at as string,
      requiresApproval: Boolean(row.requires_approval),
    }));
  } catch {
    return [];
  }
}

export type ChangeActionRow = {
  id: string;
  changeWindowId: string;
  actionType: string;
  targetRef: string | null;
  status: string;
  executedAt: string | null;
};

export async function listChangeActionsForUser(userId: string): Promise<ChangeActionRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("change_actions")
      .select("id, change_window_id, action_type, target_ref, status, executed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: row.id as string,
      changeWindowId: row.change_window_id as string,
      actionType: row.action_type as string,
      targetRef: (row.target_ref as string | null) ?? null,
      status: row.status as string,
      executedAt: (row.executed_at as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function createChangeWindowForUser(
  userId: string,
  input: {
    title: string;
    environment?: string;
    startsAt?: string;
    endsAt?: string;
    riskLevel?: string;
    requiresApproval?: boolean;
    ownerHint?: string;
    notes?: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const title = input.title.trim();
  if (!title) return { ok: false, reason: "Title is required." };
  const startsAt = toDateOrNull(input.startsAt);
  const endsAt = toDateOrNull(input.endsAt);
  if (!startsAt || !endsAt) return { ok: false, reason: "Start and end are required." };
  if (new Date(endsAt).valueOf() <= new Date(startsAt).valueOf()) {
    return { ok: false, reason: "End must be after start." };
  }
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("change_windows").insert({
      user_id: userId,
      title: title.slice(0, 200),
      environment: input.environment?.trim().slice(0, 120) || null,
      starts_at: startsAt,
      ends_at: endsAt,
      risk_level: (input.riskLevel ?? "medium").slice(0, 20),
      requires_approval: Boolean(input.requiresApproval),
      owner_hint: input.ownerHint?.trim().slice(0, 200) || null,
      notes: input.notes?.trim().slice(0, 4000) || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create change window." };
  }
}

export async function deleteChangeWindowForUser(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(id)) return { ok: false, reason: "Invalid change window id." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("change_windows").delete().eq("id", id).eq("user_id", userId);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Delete failed." };
  }
}

export async function createChangeActionForUser(
  userId: string,
  input: {
    changeWindowId?: string;
    actionType?: string;
    targetRef?: string;
    status?: string;
    executedAt?: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const changeWindowId = String(input.changeWindowId ?? "").trim();
  const actionType = String(input.actionType ?? "").trim();
  if (!isUuid(changeWindowId)) return { ok: false, reason: "Valid change window is required." };
  if (!actionType) return { ok: false, reason: "Action type is required." };
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("change_actions").insert({
      user_id: userId,
      change_window_id: changeWindowId,
      action_type: actionType.slice(0, 120),
      target_ref: input.targetRef?.trim().slice(0, 300) || null,
      status: (input.status ?? "planned").slice(0, 20),
      executed_at: toDateOrNull(input.executedAt),
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Failed to create change action." };
  }
}
