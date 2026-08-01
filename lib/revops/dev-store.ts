import type { ExtendedLeadRow } from "./leads";

/** Dev in-memory extended leads — synced when contact dev store inserts. */
export const devLeadsExtended: ExtendedLeadRow[] = [];

export function seedDevLeadFromContact(row: {
  id: string;
  public_reference: string;
  created_at: string;
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
  source_path: string | null;
  status: ExtendedLeadRow["status"];
  metadata: Record<string, unknown>;
}): void {
  devLeadsExtended.unshift({
    ...row,
    updated_at: row.created_at,
    consent: true,
    assigned_to: null,
    notes: null,
    next_action: null,
    follow_up_date: null,
    priority: "normal",
    source_label: row.source_path,
    discovery_call_date: null,
    pilot_kickoff_date: null,
    review_meeting_date: null,
    pilot_project_id: null,
  });
}
