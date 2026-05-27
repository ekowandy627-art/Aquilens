-- Phase 4: mark AI-generated processes

alter table public.processes
  add column if not exists creation_source text not null default 'manual'
  check (creation_source in ('manual', 'ai_generated'));

comment on column public.processes.creation_source is
  'How the process draft was originally created.';
