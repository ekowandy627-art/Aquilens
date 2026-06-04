-- Remove legacy Phase 15 SOP acknowledgement tables (replaced by training module)

drop table if exists public.sop_acknowledgements cascade;
drop table if exists public.sop_acknowledgement_assignments cascade;
drop table if exists public.sop_acknowledgement_campaigns cascade;

delete from public.permissions
where resource = 'acknowledgements'
  and action in ('read', 'manage', 'complete');
