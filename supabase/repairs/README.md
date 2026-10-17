# Workspace schema recovery

`workspace-schema-recovery.sql` is a targeted operational repair for the observed
organization membership `PGRST205` and subscription `42703` failures.
It is not the full migration bundle and does not baseline migration history.

Run from `C:\Users\sandr\OneDrive\Desktop\SMOHIX\SMOHIX`, using the Supabase project
that the deployed Smohix web service actually queries:

```powershell
npx supabase db query --linked --file supabase/repairs/workspace-schema-recovery.sql
npx supabase db query --linked --file supabase/diagnostics/workspace-schema.sql
```

The recovery adds the three missing subscription columns, bootstraps the
organization/member tables and their original role-based policies if absent,
and requests an API schema cache reload. It runs in one transaction, preserves
existing records and existing policies, and can be repeated. Functions are
restricted to authenticated callers. Row-level security remains enabled.

The SQL was verified against a temporary PostgreSQL instance: repeated execution,
subscription data preservation, organization creation, and cross-user read denial
passed. This does not prove compatibility with every manually modified production
schema. A database error rolls back the transaction; share its error code to
diagnose without exposing credentials or customer data.

After applying, recheck Hub and Services and inspect server-side error codes.
Further absent tables or columns require targeted follow-up. Do not mark all
historical migrations applied, or run the fresh-project bundle blindly.
