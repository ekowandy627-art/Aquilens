# Aquilens — Phase Build Plan

> Each phase produces a testable product slice: working screens, seeded demo data, and a clear user journey.
> No phase is done until you can click through it in a browser.

---

## How to Use This Plan

Each phase section is a self-contained build prompt. Hand it to an AI code assistant (or use it yourself) to build that phase in one session. Every phase lists exactly what to build, what the seed data should look like, and a pass/fail acceptance test checklist.

**Rule:** A phase is not done until every item in its Definition of Done is checked.

**Stack:**
- Frontend: Next.js (App Router) + Tailwind + shadcn/ui
- Backend: NestJS (TypeScript)
- Database: Supabase (PostgreSQL + pgvector + Auth)
- AI: Anthropic Claude API (`claude-sonnet-4-6`)
- Hosting: Vercel (frontend) + Railway (backend)
- Storage: Supabase Storage

**Design reference:** Scribe (scribehow.com) — clean sidebar, neutral content area, one accent colour (teal `#0E7C7B`) for actions only, navy `#1A2C4E` for brand elements.

---

## Phase Sequence

| Phase | Name | Testable outcome |
|---|---|---|
| 0 | App Shell + Design System | Login placeholder, layout shell, sidebar, empty pages |
| 1 | Multi-Tenant Security Kernel | Login, tenant isolation, roles, access denied |
| 2 | Tenant Onboarding + Scaffold | Setup wizard, function tree, process area editor |
| 3 | Process Repository + SOP Editor | Process list, process detail, step builder, draft save |
| 3.5 | Process Access + Execution Schedule | Per-process owner/editor/viewer, execution vs review cadence |
| 4 | AI SOP Generation | Natural language → SOP, gap detection, review screen |
| 5 | SOP Approval Lifecycle | Submit, approval queue, approve/reject, version history |
| 6 | Workflow Execution | Start workflow, task board, sequential task completion |
| 7 | Evidence Capture | Upload evidence inline, required evidence blocker, viewer |
| 8 | AI Agent Registry | Agent list, agent detail, link agent to SOP step |
| 9 | Notifications + Dashboard | Role-based dashboard, notification bell, staff task view |
| 10 | Audit Trail + Report Export | Audit trail viewer, audit pack PDF generation + download |
| 11 | GIS Demo Hardening | One-command reset, polished demo tenant, full story flow |
| 12 | Product Language & Legal Framing | Disclaimers, alignment wording, role matrix |
| 13 | SOP Control Enrichment | Publish/effective/review dates, upload, richer sections |
| 14 | Standards Library & Selection | MVP guidance packs, tenant selection, recommendations |
| 15 | Staff Acknowledgement | Assign, confirm, overdue, version-specific ack |
| 16 | Standards Alignment Dashboard | Governance metrics (not operational dashboard) |
| 17 | Internal Audit Engine | Scoped runs, automated checks from library |
| 18 | Findings & Corrective Actions | Severity, owners, closure loop |
| 19 | Evidence Pack v2 | Full PRD contents, PDF/DOCX/XLSX/CSV |

**Detailed schema, routes, estimates, and test cases (acceptance + UI + API + unit):** see [`docs/PRD_DELTA_PLAN.md`](docs/PRD_DELTA_PLAN.md) (from product requirements doc). Phases 12–19 define **~205** numbered test cases (`P12-UI-01` … `P19-A-17`) plus a cross-phase MVP journey suite.

---

## Phase Prompt Template

Use this structure for every AI build session:

```md
Build Phase X of Aquilens.
This phase must be testable through the browser UI.

Current completed phases: [list phases done]

Goal: [one sentence outcome]

User journeys:
1. As a [role], I can [action]
2. As a [role], I cannot [action]

Screens to build: [list]
Database: [tables + RLS]
API: [endpoints + guards]
Audit events: [what to log]
Seed data: [specific records]
UI acceptance tests: [pass/fail checklist]
Automated tests: [what to cover]
Out of scope: [what not to build]
Definition of done: [checklist]
```

---

## Phase 0 — App Shell + Design System

**Goal:** The app opens and looks like a real product, with all routes and empty states, before any business logic exists.

**Estimated effort:** 0.5 days

**Prerequisites:** None

---

### What to Build

**Project setup:**
- Monorepo: `/apps/web` (Next.js), `/apps/api` (NestJS), `/packages/shared` (types + utils)
- Supabase project created, environment variables wired
- NestJS health check endpoint: `GET /health`
- Tailwind configured with Aquilens design tokens
- shadcn/ui components installed

**Design tokens:**
```
--brand-navy: #1A2C4E
--brand-teal: #0E7C7B
--text-primary: #111827
--text-muted: #6B7280
--surface-bg: #F9FAFB
--border: #E5E7EB
```

**Screens:**
- `/login` — Login page (form present, no auth yet — just shows "coming in Phase 1")
- `/dashboard` — Dashboard shell (empty, "no data yet" state)
- `/processes` — Process list (empty state: "No processes yet")
- `/workflows` — Workflow list (empty state)
- `/agents` — Agent registry (empty state)
- `/audit` — Audit trail (empty state)
- `/settings` — Settings shell (tabs: Organisation, Users, Roles, Escalation, Your Data)
- `/404` — Not found page
- `/403` — Access denied page

**Layout components:**
- `AppShell` — sidebar + top nav + main content area
- `Sidebar` — brand logo, nav links with icons, active state, collapsed state
- `TopNav` — breadcrumb, notification bell placeholder, user avatar + menu
- `EmptyState` — reusable component (icon, title, description, optional CTA button)
- `PageHeader` — title, description, action button slot

**Sidebar nav items:**
- Dashboard
- Processes
- Workflows
- Agents
- Audit
- Settings (bottom)

---

### Seed Data

None required for Phase 0.

---

### Acceptance Criteria

1. App loads at `localhost:3000` without errors
2. All routes render without crashing
3. Sidebar navigation works — clicking each nav item loads the correct page
4. Sidebar collapses and expands
5. Layout is responsive at 1280px (laptop demo width)
6. Design tokens are applied — teal action buttons, navy brand elements, correct typography
7. Empty state components render on all list pages
8. 404 page appears for unknown routes
9. API health check returns `{ status: "ok" }` at `localhost:3001/health`
10. No TypeScript errors, no console errors

---

### Automated Tests

- Snapshot tests for all layout components
- Navigation routing tests (all links resolve)
- API health check test

---

### Out of Scope

- No auth, no database, no real data
- No business logic of any kind

---

### Definition of Done

- [ ] App opens at localhost:3000
- [ ] All 8 routes render without crashing
- [ ] Sidebar navigation works
- [ ] Design tokens visible in browser — teal buttons, navy brand
- [ ] API health check returns 200
- [ ] No TypeScript errors
- [ ] No console errors

---

---

## Phase 1 — Multi-Tenant Security Kernel

**Goal:** Log in as different users, prove that each user sees only their own institution's data, and verify that roles control what each user can do.

**Estimated effort:** 2 days

**Prerequisites:** Phase 0 complete

---

### What to Build

**Database tables:**
```sql
tenants (
  id uuid PK,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  institution_type text,
  country text,
  status text DEFAULT 'active',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
)

users (
  id uuid PK REFERENCES auth.users(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  status text DEFAULT 'active',  -- active | invited | deactivated
  mfa_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  UNIQUE(tenant_id, email)
)

permissions (
  id uuid PK,
  resource text NOT NULL,       -- processes | workflows | agents | users | etc.
  action text NOT NULL,         -- create | read | edit | approve | delete | etc.
  description text
)

roles (
  id uuid PK,
  tenant_id uuid REFERENCES tenants(id),  -- NULL = system role
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

role_permissions (
  role_id uuid REFERENCES roles(id),
  permission_id uuid REFERENCES permissions(id),
  scope text DEFAULT 'global',  -- global | function | own
  PRIMARY KEY (role_id, permission_id)
)

user_roles (
  user_id uuid REFERENCES users(id),
  role_id uuid REFERENCES roles(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  function_scope_id uuid,  -- if role is function-scoped
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id, tenant_id)
)

audit_log (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  timestamp timestamptz DEFAULT now(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb DEFAULT '{}'
)
-- Append-only: CREATE RULE no_update_audit AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
-- Append-only: CREATE RULE no_delete_audit AS ON DELETE TO audit_log DO INSTEAD NOTHING;
```

**RLS policies (critical — all tables):**
```sql
-- Every table with tenant_id gets this policy:
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON [table]
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- audit_log: users can only read their tenant's logs
CREATE POLICY audit_tenant_read ON audit_log
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

**NestJS modules to build:**
- `AuthModule` — JWT guard, tenant extraction from JWT claims, `@CurrentUser()` decorator
- `TenantModule` — tenant context middleware, `GET /tenants/me`, `PATCH /tenants/me`
- `UsersModule` — `GET /users`, `GET /users/:id`, `POST /auth/invite`, `PATCH /users/:id`, `DELETE /users/:id`
- `RolesModule` — `GET /roles`, `POST /roles`, `GET /roles/:id`, `PATCH /roles/:id`, `DELETE /roles/:id`, `POST /roles/:id/permissions`, `DELETE /roles/:id/permissions/:pid`
- `AuditModule` — service only (no API yet). All other services call `AuditService.log(event)` to write entries.
- `AuthController` — `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `POST /auth/invite`, `POST /auth/accept-invite`

**All endpoints must:**
1. Validate JWT
2. Extract `tenant_id` from JWT (never from headers or body)
3. Scope all DB queries with `WHERE tenant_id = $tenant_id`
4. Return `403` with `{ error: { code: "FORBIDDEN" } }` when permission fails

**System roles to seed (present in every tenant):**

| Role | Permissions |
|---|---|
| Super Admin | All permissions, global scope |
| Compliance Officer | Read all, generate audit packs — no create/edit |
| Department Head | Full access scoped to assigned function |
| Process Owner | Create/edit/submit own processes; start workflows |
| Staff | Complete assigned tasks; log incidents; view own processes |
| External Auditor | Scoped read-only; time-limited; view + download only |

**Screens:**
- `/login` — Real Supabase auth login form (email + password)
- `/auth/accept-invite` — Accept invite + set password
- `/auth/reset-password` — Password reset
- `/profile` — My profile (name, email, role badges, MFA toggle)
- `/settings/users` — User list (name, email, role, status, last login, invite button)
- `/settings/users/invite` — Invite user modal (email, role assignment)
- `/settings/roles` — Role list (system roles + custom roles)
- `/settings/roles/new` — Create custom role (permission picker)
- `/settings/roles/:id` — Role detail + permission list
- `/403` — Access denied (already built in Phase 0, now wired to real auth)

---

### Seed Data

**Tenant A — Ghana International School (GIS):**
```
slug: gis
institution_type: school
country: Ghana

Users:
  - gis-admin@aquilens.test  |  role: Super Admin
  - gis-compliance@aquilens.test  |  role: Compliance Officer
  - gis-head@aquilens.test  |  role: Department Head
  - gis-owner@aquilens.test  |  role: Process Owner
  - gis-staff@aquilens.test  |  role: Staff

All passwords: Aquilens2024!
```

**Tenant B — Demo Hospital:**
```
slug: demo-hospital
institution_type: hospital
country: Ghana

Users:
  - hospital-admin@aquilens.test  |  role: Super Admin
  - hospital-staff@aquilens.test  |  role: Staff

All passwords: Aquilens2024!
```

**Cross-tenant user (belongs to both):**
```
  - dual@aquilens.test  |  GIS: Process Owner, Hospital: Staff
```

---

### User Journeys

1. As `gis-admin`, I can log in and see only GIS data
2. As `hospital-admin`, I can log in and see only Hospital data
3. As `dual@aquilens.test`, I can switch between GIS and Hospital tenants
4. As `gis-staff`, I cannot access `/settings/roles` — I am redirected to `/403`
5. As `gis-admin`, I can invite a new user and assign a role
6. As `gis-admin`, I can create a custom role with specific permissions

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Log in as `gis-admin` | Lands on `/dashboard`, sees "Ghana International School" in sidebar |
| Log in as `hospital-admin` | Lands on `/dashboard`, sees "Demo Hospital" in sidebar |
| Log in as `gis-admin`, open browser devtools → manually change JWT `tenant_id` to Hospital's ID, call `/api/v1/users` | Returns 403 or empty list — never Hospital data |
| Log in as `dual@aquilens.test` | Tenant switcher appears in sidebar with 2 options |
| Switch tenant as `dual` | Page reloads, tenant name in sidebar changes |
| Log in as `gis-staff`, navigate to `/settings/roles` | Redirected to `/403` |
| Log in as `gis-admin`, invite `newuser@test.com` as Process Owner | User appears in user list with "Invited" status |
| Log in as `gis-admin`, create custom role "IT Systems Officer" with edit:processes permission | Role appears in roles list |
| Log in, then log out | JWT cleared, redirected to `/login`, cannot access protected routes |
| Attempt `GET /api/v1/users` with no JWT | Returns `{ error: { code: "UNAUTHORIZED", status: 401 } }` |
| Log in, every action (login, role assign, invite) | Appears in Supabase audit_log table (verify in Supabase Studio) |

---

### Automated Tests

- Unit: `AuthGuard` rejects missing/expired/invalid JWTs
- Unit: tenant extraction from JWT claims
- Integration: `POST /auth/login` returns JWT with correct claims
- Integration: `GET /users` returns only current tenant's users
- Integration: Cross-tenant query attempt returns 0 rows (RLS test)
- Integration: `gis-staff` calling `POST /roles` returns 403
- E2E: Login flow → lands on dashboard

---

### Out of Scope

- No processes, workflows, agents, or any other modules
- No email sending yet — invite just sets status to "Invited" in DB
- No MFA enforcement (toggle exists but doesn't block login yet)
- No OAuth/SSO

---

### Definition of Done

- [ ] Can log in as all 8 seed users
- [ ] GIS user cannot see Hospital data (verified in UI + API)
- [ ] Tenant switcher works for dual-tenant user
- [ ] `/403` appears when `gis-staff` hits a protected route
- [ ] User invite creates an "Invited" record
- [ ] Custom role creation works
- [ ] All auth events written to `audit_log` (verified in Supabase Studio)
- [ ] No TypeScript errors, no console errors
- [ ] RLS test passes: direct cross-tenant query returns 0 rows

---

---

## Phase 2 — Tenant Onboarding + Scaffold

**Goal:** A new institution admin can run a setup wizard, pick their institution type, get a default function tree, and edit it before going further.

**Estimated effort:** 1.5 days

**Prerequisites:** Phases 0–1 complete

---

### What to Build

**Database tables:**
```sql
functions (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  code text,           -- e.g., ACAD, FIN, HR
  status text DEFAULT 'active',
  sort_order int DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
)

process_areas (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  function_id uuid NOT NULL REFERENCES functions(id),
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  sort_order int DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
)
```

**RLS:** Both tables use `tenant_id = current_user_tenant_id` isolation.

**API endpoints:**
```
GET    /api/v1/functions                   List functions (tenant-scoped)
POST   /api/v1/functions                   Create function
GET    /api/v1/functions/:id               Get function
PATCH  /api/v1/functions/:id               Update function (name, description, sort_order)
DELETE /api/v1/functions/:id               Archive function (soft delete — only if no process areas exist)

GET    /api/v1/functions/:id/process-areas  List process areas under function
GET    /api/v1/process-areas               List all process areas
POST   /api/v1/process-areas               Create process area
GET    /api/v1/process-areas/:id           Get process area
PATCH  /api/v1/process-areas/:id           Update process area
DELETE /api/v1/process-areas/:id           Archive (only if no processes exist under it)

GET    /api/v1/tenants/me                  Get current tenant details + settings
PATCH  /api/v1/tenants/me                  Update institution name, type, country (Super Admin only)
```

**Scaffold templates (hardcoded in NestJS, applied at onboarding):**
```typescript
const SCAFFOLDS = {
  school: [
    { name: 'Academics', areas: ['Student Records', 'Curriculum', 'Assessment', 'Timetabling'] },
    { name: 'Admissions', areas: ['Enquiries', 'Enrolment', 'Scholarships'] },
    { name: 'Finance', areas: ['Fees & Billing', 'Payroll', 'Procurement'] },
    { name: 'HR', areas: ['Recruitment', 'Staff Records', 'Performance'] },
    { name: 'Operations', areas: ['Facilities', 'Health & Safety', 'Transport'] },
    { name: 'IT', areas: ['Systems', 'Data Management', 'Helpdesk'] },
  ],
  hospital: [
    { name: 'Clinical', areas: ['Patient Admissions', 'Wards', 'Theatre', 'Emergency'] },
    { name: 'Pharmacy', areas: ['Dispensing', 'Procurement', 'Controlled Drugs'] },
    { name: 'HR', areas: ['Recruitment', 'Staff Records', 'Credentialing'] },
    { name: 'Finance', areas: ['Billing', 'Payroll', 'Procurement'] },
    { name: 'Operations', areas: ['Facilities', 'Catering', 'Transport'] },
    { name: 'IT', areas: ['Systems', 'Data', 'Security'] },
  ],
  financial_services: [ /* ... */ ],
  ngo: [ /* ... */ ],
  corporate: [ /* ... */ ],
  government: [ /* ... */ ],
}
```

**Screens:**
- `/onboarding` — Multi-step setup wizard:
  - Step 1: Institution name, type (dropdown), country
  - Step 2: Review default scaffold (function list + process areas per function)
  - Step 3: Edit scaffold (rename, add, remove functions and process areas)
  - Step 4: Review + confirm
  - Step 5: Done — redirect to `/dashboard`
- `/settings/organisation` — Institution settings page (name, type, country, logo)
- `/settings/structure` — Function tree editor (edit functions + process areas after onboarding)
  - Left panel: Function list (drag to reorder, add new, archive)
  - Right panel: Process areas for selected function (add, rename, archive)

**Onboarding wizard behaviour:**
- First login of a Super Admin with no functions → redirected to `/onboarding`
- Completing wizard calls `POST /api/v1/onboarding/scaffold` which creates all functions + process areas in one transaction
- After wizard completes, `tenant.settings.onboarding_complete = true`
- Wizard is skipped on subsequent logins

---

### Seed Data

Update GIS tenant seed to trigger onboarding completion:
```
GIS — functions seeded:
  Academics  → [Student Records, Curriculum, Assessment, Timetabling]
  Admissions → [Enquiries, Enrolment, Scholarships]
  Finance    → [Fees & Billing, Payroll, Procurement]
  HR         → [Recruitment, Staff Records, Performance]
  Operations → [Facilities, Health & Safety, Transport]
  IT         → [Systems, Data Management, Helpdesk]
  onboarding_complete: true

Hospital — onboarding NOT complete → triggers wizard on login
```

---

### User Journeys

1. As `hospital-admin`, first login redirects me to the onboarding wizard
2. I select "Hospital" and see the default scaffold loaded
3. I rename "Clinical" to "Clinical Services" and add a new function "Research"
4. I confirm and see the function tree at `/settings/structure`
5. As `gis-admin`, I can edit the existing function tree at `/settings/structure`
6. As `gis-staff`, I cannot access `/settings/structure` — redirected to `/403`

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Log in as `hospital-admin` (onboarding not done) | Redirected to `/onboarding` wizard |
| Select "Hospital" as institution type | Hospital scaffold loads in Step 2 |
| Rename "Clinical" to "Clinical Services" | Updated name persists after confirmation |
| Add a new function "Research" | Appears in Step 2 list and in DB after confirmation |
| Remove a default process area | Excluded from created structure |
| Complete wizard | Redirected to `/dashboard`, function tree exists in DB |
| Log in as `hospital-admin` again | No wizard redirect — goes straight to dashboard |
| Log in as `gis-admin`, go to `/settings/structure` | GIS function tree is editable |
| Log in as `gis-staff`, navigate to `/settings/structure` | Redirected to `/403` |
| Archive a function with no process areas (in GIS) | Function disappears from tree |
| Try to archive a function with process areas | Error toast: "Cannot archive — remove process areas first" |
| All create/edit/archive actions | Written to `audit_log` |

---

### Automated Tests

- Unit: scaffold generation for each institution type
- Integration: `POST /onboarding/scaffold` creates correct functions + process areas
- Integration: `DELETE /functions/:id` with existing process areas returns 409
- RLS: Hospital user cannot read GIS functions

---

### Out of Scope

- No processes yet
- No user assignment to functions yet (Department Head → Function scoping is Phase 1 admin)

---

### Definition of Done

- [ ] Hospital admin sees wizard on first login
- [ ] Wizard creates correct scaffold in DB
- [ ] Function tree is editable after wizard
- [ ] Staff cannot access structure editor
- [ ] All changes written to `audit_log`
- [ ] No TypeScript errors, no console errors

---

---

## Phase 3 — Process Repository + SOP Editor

**Goal:** A process owner can create a fully structured, governed SOP manually — with all fields, steps, owners, risk classification, and governance controls — and save it as a draft.

**Estimated effort:** 2.5 days

**Prerequisites:** Phases 0–2 complete

---

### What to Build

**Database tables:**
```sql
processes (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  function_id uuid NOT NULL REFERENCES functions(id),
  process_area_id uuid NOT NULL REFERENCES process_areas(id),
  process_code text,              -- Auto-generated, e.g. ACAD-STUD-001
  name text NOT NULL,
  description text,
  purpose text,
  who_it_affects text[],          -- Array of roles/groups
  linked_systems text[],          -- SIS, HR, Finance etc.
  linked_policies text,
  tags text[],
  risk_rating text DEFAULT 'medium',  -- high | medium | low
  risk_notes text,
  governance_controls jsonb DEFAULT '[]',
  approval_required boolean DEFAULT false,
  review_frequency text DEFAULT 'annually',
  regulatory_reference text,
  status text DEFAULT 'draft',    -- draft | under_review | active | retired
  current_version_id uuid,        -- FK set after first version created
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

process_versions (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  process_id uuid NOT NULL REFERENCES processes(id),
  version_number int NOT NULL,
  status text DEFAULT 'draft',    -- draft | under_review | active | superseded | rejected
  change_summary text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  UNIQUE(process_id, version_number)
)

process_version_people (
  id uuid PK DEFAULT gen_random_uuid(),
  process_version_id uuid NOT NULL REFERENCES process_versions(id),
  user_id uuid REFERENCES users(id),
  role text NOT NULL,             -- owner | approver | user
  created_at timestamptz DEFAULT now()
)

process_steps (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  process_version_id uuid NOT NULL REFERENCES process_versions(id),
  step_number int NOT NULL,
  title text NOT NULL,
  description text,
  responsible_role text,
  step_type text DEFAULT 'manual',  -- manual | approval | system
  inputs text,
  outputs text,
  controls text,
  notes text,
  evidence_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)
```

**API endpoints:**
```
GET    /api/v1/processes                        List processes (filter: status, risk, function, area, tag)
POST   /api/v1/processes                        Create process (creates first draft version)
GET    /api/v1/processes/:id                    Get process with current version + steps
PATCH  /api/v1/processes/:id                    Update process metadata
DELETE /api/v1/processes/:id                    Retire process

GET    /api/v1/processes/:id/versions           List all versions
GET    /api/v1/processes/:id/versions/:vId      Get specific version (full detail + steps)

GET    /api/v1/processes/:id/versions/:vId/steps               List steps
POST   /api/v1/processes/:id/versions/:vId/steps               Add step
PATCH  /api/v1/processes/:id/versions/:vId/steps/:stepId       Update step
DELETE /api/v1/processes/:id/versions/:vId/steps/:stepId       Delete step
POST   /api/v1/processes/:id/versions/:vId/steps/reorder       Reorder (body: [{id, stepNumber}])
```

**Screens:**
- `/processes` — Process repository
  - Left panel: Function tree (click to filter)
  - Main: Process list with status badges, risk badges, owner, last updated
  - Filter bar: status, risk rating, function, tag
  - Button: "New Process"
- `/processes/new` — Create process
  - Step 1: Location (pick function + process area)
  - Step 2: Identity (name, description, purpose, who it affects, linked systems, tags)
  - Step 3: Governance (risk rating, risk notes, controls, approval required, review frequency)
  - Step 4: Steps (step builder — see below)
  - Step 5: People (assign owner, approver, users)
  - Autosave on every input ("Last saved 2s ago")
- `/processes/:id` — Process detail
  - Header: name, process code, status badge, risk badge, owner
  - Tabs: Overview | Steps | Governance | People | Version History
  - Action buttons: Edit | Submit for Approval (Phase 5) | Start Workflow (Phase 6)
- `/processes/:id/edit` — Edit process (same layout as create, prepopulated)

**Step builder (inside process create/edit):**
- Drag-and-drop reordering (drag handle on left of each step)
- Each step: expandable row with all fields
- Step type selector: Manual / Approval (System greyed out with "Phase 2" label)
- "Evidence required" toggle on each step
- "Add AI Model" button (placeholder chip for Phase 8)
- "+ Add Step" button at bottom

---

### Seed Data

Add to GIS seed:
```
Process 1 — ACAD-STUD-001 "Record Student Attendance"
  function: Academics
  area: Student Records
  status: draft
  risk_rating: medium
  steps:
    1. Teacher takes register (manual, evidence optional)
    2. Discrepancies flagged to admin (manual)
    3. Absence notified to parents (manual)

Process 2 — ADMN-ENR-001 "Enrol New Student"
  function: Admissions
  area: Enrolment
  status: active (version 2, approved)
  risk_rating: high
  steps: 5 steps covering application, interview, placement, documentation, system entry

Process 3 — FIN-FEES-001 "Issue Fee Invoice"
  function: Finance
  area: Fees & Billing
  status: draft
  risk_rating: low
  steps: 3 steps
```

---

### User Journeys

1. As `gis-owner`, I can browse the process list filtered by function
2. As `gis-owner`, I can create a new process, fill in all fields, add steps, and save as draft
3. As `gis-owner`, I can reorder steps via drag and drop
4. As `gis-owner`, I can edit a draft process
5. As `gis-staff`, I can view processes but not edit them
6. As `gis-staff`, I cannot create a new process — the button is hidden and the route returns 403

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Open `/processes` as `gis-admin` | All 3 seeded processes visible |
| Click "Academics" in function tree | List filters to attendance process only |
| Click "New Process" as `gis-owner` | Wizard opens at Step 1 |
| Fill all required fields, skip optional | Autosave indicator shows "Last saved Xs ago" |
| Add 3 steps, then drag step 3 above step 1 | Steps reorder, step numbers update |
| Toggle "Evidence required" on a step | Toggle state persists after save |
| Set step type to "Approval" | Step shows approval indicator |
| Save process | Draft process appears in list with Draft badge |
| Open process, edit a field, reload page | Edit persisted |
| Open process detail | All 5 tabs render correctly |
| Log in as `gis-staff`, try to access `/processes/new` | 403 returned, redirected to access denied |
| Log in as `gis-staff`, view a process | Read-only view, no edit button |
| Create process, check `audit_log` in Supabase Studio | `process.created` and `process.version_created` events logged |

---

### Automated Tests

- Unit: process code generation (correct format FUNC-AREA-NNN)
- Unit: step reorder endpoint applies correct step numbers
- Integration: `POST /processes` creates process + version + steps in one transaction
- Integration: `gis-staff` calling `POST /processes` returns 403
- RLS: Hospital user cannot read GIS processes

---

### Out of Scope

- No approval submission yet (Phase 5)
- No AI generation yet (Phase 4)
- No workflow start yet (Phase 6)
- No agent linking yet (Phase 8)

---

### Definition of Done

- [ ] All 3 seeded processes visible in process list
- [ ] Can create a full process with steps end to end
- [ ] Drag-to-reorder works
- [ ] Autosave indicator works
- [ ] Staff see read-only view
- [ ] All create/edit events in `audit_log`
- [ ] No TypeScript errors, no console errors

---

---

## Phase 3.5 — Process Access + Execution Schedule

**Goal:** Separate *how often the SOP document is reviewed* from *how often the process is performed*, and enforce per-process **Owner / Editor / Viewer** assignments so process owners can delegate edit and view access without tenant-admin powers.

**Estimated effort:** 1 day

**Prerequisites:** Phase 3 complete

---

### Concepts (keep these distinct in UI and schema)

| Field | Meaning | Example |
|---|---|---|
| **`review_frequency`** | Governance — how often the **SOP document** must be reviewed for accuracy | Annually, quarterly, risk-based |
| **`execution_schedule`** | Operations — how often the **process work** is performed | Daily, every Monday, 5 days before term start |

Never combine these into one control. Labels in the UI:

- **“How often should this SOP be reviewed?”** → `review_frequency`
- **“How often is this process performed?”** → `execution_schedule`

---

### What to Build

**Database changes:**
```sql
-- On processes
execution_schedule jsonb NOT NULL DEFAULT '{"kind":"ad_hoc"}'

-- process_version_people.role expands:
-- owner | editor | viewer | approver
-- (migrate legacy `user` → `viewer`)
```

**`execution_schedule` JSON schema:**
```typescript
type ExecutionSchedule =
  | { kind: 'ad_hoc' }
  | { kind: 'daily'; timezone?: string }
  | { kind: 'weekly'; interval?: number; anchor: 'monday' | ... ; timezone?: string }
  | { kind: 'monthly'; dayOfMonth: number; timezone?: string }
  | { kind: 'relative'; offsetDays: number; relativeTo: { type: 'calendar_event'; key: string } }
```

**Access model (org role + process assignment):**

| Action | Org permission | Process assignment |
|---|---|---|
| View process | `processes:read` | viewer, editor, owner, or approver on this version — OR global read-all roles (Super Admin, Compliance) |
| Edit process | `processes:edit` | owner or editor on this version — OR Super Admin |
| Assign editors/viewers | `processes:edit` or owner org role | **owner** on this process only (Super Admin always) |
| Invite tenant users | `users:invite` | Super Admin only (unchanged from Phase 1) |

**Rules:**
- Super Admin (assigned by Aquilens / platform) onboards tenant users and org roles.
- Process **Owner** assigns **Editors** and **Viewers** for that process only — not new tenant accounts.
- Editors cannot assign other editors (strict delegation).
- Staff with `processes:read` see only processes they are assigned to; Compliance / Super Admin see all.

**API changes:**
- Include `executionSchedule` on create/update/get
- Include `access: { canEdit, canManagePeople, processRole }` on process detail
- Filter `GET /processes` for staff to assigned processes only
- `PUT /processes/:id/versions/:vId/people` — owner-only (or Super Admin); roles: owner | editor | viewer | approver
- Demo mode: `GET /users` returns tenant demo users for people picker

**UI changes:**
- Governance step: split **Review frequency** and **Execution schedule** with helper text
- People step: owner picker + lists for editors and viewers (add/remove)
- Detail Overview tab: show both cadences in plain language
- Edit button hidden unless `access.canEdit`; people management only when `access.canManagePeople`

---

### Seed Data (GIS demo)

- `Record Student Attendance`: owner = gis-owner, viewer = gis-staff, execution = daily
- `Enrol New Student`: owner = gis-owner, execution = ad_hoc
- `Issue Fee Invoice`: owner = gis-owner, execution = monthly (1st)

---

### User Journeys

1. As Super Admin, I invite users and assign org roles — process owners cannot invite tenant users
2. As process Owner, I assign Editors and Viewers on my process
3. As Editor, I can edit the SOP but cannot assign other people
4. As Viewer (Staff), I see the process read-only and it appears in my list; I cannot edit
5. As Compliance Officer, I see all processes regardless of assignment

---

### Automated Tests

- Unit: execution schedule label formatting
- Integration: staff sees only assigned processes in list
- Integration: staff GET detail on assigned process = 200, edit = 403
- Integration: owner PUT people with editor + viewer succeeds; staff PUT people = 403
- Integration: create/update persists `executionSchedule` separately from `reviewFrequency`

---

### Definition of Done

- [ ] Review frequency and execution schedule are separate fields with clear UI labels
- [ ] Process people roles: owner, editor, viewer, approver
- [ ] Owner can assign editors/viewers; editors cannot
- [ ] Staff list/detail respects process assignments
- [ ] Demo seed includes viewer assignment and sample schedules
- [ ] Tests pass; no TypeScript errors

---

## Phase 4 — AI SOP Generation

**Goal:** A process owner can describe a process in plain English (text only — no file or voice yet) and Aquilens generates a complete, structured SOP draft using AI, flags gaps, and requires human review before saving.

**Estimated effort:** 1.5 days

**Prerequisites:** Phases 0–3.5 complete

---

### What to Build

**NestJS service — `SopGenerationService`:**
- Single `generate(dto)` method that calls Claude API
- Input: `{ description: string, functionId: string, processAreaId: string, tenantContext: string }`
- System prompt instructs Claude to output **strictly valid JSON** matching the process template schema
- Output JSON schema (strictly enforced):
```typescript
{
  name: string,
  description: string,
  purpose: string,
  risk_rating: 'high' | 'medium' | 'low',
  risk_notes: string,
  who_it_affects: string[],
  governance_controls: Array<{ name: string, type: 'preventive' | 'detective' | 'corrective', owner: string }>,
  steps: Array<{
    step_number: number,
    title: string,
    description: string,
    responsible_role: string,
    inputs: string,
    outputs: string,
    controls: string,
    step_type: 'manual' | 'approval',
    evidence_required: boolean
  }>,
  gaps: Array<{
    field: string,
    severity: 'required' | 'recommended',
    message: string
  }>
}
```
- If Claude returns invalid JSON: retry once, then return 500
- Gap detection: gaps are embedded in the AI response — Claude identifies them as part of output
- Every call is logged: `{ tenant_id, actor_id, description_length, model, tokens_used, timestamp }` to `audit_log`

**API endpoints:**
```
POST   /api/v1/sop/generate
  Body: { description: string, functionId: string, processAreaId: string }
  Returns: { draft: ProcessDraftDTO, gaps: GapDTO[] }
  Auth: requires `processes:create` permission
  Rate limit: 10 requests/user/hour
```

**Screens:**
- `/processes/new` — Add a new creation method selection step before the wizard:
  - "Build manually" (existing wizard)
  - "Generate with AI" (new — opens AI generation screen)
  - "Upload a file" (placeholder — "Coming soon")
  - "Speak or record" (placeholder — "Coming soon")

- `/processes/generate` — AI SOP generation screen:
  - Input area: large textarea, placeholder "Describe the process in plain English. The more detail you give, the better the output."
  - Function + Process Area selectors (required before generating)
  - "Generate SOP" button (teal, primary action)
  - Loading state: animated skeleton with "Aquilens is generating your SOP…"
  
- `/processes/generate/review` — AI-generated SOP review screen:
  - All process fields pre-filled from AI output
  - Every AI-generated field has a small "AI" badge next to it
  - Gap panel on the right: list of flagged gaps with severity (Required / Recommended)
  - Required gaps highlighted in orange — cannot save as Draft until all Required gaps are addressed
  - Recommended gaps shown in yellow — can be saved with warnings present
  - All fields are editable — user must review and confirm before saving
  - "Save as Draft" button (disabled until required gaps resolved)
  - "Discard" button (confirms before navigating away)

**AI badge component:**
```
Small pill: [✦ AI generated]
Colour: neutral grey
Appears next to every field populated by AI
Disappears when the user edits the field manually
```

**Gap panel items:**
```
[Required] Owner not assigned — assign a Process Owner before publishing
[Required] Risk rating is set to Medium — review and confirm this is correct
[Recommended] No governance controls defined — consider adding at least one preventive control
[Recommended] Step 3 has no defined outputs — what does this step produce?
```

---

### Seed Data

Add to GIS seed:
```
AI-generated draft process in GIS:
  name: "Manage Student Safeguarding Concern"
  function: Operations / Health & Safety
  status: draft
  source: ai_generated (field to mark it was AI-created)
  gaps remaining: 2 recommended (no audit log entry yet for resolve)
```

---

### User Journeys

1. As `gis-owner`, I click "Generate with AI" and see the generation screen
2. I select "Academics > Student Records", paste a process description, and click Generate
3. I see a loading screen while AI processes
4. I see the structured SOP with all fields populated and AI badges
5. I see the gap panel with required gaps highlighted
6. I try to click "Save as Draft" without fixing required gaps — button is disabled
7. I fix the required gaps (fill in owner, confirm risk rating)
8. I click "Save as Draft" — process appears in process list as Draft
9. AI generation request is written to audit log

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Click "New Process" | Method selection screen appears with 4 options |
| Click "Generate with AI" | AI generation screen opens |
| Click "Generate" without selecting function/area | Validation error: "Select a function and process area first" |
| Submit a description | Loading skeleton appears, then review screen |
| Review screen | All fields populated, "AI" badges visible on AI-populated fields |
| Edit a field | AI badge disappears from that field |
| Gap panel | Required gaps listed with orange highlight |
| Click "Save as Draft" with required gaps | Button disabled, tooltip "Resolve required gaps first" |
| Resolve required gaps, click "Save as Draft" | Draft created, redirected to process detail |
| Check audit log | `sop.ai_generated` event logged with description length and model used |
| Send 11 generate requests in 1 hour | 11th request returns 429 rate limit error |

---

### Automated Tests

- Unit: `SopGenerationService` — mock Claude response, verify JSON parsing
- Unit: gap detection (missing owner, missing controls, etc.)
- Integration: `POST /sop/generate` with valid body returns structured draft
- Integration: AI response with invalid JSON triggers retry
- Integration: Rate limit enforced after 10 requests

---

### Out of Scope

- No file upload (Phase 4 only — text description)
- No voice input
- No automatic publishing — AI can never save without human review
- No gap auto-resolution

---

### Definition of Done

- [ ] Method selection screen appears on new process flow
- [ ] AI generation screen submits to Claude and displays structured output
- [ ] AI badges visible on every AI-populated field
- [ ] Required gaps block "Save as Draft"
- [ ] Editing a field removes its AI badge
- [ ] Draft created correctly in DB after save
- [ ] AI generation event in `audit_log`
- [ ] No TypeScript errors, no console errors

---

---

## Phase 5 — SOP Approval Lifecycle

**Goal:** A process owner can submit a SOP for approval. An approver can approve or reject it with a comment. Approved SOPs become active and locked. Rejected SOPs return to draft.

**Estimated effort:** 2 days

**Prerequisites:** Phases 0–4 complete

---

### What to Build

**Database tables:**
```sql
approval_instances (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  entity_type text NOT NULL,           -- process_version
  entity_id uuid NOT NULL,             -- the process_version_id
  process_id uuid REFERENCES processes(id),
  status text DEFAULT 'pending',       -- pending | approved | rejected
  approver_id uuid REFERENCES users(id),
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamptz DEFAULT now(),
  decided_at timestamptz,
  comment text
)
```

**Process lifecycle state machine (strictly enforced):**
```
draft → under_review   (via POST /processes/:id/submit)
under_review → active  (via POST /processes/:id/approve — approver only)
under_review → draft   (via POST /processes/:id/reject — approver only, comment required)
active → draft         (new draft version created — existing active version unchanged)
active → retired       (via POST /processes/:id/retire — Super Admin only)
```

**API endpoints:**
```
POST   /api/v1/processes/:id/submit      Submit draft for approval (Process Owner)
POST   /api/v1/processes/:id/approve     Approve (Approver — body: { comment?: string })
POST   /api/v1/processes/:id/reject      Reject (Approver — body: { comment: string } — required)
POST   /api/v1/processes/:id/retire      Retire active process (Super Admin)
POST   /api/v1/processes/:id/versions    Create new draft version from active (Process Owner)

GET    /api/v1/approvals                 List pending approvals for current user
GET    /api/v1/approvals/:id             Get approval instance
POST   /api/v1/approvals/:id/approve     Approve (same as above, approval-centric path)
POST   /api/v1/approvals/:id/reject      Reject (same as above)
```

**Screens:**
- `/processes/:id` — Updated process detail:
  - "Submit for Approval" button appears when status is `draft` and user is Process Owner
  - Status badge updates in real time after actions
  - Approval history tab shows all approval decisions (who, when, comment)
- `/approvals` — Approval queue
  - List: process name, submitted by, submitted date, function/area
  - Only shows items where current user is the designated approver
  - Badge on sidebar: count of pending approvals
- `/approvals/:id` — Approval detail
  - Full process overview (name, description, steps — read only)
  - "Approve" button (teal) + "Reject" button (destructive)
  - Reject modal: comment is required, cannot reject without text
  - After decision: redirected back to approval queue
- Version history (inside `/processes/:id` — Versions tab):
  - List: version number, created by, status, approved/rejected by, date
  - Click to view a specific version read-only
  - Simple diff: show added/changed/removed fields between two versions (highlight changes, not a full diff tool)

---

### Seed Data

Update GIS seed:
```
ADMN-ENR-001 "Enrol New Student"
  version 1: rejected (rejected by gis-head, comment: "Missing safeguarding step")
  version 2: active (approved by gis-head)

ACAD-STUD-001 "Record Student Attendance"
  version 1: under_review (pending — gis-head has a pending approval task)

FIN-FEES-001 "Issue Fee Invoice"
  version 1: draft (not yet submitted)
```

---

### User Journeys

1. As `gis-owner`, I open a Draft SOP and click "Submit for Approval" — status changes to "Under Review"
2. As `gis-head` (approver), I see the SOP in my approval queue
3. I open the approval, read the SOP, and click "Approve"
4. Process status changes to Active, version is locked
5. As `gis-owner`, I try to edit the Active SOP directly — I see "Create New Version" instead of "Edit"
6. I create a new draft version — Active version stays active, new draft is separate
7. As `gis-head`, I reject a submission — comment is required, rejection recorded
8. As `gis-owner`, I receive notification of rejection with comment (notification only — no email yet)

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Open Draft SOP as `gis-owner`, click "Submit for Approval" | Status badge changes to "Under Review" |
| Refresh page | Status still shows "Under Review" |
| Log in as `gis-head`, open `/approvals` | Pending approval for attendance process visible |
| Open approval detail | Full SOP displayed read-only |
| Click "Approve" | Process status → Active, version locked |
| Open Active process as `gis-owner` | "Edit" button replaced by "Create New Version" |
| Click "Create New Version" | New draft version created, active version unchanged |
| Versions tab | Shows v1 Active, v2 Draft side-by-side |
| Click "Reject" without comment | Error: "Rejection comment is required" |
| Click "Reject" with comment | Status → Draft, rejection comment visible in approval history |
| Check `audit_log` | Events: `process.submitted`, `process.approved`/`process.rejected`, approver name and timestamp |
| Log in as `gis-staff`, open `/approvals` | Empty state or 403 — staff have no approvals |

---

### Automated Tests

- Unit: state machine rejects invalid transitions (e.g., cannot approve an already active process)
- Integration: `POST /submit` → status = under_review
- Integration: `POST /approve` → status = active, version locked
- Integration: `POST /reject` without comment → 422
- Integration: `gis-staff` calling `POST /approve` → 403

---

### Out of Scope

- No email notifications yet (Phase 9)
- No parallel approval chains (Phase 2 product)
- No delegated approval yet

---

### Definition of Done

- [ ] Submit for approval changes status and creates approval instance
- [ ] Approver sees pending approvals in queue
- [ ] Approve makes process Active
- [ ] Edit on Active shows "Create New Version" instead
- [ ] Reject requires comment, returns to Draft
- [ ] Version history tab shows correct history with diff
- [ ] All approval events in `audit_log`
- [ ] No TypeScript errors, no console errors

---

---

## Phase 6 — Workflow Execution

**Goal:** A process owner can start a workflow from an active SOP. Tasks are created, assigned, and executed sequentially. Each completion is recorded with a timestamp and actor.

**Estimated effort:** 3 days

**Prerequisites:** Phases 0–5 complete

---

### What to Build

**Database tables:**
```sql
workflow_instances (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  process_id uuid NOT NULL REFERENCES processes(id),
  process_version_id uuid NOT NULL REFERENCES process_versions(id),
  title text NOT NULL,
  context text,
  status text DEFAULT 'in_progress',  -- in_progress | completed | cancelled
  started_by uuid REFERENCES users(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
)

workflow_tasks (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  workflow_instance_id uuid NOT NULL REFERENCES workflow_instances(id),
  process_step_id uuid REFERENCES process_steps(id),
  step_number int NOT NULL,
  title text NOT NULL,
  description text,
  step_type text NOT NULL,           -- manual | approval
  status text DEFAULT 'pending',     -- pending | in_progress | completed | skipped | approved | rejected
  assigned_to uuid REFERENCES users(id),
  assigned_role text,
  evidence_required boolean DEFAULT false,
  sla_hours int,
  sla_due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  completed_by uuid REFERENCES users(id),
  notes text,
  skip_reason text
)
```

**Sequential execution rule:**
- Task N+1 status is `pending` and cannot be acted on until Task N is `completed`
- Approval-type tasks: status becomes `approved` or `rejected` — both count as "completed" for unlocking next task (rejection of a workflow task does NOT stop the workflow — it just records the rejection and the workflow owner decides next steps)
- Task N cannot be started if Task N-1 is still `pending`

**API endpoints:**
```
POST   /api/v1/workflows                          Start workflow instance
  Body: { processId, title, context?, assignees?: { stepId: userId }[] }

GET    /api/v1/workflows                          List instances (filter: status, processId, startedBy)
GET    /api/v1/workflows/:id                      Get instance with all tasks
PATCH  /api/v1/workflows/:id                      Update metadata
POST   /api/v1/workflows/:id/cancel               Cancel (body: { reason })

GET    /api/v1/workflows/:id/tasks                List tasks
GET    /api/v1/workflows/:id/tasks/:taskId        Get task
POST   /api/v1/workflows/:id/tasks/:taskId/start  Mark in_progress
POST   /api/v1/workflows/:id/tasks/:taskId/complete  Complete task (body: { notes? })
POST   /api/v1/workflows/:id/tasks/:taskId/skip   Skip (body: { reason })
POST   /api/v1/workflows/:id/tasks/:taskId/approve  Approve (approval tasks only)
POST   /api/v1/workflows/:id/tasks/:taskId/reject   Reject (approval tasks only, body: { comment })

GET    /api/v1/workflows/:id/audit                Audit trail for this instance
```

**Screens:**
- `/workflows` — Workflow list
  - Tabs: Active | Completed | All
  - Columns: title, process, status, started by, started date, tasks done/total
- `/workflows/new` — Start workflow modal (opened from process detail page)
  - Select process (pre-filled if opened from process page)
  - Add title, context (optional)
  - Assign users to steps (optional — can use role default)
- `/workflows/:id` — Workflow instance detail
  - Header: title, process, status, started by, date
  - Timeline on left: step 1 → step 2 → step 3 etc. with status indicators (pending, in progress, done)
  - Active task panel on right: current task detail
  - "Complete Task" / "Approve" / "Reject" buttons
  - Notes field (optional) on completion
  - Workflow log at bottom: timestamped history of all task actions
- `/my-tasks` — My tasks (tasks assigned to current user across all workflows)
  - Card per task: workflow title, task title, due date, SLA indicator (on time / overdue)
  - Click → opens `/workflows/:id` at the active task

**SOP approval workflow (auto-triggered in Phase 5 — now with workflow instance):**
When a SOP is submitted for approval, create a workflow instance automatically:
```
workflow_instances:
  title: "Approval: [SOP Name]"
  process_id: null (governance workflow, not a process)
  status: in_progress

workflow_tasks:
  Task 1: "Review and approve SOP — [name]"
  assigned_to: process approver
  step_type: approval
  evidence_required: false
```

---

### Seed Data

Add to GIS seed:
```
Workflow 1 — "Enrol New Student — Term 2 2025"
  process: ADMN-ENR-001 (active)
  status: in_progress
  started_by: gis-owner
  tasks:
    Task 1: "Receive and review application" — completed by gis-staff
    Task 2: "Schedule admission interview" — in_progress (assigned to gis-staff)
    Task 3: "Conduct interview and assessment" — pending
    Task 4: "Issue placement decision" — pending (approval step, assigned to gis-head)
    Task 5: "Collect registration documents" — pending
  
Workflow 2 — "Term 1 Attendance Review"
  process: ACAD-STUD-001 (draft — should NOT allow starting a workflow from a non-active SOP)
  → This seed tests that starting a workflow from a non-active process is blocked

Workflow 3 — "Fees Invoice — Q1 2025" (completed)
  process: FIN-FEES-001
  status: completed
  all tasks completed
```

---

### User Journeys

1. As `gis-owner`, I open the active "Enrol New Student" SOP and click "Start Workflow"
2. I name the workflow "Enrol New Student — Term 2 2025", set context, and start
3. System creates all tasks from the locked SOP version
4. I see the workflow with Task 1 active, Tasks 2–5 pending
5. As `gis-staff`, I open "My Tasks" and see Task 2 assigned to me
6. I click into the task, mark it as in_progress, then complete with notes
7. Task 3 unlocks automatically
8. When Task 4 (approval) is reached, `gis-head` sees it in their approval queue
9. `gis-head` approves — Task 5 unlocks
10. After all tasks complete — workflow status changes to "Completed"

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Open Active SOP, click "Start Workflow" | Workflow start modal opens |
| Try to start workflow from Draft SOP | "Start Workflow" button hidden or disabled with tooltip |
| Start workflow | Redirected to `/workflows/:id`, all tasks created |
| Timeline | Task 1 shows as active, others as pending |
| Complete Task 1 | Task 2 becomes active, Task 1 shows green checkmark |
| Try to complete Task 3 before Task 2 | API returns 409 "Task N-1 is not complete" |
| Navigate to `/my-tasks` as `gis-staff` | Assigned tasks visible |
| Approval task reached | Appears in approver's approval queue and `/my-tasks` |
| Approve task | Task shows "Approved", next task unlocks |
| Skip a task with reason | Task shows "Skipped", reason recorded |
| All tasks complete | Workflow status → "Completed" |
| Cancel workflow | Status → "Cancelled", reason recorded |
| Check `audit_log` | Events for every task action with actor + timestamp |

---

### Automated Tests

- Unit: sequential lock — completing task N-1 unlocks task N only
- Unit: only approval-type tasks can receive approve/reject actions
- Integration: `POST /workflows` creates correct number of tasks from SOP version
- Integration: completing task out of sequence returns 409
- Integration: `gis-staff` can only complete tasks assigned to them

---

### Out of Scope

- No evidence upload yet (Phase 7)
- No parallel tasks (Phase 2 product)
- No System step type execution
- No automated cron triggers (Phase 8 of the plan)
- No email notifications

---

### Definition of Done

- [ ] Can start workflow from Active SOP
- [ ] Cannot start workflow from Draft/Under Review SOP
- [ ] Tasks execute sequentially — next task locked until previous complete
- [ ] `/my-tasks` shows assigned tasks
- [ ] Approval tasks route to approver
- [ ] Workflow completes when all tasks done
- [ ] All task events in `audit_log` with actor + timestamp
- [ ] No TypeScript errors, no console errors

---

---

## Phase 7 — Evidence Capture

**Goal:** A workflow participant can upload evidence (file or photo) directly inside a task. Evidence is linked to the workflow, immutable after upload, and blocks task completion when marked required.

**Estimated effort:** 1.5 days

**Prerequisites:** Phases 0–6 complete

---

### What to Build

**Database tables:**
```sql
workflow_task_evidence (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  workflow_instance_id uuid NOT NULL REFERENCES workflow_instances(id),
  workflow_task_id uuid NOT NULL REFERENCES workflow_tasks(id),
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size int NOT NULL,
  storage_path text NOT NULL,      -- Supabase Storage path
  checksum text NOT NULL,          -- SHA-256 hash
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now(),
  notes text
)
-- No DELETE rule: CREATE RULE no_delete_evidence AS ON DELETE TO workflow_task_evidence DO INSTEAD NOTHING;

evidence_files (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  entity_type text NOT NULL,      -- incident | attestation | access_review
  entity_id uuid NOT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size int NOT NULL,
  storage_path text NOT NULL,
  checksum text NOT NULL,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now(),
  notes text
)
-- No DELETE rule applied
```

**Supabase Storage bucket:**
```
Bucket: aquilens-evidence
Access: private (no public URLs)
RLS: users can only upload to their tenant's path (/{tenant_id}/evidence/*)
     users can only read from their tenant's path
Signed URLs: generated on demand, 15-minute expiry
```

**API endpoints:**
```
POST   /api/v1/workflows/:id/tasks/:taskId/evidence
  Body: multipart/form-data — file + { notes?: string }
  Process: stream to Supabase Storage, compute SHA-256 checksum, save metadata
  Returns: evidence record (no URL — URL generated separately)

GET    /api/v1/workflows/:id/tasks/:taskId/evidence
  Returns: list of evidence records with metadata (no URLs)

GET    /api/v1/evidence/:evidenceId/download
  Returns: { signedUrl: string, expiresAt: string }  -- 15-minute signed URL
  Never streams the file through NestJS
```

**Screens:**
- `/workflows/:id` — Updated task completion modal:
  - Evidence section visible on every task
  - If `evidence_required: true` on the step: orange banner "Evidence required before you can complete this task"
  - Drop zone: "Drag a file here, or click to upload"
  - Supported: any file format (PDF, Word, Excel, images, video)
  - After upload: file appears as an evidence card (filename, size, timestamp, uploader, notes field)
  - "Complete Task" button disabled until evidence is uploaded (if required)
  - Multiple evidence items allowed per task
  - Once uploaded: no delete button visible ("Evidence cannot be removed after upload")

- Evidence viewer (inside workflow task detail):
  - List of all evidence items for the task
  - Each item: filename, type icon, size, uploaded by, uploaded at, notes
  - "View / Download" button → calls `/evidence/:id/download` → opens signed URL in new tab
  - Note at bottom: "Evidence is permanently attached to this record and cannot be deleted."

---

### Seed Data

Update Workflow 1 in GIS seed:
```
Task 1 "Receive and review application" (completed):
  evidence: application_form.pdf
    uploaded by: gis-staff
    uploaded_at: [past timestamp]
    notes: "Received via email 15 Jan"
```

---

### User Journeys

1. As `gis-staff`, I open a workflow task that requires evidence
2. I see an orange banner: "Evidence required before you can complete this task"
3. I drag and drop a PDF onto the drop zone — it uploads and appears as a card
4. I add a note to the evidence item
5. The "Complete Task" button becomes enabled
6. I complete the task — evidence is permanently attached
7. As `gis-head`, I open the completed task and see the evidence with a download link
8. I download the file — signed URL opens in a new tab
9. As `gis-admin`, I try to delete an evidence item — there is no delete button anywhere

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Open task with `evidence_required: true` | Orange banner and disabled "Complete Task" button |
| Drag PDF onto drop zone | Upload progress, then evidence card appears |
| Try to complete task before uploading | Button stays disabled |
| Upload file, then click "Complete Task" | Task completes successfully |
| Open completed task | Evidence card shows filename, uploader, timestamp |
| Click "View / Download" | Signed URL opens file in new tab |
| Upload same file twice | Both uploads accepted (deduplication not implemented in Phase 7) |
| Check Supabase Storage | File exists at `/{tenant_id}/evidence/{task_id}/{filename}` |
| Attempt to call `DELETE /evidence/:id` directly | Returns 405 (no delete rule at DB layer) |
| Check `audit_log` | `evidence.uploaded` event with filename, uploader, workflow, task |
| Cross-tenant: log in as hospital user, try to GET GIS evidence ID | 403 or empty (RLS blocks) |

---

### Automated Tests

- Unit: SHA-256 checksum computed correctly before storage
- Unit: evidence_required blocks task completion when no evidence present
- Integration: `POST /evidence` uploads to correct Supabase Storage path
- Integration: `DELETE /evidence/:id` returns 405
- Integration: `GET /evidence/:id/download` returns valid signed URL (not the file itself)
- RLS: Hospital user cannot read GIS evidence records

---

### Out of Scope

- No bulk download yet
- No evidence for incidents or attestations (uses `evidence_files` table — that's Phase 8+)
- No virus scanning
- No file size limits beyond what Supabase Storage enforces

---

### Definition of Done

- [ ] Evidence upload works inside task modal
- [ ] Required evidence blocks task completion
- [ ] Evidence cards appear after upload with metadata
- [ ] Download via signed URL works
- [ ] No delete button visible anywhere
- [ ] Files stored in correct Supabase Storage path
- [ ] Cross-tenant evidence access blocked
- [ ] `evidence.uploaded` in `audit_log`
- [ ] No TypeScript errors, no console errors

---

---

## Phase 8 — AI Agent Registry

**Goal:** A governance admin can register AI models and tools used by the institution, link them to specific SOP steps, track attestation history, and search the registry by natural language.

**Estimated effort:** 2 days

**Prerequisites:** Phases 0–7 complete

---

### What to Build

**Database tables:**
```sql
ai_agents (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  agent_code text,               -- Auto-generated: AI-001
  name text NOT NULL,
  description text,
  purpose text,
  vendor text,
  model_name text,
  model_version text,
  owner_id uuid REFERENCES users(id),
  owning_function_id uuid REFERENCES functions(id),
  risk_classification text DEFAULT 'medium',  -- high | medium | low
  risk_rationale text,
  deployment_environment text,
  status text DEFAULT 'active',  -- active | under_review | deprecated | retired
  version text,
  deployment_date date,
  last_attested_at timestamptz,
  next_attestation_due timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
)

ai_agent_data_inputs (
  id uuid PK,
  agent_id uuid NOT NULL REFERENCES ai_agents(id),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  data_classification text,     -- personal | sensitive | public
  source_system text
)

ai_agent_tools (
  id uuid PK,
  agent_id uuid NOT NULL REFERENCES ai_agents(id),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type text,                    -- api | database | file_system | external_service
  description text
)

ai_agent_attestations (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  agent_id uuid NOT NULL REFERENCES ai_agents(id),
  attested_by uuid REFERENCES users(id),
  attested_at timestamptz DEFAULT now(),
  outcome text NOT NULL,        -- confirmed | flagged | deprecation_recommended
  notes text
)
-- Append-only: no UPDATE, no DELETE

process_step_ai_agents (
  process_step_id uuid REFERENCES process_steps(id),
  agent_id uuid REFERENCES ai_agents(id),
  tenant_id uuid NOT NULL,
  linked_by uuid REFERENCES users(id),
  linked_at timestamptz DEFAULT now(),
  PRIMARY KEY (process_step_id, agent_id)
)

agent_embeddings (
  agent_id uuid PRIMARY KEY REFERENCES ai_agents(id),
  tenant_id uuid NOT NULL,
  embedding vector(1536),
  content text
)
```

**Attestation schedule (calculated on create/update):**
```typescript
const ATTESTATION_INTERVALS = { high: 90, medium: 180, low: 365 }  // days
next_attestation_due = last_attested_at + interval[risk_classification]
```

**API endpoints:**
```
GET    /api/v1/agents                    List agents (filter: status, risk, vendor, function)
POST   /api/v1/agents                    Register new agent + generate embedding
GET    /api/v1/agents/:id                Get agent with attestation history + linked processes
PATCH  /api/v1/agents/:id                Update agent
POST   /api/v1/agents/:id/deprecate      Deprecate (triggers impact check — lists linked processes)
POST   /api/v1/agents/:id/retire         Retire a deprecated agent

GET    /api/v1/agents/:id/processes      Processes that reference this agent
GET    /api/v1/agents/:id/attestations   Attestation history
POST   /api/v1/agents/:id/attest         Submit attestation (appends to log, recalculates next due date)

GET    /api/v1/agents/due-attestation    List agents with attestation due or overdue

POST   /api/v1/processes/:id/versions/:vId/steps/:stepId/agents          Link agent to step
DELETE /api/v1/processes/:id/versions/:vId/steps/:stepId/agents/:agentId  Unlink agent from step

GET    /api/v1/search/agents             Semantic search — natural language query
```

**Embedding generation:**
When an agent is created or updated, generate an embedding via Claude API (or OpenAI — whichever is configured) on the concatenated `name + description + purpose`. Store in `agent_embeddings`. Used for natural language search queries.

**Screens:**
- `/agents` — Agent registry list
  - Filter bar: status, risk classification, vendor, function, attestation status (due / overdue / current)
  - Columns: name, vendor/model, owner, risk, status, last attested, next due, linked processes count
  - "Overdue attestation" badge in red when past due
  - "Register Agent" button
- `/agents/new` — Register agent form
  - Section 1: Identity (name, description, purpose, vendor, model name, model version)
  - Section 2: Ownership (owner user, owning function, deployment environment)
  - Section 3: Risk (risk classification, risk rationale)
  - Section 4: Data Inputs (add data inputs — name, classification, source system)
  - Section 5: Tools (add tools — name, type, description)
- `/agents/:id` — Agent detail
  - Header: name, agent code, status badge, risk badge
  - Tabs: Overview | Data Inputs | Tools | Linked Processes | Attestation History
  - "Attest Now" button (if due or overdue — highlighted)
  - Attestation modal: outcome dropdown + notes
  - Deprecation: "Deprecate Agent" button (shows impact: "This agent is linked to 3 active processes")
- Step builder (Phase 3 screen, updated):
  - "Add AI Model" button now opens agent selector panel
  - Select from registered agents or "+ Register New Agent" inline
  - Selected agent renders as a chip: `[AI] Attendance Checker →` (click navigates to agent detail)

---

### Seed Data

Add to GIS seed:
```
Agent 1 — AI-001 "Attendance Pattern Analyser"
  vendor: Anthropic, model: claude-sonnet-4-6
  owner: gis-owner
  function: Academics
  risk: medium
  status: active
  linked to: ACAD-STUD-001 Step 2
  last_attested: 6 months ago (overdue — attestation due!)
  attestation history: 1 entry (confirmed, 6 months ago)

Agent 2 — AI-002 "Application Scoring Assistant"
  vendor: OpenAI, model: gpt-4o
  owner: gis-head
  function: Admissions
  risk: high
  status: active
  linked to: ADMN-ENR-001 Step 3
  last_attested: 2 months ago (current)
  attestation history: 2 entries
```

---

### User Journeys

1. As `gis-admin`, I open the agent registry and see both agents
2. AI-001 shows a red "Overdue" badge — I click "Attest Now"
3. I select "Confirmed" outcome and add notes — attestation logged, next due date recalculated
4. I open AI-001's detail, click "Linked Processes" tab — see ACAD-STUD-001 listed
5. I open ACAD-STUD-001's SOP editor, click Step 2 — see AI-001 chip
6. I register a new agent "Admissions Chatbot" and link it to a step
7. I search agents: "agents that process student data" — semantic search returns relevant results
8. I attempt to deprecate AI-001 — system shows impact warning: "Linked to 1 active process"

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Open `/agents` | Both seeded agents visible with correct metadata |
| AI-001 shows overdue badge | Red "Overdue" badge visible in attestation column |
| Click "Attest Now" on AI-001 | Attestation modal opens |
| Submit attestation | `last_attested_at` updated, `next_attestation_due` recalculated, history entry added |
| Open AI-001 Attestation History tab | Both attestation entries visible |
| Open AI-001 Linked Processes tab | ACAD-STUD-001 listed |
| Open ACAD-STUD-001 SOP step 2 | AI-001 chip visible |
| Click the AI chip | Navigates to `/agents/AI-001` |
| Search "student data" in agent search | Semantically relevant agents returned |
| Click "Deprecate" on AI-001 | Impact warning shown: "1 active process linked" |
| Register new agent | Agent code auto-generated (AI-003), record saved |
| Check `audit_log` | `agent.created`, `agent.attested`, `agent.linked` events logged |

---

### Automated Tests

- Unit: attestation due date calculation for each risk level
- Unit: agent code auto-increment
- Integration: `POST /agents/:id/attest` appends to attestation log, recalculates next due
- Integration: `DELETE` on attestation table returns error (append-only)
- Integration: agent step link appears correctly in `GET /processes/:id/versions/:vId/steps`
- Integration: semantic search returns results (mock embedding in test)

---

### Out of Scope

- No bulk import of agents
- No AI model performance monitoring
- No automated deprecation workflow (Phase 2 product)

---

### Definition of Done

- [ ] Agent registry renders with both seeded agents
- [ ] Overdue attestation badge shows on AI-001
- [ ] Attestation submission updates record and history
- [ ] Agent linked to SOP step — chip visible on step
- [ ] Clicking chip navigates to agent detail
- [ ] Natural language search returns results
- [ ] Deprecation shows impact warning
- [ ] All agent events in `audit_log`
- [ ] No TypeScript errors, no console errors

---

---

## Phase 9 — Notifications + Dashboard

**Goal:** Every user lands on a role-appropriate home screen that shows exactly what needs attention. Notifications fire in real time when tasks are assigned, approvals are needed, or SLAs are missed.

**Estimated effort:** 2 days

**Prerequisites:** Phases 0–8 complete

---

### What to Build

**Database tables:**
```sql
notifications (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL,            -- task_assigned | approval_requested | sla_missed | sop_approved | etc.
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  entity_name text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
)

escalation_rules (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  trigger_event text NOT NULL,   -- task_sla_missed | approval_overdue | attestation_overdue | etc.
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
)

escalation_rule_levels (
  id uuid PK DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES escalation_rules(id),
  level_number int NOT NULL,
  target_role text NOT NULL,     -- Role key — not a user ID
  delay_hours int NOT NULL,
  PRIMARY KEY (rule_id, level_number)
)
```

**NestJS services:**
- `NotificationService.create(dto)` — called by all other services when events occur
- `EscalationService` — checks for missed SLAs every 5 minutes (NestJS `@Interval`), fires escalation chain
- Socket.io gateway — `NotificationsGateway` — emits `notification.new` to user's socket room on creation

**API endpoints:**
```
GET    /api/v1/notifications               List notifications (filter: isRead, type)
PATCH  /api/v1/notifications/:id/read      Mark as read
POST   /api/v1/notifications/read-all      Mark all as read

GET    /api/v1/escalation-rules            List escalation rules
POST   /api/v1/escalation-rules            Create rule
GET    /api/v1/escalation-rules/:id        Get rule with levels
PATCH  /api/v1/escalation-rules/:id        Update
DELETE /api/v1/escalation-rules/:id        Delete
POST   /api/v1/escalation-rules/:id/toggle  Enable/disable

GET    /api/v1/dashboard                   Dashboard summary for current user (role-aware)
  Returns aggregated data based on role:
  Super Admin: { openWorkflows, pendingApprovals, overdueItems, agentsNeedingAttestation, recentActivity }
  Process Owner: { myDraftProcesses, myPendingApprovals, myActiveWorkflows, myOverdueTasks }
  Staff: { myTasks, overdueTaskCount, completedThisWeek }
  Compliance Officer: { openIncidents, processesNeedingReview, auditPacksGenerated }
```

**Notification types and triggers:**
```typescript
const NOTIFICATION_TRIGGERS = {
  'task.assigned':           { fires: 'on workflow task assignment', recipients: ['task assignee'] },
  'task.sla_warning':        { fires: '24h before SLA due', recipients: ['task assignee'] },
  'task.sla_missed':         { fires: 'when SLA deadline passes', recipients: ['task assignee', 'escalation chain'] },
  'approval.requested':      { fires: 'on SOP submission', recipients: ['approver'] },
  'approval.approved':       { fires: 'on SOP approval', recipients: ['process owner'] },
  'approval.rejected':       { fires: 'on SOP rejection', recipients: ['process owner'] },
  'workflow.completed':      { fires: 'on workflow completion', recipients: ['workflow initiator'] },
  'attestation.due':         { fires: '14 days before due', recipients: ['agent owner'] },
  'attestation.overdue':     { fires: 'when attestation date passes', recipients: ['agent owner'] },
}
```

**Screens:**
- `/dashboard` — Role-based home screen (Operational Control Room)
  - **Super Admin / Compliance Officer view:**
    - Summary cards: Open Workflows | Pending Approvals | Overdue Items | Agents Needing Attestation
    - Recent activity feed (last 10 audit events)
    - Quick links: Start Workflow | New Process | Register Agent
  - **Process Owner view:**
    - "Your Work" section: My Drafts | My Pending Approvals | My Active Workflows
    - "Overdue" section: overdue tasks in my workflows
  - **Staff view:** (simplified — this is the Two-Mode UI from the design principles)
    - Large "My Tasks" list — just tasks assigned to them, nothing else
    - Each task: workflow title, step title, due date, SLA indicator
    - No governance, no admin, no sidebar modules they don't need
- Top nav — Notification bell:
  - Badge with unread count
  - Dropdown: last 10 notifications
  - Each notification: icon, title, timestamp, entity name, "Go to record" button
  - "Mark all as read" at bottom
  - "View all notifications" → `/notifications`
- `/notifications` — Full notification centre (all notifications, filter by type, read/unread)
- `/settings/escalation` — Escalation rules editor (Super Admin only)
  - List of rules
  - Create/edit rule: name, trigger event, levels (add level: role + delay hours)
  - Enable/disable toggle

---

### Seed Data

Add to GIS seed:
```
Notifications:
  gis-staff: "Task assigned: Schedule admission interview" — unread
  gis-staff: "Task overdue: Collect registration documents" — unread
  gis-head: "Approval requested: Record Student Attendance SOP" — unread
  gis-owner: "SOP approved: Enrol New Student" — read
  gis-owner: "Attestation overdue: AI-001 Attendance Pattern Analyser" — unread

Escalation rules:
  Rule 1: "Workflow Task SLA Breach"
    trigger: task_sla_missed
    Level 1: Staff role — immediately on breach
    Level 2: Department Head — after 24 hours

  Rule 2: "Attestation Overdue"
    trigger: attestation_overdue
    Level 1: Process Owner — immediately
    Level 2: Super Admin — after 48 hours
```

---

### User Journeys

1. As `gis-admin`, login lands on dashboard showing institutional summary cards
2. I see 3 overdue items in the overdue card — click through to the list
3. Notification bell shows badge count 3 — I click and see recent notifications
4. I click a notification → navigated to the relevant record
5. As `gis-staff`, login lands on a simplified "My Tasks" view — no sidebar modules for governance
6. As `gis-head`, login shows my approval queue and department workflows
7. As `gis-admin`, I configure an escalation rule: SLA breach → notify Department Head after 24 hours

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Log in as `gis-admin` | Dashboard shows summary cards with real counts |
| Log in as `gis-staff` | Dashboard shows only "My Tasks" — no admin panels visible |
| Log in as `gis-head` | Dashboard shows pending approvals + department workflows |
| Notification bell as `gis-staff` | Badge shows 2 (2 unread notifications) |
| Click notification | Navigates to the correct record |
| Click "Mark all as read" | Badge disappears, all items show as read |
| Refresh page | Read/unread state persists |
| Log in as `gis-admin`, go to `/settings/escalation` | Two seeded rules visible |
| Create escalation rule | Rule saved with levels |
| Toggle rule to inactive | Rule disabled, no longer fires |
| Log in as `gis-staff`, navigate to `/settings/escalation` | 403 |
| Real-time test: in another tab, assign a task to `gis-staff` | Notification bell badge increments without page refresh |

---

### Automated Tests

- Unit: notification creation for each trigger event type
- Unit: escalation chain fires in correct order with correct delays
- Integration: `GET /dashboard` returns role-appropriate data
- Integration: `PATCH /notifications/:id/read` marks as read
- Integration: `POST /escalation-rules` creates rule with levels

---

### Out of Scope

- No email notifications (Phase 2 product)
- No push notifications
- No per-user notification preference settings (Phase 2 product)
- No "Aquilens Readiness Score" (Phase 11 demo hardening)

---

### Definition of Done

- [ ] Dashboard content differs by role (admin vs staff)
- [ ] Notification bell badge shows correct unread count
- [ ] Clicking notification navigates to correct record
- [ ] Mark as read works
- [ ] Staff see simplified task-only view
- [ ] Escalation rule CRUD works
- [ ] Real-time notification via WebSocket fires when task assigned
- [ ] No TypeScript errors, no console errors

---

---

## Phase 10 — Audit Trail + Report Export

**Goal:** A compliance officer can view the full immutable audit trail, filter by entity or date, and generate a scoped PDF audit pack that includes process records, approval history, workflow evidence, and incident records.

**Estimated effort:** 2 days

**Prerequisites:** Phases 0–9 complete

---

### What to Build

**No new tables.** All audit data already exists from Phase 1 onwards.

**API endpoints:**
```
GET    /api/v1/audit
  Filters: entityType, entityId, actorId, eventType, dateFrom, dateTo
  Paginated — cursor-based
  Permission: Super Admin and Compliance Officer see all; others scoped to their entity types

GET    /api/v1/audit/export
  Returns: CSV download of filtered audit log

POST   /api/v1/audit-packs/generate
  Body: {
    scope: 'function' | 'process' | 'date_range' | 'incident',
    scopeId?: string,
    dateFrom?: string,
    dateTo?: string
  }
  Returns: { jobId }  — async generation, returns immediately

GET    /api/v1/audit-packs/:jobId/status    -- pending | ready | failed
GET    /api/v1/audit-packs/:jobId/download  -- returns signed URL when ready
GET    /api/v1/audit-packs                  -- list previously generated packs

POST   /api/v1/guest-access
  Body: { scope, scopeId, expiresAt, auditorEmail }
  Returns: { accessUrl, token }
  Permission: Super Admin only

GET    /api/v1/guest-access                 -- list active guest grants
DELETE /api/v1/guest-access/:id             -- revoke grant
```

**PDF generation (NestJS background job):**
Use `pdfkit` (Node.js) for PDF generation. No headless browser — no Puppeteer/Playwright complexity.

**Audit pack PDF structure:**
1. Cover page — institution name, scope description, date range, generated by, generation timestamp
2. Summary table — total processes, workflows, approvals, incidents in scope
3. Process records — for each process in scope: current version, approval history, owner, risk, last review
4. Workflow execution records — each instance: who started, each step (who, when, notes)
5. Approvals log — all approval decisions (approver, timestamp, comment)
6. Incident records (if in scope) — type, severity, RCA, corrective actions, closure
7. Agent attestations (if in scope) — attester, date, outcome, notes
8. Evidence index — list of all evidence files attached (filename, uploader, date, linked task). Note: files not embedded in Phase 10. File embedding is Phase 11.
9. Audit event log — raw event table for the scope and date range

**Screens:**
- `/audit` — Audit trail viewer
  - Filter bar: entity type (Process | Workflow | Agent | User | Incident | All), date range, actor
  - Table: timestamp, actor, event type, entity name, action description
  - Row expand: shows `before_state` / `after_state` JSON diff
  - "Export CSV" button
- `/processes/:id` — Updated process detail, Audit tab:
  - Shows all audit events for this process only
  - Same table format
- `/workflows/:id` — Updated workflow detail, Audit tab:
  - Shows all audit events for this workflow instance
- `/audit-packs` — Audit pack generator
  - Scope selector: By Function | By Process | By Date Range | By Incident
  - Scope configuration (pick function/process from dropdown, or set date range)
  - "Generate Pack" button
  - "Generating…" state while async job runs
  - List of previously generated packs with status + download button
- `/guest-access` (inside `/settings`) — External auditor access
  - List of active guest grants (email, scope, expiry)
  - "Create Guest Access" button → modal: scope, expiry date, auditor email
  - Revoke button on each active grant

---

### Seed Data

All audit data already exists from previous phase seeds. Add:
```
Audit packs already generated:
  Pack 1: Academics function scope, last month — status: ready (downloadable)
  Pack 2: ADMN-ENR-001 process scope, last 6 months — status: ready

Guest access:
  External auditor: auditor@cis.org
  Scope: Academics function
  Expires: 30 days from now
  Status: active
```

---

### User Journeys

1. As `gis-compliance`, I open `/audit` and see a full event log for GIS
2. I filter by "Approval" events and date range to see all approvals in the last 6 months
3. I click "Export CSV" — CSV downloads with all filtered events
4. I open `/audit-packs`, select "By Function", pick "Academics", click "Generate Pack"
5. System shows "Generating…" — after a few seconds, "Ready — Download" appears
6. I download the PDF — it contains all 9 sections
7. As `gis-admin`, I create a guest access link for an external CIS auditor
8. I set scope to "Academics function", expiry to 30 days, and email it to the auditor
9. External auditor accesses via the link — scoped read-only view

---

### UI Acceptance Tests

| Test | Expected Result |
|---|---|
| Open `/audit` as `gis-compliance` | Full event log visible |
| Filter by "Process" entity type | Only process events shown |
| Filter by date range | Events outside range not shown |
| Click "Export CSV" | CSV downloads with filtered data |
| Open audit trail as `gis-staff` | Shows only events for their own activities |
| Go to `/audit-packs`, generate by Academics function | Job created, status shows "Generating…" |
| Wait for completion | Status → "Ready", download button appears |
| Download PDF | PDF opens with all 9 sections |
| PDF Section 3 (Process Records) | Lists processes in Academics with versions and approval history |
| PDF Section 8 (Evidence Index) | Lists evidence filenames, uploaders, timestamps |
| Create guest access link | Access URL returned |
| Guest access link | Read-only view of Academics scope |
| Guest access expired | Link returns "Access expired" |
| Revoke guest access | Link immediately returns "Access revoked" |
| Check `audit_log` | `audit_pack.generated`, `guest_access.created`, `guest_access.revoked` events logged |

---

### Automated Tests

- Integration: PDF generated contains all required sections
- Integration: CSV export contains correct columns + filtered data
- Integration: `GET /audit` scopes correctly by role (staff only sees own events)
- Integration: guest access token validates scope and expiry
- Integration: revoked token returns 403 immediately

---

### Out of Scope

- Evidence files not embedded in PDF (Phase 11 does this for GIS demo)
- No real email to auditor (access URL just returned in response for now)

---

### Definition of Done

- [ ] Audit trail viewer shows real events from all previous phases
- [ ] CSV export works with filters applied
- [ ] Audit pack generates as PDF with all 9 sections
- [ ] Download works via signed URL
- [ ] Guest access link creates scoped read-only session
- [ ] Revoke immediately blocks access
- [ ] `audit_pack.generated` in `audit_log`
- [ ] No TypeScript errors, no console errors

---

---

## Phase 11 — GIS Demo Hardening

**Goal:** The full platform can be demonstrated to GIS in a clean 10-minute session with no broken pages, no ugly empty states, and a complete school-relevant story that flows from SOP creation → approval → workflow → evidence → audit pack.

**Estimated effort:** 1 day

**Prerequisites:** All phases 0–10 complete

---

### What to Build

**No new features.** This phase is entirely about polish and demo reliability.

**One-command demo reset:**
```bash
npm run seed:demo
```
This command:
1. Drops all data for the `gis` tenant
2. Runs the GIS seed script from scratch
3. Recreates all demo users (all passwords reset to `Aquilens2024!`)
4. Prints a summary of what was created

**Polished seed data — full GIS school scenario:**
```
Institution: Ghana International School (GIS)
Type: School (International)
Country: Ghana

Users:
  Admin: Sarah Mensah (Super Admin)
  Compliance: James Asante (Compliance Officer)
  Head: Dr. Ama Boateng (Department Head — Academics)
  Owner: Michael Darko (Process Owner — Academics + Admissions)
  Staff: Grace Osei (Staff)

Functions: Full school scaffold (Academics, Admissions, Finance, HR, Operations, IT)

Active SOPs (fully approved with version history):
  ACAD-STUD-001 "Record Student Attendance" (v2 active, v1 rejected)
  ADMN-ENR-001 "Enrol New Student" (v3 active — most complete SOP, 7 steps)
  ADMN-SAF-001 "Manage Safeguarding Concern" (v1 active, AI-generated)

Draft SOP:
  FIN-FEES-001 "Process Fee Payment" (v1 draft, 4 steps)

SOP Under Review:
  HR-RECR-001 "Recruit New Teacher" (v1 under_review — James has a pending approval)

Completed Workflows (2):
  "Enrol New Student — Term 1, 2025/26" — all steps complete, evidence on 3 tasks
  "Safeguarding Review — October 2025" — complete, closed incident linked

In-Progress Workflow (1):
  "Enrol New Student — Term 2, 2025/26"
    Tasks 1-2: complete
    Task 3: in_progress (assigned to Grace)
    Task 4: pending (approval — Dr. Ama)
    Evidence on task 2: "application_pack.pdf"

AI Agents (2):
  AI-001 "Attendance Pattern Analyser" — medium risk, attestation overdue
  AI-002 "Application Scoring Tool" — high risk, attestation current

Incident (closed):
  "Data breach — student report sent to wrong parent"
  Status: closed
  RCA submitted, 2 corrective actions complete, evidence attached

Generated Audit Pack (1):
  Scope: Academics function
  Status: ready for download

Notifications (seeded per user, realistic mix):
  Sarah: 2 unread (workflow completed, attestation overdue)
  James: 1 unread (audit pack ready)
  Dr. Ama: 1 unread (approval requested — HR-RECR-001)
  Michael: 2 unread (workflow task completed, SOP approved)
  Grace: 1 unread (task assigned)
```

**Polish items:**
- [x] All empty states have correct icons, headings, and CTAs (no generic "No data" messages)
- [x] Loading skeletons on all list pages (no blank flashes)
- [ ] Error states: form validation errors are inline, not toasts only
- [x] "Last saved Xs ago" autosave indicator on all form pages
- [x] Breadcrumb navigation on all nested pages
- [ ] All status badges use consistent colour coding:
  - Draft: grey
  - Under Review: amber
  - Active: green
  - Overdue: red
  - Completed: teal
- [ ] SOP detail page looks like a well-designed document, not a database table
- [x] Workflow timeline is visual and scannable — not just a list
- [x] Notification bell has smooth badge animation when new notifications arrive
- [x] PDF audit pack cover page includes Aquilens logo and GIS institution name

**10-minute demo script (verified to work end-to-end):**
1. (1 min) Log in as Sarah Mensah. Show dashboard — open items, overdue attestation
2. (1 min) Show GIS function tree — Academics, Admissions etc.
3. (2 min) Open ADMN-ENR-001 "Enrol New Student" — show approved SOP, steps, governance tab, version history
4. (1 min) Show in-progress workflow — timeline, completed steps, Grace's task
5. (1 min) Log in as Grace. Show "My Tasks" — one task assigned. Open task, upload fake evidence, complete task
6. (1 min) Log in as Dr. Ama. Show notification bell (new task). Open approval task, approve
7. (1 min) Log in as James. Show audit trail — see all recent events
8. (1 min) Generate an audit pack — Academics function. Download PDF.
9. (1 min) Show AI-001 agent — overdue attestation badge. Click Attest Now, submit attestation.

---

### UI Acceptance Tests

Run the full demo script above. Every step must complete cleanly.

| Test | Expected Result |
|---|---|
| `npm run seed:demo` | Completes without error, prints summary |
| All 5 demo users can log in | Correct dashboard for each role |
| No 404 or 500 errors during full demo script | Zero errors |
| No broken or missing images | All assets load |
| Process detail for ADMN-ENR-001 | Looks like a professional document |
| Workflow timeline | Visual step indicators, completed steps clearly marked |
| Grace uploads evidence + completes task | No errors, evidence card appears |
| Audit pack PDF download | PDF opens, readable, contains all sections |
| PDF has correct institution name and date | "Ghana International School" on cover |
| Notification badge updates in real time | No page refresh needed |

---

### Definition of Done

- [x] `npm run seed:demo` creates a clean, complete demo environment
- [x] Full 10-minute demo script runs without errors (demo mode — in-memory stores)
- [x] No broken routes, no 404 pages
- [x] No visible empty states during the demo flow (seeded GIS scenario)
- [x] All status badges consistently coloured
- [x] Audit pack PDF is professional and readable
- [ ] App runs on Vercel (frontend) + Railway (backend) — not just localhost
- [x] All environment variables documented in `.env.example`
- [x] README has setup instructions

---

---

## Appendix A — Build Session Prompt Template

Copy this for each AI build session. Fill in the phase-specific details.

```md
Build Phase [N] of Aquilens: [Phase Name]

## Context
This is a multi-tenant institutional governance platform built with:
- Frontend: Next.js (App Router) + Tailwind + shadcn/ui — deployed on Vercel
- Backend: NestJS (TypeScript) — deployed on Railway
- Database: Supabase (PostgreSQL + pgvector + Auth)
- AI: Anthropic Claude API (claude-sonnet-4-6)
- Design: NAVY #1A2C4E, TEAL #0E7C7B — reference Scribe (scribehow.com) aesthetic

Completed phases: [list phases done]

## Goal
[One sentence on the testable outcome of this phase.]

## User journeys
1. As [role], I can [action]
2. As [role], I can [action]
3. As [role], I cannot [action] → [what happens instead]

## Screens to build
- [Screen 1]: [description]
- [Screen 2]: [description]

## Database
Tables: [list with key columns]
RLS: tenant_id isolation on all new tables
Append-only rules: [tables if applicable]

## API endpoints
[Endpoint list with HTTP method, path, auth requirement, permission required]

## Audit events to log
- [event_type]: fired when [trigger], by [actor]

## Seed data
[Specific records to create — names, statuses, relationships]

## UI acceptance tests
[Pass/fail checklist — specific clicks and expected results]

## Automated tests
- Unit: [what]
- Integration: [what]
- RLS: [cross-tenant test]
- Permission: [role boundary test]

## Out of scope
- Do not build [next phase feature]
- Do not weaken tenant isolation
- Do not add features not listed above

## Definition of done
- [ ] App runs without errors
- [ ] All acceptance tests pass
- [ ] Seed data is present
- [ ] No cross-tenant data access possible
- [ ] No TypeScript errors
- [ ] No console errors
```

---

## Appendix B — Audit Event Type Reference

All services must call `AuditService.log(event)` when these events occur:

| Event Type | Fired When |
|---|---|
| `auth.login` | User successfully logs in |
| `auth.logout` | User logs out |
| `auth.invite_sent` | Admin invites a user |
| `user.role_assigned` | Role assigned to user |
| `user.deactivated` | User deactivated |
| `process.created` | New process created |
| `process.version_created` | New version created |
| `process.submitted` | Submitted for approval |
| `process.approved` | Version approved |
| `process.rejected` | Version rejected |
| `process.retired` | Process retired |
| `workflow.started` | Workflow instance started |
| `workflow.task_completed` | Task marked complete |
| `workflow.task_approved` | Approval task approved |
| `workflow.task_rejected` | Approval task rejected |
| `workflow.task_skipped` | Task skipped with reason |
| `workflow.completed` | All tasks complete |
| `workflow.cancelled` | Workflow cancelled |
| `evidence.uploaded` | Evidence file uploaded to task |
| `agent.created` | Agent registered |
| `agent.attested` | Attestation submitted |
| `agent.linked` | Agent linked to SOP step |
| `agent.deprecated` | Agent deprecated |
| `incident.logged` | Incident created |
| `incident.assigned` | Incident assigned to owner |
| `incident.closed` | Incident closed |
| `audit_pack.generated` | Audit pack PDF created |
| `guest_access.created` | Guest access link created |
| `guest_access.revoked` | Guest access revoked |
| `sop.ai_generated` | AI SOP generation called |

---

## Appendix C — Permission Guard Reference

Every API route must declare its required permission. NestJS decorator pattern:

```typescript
@Post()
@RequirePermission('processes', 'create', 'function')
async createProcess(@CurrentUser() user: AuthUser, @Body() dto: CreateProcessDto) { ... }
```

Route that any authenticated user can call (no specific permission needed):
```typescript
@Get('/my-tasks')
@RequireAuth()  // just needs valid JWT + active user
async getMyTasks(@CurrentUser() user: AuthUser) { ... }
```
