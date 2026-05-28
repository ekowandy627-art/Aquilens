-- Phase 14: guidance library + tenant selections

create table if not exists public.guidance_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  pack_type text not null check (pack_type in ('standard','regulation','policy','guidance_area')),
  sector text[] not null default '{}',
  jurisdiction text[] not null default '{}',
  version_label text not null,
  effective_date date not null,
  disclaimer text not null,
  summary text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.guidance_requirements (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.guidance_packs(id) on delete cascade,
  requirement_area text not null,
  reference_code text,
  summary text not null,
  applies_to text not null check (applies_to in ('organisation','department','process','sop')),
  suggested_sop_titles text[] not null default '{}',
  required_controls jsonb not null default '[]',
  evidence_expected text[] not null default '{}',
  risk_if_missing text,
  audit_checks jsonb not null default '[]',
  sort_order int not null default 0
);

create table if not exists public.tenant_guidance_selections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pack_id uuid not null references public.guidance_packs(id) on delete restrict,
  selection_status text not null check (selection_status in (
    'certified','working_towards','align','not_relevant','deferred'
  )),
  selected_at timestamptz not null default now(),
  selected_by uuid references public.users(id),
  unique (tenant_id, pack_id)
);

create table if not exists public.department_guidance_links (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  function_id uuid not null references public.tenant_functions(id) on delete cascade,
  pack_id uuid not null references public.guidance_packs(id) on delete cascade,
  primary key (function_id, pack_id)
);

create table if not exists public.process_guidance_links (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  pack_id uuid not null references public.guidance_packs(id) on delete cascade,
  requirement_id uuid references public.guidance_requirements(id) on delete set null,
  primary key (process_id, pack_id, requirement_id)
);

alter table public.tenants
  add column if not exists organisation_profile jsonb not null default '{}';

insert into public.permissions (resource, action, description)
values
  ('standards', 'read', 'View guidance packs and tenant selections'),
  ('standards', 'manage', 'Manage tenant guidance selections and organisation profile')
on conflict (resource, action) do nothing;
