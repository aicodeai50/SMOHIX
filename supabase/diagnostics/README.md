# Private workspace database checks

Run these commands from `C:\Users\sandr\OneDrive\Desktop\SMOHIX\SMOHIX`.
These files are development tools, not public pages or API responses.

```powershell
npx supabase login
npx supabase db query --linked --file supabase/diagnostics/workspace-schema.sql
```

The query reads schema metadata only. It does not read accounts, secrets, billing
records, or incidents, and it does not apply migrations.

An empty remote migration history does not establish that the database is empty.
Manually created tables can exist without migration records. Check the actual
schema before applying pending migrations. Do not replay the fresh-project
`apply-all-migrations.sql` bundle against an existing project.

`PGRST205` for organization membership means the database API could not find the
queried table. Check `organizations` and `organization_members`, the connected
project, and its schema cache. `42703` from the subscription lookup means one of
the selected columns does not exist; the diagnostic lists each expected column.

The platform's operations workspace reads Supabase through its own server code.
The separate Own API, Identity, Hub, SH, and Robot projects do not create these
tables in this database automatically.
