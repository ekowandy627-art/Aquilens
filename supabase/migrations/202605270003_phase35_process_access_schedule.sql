-- Aquilens Phase 3.5: execution schedule + process-level access roles

alter table public.processes
  add column if not exists execution_schedule jsonb not null default '{"kind":"ad_hoc"}'::jsonb;

comment on column public.processes.review_frequency is
  'Governance cadence: how often the SOP document must be reviewed.';
comment on column public.processes.execution_schedule is
  'Operational cadence: how often the process work is performed.';

alter table public.process_version_people
  drop constraint if exists process_version_people_role_check;

update public.process_version_people
set role = 'viewer'
where role = 'user';

alter table public.process_version_people
  add constraint process_version_people_role_check
  check (role in ('owner', 'editor', 'viewer', 'approver'));
