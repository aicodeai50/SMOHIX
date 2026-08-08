/**
 * Supabase / Postgres schema types for Smohix.
 *
 * Regenerate after schema changes (requires linked Supabase CLI project):
 *   supabase gen types typescript --linked > lib/supabase/database.types.ts
 *
 * Not yet wired into createClient() — use full generated output before enabling generics.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      contact_leads: {
        Row: {
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
          status: string;
          assigned_to: string | null;
          notes: string | null;
          metadata: Json;
          next_action: string | null;
          follow_up_date: string | null;
          priority: string;
          source_label: string | null;
          discovery_call_date: string | null;
          pilot_kickoff_date: string | null;
          review_meeting_date: string | null;
          pilot_project_id: string | null;
        };
        Insert: {
          id?: string;
          public_reference: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          email: string;
          company: string;
          country: string;
          inquiry_type: string;
          problem_summary: string;
          budget_range?: string | null;
          timeline?: string | null;
          product_context?: string | null;
          pilot_category?: string | null;
          consent?: boolean;
          source_path?: string | null;
          status?: string;
          assigned_to?: string | null;
          notes?: string | null;
          metadata?: Json;
          next_action?: string | null;
          follow_up_date?: string | null;
          priority?: string;
          source_label?: string | null;
          discovery_call_date?: string | null;
          pilot_kickoff_date?: string | null;
          review_meeting_date?: string | null;
          pilot_project_id?: string | null;
        };
        Update: {
          id?: string;
          public_reference?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          email?: string;
          company?: string;
          country?: string;
          inquiry_type?: string;
          problem_summary?: string;
          budget_range?: string | null;
          timeline?: string | null;
          product_context?: string | null;
          pilot_category?: string | null;
          consent?: boolean;
          source_path?: string | null;
          status?: string;
          assigned_to?: string | null;
          notes?: string | null;
          metadata?: Json;
          next_action?: string | null;
          follow_up_date?: string | null;
          priority?: string;
          source_label?: string | null;
          discovery_call_date?: string | null;
          pilot_kickoff_date?: string | null;
          review_meeting_date?: string | null;
          pilot_project_id?: string | null;
        };
        Relationships: [];
      };
      lead_activity: {
        Row: {
          id: string;
          lead_id: string;
          created_at: string;
          actor_email: string;
          event_type: string;
          summary: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          lead_id: string;
          created_at?: string;
          actor_email: string;
          event_type: string;
          summary: string;
          metadata?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      pilot_projects: {
        Row: {
          id: string;
          public_reference: string;
          lead_id: string | null;
          created_at: string;
          updated_at: string;
          name: string;
          organization: string;
          contact_name: string;
          contact_email: string;
          category: string | null;
          related_product: string | null;
          objective: string | null;
          scope: string | null;
          status: string;
          start_date: string | null;
          target_review_date: string | null;
          owner: string | null;
          risks: string | null;
          next_action: string | null;
          notes: string | null;
          discovery_call_date: string | null;
          pilot_kickoff_date: string | null;
          review_meeting_date: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          public_reference: string;
          lead_id?: string | null;
          name: string;
          organization: string;
          contact_name: string;
          contact_email: string;
          category?: string | null;
          related_product?: string | null;
          objective?: string | null;
          scope?: string | null;
          status?: string;
          start_date?: string | null;
          target_review_date?: string | null;
          owner?: string | null;
          risks?: string | null;
          next_action?: string | null;
          notes?: string | null;
          discovery_call_date?: string | null;
          pilot_kickoff_date?: string | null;
          review_meeting_date?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["pilot_projects"]["Insert"]>;
        Relationships: [];
      };
      pilot_activity: {
        Row: {
          id: string;
          pilot_id: string;
          created_at: string;
          actor_email: string;
          event_type: string;
          summary: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          pilot_id: string;
          created_at?: string;
          actor_email: string;
          event_type: string;
          summary: string;
          metadata?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          lemon_subscription_id: string;
          lemon_customer_id: string | null;
          lemon_order_id: string | null;
          lemon_product_id: string | null;
          lemon_variant_id: string | null;
          status: string;
          renews_at: string | null;
          ends_at: string | null;
          trial_ends_at: string | null;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          lemon_subscription_id: string;
          lemon_customer_id?: string | null;
          lemon_order_id?: string | null;
          lemon_product_id?: string | null;
          lemon_variant_id?: string | null;
          status: string;
          renews_at?: string | null;
          ends_at?: string | null;
          trial_ends_at?: string | null;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          lemon_subscription_id?: string;
          lemon_customer_id?: string | null;
          lemon_order_id?: string | null;
          lemon_product_id?: string | null;
          lemon_variant_id?: string | null;
          status?: string;
          renews_at?: string | null;
          ends_at?: string | null;
          trial_ends_at?: string | null;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          severity: "low" | "medium" | "high" | "critical";
          status: "investigating" | "mitigated" | "resolved" | "monitoring";
          updated_at: string;
          created_at: string;
          service_id: string | null;
          postmortem: string | null;
          external_ref: string | null;
          owner_hint: string | null;
          runbook_slug: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          severity: "low" | "medium" | "high" | "critical";
          status?: string;
          updated_at?: string;
          created_at?: string;
          service_id?: string | null;
          postmortem?: string | null;
          external_ref?: string | null;
          owner_hint?: string | null;
          runbook_slug?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          severity?: "low" | "medium" | "high" | "critical";
          status?: string;
          updated_at?: string;
          created_at?: string;
          service_id?: string | null;
          postmortem?: string | null;
          external_ref?: string | null;
          owner_hint?: string | null;
          runbook_slug?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          environment: string | null;
          owner_hint: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          environment?: string | null;
          owner_hint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          environment?: string | null;
          owner_hint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          created_at: string;
          event_type: string;
          user_id: string | null;
          details: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_type: string;
          user_id?: string | null;
          details?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_type?: string;
          user_id?: string | null;
          details?: Json | null;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_prefix: string;
          secret_hash: string;
          created_at: string;
          last_used_at: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          key_prefix: string;
          secret_hash: string;
          created_at?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_prefix?: string;
          secret_hash?: string;
          created_at?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      automation_dry_runs: {
        Row: {
          id: string;
          user_id: string;
          playbook_id: string;
          ok: boolean;
          summary: string | null;
          created_at: string;
          incident_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          playbook_id: string;
          ok: boolean;
          summary?: string | null;
          created_at?: string;
          incident_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          playbook_id?: string;
          ok?: boolean;
          summary?: string | null;
          created_at?: string;
          incident_id?: string | null;
        };
        Relationships: [];
      };
      remediation_runs: {
        Row: {
          id: string;
          user_id: string;
          incident_id: string | null;
          playbook_id: string;
          trigger_source: "incident" | "automation" | "manual";
          dry_run_ok: boolean;
          approval_note: string;
          rollback_plan: string;
          execution_ok: boolean;
          execution_mode: "simulated" | "connector";
          blocked_reason: string | null;
          guardrail_checks_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          incident_id?: string | null;
          playbook_id: string;
          trigger_source: "incident" | "automation" | "manual";
          dry_run_ok?: boolean;
          approval_note: string;
          rollback_plan: string;
          execution_ok?: boolean;
          execution_mode: "simulated" | "connector";
          blocked_reason?: string | null;
          guardrail_checks_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          incident_id?: string | null;
          playbook_id?: string;
          trigger_source?: "incident" | "automation" | "manual";
          dry_run_ok?: boolean;
          approval_note?: string;
          rollback_plan?: string;
          execution_ok?: boolean;
          execution_mode?: "simulated" | "connector";
          blocked_reason?: string | null;
          guardrail_checks_json?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      zentro_db_health: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      purge_stale_audit_log: {
        Args: { retention_days?: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
