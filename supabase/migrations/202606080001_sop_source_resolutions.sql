-- Product Spec Sprint 3: conflict resolution memory for SOP composer

create table if not exists public.sop_source_resolutions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  process_id uuid,
  draft_hash text,
  source_artifact_id text not null,
  field text not null,
  chosen_value text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists sop_source_resolutions_tenant_process_idx
  on public.sop_source_resolutions (tenant_id, process_id);
