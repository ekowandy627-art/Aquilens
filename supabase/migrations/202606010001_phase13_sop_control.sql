-- Phase 13: SOP control enrichment (PRD §12.3)

alter table public.processes
  add column if not exists trigger_description text,
  add column if not exists participants jsonb not null default '[]'::jsonb,
  add column if not exists inputs text,
  add column if not exists outputs text,
  add column if not exists exceptions text,
  add column if not exists related_documents jsonb not null default '[]'::jsonb,
  add column if not exists acknowledgement_required boolean not null default false;

alter table public.process_versions
  add column if not exists effective_date date,
  add column if not exists review_due_date date,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references public.users(id),
  add column if not exists archived_at timestamptz;

alter table public.processes drop constraint if exists processes_status_check;
alter table public.processes
  add constraint processes_status_check
  check (status in ('draft', 'under_review', 'active', 'retired', 'archived'));

alter table public.process_versions drop constraint if exists process_versions_status_check;
alter table public.process_versions
  add constraint process_versions_status_check
  check (
    status in (
      'draft',
      'under_review',
      'approved',
      'active',
      'superseded',
      'rejected',
      'archived'
    )
  );

create table if not exists public.process_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  process_version_id uuid references public.process_versions(id) on delete set null,
  filename text not null,
  storage_path text not null,
  mime_type text,
  byte_size bigint,
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists process_documents_process_id_idx
  on public.process_documents (process_id);

alter table public.process_documents enable row level security;

create policy process_documents_tenant_isolation on public.process_documents
  for all
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
