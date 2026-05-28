-- Aquilens Phase 7: workflow execution tables + evidence capture

create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  process_version_id uuid not null references public.process_versions(id) on delete cascade,
  title text not null,
  context text,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'cancelled')),
  started_by uuid references public.users(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
);

create table if not exists public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  process_step_id uuid references public.process_steps(id) on delete set null,
  step_number int not null,
  title text not null,
  description text,
  step_type text not null default 'manual'
    check (step_type in ('manual', 'approval')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'skipped', 'approved', 'rejected')),
  assigned_to uuid references public.users(id),
  assigned_role text,
  evidence_required boolean not null default false,
  sla_hours int,
  sla_due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.users(id),
  notes text,
  skip_reason text
);

create table if not exists public.workflow_task_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  workflow_task_id uuid not null references public.workflow_tasks(id) on delete cascade,
  filename text not null,
  file_type text not null,
  file_size int not null,
  storage_path text not null,
  checksum text not null,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamptz not null default now(),
  notes text
);

create rule no_delete_workflow_task_evidence
  as on delete to public.workflow_task_evidence do instead nothing;

create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  filename text not null,
  file_type text not null,
  file_size int not null,
  storage_path text not null,
  checksum text not null,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamptz not null default now(),
  notes text
);

create rule no_delete_evidence_files
  as on delete to public.evidence_files do instead nothing;

create index if not exists idx_workflow_instances_tenant
  on public.workflow_instances(tenant_id, status);
create index if not exists idx_workflow_tasks_instance
  on public.workflow_tasks(workflow_instance_id, step_number);
create index if not exists idx_workflow_task_evidence_task
  on public.workflow_task_evidence(workflow_task_id);
create index if not exists idx_evidence_files_entity
  on public.evidence_files(tenant_id, entity_type, entity_id);

alter table public.workflow_instances enable row level security;
alter table public.workflow_tasks enable row level security;
alter table public.workflow_task_evidence enable row level security;
alter table public.evidence_files enable row level security;

drop policy if exists workflow_instances_tenant_isolation on public.workflow_instances;
create policy workflow_instances_tenant_isolation on public.workflow_instances
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists workflow_tasks_tenant_isolation on public.workflow_tasks;
create policy workflow_tasks_tenant_isolation on public.workflow_tasks
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists workflow_task_evidence_tenant_isolation on public.workflow_task_evidence;
create policy workflow_task_evidence_tenant_isolation on public.workflow_task_evidence
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists evidence_files_tenant_isolation on public.evidence_files;
create policy evidence_files_tenant_isolation on public.evidence_files
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
