-- Manager Control Plane: platform config, AI usage, support access, standards versioning, reporting views

-- ---------------------------------------------------------------------------
-- Platform role enum expansion
-- ---------------------------------------------------------------------------

alter table public.platform_users drop constraint if exists platform_users_role_check;

update public.platform_users
set role = 'support'
where role = 'support_staff';

alter table public.platform_users
  add constraint platform_users_role_check
  check (role in ('super_admin', 'support', 'billing', 'library_curator'));

-- ---------------------------------------------------------------------------
-- tenant_platform_config (1:1 with tenants)
-- ---------------------------------------------------------------------------

create table if not exists public.tenant_platform_config (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  lifecycle_state text not null default 'active'
    check (lifecycle_state in ('trial', 'active', 'suspended', 'offboarding')),
  ai_monthly_budget_usd numeric(12, 4),
  markup_multiplier numeric(6, 3),
  feature_flags jsonb not null default '{}',
  model_routing jsonb not null default '{}',
  plan_label text,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by_platform_user_id uuid references public.platform_users(id)
);

create index if not exists idx_tenant_platform_config_lifecycle
  on public.tenant_platform_config(lifecycle_state);

-- Backfill existing tenants (null budget = AI hard-blocked until platform sets one)
insert into public.tenant_platform_config (tenant_id, lifecycle_state, ai_monthly_budget_usd)
select
  t.id,
  case
    when t.status = 'suspended' then 'suspended'
    else 'active'
  end,
  null
from public.tenants t
on conflict (tenant_id) do nothing;

-- ---------------------------------------------------------------------------
-- Platform AI agent registry
-- ---------------------------------------------------------------------------

create table if not exists public.platform_ai_agents (
  agent_key text primary key,
  display_name text not null,
  description text not null default '',
  provider text not null check (provider in ('openai', 'anthropic', 'internal')),
  default_model text not null,
  feature_flag_key text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  current_prompt_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_ai_agent_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null references public.platform_ai_agents(agent_key) on delete cascade,
  version int not null,
  system_prompt text not null,
  user_prompt_template text not null default '',
  changelog text not null default '',
  created_at timestamptz not null default now(),
  created_by_platform_user_id uuid references public.platform_users(id),
  unique (agent_key, version)
);

alter table public.platform_ai_agents
  drop constraint if exists platform_ai_agents_current_prompt_version_id_fkey;

alter table public.platform_ai_agents
  add constraint platform_ai_agents_current_prompt_version_id_fkey
  foreign key (current_prompt_version_id)
  references public.platform_ai_agent_prompt_versions(id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- AI usage events (append-only)
-- ---------------------------------------------------------------------------

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  platform_agent_key text not null references public.platform_ai_agents(agent_key),
  prompt_version int not null default 1,
  feature text not null,
  model text not null,
  provider text not null check (provider in ('openai', 'anthropic')),
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  provider_cost_usd numeric(12, 6) not null default 0,
  billed_cost_usd numeric(12, 6),
  latency_ms int,
  success boolean not null default true,
  cache_hit boolean not null default false,
  json_valid boolean,
  input_char_count int,
  user_content_hash text,
  actor_user_id uuid references public.users(id) on delete set null,
  error_code text,
  metadata jsonb not null default '{}'
);

create index if not exists idx_ai_usage_events_tenant_created
  on public.ai_usage_events(tenant_id, created_at desc);

create index if not exists idx_ai_usage_events_agent_created
  on public.ai_usage_events(platform_agent_key, created_at desc);

-- ---------------------------------------------------------------------------
-- Platform support access log
-- ---------------------------------------------------------------------------

create table if not exists public.platform_support_access_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  platform_user_id uuid references public.platform_users(id) on delete set null,
  platform_email text not null,
  support_user_id uuid references public.users(id) on delete set null,
  reason text not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  magic_link_issued_at timestamptz not null default now()
);

create index if not exists idx_platform_support_access_tenant
  on public.platform_support_access_log(tenant_id, started_at desc);

-- ---------------------------------------------------------------------------
-- Guidance pack proposals (curation queue)
-- ---------------------------------------------------------------------------

create table if not exists public.guidance_pack_proposals (
  id uuid primary key default gen_random_uuid(),
  signal text not null,
  jurisdiction text,
  institution_type text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  curator_notes text,
  resulting_pack_id uuid references public.guidance_packs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tenant offboarding jobs
-- ---------------------------------------------------------------------------

create table if not exists public.tenant_offboarding_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'complete', 'failed', 'cancelled')),
  requested_by uuid references public.platform_users(id) on delete set null,
  export_storage_path text,
  retention_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenant_offboarding_jobs_tenant
  on public.tenant_offboarding_jobs(tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Guidance pack versioning columns
-- ---------------------------------------------------------------------------

alter table public.guidance_packs
  add column if not exists family_id uuid,
  add column if not exists canonical_slug text,
  add column if not exists version int not null default 1,
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists is_latest_published boolean not null default true,
  add column if not exists published_at timestamptz,
  add column if not exists supersedes_pack_id uuid references public.guidance_packs(id) on delete set null;

update public.guidance_packs
set
  family_id = coalesce(family_id, id),
  canonical_slug = coalesce(canonical_slug, slug),
  status = case when is_active then 'published' else 'archived' end,
  is_latest_published = is_active,
  published_at = coalesce(published_at, created_at)
where family_id is null or canonical_slug is null;

alter table public.guidance_packs
  alter column family_id set not null,
  alter column canonical_slug set not null;

alter table public.guidance_packs drop constraint if exists guidance_packs_slug_key;

create unique index if not exists idx_guidance_packs_canonical_version
  on public.guidance_packs(canonical_slug, version);

create index if not exists idx_guidance_packs_family_latest
  on public.guidance_packs(family_id, is_latest_published)
  where is_latest_published = true;

-- ---------------------------------------------------------------------------
-- Tenant guidance selections versioning
-- ---------------------------------------------------------------------------

alter table public.tenant_guidance_selections
  add column if not exists pack_family_id uuid,
  add column if not exists pinned_pack_id uuid references public.guidance_packs(id) on delete restrict,
  add column if not exists latest_notified_pack_id uuid references public.guidance_packs(id) on delete set null,
  add column if not exists acknowledged_at timestamptz;

update public.tenant_guidance_selections tgs
set
  pack_family_id = coalesce(tgs.pack_family_id, gp.family_id),
  pinned_pack_id = coalesce(tgs.pinned_pack_id, tgs.pack_id)
from public.guidance_packs gp
where gp.id = tgs.pack_id
  and (tgs.pack_family_id is null or tgs.pinned_pack_id is null);

alter table public.tenant_guidance_selections
  alter column pack_family_id set not null,
  alter column pinned_pack_id set not null;

alter table public.tenant_guidance_selections
  drop constraint if exists tenant_guidance_selections_tenant_id_pack_id_key;

alter table public.tenant_guidance_selections
  drop constraint if exists tenant_guidance_selections_selection_status_check;

alter table public.tenant_guidance_selections
  add constraint tenant_guidance_selections_selection_status_check
  check (selection_status in (
    'certified', 'working_towards', 'align', 'relevant', 'not_relevant', 'deferred'
  ));

create unique index if not exists idx_tenant_guidance_selections_tenant_family
  on public.tenant_guidance_selections(tenant_id, pack_family_id);

-- ---------------------------------------------------------------------------
-- Standards gap analyses
-- ---------------------------------------------------------------------------

create table if not exists public.standards_gap_analyses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  from_pack_id uuid not null references public.guidance_packs(id) on delete restrict,
  to_pack_id uuid not null references public.guidance_packs(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'complete', 'failed')),
  triggered_by uuid references public.users(id) on delete set null,
  results jsonb not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_standards_gap_analyses_tenant
  on public.standards_gap_analyses(tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Reporting views (content-free aggregates)
-- ---------------------------------------------------------------------------

create or replace view public.v_tenant_ai_usage_monthly as
select
  e.tenant_id,
  date_trunc('month', e.created_at at time zone 'UTC') as usage_month,
  sum(e.provider_cost_usd) as provider_cost_usd,
  sum(e.billed_cost_usd) as billed_cost_usd,
  count(*) as event_count,
  count(*) filter (where e.cache_hit) as cache_hit_count,
  count(*) filter (where e.json_valid = false) as json_invalid_count
from public.ai_usage_events e
group by e.tenant_id, date_trunc('month', e.created_at at time zone 'UTC');

create or replace view public.v_tenant_ai_spend_total as
select
  e.tenant_id,
  sum(e.provider_cost_usd) filter (
    where e.created_at >= date_trunc('month', now() at time zone 'UTC')
  ) as mtd_provider_cost_usd,
  sum(e.billed_cost_usd) filter (
    where e.created_at >= date_trunc('month', now() at time zone 'UTC')
  ) as mtd_billed_cost_usd,
  sum(e.provider_cost_usd) as all_time_provider_cost_usd,
  count(*) as all_time_event_count,
  max(e.created_at) as last_event_at
from public.ai_usage_events e
group by e.tenant_id;

create or replace view public.v_platform_agent_usage as
select
  e.platform_agent_key as agent_key,
  count(*) as total_calls,
  count(*) filter (
    where e.created_at >= date_trunc('month', now() at time zone 'UTC')
  ) as mtd_calls,
  sum(e.provider_cost_usd) filter (
    where e.created_at >= date_trunc('month', now() at time zone 'UTC')
  ) as mtd_provider_cost_usd,
  avg(e.latency_ms) filter (where e.latency_ms is not null) as avg_latency_ms,
  count(*) filter (where e.success) * 100.0 / nullif(count(*), 0) as success_pct,
  count(*) filter (where e.json_valid = true) * 100.0
    / nullif(count(*) filter (where e.json_valid is not null), 0) as json_valid_pct
from public.ai_usage_events e
group by e.platform_agent_key;

create or replace view public.v_platform_agent_usage_by_tenant as
select
  e.tenant_id,
  e.platform_agent_key as agent_key,
  count(*) as call_count,
  sum(e.provider_cost_usd) filter (
    where e.created_at >= date_trunc('month', now() at time zone 'UTC')
  ) as mtd_provider_cost_usd,
  sum(e.provider_cost_usd) as all_time_provider_cost_usd,
  max(e.created_at) as last_used_at
from public.ai_usage_events e
group by e.tenant_id, e.platform_agent_key;

create or replace view public.v_tenant_operational_metrics as
select
  t.id as tenant_id,
  t.name,
  t.slug,
  t.status,
  coalesce(tpc.lifecycle_state, 'active') as lifecycle_state,
  (select count(*) from public.users u where u.tenant_id = t.id and u.status = 'active') as active_user_count,
  (select max(u.last_login_at) from public.users u where u.tenant_id = t.id) as last_activity_at,
  coalesce(vs.mtd_provider_cost_usd, 0) as mtd_ai_cost_usd,
  tpc.ai_monthly_budget_usd
from public.tenants t
left join public.tenant_platform_config tpc on tpc.tenant_id = t.id
left join public.v_tenant_ai_spend_total vs on vs.tenant_id = t.id;

create or replace view public.v_platform_benchmarks as
select
  count(distinct t.id) as tenant_count,
  avg(vom.active_user_count) as avg_active_users,
  percentile_cont(0.5) within group (order by coalesce(vs.mtd_provider_cost_usd, 0)) as median_mtd_ai_cost_usd,
  percentile_cont(0.5) within group (
    order by case
      when vom.active_user_count > 0
      then coalesce(vs.mtd_provider_cost_usd, 0) / vom.active_user_count
      else null
    end
  ) as median_mtd_ai_cost_per_active_user
from public.tenants t
left join public.v_tenant_operational_metrics vom on vom.tenant_id = t.id
left join public.v_tenant_ai_spend_total vs on vs.tenant_id = t.id
where t.status = 'active';

-- ---------------------------------------------------------------------------
-- Seed platform AI agents + prompt v1 (idempotent)
-- ---------------------------------------------------------------------------

insert into public.platform_ai_agents (agent_key, display_name, description, provider, default_model, feature_flag_key, status)
values
  ('sop_generate', 'SOP Generate', 'Generates structured SOP content from process context', 'anthropic', 'claude-sonnet-4-20250514', 'sop_compose_enabled', 'active'),
  ('sop_transcribe', 'SOP Transcribe', 'Transcribes voice input for compose flows', 'openai', 'gpt-4o-mini-transcribe', 'sop_compose_enabled', 'active'),
  ('sop_compose_align', 'SOP Compose Align', 'Aligns draft SOP with selected guidance packs', 'anthropic', 'claude-sonnet-4-20250514', 'sop_compose_enabled', 'active'),
  ('standards_gap_analysis', 'Standards Gap Analysis', 'AI narrative for standards version gap analysis', 'anthropic', 'claude-sonnet-4-20250514', null, 'active'),
  ('standards_update_watch', 'Standards Update Watch', 'Rule-based weekly check for new published pack versions', 'internal', 'none', null, 'active'),
  ('training_questions', 'Training Questions', 'Generates training assessment questions from SOP content', 'anthropic', 'claude-sonnet-4-20250514', 'training_assessments_enabled', 'active')
on conflict (agent_key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  provider = excluded.provider,
  default_model = excluded.default_model,
  feature_flag_key = excluded.feature_flag_key,
  status = excluded.status,
  updated_at = now();

insert into public.platform_ai_agent_prompt_versions (id, agent_key, version, system_prompt, user_prompt_template, changelog)
values
  (
    'a1000001-0000-4000-8000-000000000001',
    'sop_generate',
    1,
    'You are an expert SOP author for regulated institutions. Output valid JSON only.',
    'Generate an SOP for process: {{processName}}. Context: {{context}}',
    'Initial v1 seed'
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    'sop_transcribe',
    1,
    'Transcribe the provided audio accurately.',
    '{{audioReference}}',
    'Initial v1 seed'
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    'sop_compose_align',
    1,
    'You align SOP drafts with selected guidance pack requirements. Output valid JSON.',
    'Draft: {{draft}}. Packs: {{packIds}}',
    'Initial v1 seed'
  ),
  (
    'a1000001-0000-4000-8000-000000000004',
    'standards_gap_analysis',
    1,
    'You analyze standards requirement diffs and produce structured gap recommendations. Output valid JSON.',
    'From pack {{fromPackId}} to {{toPackId}}. Diff: {{diff}}',
    'Initial v1 seed'
  ),
  (
    'a1000001-0000-4000-8000-000000000005',
    'standards_update_watch',
    1,
    'Rule-based agent — no LLM prompt.',
    '',
    'Initial v1 seed'
  ),
  (
    'a1000001-0000-4000-8000-000000000006',
    'training_questions',
    1,
    'Generate training assessment questions from SOP content. Output valid JSON.',
    'SOP: {{sopContent}}',
    'Initial v1 seed'
  )
on conflict (agent_key, version) do nothing;

update public.platform_ai_agents a
set current_prompt_version_id = pv.id, updated_at = now()
from public.platform_ai_agent_prompt_versions pv
where pv.agent_key = a.agent_key
  and pv.version = 1
  and a.current_prompt_version_id is distinct from pv.id;
