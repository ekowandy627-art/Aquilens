-- Product Spec Sprint 2: control points + evidence map on process steps

alter table public.process_steps
  add column if not exists is_control_point boolean not null default false,
  add column if not exists evidence_map jsonb not null default '{}';

update public.process_steps
set
  is_control_point = evidence_required,
  evidence_map = case
    when evidence_required then
      jsonb_build_object('mode', 'acknowledgement', 'needsCompletion', true)
    else '{}'::jsonb
  end
where is_control_point = false and evidence_required = true;
