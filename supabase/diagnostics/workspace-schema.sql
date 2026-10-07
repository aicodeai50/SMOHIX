-- READ ONLY. Run in the connected Supabase project's SQL Editor, not PowerShell.
-- Returns schema metadata only; no accounts, keys, or customer records.
select expected.table_name,
       to_regclass('public.' || expected.table_name) is not null as table_exists
from (values
  ('profiles'), ('organizations'), ('organization_members'),
  ('subscriptions'), ('incidents'), ('services'), ('service_slos')
) as expected(table_name);

select expected.column_name,
       exists (
         select 1 from information_schema.columns actual
         where actual.table_schema = 'public'
           and actual.table_name = 'subscriptions'
           and actual.column_name = expected.column_name
       ) as column_exists
from (values
  ('user_id'), ('status'), ('renews_at'), ('ends_at'), ('trial_ends_at'),
  ('lemon_variant_id'), ('lemon_product_id'), ('paypal_subscription_id'),
  ('paypal_plan_id'), ('updated_at'), ('org_id')
) as expected(column_name);
