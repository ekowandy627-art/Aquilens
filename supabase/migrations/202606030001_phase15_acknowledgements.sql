-- Phase 15: staff SOP acknowledgements

create table if not exists public.sop_acknowledgement_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  process_version_id uuid not null references public.process_versions(id) on delete cascade,
  due_date date,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sop_acknowledgement_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid not null references public.sop_acknowledgement_campaigns(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','completed','overdue')),
  due_date date,
  unique (campaign_id, user_id)
);

create table if not exists public.sop_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assignment_id uuid not null references public.sop_acknowledgement_assignments(id) on delete cascade,
  process_version_id uuid not null references public.process_versions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  unique (assignment_id)
);

create index if not exists idx_sop_ack_campaigns_process
  on public.sop_acknowledgement_campaigns (tenant_id, process_id);

create index if not exists idx_sop_ack_assignments_user
  on public.sop_acknowledgement_assignments (tenant_id, user_id, status);

alter table public.sop_acknowledgement_campaigns enable row level security;
alter table public.sop_acknowledgement_assignments enable row level security;
alter table public.sop_acknowledgements enable row level security;

drop policy if exists sop_ack_campaigns_tenant on public.sop_acknowledgement_campaigns;
create policy sop_ack_campaigns_tenant on public.sop_acknowledgement_campaigns
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists sop_ack_assignments_tenant on public.sop_acknowledgement_assignments;
create policy sop_ack_assignments_tenant on public.sop_acknowledgement_assignments
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists sop_ack_records_tenant on public.sop_acknowledgements;
create policy sop_ack_records_tenant on public.sop_acknowledgements
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

insert into public.permissions (resource, action, description)
values
  ('acknowledgements', 'read', 'View acknowledgement campaigns and progress'),
  ('acknowledgements', 'manage', 'Create acknowledgement campaigns'),
  ('acknowledgements', 'complete', 'Complete own acknowledgement assignments')
on conflict (resource, action) do nothing;
