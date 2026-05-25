-- HIPAA: healthcare BAA vendor category for third-party risk inheritance.

alter table public.third_party_vendors
  drop constraint if exists third_party_vendors_category_check;

alter table public.third_party_vendors
  add constraint third_party_vendors_category_check
  check (category in (
    'saas', 'cloud', 'security', 'data_processor', 'consulting', 'healthcare_baa', 'other'
  ));

comment on constraint third_party_vendors_category_check on public.third_party_vendors is
  'Vendor categories incl. healthcare_baa for HIPAA Security Rule / BAA control inheritance.';
