-- Function owner: default process owner for SOPs under this function.

alter table public.tenant_functions
  add column if not exists owner_id uuid references public.users(id) on delete set null;

create index if not exists idx_tenant_functions_owner
  on public.tenant_functions(owner_id)
  where owner_id is not null;
