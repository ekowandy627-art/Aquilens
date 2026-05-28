-- Aquilens Phase 5: SOP approval lifecycle

create table if not exists public.approval_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null default 'process_version',
  entity_id uuid not null,
  process_id uuid references public.processes(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approver_id uuid references public.users(id),
  submitted_by uuid references public.users(id),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  comment text
);

create index if not exists idx_approval_instances_tenant_status
  on public.approval_instances(tenant_id, status);
create index if not exists idx_approval_instances_approver
  on public.approval_instances(approver_id, status);
create index if not exists idx_approval_instances_process
  on public.approval_instances(process_id);

alter table public.approval_instances enable row level security;

drop policy if exists approval_instances_tenant_isolation on public.approval_instances;
create policy approval_instances_tenant_isolation on public.approval_instances
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
