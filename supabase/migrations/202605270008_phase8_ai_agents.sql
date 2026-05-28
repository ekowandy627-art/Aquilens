-- Aquilens Phase 8: AI agent registry

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_code text,
  name text not null,
  description text,
  purpose text,
  vendor text,
  model_name text,
  model_version text,
  owner_id uuid references public.users(id) on delete set null,
  owning_function_id uuid references public.tenant_functions(id) on delete set null,
  risk_classification text not null default 'medium'
    check (risk_classification in ('high', 'medium', 'low')),
  risk_rationale text,
  deployment_environment text,
  status text not null default 'active'
    check (status in ('active', 'under_review', 'deprecated', 'retired')),
  version text,
  deployment_date date,
  last_attested_at timestamptz,
  next_attestation_due timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_ai_agents_tenant_code
  on public.ai_agents(tenant_id, agent_code)
  where agent_code is not null;

create index if not exists idx_ai_agents_tenant_status
  on public.ai_agents(tenant_id, status);
create index if not exists idx_ai_agents_tenant_risk
  on public.ai_agents(tenant_id, risk_classification);
create index if not exists idx_ai_agents_tenant_function
  on public.ai_agents(tenant_id, owning_function_id);
create index if not exists idx_ai_agents_tenant_attestation_due
  on public.ai_agents(tenant_id, next_attestation_due);

alter table public.ai_agents enable row level security;

drop policy if exists ai_agents_tenant_isolation on public.ai_agents;
create policy ai_agents_tenant_isolation on public.ai_agents
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create table if not exists public.agent_attestations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id uuid not null references public.ai_agents(id) on delete cascade,
  attested_by uuid references public.users(id) on delete set null,
  attested_at timestamptz not null default now(),
  outcome text not null check (outcome in ('confirmed', 'flagged', 'deprecation_recommended')),
  notes text
);

create index if not exists idx_agent_attestations_agent
  on public.agent_attestations(agent_id, attested_at desc);
create index if not exists idx_agent_attestations_tenant
  on public.agent_attestations(tenant_id, attested_at desc);

alter table public.agent_attestations enable row level security;

drop policy if exists agent_attestations_tenant_isolation on public.agent_attestations;
create policy agent_attestations_tenant_isolation on public.agent_attestations
  for select to authenticated
  using (tenant_id = public.current_tenant_id());

drop policy if exists agent_attestations_insert on public.agent_attestations;
create policy agent_attestations_insert on public.agent_attestations
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id());

create table if not exists public.process_step_agents (
  process_step_id uuid not null references public.process_steps(id) on delete cascade,
  agent_id uuid not null references public.ai_agents(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  linked_by uuid references public.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  primary key (process_step_id, agent_id)
);

create index if not exists idx_process_step_agents_agent
  on public.process_step_agents(agent_id);
create index if not exists idx_process_step_agents_tenant
  on public.process_step_agents(tenant_id);

alter table public.process_step_agents enable row level security;

drop policy if exists process_step_agents_tenant_isolation on public.process_step_agents;
create policy process_step_agents_tenant_isolation on public.process_step_agents
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- Append-only attestations: block update/delete at DB level
create or replace function public.deny_agent_attestation_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'agent_attestations is append-only';
end;
$$;

drop trigger if exists trg_agent_attestations_no_update on public.agent_attestations;
create trigger trg_agent_attestations_no_update
before update or delete on public.agent_attestations
for each row execute function public.deny_agent_attestation_mutation();
