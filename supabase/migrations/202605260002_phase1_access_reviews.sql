-- Aquilens Phase 1 completion: access reviews and expanded admin permissions

create table if not exists public.access_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  initiated_by uuid not null references public.users(id),
  initiated_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

create table if not exists public.access_review_items (
  id uuid primary key default gen_random_uuid(),
  access_review_id uuid not null references public.access_reviews(id) on delete cascade,
  user_id uuid not null references public.users(id),
  roles_at_review jsonb not null,
  decision text check (decision in ('confirmed', 'revoked')),
  decided_by uuid references public.users(id),
  decided_at timestamptz,
  notes text,
  unique (access_review_id, user_id)
);

alter table public.access_reviews enable row level security;
alter table public.access_review_items enable row level security;

drop policy if exists access_reviews_tenant_isolation on public.access_reviews;
create policy access_reviews_tenant_isolation on public.access_reviews
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists access_review_items_tenant_isolation on public.access_review_items;
create policy access_review_items_tenant_isolation on public.access_review_items
  for all using (
    exists (
      select 1
      from public.access_reviews ar
      where ar.id = access_review_items.access_review_id
      and ar.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1
      from public.access_reviews ar
      where ar.id = access_review_items.access_review_id
      and ar.tenant_id = public.current_tenant_id()
    )
  );

create index if not exists idx_access_reviews_tenant on public.access_reviews(tenant_id, status);
create index if not exists idx_access_review_items_review on public.access_review_items(access_review_id);

insert into public.permissions (resource, action, description)
values
  ('users', 'read', 'View users'),
  ('users', 'edit', 'Edit and deactivate users'),
  ('users', 'assign_roles', 'Assign roles to users'),
  ('access_reviews', 'read', 'View access reviews'),
  ('access_reviews', 'manage', 'Create and complete access reviews')
on conflict (resource, action) do nothing;
