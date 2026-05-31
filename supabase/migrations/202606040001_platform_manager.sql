-- Platform manager console (separate from tenant users)

create table if not exists public.platform_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  role text not null check (role in ('super_admin', 'support_staff')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  must_change_password boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  actor_id uuid references public.platform_users(id),
  actor_email text not null,
  event_type text not null,
  entity_type text not null,
  entity_id text,
  entity_name text,
  action text not null,
  metadata jsonb not null default '{}'
);

create rule no_update_platform_audit_log as on update to public.platform_audit_log do instead nothing;
create rule no_delete_platform_audit_log as on delete to public.platform_audit_log do instead nothing;
