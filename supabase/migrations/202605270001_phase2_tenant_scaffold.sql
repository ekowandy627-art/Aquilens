-- Aquilens Phase 2: tenant onboarding scaffold persisted in Supabase.

create table if not exists public.tenant_functions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.tenant_process_areas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  function_id uuid not null references public.tenant_functions(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (function_id, name)
);

alter table public.tenant_functions enable row level security;
alter table public.tenant_process_areas enable row level security;

drop policy if exists tenant_functions_isolation on public.tenant_functions;
create policy tenant_functions_isolation on public.tenant_functions
  for all to authenticated using (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid() limit 1
    )
  )
  with check (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid() limit 1
    )
  );

drop policy if exists tenant_process_areas_isolation on public.tenant_process_areas;
create policy tenant_process_areas_isolation on public.tenant_process_areas
  for all to authenticated using (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid() limit 1
    )
  )
  with check (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid() limit 1
    )
  );

create index if not exists idx_tenant_functions_tenant_order
  on public.tenant_functions(tenant_id, sort_order, name);

create index if not exists idx_tenant_process_areas_function_order
  on public.tenant_process_areas(function_id, sort_order, name);

insert into public.permissions(resource, action, description)
values
  ('tenant_scaffold', 'read', 'View tenant onboarding scaffold'),
  ('tenant_scaffold', 'manage', 'Edit tenant onboarding scaffold')
on conflict (resource, action) do update set description = excluded.description;
