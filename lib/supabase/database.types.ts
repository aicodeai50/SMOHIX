/**
 * Supabase / Postgres schema types for Zentro.
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
