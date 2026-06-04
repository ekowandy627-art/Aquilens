-- Product Spec Sprint 1: operating + output-market jurisdictions on org and process

alter table public.tenants
  add column if not exists operating_jurisdictions text[] not null default '{}',
  add column if not exists output_market_jurisdictions text[] not null default '{}';

alter table public.processes
  add column if not exists operating_jurisdictions text[] not null default '{}',
  add column if not exists output_market_jurisdictions text[] not null default '{}',
  add column if not exists jurisdictions_inherit_org boolean not null default true;
