-- =============================================================
-- AQUILENS — Full Database Schema
-- PostgreSQL / Supabase
-- Multi-tenant via tenant_id + Row Level Security on all tables
-- Audit log is append-only — no UPDATE or DELETE permitted
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for semantic search

-- =============================================================
-- TENANTS
-- =============================================================

CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('school', 'hospital', 'corporate', 'ngo', 'government', 'other')),
  country         TEXT NOT NULL,
  subdomain       TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  settings        JSONB NOT NULL DEFAULT '{}', -- configurable tenant settings
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USERS (extends Supabase Auth)
-- =============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY, -- matches Supabase Auth user id
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  job_title       TEXT,
  status          TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'deactivated')),
  mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

-- =============================================================
-- ROLES & PERMISSIONS (RBAC)
-- =============================================================

-- System-level permission definitions (same across all tenants)
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource    TEXT NOT NULL, -- processes, workflows, incidents, agents, audit, users, roles, settings
  action      TEXT NOT NULL, -- create, read, edit, delete, approve, submit, assign, attest, generate
  description TEXT,
  UNIQUE (resource, action)
);

-- Roles (system-defined + institution-defined)
CREATE TABLE roles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  name             TEXT NOT NULL,
  description      TEXT,
  is_system_role   BOOLEAN NOT NULL DEFAULT FALSE,
  system_role_key  TEXT, -- super_admin | compliance_officer | department_head | process_owner | staff | guest_auditor
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

-- Role → Permissions (with scope)
CREATE TABLE role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id),
  scope         TEXT NOT NULL CHECK (scope IN ('global', 'function', 'own')),
  UNIQUE (role_id, permission_id, scope)
);

-- User → Roles (with optional function scope)
CREATE TABLE user_roles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  role_id             UUID NOT NULL REFERENCES roles(id),
  assigned_functions  UUID[] DEFAULT '{}', -- function IDs for function-scoped roles
  assigned_by         UUID REFERENCES users(id),
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id)
);

-- =============================================================
-- ACCESS REVIEWS
-- =============================================================

CREATE TABLE access_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  status        TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  initiated_by  UUID NOT NULL REFERENCES users(id),
  initiated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  notes         TEXT
);

CREATE TABLE access_review_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_review_id UUID NOT NULL REFERENCES access_reviews(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  roles_at_review  JSONB NOT NULL, -- snapshot of user roles at time of review
  decision         TEXT CHECK (decision IN ('confirmed', 'revoked')),
  decided_by       UUID REFERENCES users(id),
  decided_at       TIMESTAMPTZ,
  notes            TEXT
);

-- =============================================================
-- PROCESS HIERARCHY
-- =============================================================

CREATE TABLE functions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES users(id),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE process_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  function_id UUID NOT NULL REFERENCES functions(id),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES users(id),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, function_id, name)
);

-- =============================================================
-- PROCESSES & VERSIONS
-- =============================================================

CREATE TABLE processes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  process_area_id     UUID NOT NULL REFERENCES process_areas(id),
  process_code        TEXT NOT NULL, -- e.g. ACAD-ATTN-001 (auto-generated)
  name                TEXT NOT NULL,
  current_version_id  UUID, -- FK to process_versions, set after first approval
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'active', 'retired')),
  risk_rating         TEXT CHECK (risk_rating IN ('high', 'medium', 'low')),
  tags                TEXT[] DEFAULT '{}',
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, process_code)
);

CREATE TABLE process_versions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  process_id            UUID NOT NULL REFERENCES processes(id),
  version_number        INTEGER NOT NULL,
  description           TEXT,
  purpose               TEXT,
  who_it_affects        TEXT[] DEFAULT '{}',
  linked_systems        TEXT[] DEFAULT '{}',
  linked_policies       TEXT,
  risk_notes            TEXT,
  approval_required     BOOLEAN NOT NULL DEFAULT TRUE,
  review_frequency      TEXT CHECK (review_frequency IN ('monthly', 'quarterly', 'annually', 'risk_based')),
  next_review_due       DATE,
  regulatory_reference  TEXT,
  governance_controls   JSONB DEFAULT '[]', -- [{name, type, owner}]
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'superseded')),
  submitted_by          UUID REFERENCES users(id),
  submitted_at          TIMESTAMPTZ,
  approved_by           UUID REFERENCES users(id),
  approved_at           TIMESTAMPTZ,
  rejection_comment     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (process_id, version_number)
);

-- Forward reference: processes.current_version_id → process_versions
ALTER TABLE processes
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES process_versions(id);

-- Process owners and users (many-to-many)
CREATE TABLE process_version_people (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_version_id  UUID NOT NULL REFERENCES process_versions(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  role                TEXT NOT NULL CHECK (role IN ('owner', 'user')),
  UNIQUE (process_version_id, user_id, role)
);

-- Process steps
CREATE TABLE process_steps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  process_version_id  UUID NOT NULL REFERENCES process_versions(id),
  step_number         INTEGER NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  responsible_role    TEXT,
  inputs              TEXT,
  outputs             TEXT,
  controls            TEXT,
  step_type           TEXT NOT NULL DEFAULT 'manual' CHECK (step_type IN ('manual', 'approval', 'system')),
  evidence_required   BOOLEAN NOT NULL DEFAULT FALSE,
  notes               TEXT,
  UNIQUE (process_version_id, step_number)
);

-- Step ↔ AI Agent linkage
CREATE TABLE process_step_ai_agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_step_id UUID NOT NULL REFERENCES process_steps(id),
  ai_agent_id     UUID NOT NULL REFERENCES ai_agents(id),
  added_by        UUID REFERENCES users(id),
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (process_step_id, ai_agent_id)
);

-- =============================================================
-- AI MODEL & AGENT REGISTRY
-- =============================================================

CREATE TABLE ai_agents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  agent_code              TEXT NOT NULL, -- e.g. AI-001
  name                    TEXT NOT NULL,
  description             TEXT,
  purpose                 TEXT,
  vendor                  TEXT, -- anthropic, openai, google, meta, other
  underlying_model        TEXT, -- e.g. claude-sonnet-4-6
  model_version           TEXT,
  owner_id                UUID REFERENCES users(id),
  function_id             UUID REFERENCES functions(id),
  risk_classification     TEXT CHECK (risk_classification IN ('high', 'medium', 'low')),
  risk_rationale          TEXT,
  deployment_environment  TEXT,
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'deprecated', 'retired')),
  version                 TEXT,
  deployment_date         DATE,
  last_attested_at        TIMESTAMPTZ,
  next_attestation_due    DATE,
  created_by              UUID REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, agent_code)
);

CREATE TABLE ai_agent_data_inputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  data_type     TEXT,
  sensitivity   TEXT CHECK (sensitivity IN ('public', 'internal', 'confidential', 'restricted'))
);

CREATE TABLE ai_agent_tools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  tool_type   TEXT CHECK (tool_type IN ('api', 'database', 'service', 'other'))
);

-- Attestation log — append-only
CREATE TABLE ai_agent_attestations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  agent_id              UUID NOT NULL REFERENCES ai_agents(id),
  attested_by           UUID NOT NULL REFERENCES users(id),
  attested_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome               TEXT NOT NULL CHECK (outcome IN ('confirmed', 'flagged', 'deprecation_recommended')),
  notes                 TEXT,
  next_attestation_due  DATE NOT NULL
);

-- Prevent updates and deletes on attestation log
CREATE RULE no_update_ai_attestations AS ON UPDATE TO ai_agent_attestations DO INSTEAD NOTHING;
CREATE RULE no_delete_ai_attestations AS ON DELETE TO ai_agent_attestations DO INSTEAD NOTHING;

-- =============================================================
-- WORKFLOW ENGINE
-- =============================================================

CREATE TABLE workflow_instances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  process_id          UUID NOT NULL REFERENCES processes(id),
  process_version_id  UUID NOT NULL REFERENCES process_versions(id),
  instance_number     INTEGER NOT NULL,
  title               TEXT NOT NULL, -- human-readable: "New Student Enrollment - John Doe"
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  started_by          UUID NOT NULL REFERENCES users(id),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancelled_by        UUID REFERENCES users(id),
  cancellation_reason TEXT,
  context             JSONB DEFAULT '{}', -- additional context about this specific run
  UNIQUE (process_id, instance_number)
);

CREATE TABLE workflow_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  workflow_instance_id  UUID NOT NULL REFERENCES workflow_instances(id),
  process_step_id       UUID NOT NULL REFERENCES process_steps(id),
  step_number           INTEGER NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  step_type             TEXT NOT NULL CHECK (step_type IN ('manual', 'approval')),
  assigned_to_user_id   UUID REFERENCES users(id),
  assigned_to_role      TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  sla_hours             INTEGER,
  sla_due_at            TIMESTAMPTZ,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  completed_by          UUID REFERENCES users(id),
  completion_notes      TEXT,
  skipped_reason        TEXT,
  evidence_required     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE workflow_task_evidence (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  task_id       UUID NOT NULL REFERENCES workflow_tasks(id),
  filename      TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INTEGER NOT NULL,
  storage_path  TEXT NOT NULL,
  checksum      TEXT NOT NULL, -- SHA-256
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT
);

-- Prevent deletion of submitted evidence
CREATE RULE no_delete_task_evidence AS ON DELETE TO workflow_task_evidence DO INSTEAD NOTHING;

-- =============================================================
-- APPROVALS
-- =============================================================

CREATE TABLE approval_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_type     TEXT NOT NULL, -- process_version, custom
  entity_id       UUID NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by    UUID NOT NULL REFERENCES users(id),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by      UUID REFERENCES users(id),
  decided_at      TIMESTAMPTZ,
  decision        TEXT CHECK (decision IN ('approved', 'rejected')),
  decision_comment TEXT
);

-- =============================================================
-- INCIDENTS
-- =============================================================

CREATE TABLE incidents (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id),
  incident_code               TEXT NOT NULL, -- e.g. INC-001
  title                       TEXT NOT NULL,
  description                 TEXT NOT NULL,
  incident_type               TEXT NOT NULL CHECK (incident_type IN (
                                'process_deviation', 'policy_breach', 'missed_approval',
                                'failed_control', 'audit_finding', 'data_quality', 'other'
                              )),
  severity                    TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status                      TEXT NOT NULL DEFAULT 'logged' CHECK (status IN (
                                'logged', 'assigned', 'rca_in_progress',
                                'corrective_action', 'pending_closure', 'closed'
                              )),
  linked_process_id           UUID REFERENCES processes(id),
  linked_workflow_instance_id UUID REFERENCES workflow_instances(id),
  logged_by                   UUID NOT NULL REFERENCES users(id),
  logged_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to                 UUID REFERENCES users(id),
  assigned_at                 TIMESTAMPTZ,
  rca_description             TEXT,
  rca_submitted_by            UUID REFERENCES users(id),
  rca_submitted_at            TIMESTAMPTZ,
  closed_by                   UUID REFERENCES users(id),
  closed_at                   TIMESTAMPTZ,
  closure_notes               TEXT,
  UNIQUE (tenant_id, incident_code)
);

CREATE TABLE incident_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  incident_id   UUID NOT NULL REFERENCES incidents(id),
  action_type   TEXT NOT NULL CHECK (action_type IN ('corrective', 'preventive')),
  description   TEXT NOT NULL,
  assigned_to   UUID REFERENCES users(id),
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_by  UUID REFERENCES users(id),
  completed_at  TIMESTAMPTZ,
  evidence_notes TEXT
);

-- =============================================================
-- AUDIT LOG — APPEND-ONLY
-- =============================================================

CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type    TEXT NOT NULL, -- e.g. process.approved, workflow.task_completed
  entity_type   TEXT NOT NULL, -- Process, Workflow, Agent, User, Incident, etc.
  entity_id     UUID,
  entity_name   TEXT,          -- snapshot at time of event
  actor_id      UUID,          -- nullable for system/scheduled events
  actor_name    TEXT,          -- snapshot — preserved even if user is deactivated
  action        TEXT NOT NULL, -- human-readable: "Approved SOP v2 - Attendance Recording"
  before_state  JSONB,
  after_state   JSONB,
  metadata      JSONB DEFAULT '{}'  -- comment, ip_address, session_id, etc.
);

-- Enforce append-only at database level
CREATE RULE no_update_audit_log AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_log AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- =============================================================
-- EVIDENCE FILES (incidents, attestations, access reviews)
-- =============================================================

CREATE TABLE evidence_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  entity_type   TEXT NOT NULL, -- incident, attestation, access_review
  entity_id     UUID NOT NULL,
  filename      TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INTEGER NOT NULL,
  storage_path  TEXT NOT NULL,
  checksum      TEXT NOT NULL, -- SHA-256
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT
);

-- Prevent deletion of submitted evidence
CREATE RULE no_delete_evidence_files AS ON DELETE TO evidence_files DO INSTEAD NOTHING;

-- =============================================================
-- NOTIFICATIONS
-- =============================================================

CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  notification_type   TEXT NOT NULL,
  title               TEXT NOT NULL,
  body                TEXT,
  entity_type         TEXT,
  entity_id           UUID,
  action_url          TEXT,   -- deep link to relevant record
  is_read             BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ESCALATION RULES
-- =============================================================

CREATE TABLE escalation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  trigger_event   TEXT NOT NULL, -- workflow_task_sla_breach | incident_sla_breach | attestation_overdue | review_overdue
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE escalation_rule_levels (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escalation_rule_id    UUID NOT NULL REFERENCES escalation_rules(id) ON DELETE CASCADE,
  level_number          INTEGER NOT NULL, -- 1, 2, 3
  notify_role           TEXT NOT NULL,    -- system role key or custom role name
  escalate_after_hours  INTEGER NOT NULL, -- hours after previous level with no action
  UNIQUE (escalation_rule_id, level_number)
);

-- =============================================================
-- SEMANTIC SEARCH (pgvector)
-- =============================================================

-- Embeddings for process semantic search and AI assistant queries
CREATE TABLE process_embeddings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  process_version_id  UUID NOT NULL REFERENCES process_versions(id),
  embedding           vector(1536), -- OpenAI/Claude embedding dimension
  content_snapshot    TEXT,         -- the text that was embedded
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  agent_id    UUID NOT NULL REFERENCES ai_agents(id),
  embedding   vector(1536),
  content_snapshot TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================

-- Tenant isolation (on every major table)
CREATE INDEX idx_users_tenant               ON users(tenant_id);
CREATE INDEX idx_functions_tenant           ON functions(tenant_id);
CREATE INDEX idx_process_areas_tenant       ON process_areas(tenant_id);
CREATE INDEX idx_processes_tenant           ON processes(tenant_id);
CREATE INDEX idx_processes_status           ON processes(tenant_id, status);
CREATE INDEX idx_process_versions_process   ON process_versions(process_id);
CREATE INDEX idx_process_steps_version      ON process_steps(process_version_id);
CREATE INDEX idx_ai_agents_tenant           ON ai_agents(tenant_id);
CREATE INDEX idx_ai_agents_status           ON ai_agents(tenant_id, status);
CREATE INDEX idx_ai_agents_attestation_due  ON ai_agents(next_attestation_due) WHERE status = 'active';
CREATE INDEX idx_workflow_instances_tenant  ON workflow_instances(tenant_id);
CREATE INDEX idx_workflow_instances_status  ON workflow_instances(tenant_id, status);
CREATE INDEX idx_workflow_tasks_instance    ON workflow_tasks(workflow_instance_id);
CREATE INDEX idx_workflow_tasks_assignee    ON workflow_tasks(assigned_to_user_id) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_workflow_tasks_sla_due     ON workflow_tasks(sla_due_at) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_incidents_tenant           ON incidents(tenant_id);
CREATE INDEX idx_incidents_status           ON incidents(tenant_id, status);
CREATE INDEX idx_audit_log_tenant_time      ON audit_log(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_log_entity           ON audit_log(entity_type, entity_id);
CREATE INDEX idx_notifications_user         ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_processes_review_due       ON processes(tenant_id) WHERE status = 'active';

-- Vector similarity search
CREATE INDEX idx_process_embeddings_vector  ON process_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_agent_embeddings_vector    ON agent_embeddings USING ivfflat (embedding vector_cosine_ops);
