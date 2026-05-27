-- Aquilens Phase 3: process registry + SOP editor persistence

create extension if not exists "pgcrypto";

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  function_id uuid not null references public.tenant_functions(id) on delete restrict,
  process_area_id uuid not null references public.tenant_process_areas(id) on delete restrict,
  process_code text,
  name text not null,
  description text,
  purpose text,
  who_it_affects text[] not null default '{}',
  linked_systems text[] not null default '{}',
  linked_policies text,
  tags text[] not null default '{}',
  risk_rating text not null default 'medium' check (risk_rating in ('high', 'medium', 'low')),
  risk_notes text,
  governance_controls jsonb not null default '[]',
  approval_required boolean not null default false,
  review_frequency text not null default 'annually',
  regulatory_reference text,
  status text not null default 'draft' check (status in ('draft', 'under_review', 'active', 'retired')),
  current_version_id uuid,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_processes_tenant_status on public.processes(tenant_id, status);
create index if not exists idx_processes_tenant_function on public.processes(tenant_id, function_id);
create index if not exists idx_processes_tenant_area on public.processes(tenant_id, process_area_id);

drop trigger if exists trg_processes_updated_at on public.processes;
create trigger trg_processes_updated_at
before update on public.processes
for each row execute function public.set_updated_at();

create table if not exists public.process_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  version_number integer not null,
  status text not null default 'draft' check (status in ('draft', 'under_review', 'active', 'superseded', 'rejected')),
  change_summary text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  unique (process_id, version_number)
);

create index if not exists idx_process_versions_process on public.process_versions(process_id, version_number desc);
create index if not exists idx_process_versions_tenant on public.process_versions(tenant_id, created_at desc);

create table if not exists public.process_version_people (
  id uuid primary key default gen_random_uuid(),
  process_version_id uuid not null references public.process_versions(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  role text not null check (role in ('owner', 'approver', 'user')),
  created_at timestamptz not null default now()
);

create index if not exists idx_process_version_people_version on public.process_version_people(process_version_id);
create index if not exists idx_process_version_people_user on public.process_version_people(user_id);

create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  process_version_id uuid not null references public.process_versions(id) on delete cascade,
  step_number integer not null,
  title text not null,
  description text,
  responsible_role text,
  step_type text not null default 'manual' check (step_type in ('manual', 'approval', 'system')),
  inputs text,
  outputs text,
  controls text,
  notes text,
  evidence_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (process_version_id, step_number)
);

create index if not exists idx_process_steps_version on public.process_steps(process_version_id, step_number);
create index if not exists idx_process_steps_tenant on public.process_steps(tenant_id);

-- Ensure current_version_id FK is present after versions exist.
alter table public.processes
  drop constraint if exists fk_processes_current_version;
alter table public.processes
  add constraint fk_processes_current_version
  foreign key (current_version_id) references public.process_versions(id)
  on delete set null;

-- RLS
alter table public.processes enable row level security;
alter table public.process_versions enable row level security;
alter table public.process_version_people enable row level security;
alter table public.process_steps enable row level security;

drop policy if exists processes_tenant_isolation on public.processes;
create policy processes_tenant_isolation on public.processes
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists process_versions_tenant_isolation on public.process_versions;
create policy process_versions_tenant_isolation on public.process_versions
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists process_steps_tenant_isolation on public.process_steps;
create policy process_steps_tenant_isolation on public.process_steps
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists process_version_people_tenant_isolation on public.process_version_people;
create policy process_version_people_tenant_isolation on public.process_version_people
  for all to authenticated
  using (
    exists (
      select 1
      from public.process_versions pv
      where pv.id = process_version_people.process_version_id
      and pv.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1
      from public.process_versions pv
      where pv.id = process_version_people.process_version_id
      and pv.tenant_id = public.current_tenant_id()
    )
  );

