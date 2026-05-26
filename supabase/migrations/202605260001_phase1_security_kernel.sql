-- Aquilens Phase 1: multi-tenant security kernel
-- Apply this migration to the linked Supabase project before creating demo users.

create extension if not exists "pgcrypto";

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  institution_type text not null check (
    institution_type in (
      'school',
      'hospital',
      'financial_services',
      'ngo',
      'corporate',
      'government',
      'other'
    )
  ),
  country text not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'invited', 'deactivated')),
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  unique (tenant_id, email)
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  action text not null,
  description text,
  unique (resource, action)
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean not null default false,
  system_key text,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  scope text not null default 'global' check (scope in ('global', 'function', 'own')),
  primary key (role_id, permission_id, scope)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  function_scope_id uuid,
  assigned_by uuid references public.users(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id, tenant_id)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  timestamp timestamptz not null default now(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  actor_id uuid,
  actor_name text,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'
);

create rule no_update_audit_log as on update to public.audit_log do instead nothing;
create rule no_delete_audit_log as on delete to public.audit_log do instead nothing;

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.users where id = auth.uid() limit 1
$$;

drop policy if exists tenant_read_own on public.tenants;
create policy tenant_read_own on public.tenants
  for select using (id = public.current_tenant_id());

drop policy if exists tenant_update_own on public.tenants;
create policy tenant_update_own on public.tenants
  for update using (id = public.current_tenant_id())
  with check (id = public.current_tenant_id());

drop policy if exists users_tenant_isolation on public.users;
create policy users_tenant_isolation on public.users
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists permissions_read_authenticated on public.permissions;
create policy permissions_read_authenticated on public.permissions
  for select to authenticated using (true);

drop policy if exists roles_tenant_isolation on public.roles;
create policy roles_tenant_isolation on public.roles
  for all using (tenant_id = public.current_tenant_id() or tenant_id is null)
  with check (tenant_id = public.current_tenant_id() or tenant_id is null);

drop policy if exists role_permissions_read_authenticated on public.role_permissions;
create policy role_permissions_read_authenticated on public.role_permissions
  for select to authenticated using (
    exists (
      select 1
      from public.roles r
      where r.id = role_permissions.role_id
      and (r.tenant_id = public.current_tenant_id() or r.tenant_id is null)
    )
  );

drop policy if exists user_roles_tenant_isolation on public.user_roles;
create policy user_roles_tenant_isolation on public.user_roles
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists audit_tenant_read on public.audit_log;
create policy audit_tenant_read on public.audit_log
  for select using (tenant_id = public.current_tenant_id());

create index if not exists idx_users_tenant on public.users(tenant_id);
create index if not exists idx_roles_tenant on public.roles(tenant_id);
create index if not exists idx_user_roles_tenant on public.user_roles(tenant_id);
create index if not exists idx_audit_log_tenant_time on public.audit_log(tenant_id, timestamp desc);

insert into public.permissions (resource, action, description)
values
  ('processes', 'create', 'Create process drafts'),
  ('processes', 'read', 'View processes'),
  ('processes', 'edit', 'Edit process drafts'),
  ('processes', 'approve', 'Approve or reject SOP submissions'),
  ('workflows', 'read', 'View workflow instances'),
  ('workflows', 'complete', 'Complete assigned tasks'),
  ('agents', 'read', 'View AI agent registry'),
  ('agents', 'attest', 'Submit AI model attestations'),
  ('audit', 'read', 'View audit trail'),
  ('audit_packs', 'generate', 'Generate audit packs'),
  ('users', 'invite', 'Invite users'),
  ('roles', 'manage', 'Manage roles and permissions'),
  ('settings', 'edit', 'Edit tenant settings')
on conflict (resource, action) do nothing;
