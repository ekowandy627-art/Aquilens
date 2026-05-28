-- Aquilens Phase 9: Notifications, escalation rules, and dashboard support

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  entity_name text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_user_unread
  on public.notifications(tenant_id, user_id, is_read, created_at desc);
create index if not exists idx_notifications_type
  on public.notifications(tenant_id, type);

alter table public.notifications enable row level security;

drop policy if exists notifications_tenant_isolation on public.notifications;
create policy notifications_tenant_isolation on public.notifications
  for all to authenticated
  using (tenant_id = public.current_tenant_id() and user_id = auth.uid())
  with check (tenant_id = public.current_tenant_id() and user_id = auth.uid());

create table if not exists public.escalation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  trigger_event text not null,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.escalation_rule_levels (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.escalation_rules(id) on delete cascade,
  level_number int not null,
  target_role text not null,
  delay_hours int not null,
  unique (rule_id, level_number)
);

create index if not exists idx_escalation_rules_tenant
  on public.escalation_rules(tenant_id, is_active);

alter table public.escalation_rules enable row level security;
alter table public.escalation_rule_levels enable row level security;

drop policy if exists escalation_rules_tenant_isolation on public.escalation_rules;
create policy escalation_rules_tenant_isolation on public.escalation_rules
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists escalation_rule_levels_tenant_isolation on public.escalation_rule_levels;
create policy escalation_rule_levels_tenant_isolation on public.escalation_rule_levels
  for all to authenticated
  using (
    exists (
      select 1
      from public.escalation_rules r
      where r.id = escalation_rule_levels.rule_id
        and r.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1
      from public.escalation_rules r
      where r.id = escalation_rule_levels.rule_id
        and r.tenant_id = public.current_tenant_id()
    )
  );
