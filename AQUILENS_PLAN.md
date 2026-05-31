# Aquilens — Master Project Plan

> Last updated: May 2026  
> Status: Active — pre-build, spec in progress  
> Built by: Victor Hazel (solo)

---

## 1. What Aquilens Is

Aquilens is an AI-powered operational governance and process intelligence platform. It gives any institution — schools, hospitals, financial services firms, NGOs, government agencies, corporates — a single environment to document, govern, execute, monitor, and audit organisational processes across every department.

It is **not industry-specific software.** It is a horizontal governance platform. The use case is the same wherever institutions have processes, owners, approvals, evidence, and audit obligations.

Aquilens sits **above** existing operational systems — SIS, EMR, ERP, CRM, HR, finance, LMS, case management — and governs how those systems are used, maintained, and audited. It does not compete with them.

**Core positioning:** Operational governance backbone for institutions — transforming static processes into intelligent, executable, measurable, and continuously improving operational systems.

### Target Markets

| Sector | Use Case Examples |
|---|---|
| **Education** (first customer: GIS) | Academic processes, admissions, accreditation evidence, ISO/CIS/NEASC readiness |
| **Healthcare** | Clinical SOPs, patient pathway governance, JCI/COHSASA accreditation, incident reporting |
| **Financial Services** | Operational risk processes, regulatory attestations, model governance, audit trails |
| **NGOs & Foundations** | Donor reporting, programme governance, grant compliance, board-level audit packs |
| **Government & Public Sector** | Policy implementation tracking, service delivery SOPs, oversight reporting |
| **Corporates** | ISO 9001 / ISO 27001 readiness, process maturity, AI governance, internal audit |

The product is identical across these. The Function/Process Area scaffolding adapts to each — Academics & Admissions in a school, Clinical & Pharmacy in a hospital, Operations & Compliance in a financial firm. The platform doesn't change. The vocabulary the customer puts into it does.

---

## 2. Strategic Context

- Independent product (not a STRATEO productisation)
- **Horizontal platform for any institution** — schools, hospitals, financial services, NGOs, government, corporates
- **First wedge: schools** (Ghana/West Africa). Schools are the entry market because of warm intros and Learn Motive overlap — but the platform is sector-agnostic from day one
- First target customer: Ghana International School (GIS) — proposal in progress
- Solo build by Victor Hazel
- MVP target: 2 weeks from start

---

## 3. Modules

### Phase 1 — MVP (2 weeks)

| # | Module | Status |
|---|---|---|
| 1 | Auth & Access Governance (RBAC, multi-tenant) | To build |
| 2 | Function/Process Area/Process Hierarchy | To build |
| 3 | Process Repository & Template | To build |
| 4 | SOP Creation (manual, upload, voice, AI conversion) | To build |
| 5 | AI Model & Agent Registry | To build |
| 6 | Basic Workflow Engine | To build |
| 7 | Audit & Evidence Management | To build |
| 8 | Basic AI Governance Assistant | To build |

### Phase 2 — After First Paying Customer

- Full Workflow Engine (Temporal/durable execution)
- Governance & Approval Management (parallel approvals, segregation of duties)
- Incident & Non-Conformance Management
- Reporting & Operational Intelligence dashboards
- Change Management

### Phase 3 — Scale

- Advanced AI features (audit risk prediction, SLA breach prediction)
- Data Governance module (requires SOR API access — not in Phase 1)
- Integration Framework (REST APIs, webhooks, MS365, Google Workspace)
- SAML/Entra ID for enterprise SSO
- Multi-region deployment

---

## 4. Process Architecture

### 4.1 Hierarchy

Three levels — sector-agnostic:

```
Function
  └── Process Area
        └── Process
```

| Level | School | Hospital | Financial Services | NGO |
|---|---|---|---|---|
| Function | Academics | Clinical Services | Operational Risk | Programme Delivery |
| Process Area | Student Records | Patient Admissions | Trade Settlement | Grant Management |
| Process | Generate Student Report | Admit New Patient | Settle FX Trade | Disburse Grant Payment |

Functions and Process Areas are organisational scaffolding. Processes are the atomic unit of work. The same three-level structure works for every sector — only the vocabulary changes.

**Onboarding scaffold** is offered per institution type at setup:

| Institution Type | Default Functions Pre-loaded |
|---|---|
| School | Academics, Admissions, Finance, HR, Operations, IT |
| Hospital | Clinical, Pharmacy, Nursing, Admissions, Finance, HR, Operations, IT |
| Financial Services | Operations, Risk & Compliance, Treasury, Finance, HR, IT, Audit |
| NGO | Programmes, Fundraising, Finance, HR, Operations, M&E |
| Corporate | Operations, Finance, HR, IT, Legal & Compliance, Sales |
| Government | Service Delivery, Finance, HR, Procurement, Audit & Oversight |

All scaffolds are editable — institutions can rename, add, or delete any Function or Process Area.

---

### 4.2 Onboarding Flow

1. **Institution Setup** — name, type, country, admin user, tenant provisioned
2. **Build Function Tree** — accept/modify default scaffold, add Functions and Process Areas
3. **Add Processes** — under any Process Area, create processes using the standard template
4. **Link AI Models** — at any process step, reference an existing agent or register a new one

---

### 4.3 Process Template — Full Spec

#### Section 1 — Process Identity

| Field | Type | Notes |
|---|---|---|
| Process Name | Text | Action-oriented (e.g., "Record Student Attendance") |
| Process ID | Auto-generated | e.g., ACAD-ATTN-001 |
| Function | Locked (inherited) | |
| Process Area | Locked (inherited) | |
| Description | Long text | What this process does |
| Purpose | Long text | Why it exists — the outcome it produces |
| Who It Affects | Multi-select (roles) | Students, Teachers, Admin Staff, Parents, etc. |
| Process Owners | User select | Accountable person(s) |
| Process Users | Role select | Who executes it |
| Linked Systems | Multi-select | SIS, HR, Finance, LMS, etc. |
| Linked Policies | Text / reference | Internal policy or regulation |
| Tags | Free tags | For cross-search |
| Status | Enum | Draft → Under Review → Active → Retired |
| Version | Auto-increment | Bumps on every approved revision |
| Created By | Auto | |
| Last Reviewed | Date | |
| Next Review Due | Date | Tied to risk rating |

#### Section 2 — Risk & Governance

| Field | Type | Notes |
|---|---|---|
| Risk Rating | Enum | High / Medium / Low |
| Risk Notes | Long text | What goes wrong if this process fails |
| Governance Controls | Structured list | Name, type (preventive/detective/corrective), owner |
| Approval Required | Boolean | Does executing this process require sign-off? |
| Approval Authority | User/Role | Who approves |
| Review Frequency | Enum | Monthly / Quarterly / Annually / Risk-based |
| Regulatory Reference | Text | ISO clause, accreditation standard, local regulation |

#### Section 3 — Process Steps

Each step:

| Field | Notes |
|---|---|
| Step Number | Auto-incremented, reorderable via drag |
| Step Title | Short action label |
| Description | What happens in this step |
| Responsible Role | Who performs it |
| Inputs | What is needed to start |
| Outputs | What it produces |
| Controls | Any check or validation |
| AI Model Reference | Inline linkage (see Section 4) |
| Notes / Exceptions | Edge cases |

#### Section 4 — AI Model Reference (Inline Linkage)

On any step, a **`＋ Add AI Model`** button opens an inline panel:

- **Select existing** — dropdown of registered agents (name, purpose, risk rating)
- **Register new** — lightweight side drawer to create a new agent record inline

The linked model renders as a clickable chip on the step: `[AI] Attendance Checker Agent →`  
Clicking navigates to the full Agent Registry record.

---

### 4.4 SOP Creation Methods

Users can create SOPs four ways:

1. **Manual** — fill the template step by step
2. **Upload any file** — Word, PDF, image, spreadsheet — AI parses and maps to template structure
3. **Natural language** — describe the process in plain text or voice; AI generates the structured SOP
4. **Voice input** — speak the process; AI transcribes, structures, and maps to template

In all cases, the AI:
- Converts input into the standard template format
- Identifies gaps (missing owners, missing controls, missing risk rating, undefined inputs/outputs)
- Flags gaps inline and prompts the user to complete them before publishing

---

## 5. AI Model & Agent Registry

### 5.1 Agent Record

| Field | Type | Notes |
|---|---|---|
| Agent Name | Text | |
| Agent ID | Auto-generated | e.g., AI-001 |
| Description | Long text | What this agent/model is |
| Purpose | Long text | What it is used for |
| Underlying Model | Structured | Vendor + model name + version |
| Owner | User select | Person accountable |
| Owning Department | Function select | |
| Risk Classification | Enum | High / Medium / Low |
| Risk Rationale | Text | Why this risk level |
| Data Inputs | Structured list | What data this agent processes |
| Tools / Integrations Used | Structured list | APIs, databases, external services |
| Deployment Environment | Text | Where it runs |
| Status | Enum | Active / Under Review / Deprecated / Retired |
| Version | Text | |
| Deployment Date | Date | |
| Last Attested | Date | Auto-updated on attestation |
| Next Attestation Due | Date | Calculated from risk rating |
| Linked Processes | Auto-derived | Every process + step that references this agent |
| Attestation History | Append-only log | Date, attester, outcome, notes |

### 5.2 Risk-Based Attestation Schedule

| Risk Level | Frequency |
|---|---|
| High | Every 90 days |
| Medium | Every 180 days |
| Low | Every 365 days |

Overdue attestations trigger notifications → owner first, then department head.

### 5.3 Search & Discovery

- Full-text search by name, purpose, description
- Filter by: underlying model, risk rating, owner, status, attestation status
- Natural language: *"show me all agents that process student data"*
- From agent → see all linked processes
- From process step → jump to agent record

---

## 6. Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui |
| Backend | NestJS (TypeScript) |
| Database | Supabase (PostgreSQL + pgvector + Auth) |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Hosting | Vercel (frontend) + Railway or Render (backend) |

### Design Reference
Scribe (scribehow.com) — clean sidebar, neutral content area, consistent type scale, minimal colour. One accent colour (teal) for actions only.

### Architecture Principles

- **Multi-tenant from day one** — PostgreSQL Row Level Security with `tenant_id` on every table
- **Append-only audit log** — never UPDATE or DELETE audit records
- **All AI calls through a single service layer** — swappable model, logged, cached
- **Structured outputs for AI** — JSON schema for all SOP generation, not freeform text

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│      (Process Tree, SOP Editor, Agents, Workflows)       │
└─────────────────┬───────────────────────────────────────┘
                  │ REST + WebSockets
┌─────────────────▼───────────────────────────────────────┐
│                  NestJS API Gateway                       │
│   Auth | Processes | Workflows | Audit | AI Assistant    │
└────────┬───────────────────────────────────────┬─────────┘
         │                                        │
┌────────▼────────┐                   ┌──────────▼────────┐
│   PostgreSQL     │                   │   Claude API       │
│   (Supabase)     │                   │   SOP generation   │
│  + pgvector      │                   │   Gap detection    │
│  + Row-level     │                   │   Semantic search  │
│    security      │                   │   Voice → SOP      │
└─────────────────┘                   └───────────────────┘
```

---

## 7. Pricing

### GIS Pilot (First Target Customer)

| Item | Value |
|---|---|
| Pilot duration | 3 months |
| Pilot fee | $1,800 |
| Payment | $900 on signing / $900 at go-live |
| Year-one founding rate | $9,600 (standard: $12,000) |
| Pilot credit | $1,800 → net year-one balance: $7,800 |
| Year two onwards | $12,000/year standard |
| AI SOP generation | 50 generations/month |
| Integration | 1 CSV import or read-only API connection included |
| Onboarding | Up to 12 hours included |

### Public Pricing Tiers (Post-GIS)

| Plan | Annual | Monthly Equiv | Best For |
|---|---|---|---|
| Core | $7,200 | $600 | Small institutions, single department, NGOs |
| Institution | $12,000 | $1,000 | One full institution (school, clinic, small firm) |
| Institution Plus | $21,000 | $1,750 | Larger institutions with serious governance load |
| Network / Group | $30,000–$42,000 | $2,500–$3,500 | Multi-site (school groups, hospital networks, multi-branch firms) |

**Pricing model: institution-based, not per-user.** Avoids deal-killing where many staff touch the system occasionally. Works equally well for a school with 200 staff or a hospital with 800 staff — the platform's value is institutional, not per-seat.

---

## 8. Go-to-Market

**Aquilens is a horizontal governance platform.** Schools are the first wedge — not the ceiling.

### Wedge Strategy

| Phase | Market | Entry Angle |
|---|---|---|
| **Phase 1 — Schools (Ghana)** | International + private schools with CIS/NEASC accreditation | Audit readiness, ISO 9001 alignment, AI governance |
| **Phase 2 — Schools (West Africa) + NGOs** | Multi-campus schools, foundations, grant-funded NGOs | Programme governance, donor reporting, board-level evidence |
| **Phase 3 — Healthcare + Financial Services** | Mid-tier hospitals, fintechs, microfinance, insurance brokers | Operational risk, regulatory attestation, model governance |
| **Phase 4 — Corporate + Government** | Mid-market corporates, public sector agencies | ISO 27001/9001 readiness, oversight reporting, AI registry |

### Why Schools First

- Warm market — overlap with Learn Motive customer base
- Clear, urgent pain — CIS/NEASC/COBIS accreditation cycles are calendar events
- Manageable institutional complexity — schools have fewer regulatory bodies than hospitals or banks
- Lower compliance bar for v1 — schools don't require SOC 2 / ISO 27001 certified vendors on day one (hospitals and financial services do)

### Cross-Sector Hooks

- **STRATEO newsletter** — enterprise AI architecture audience cuts across sectors
- **AI governance registry** — universal pain point right now, not sector-specific
- **Audit-pack-in-one-click** — applies identically to accreditation reviews, JCI hospital audits, regulatory exams, donor audits

### Geography

Ghana first → West Africa → broader emerging markets. The compliance pain in emerging markets is higher (more manual processes, less existing tooling) and the price sensitivity is lower than headline US/EU SaaS competition.

---

## 9. Data Governance Note

The Data Governance module (automated data quality monitoring — duplicate detection, cross-system reconciliation, orphaned record detection) requires API access to systems of record. This is **Phase 2**, scoped after SOR access is confirmed with the customer. Phase 1 delivers data governance *process management* only — SOPs, workflows, and incident logging for data quality practices.

---

## 10. Workflow Engine

### 10.1 Purpose

Aquilens is a **system of reference and governance**, not a daily workstation. Operational work happens in systems of record (SIS, EMR, ERP, etc.). Workflows in Aquilens serve three purposes:

1. **Governance Actions** — routing SOP approvals, access reviews, agent attestations, and similar sign-offs to the right people
2. **Optional Compliance Records** — when an institution needs instance-level proof (audit samples, spot checks, high-risk cases), process owners or compliance officers log a compliance record with step evidence; this is not the default staff daily workflow
3. **Incident Resolution** — routing a logged breach or non-conformance through root cause analysis, corrective action, and formal closure

Aquilens does not automate operational steps. It **records governance and compliance evidence** when institutions choose to log it. Staff primarily **read SOPs, follow generated tutorials, and acknowledge** published versions when required.

---

### 10.2 Step Types

Every step in a process is defined as one of three types:

| Type | How it works |
|---|---|
| **Manual** | Task assigned to a role. Human marks complete, optionally attaches evidence, adds notes. Timestamp recorded. |
| **Approval** | Routes to a specific person or role for sign-off. Workflow cannot proceed until approved or rejected. |
| **System** | Automated — triggered by a platform event or integration. **Phase 2 only.** |

For Phase 1, all steps are Manual or Approval. The process author sets — at the step level — whether evidence attachment is required or optional before a step can be marked complete.

---

### 10.3 Workflow Instance

When a workflow is started, Aquilens creates an **instance** of the linked process:

- Instance has its own ID, start date, assigned participants, and status
- Each step becomes a **Task** — assigned to the responsible role/person
- Tasks are worked sequentially (Phase 1). Parallel tasks are Phase 2.
- Each completed task records: who completed it, when, any evidence attached, any notes
- The full instance history is immutable — the audit trail

---

### 10.4 What Triggers a Workflow

| Trigger | Type | Phase |
|---|---|---|
| Manual start by a user | User-initiated | Phase 1 |
| New SOP created → approval required | System event | Phase 1 |
| Incident logged → resolution workflow | System event | Phase 1 |
| Process review due date reached | Scheduled (cron) | Phase 1.5 |
| AI model attestation due date reached | Scheduled (cron) | Phase 1.5 |

---

### 10.5 SLA & Escalation

- Each step can have an SLA (hours or days to complete)
- Missed SLA → notification to task owner first, then escalation to department head
- Escalation rules configured per process, not globally
- Phase 1: notify only. Auto-reassignment is Phase 2.

---

### 10.6 Evidence & Completion

- Evidence attachment is configured at the step level: **Required** or **Optional**
- Supported evidence types: file upload (any format), photo, free-text note, URL
- A step marked Required cannot be completed without at least one attachment
- All evidence is stored and linked to the specific workflow instance and step — not editable after submission

---

### 10.7 Governance Action Workflows (Phase 1)

**SOP Approval Workflow**
Triggered when a new or revised SOP is submitted for approval.
```
SOP created/revised → Status: Under Review
→ Task created for Approver
→ Approver reviews → Approves or Rejects with comment
→ Approved: Status → Active, version locked, audit entry created
→ Rejected: Status → Draft, owner notified with comment, revision required
```

**Incident Resolution Workflow**
Triggered when an incident or non-conformance is logged.
```
Incident logged (type, severity, description, linked process)
→ Task: Assign owner + acknowledge within SLA
→ Task: Root cause analysis (required evidence: RCA document)
→ Task: Corrective action defined and assigned
→ Task: Corrective action completed (required evidence)
→ Task: Preventive action defined (optional)
→ Closure: Senior sign-off required
→ Status: Closed — all steps immutably recorded
```

---

### 10.8 Governance Action Workflows (Phase 1.5)

**Process Annual Review Workflow**
Scheduled trigger fires when `next_review_due` date is reached.
```
Cron job detects overdue review
→ Workflow instance created automatically
→ Task routed to Process Owner: review and update SOP
→ If updated: routes to Approver for re-approval
→ If no changes: Owner attests "no changes required"
→ next_review_due recalculated and updated
→ Audit entry created
```

**AI Model Attestation Workflow**
Scheduled trigger fires based on risk-rated attestation frequency (90 / 180 / 365 days).
```
Cron job detects attestation due
→ Workflow instance created automatically
→ Task routed to Model Owner: review agent performance, data inputs, risk status
→ Owner attests: Confirmed / Flagged for review / Deprecation recommended
→ If flagged: escalation workflow triggered (Phase 2)
→ next_attestation_due recalculated and updated
→ Attestation entry appended to agent record (immutable)
```

---

### 10.9 Phase Build Split

| Feature | Phase 1 (Weeks 1–2) | Phase 1.5 (Weeks 3–4) |
|---|---|---|
| Manual + Approval step types | ✓ | |
| Sequential workflow execution | ✓ | |
| SOP approval workflow | ✓ | |
| Incident logging + closure workflow | ✓ | |
| SLA notification (missed deadline) | ✓ | |
| Evidence attachment (required/optional) | ✓ | |
| Scheduled process review trigger (cron) | | ✓ |
| Scheduled AI attestation trigger (cron) | | ✓ |
| Full root cause + corrective action workflow | | ✓ |
| Parallel tasks | | Phase 2 |
| System/automated step type | | Phase 2 |
| Auto-reassignment on SLA breach | | Phase 2 |

---

## 11. Audit & Evidence Management

### 11.1 Purpose

Every significant event in Aquilens — process changes, workflow completions, approvals, attestations, access events — is written to an immutable audit log. This log, combined with attached evidence, gives institutions a complete, tamper-resistant record of how they operate. It is the foundation of accreditation readiness.

---

### 11.2 What Gets Logged

Every event across the platform writes an audit entry automatically. No manual logging required.

| Category | Events Logged |
|---|---|
| **Process** | Created, edited, version bumped, submitted for approval, approved, rejected, status changed, retired |
| **Workflow** | Instance started, task assigned, task completed, evidence attached, step skipped (with reason), workflow completed, workflow cancelled |
| **Approvals** | Submitted, approved (with approver), rejected (with comment), re-submitted |
| **Incidents** | Logged, assigned, RCA submitted, corrective action assigned, corrective action completed, closed |
| **Agent Registry** | Agent registered, updated, attested, risk rating changed, deprecated, retired |
| **Access & Users** | Login, logout, role assigned, role removed, permission changed, user created, user deactivated |
| **Configuration** | Review frequency changed, SLA changed, escalation rules changed, tenant settings changed |

---

### 11.3 Audit Log Entry Structure

Every entry is identical in structure regardless of event type:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `tenant_id` | UUID | Multi-tenant isolation |
| `timestamp` | Timestamp | Server-side — never client-supplied |
| `event_type` | Enum | e.g., `process.approved`, `workflow.task_completed` |
| `entity_type` | Enum | Process, Workflow, Agent, User, Incident, etc. |
| `entity_id` | UUID | The record this event is about |
| `entity_name` | Text | Snapshot of the name at time of event |
| `actor_id` | UUID | Who triggered the event |
| `actor_name` | Text | Snapshot — preserved even if user is later deactivated |
| `action` | Text | Human-readable description: "Approved SOP v2 — Attendance Recording" |
| `before_state` | JSON | Snapshot of the record before the change (for edit events) |
| `after_state` | JSON | Snapshot after the change |
| `metadata` | JSON | Additional context (e.g., rejection comment, IP address, session ID) |

**Immutability:** The audit log table has database-level constraints — no UPDATE or DELETE operations are permitted. Append-only. Any attempt to modify an existing entry is blocked at the database layer.

---

### 11.4 Evidence Storage

Evidence is any file, photo, or note attached to a workflow step at the point of completion.

**Storage:** Supabase Storage (object storage). Files are never stored in the database — only metadata and the storage reference.

**Evidence record:**

| Field | Notes |
|---|---|
| `id` | UUID |
| `tenant_id` | Multi-tenant isolation |
| `workflow_instance_id` | The workflow this evidence belongs to |
| `step_id` | The specific step it was attached to |
| `entity_type` | What it's evidencing (workflow step, incident, attestation) |
| `entity_id` | The specific record |
| `filename` | Original filename |
| `file_type` | MIME type |
| `file_size` | Bytes |
| `storage_path` | Reference to object in Supabase Storage |
| `checksum` | SHA-256 hash of the file — detects corruption |
| `uploaded_by` | User ID (snapshot) |
| `uploaded_at` | Timestamp |
| `notes` | Optional free-text note attached with the evidence |

**Immutability:** Evidence cannot be deleted or replaced after submission. Additional evidence can be added to a step, but nothing is removed. This is enforced at the application layer and database layer (no DELETE permission on the evidence table for non-superadmin roles).

**Supported evidence types:** Any file format (PDF, Word, Excel, images, video). No restrictions — institutions use whatever they have.

---

### 11.5 Audit Pack Generation

An audit pack is a compiled PDF produced on demand for a defined scope — typically used for accreditation reviews, external audits, or internal governance reporting.

**Scope options:**
- By Function (e.g., all Academics processes)
- By Process (single process — full history)
- By date range (everything in a period)
- By accreditation cycle (all activity since last review)
- By incident (single incident — full resolution trail)

**What the audit pack PDF contains:**

1. **Cover page** — institution name, scope, date range, generated by, generation timestamp
2. **Summary** — total processes reviewed, workflows completed, incidents resolved, agents attested in the period
3. **Process records** — for each process in scope: current version, approval history, last review date, owner, risk rating
4. **Workflow execution records** — each instance: who started it, each step completed (by whom, when), any exceptions noted
5. **Approvals log** — every approval and rejection with approver name, timestamp, and comment
6. **Incident records** — each incident: type, severity, RCA, corrective actions, closure evidence
7. **Agent attestation records** — each AI model attested in the period: attester, outcome, notes
8. **Evidence** — all attached files embedded directly in the PDF (photos, scans, documents rendered inline). Reviewers get one document, nothing separate to chase.

**Format:** Single PDF. Evidence files embedded. Clean layout. Generated in the background for large packs — user notified when ready.

---

### 11.6 External Auditor Access

A read-only guest role for external reviewers (e.g., CIS/NEASC accreditors, external compliance auditors).

**How it works:**
- Institution admin generates a time-limited access link for a specific scope (e.g., "Academics — 2025–2026 accreditation period")
- External auditor receives the link, creates a guest account (email only — no SSO required)
- Guest can browse: processes, workflow histories, evidence, audit trail — read-only, scoped to what the admin defined
- Guest cannot see anything outside their defined scope
- Guest access has an expiry date (set by the admin — e.g., 30 days)
- Every action by the guest is logged in the audit trail
- Admin can revoke access at any time

---

### 11.7 Access Control on the Audit Trail

| Role | What They Can See |
|---|---|
| Super Admin | Full audit trail for the entire tenant |
| Compliance Officer | Full audit trail for the entire tenant (read-only) |
| Department Head | Audit trail for their Function only |
| Process Owner | Audit trail for their processes only |
| Workflow Participant | Audit trail for workflow instances they participated in |
| External Auditor (guest) | Scoped to what the admin defined — read-only |

No role can edit or delete audit entries. Ever.

---

### 11.8 Retention

Default: indefinite. Audit records and evidence are retained permanently unless the institution explicitly requests deletion (subject to data processing agreements). Institutions with specific regulatory retention requirements (e.g., 7 years) can configure a minimum retention period — records are flagged for review after that period, not automatically deleted.

---

## 12. Notification & Escalation Framework

### 12.1 Purpose

Aquilens notifies the right people when action is required and escalates when no action is taken. The platform provides the engine — each institution configures the rules.

**Phase 1:** In-app notifications only.  
**Phase 2:** Email notifications.

---

### 12.2 What Triggers a Notification

| Trigger | Who Gets Notified |
|---|---|
| Task assigned to you | Task assignee |
| Task SLA approaching (configurable warning threshold) | Task assignee |
| Task SLA missed | Task assignee → escalation chain fires |
| Workflow instance completed | Workflow initiator |
| SOP submitted for your approval | Approver |
| SOP approved | Process owner |
| SOP rejected (with comment) | Process owner |
| Incident assigned to you | Incident owner |
| Incident SLA missed | Incident owner → escalation chain fires |
| AI model attestation due | Model owner |
| AI model attestation overdue | Model owner → escalation chain fires |
| Process review due | Process owner |
| Process review overdue | Process owner → escalation chain fires |
| Your access role changed | Affected user |
| Guest auditor access granted | Guest auditor (in-app on first login) |

---

### 12.3 In-App Notification Centre

A notification bell in the top navigation bar. Badge count shows unread notifications.

Each notification shows:
- Icon indicating type (task, approval, incident, attestation, system)
- Title — short description of the event
- Entity name — which process, workflow, agent, or incident it relates to
- Timestamp
- Read / unread state
- Action button — takes the user directly to the relevant record

Clicking a notification marks it as read and navigates to the relevant record. Bulk mark-all-as-read available.

Notifications are stored per user — each user sees only their own.

---

### 12.4 Escalation Configuration

Each institution configures escalation rules through the admin settings. Aquilens does not impose a fixed chain — the institution defines it.

**Escalation rule structure:**

| Field | Notes |
|---|---|
| Rule name | e.g., "Workflow Task Escalation" |
| Trigger | Which event type this rule applies to |
| Level 1 | Who is notified first + after how long (hours/days) |
| Level 2 | Who is notified if Level 1 doesn't act + after how long |
| Level 3 | Optional third level |
| Maximum levels | Institution decides how deep the chain goes |
| Action required to stop escalation | e.g., task completed, item acknowledged, approval given |

**Escalation targets** are defined as roles, not individuals — so if the "Department Head" role changes hands, the escalation still routes correctly.

**Example rule (institution-configured):**
```
Rule: Workflow Task SLA Breach
Level 1: Task Owner — notify immediately on SLA breach
Level 2: Department Head — escalate after 24 hours of no action
Level 3: Institution Admin — escalate after 48 hours of no action
Stops when: task is marked complete
```

Institutions can create multiple escalation rules — one per event type if needed, or shared rules across types.

---

### 12.5 Notification Preferences

Each user can configure which notifications they receive in-app. System-critical notifications (task assigned, SLA breach, approval required) cannot be turned off. Informational notifications (workflow completed, access changed) can be muted per user.

Admins can lock certain notification types on for specific roles — e.g., compliance officers always receive incident notifications regardless of personal preferences.

---

### 12.6 Phase 2 — Email Notifications

When email is added, every in-app notification has an email equivalent. Users configure per notification type whether they want in-app only, email only, or both. Email digest (daily summary) offered as an alternative to per-event emails for users who prefer lower volume.

---

## 13. User & Access Governance / RBAC

### 13.1 Model Overview

Aquilens uses a two-layer RBAC model:

- **System roles** — predefined, present in every tenant, cannot be deleted
- **Custom roles** — institution-defined, built from a permission set, fully configurable

A user can hold multiple roles. Permissions are additive — a user gets the union of all permissions across their roles. Scope (global vs. function vs. own) determines how far each permission reaches.

---

### 13.2 System-Defined Roles

| Role | Description |
|---|---|
| **Super Admin** | Full access to everything in the tenant. Manages users, roles, settings, escalation rules. Cannot be deleted. At least one Super Admin must exist at all times. |
| **Compliance Officer** | Read-only access to the entire tenant. Can generate and download audit packs. Cannot create or edit any records. |
| **Department Head** | Full access scoped to their assigned Function(s). Can approve processes, manage workflow instances, view incidents within their Function. |
| **Process Owner** | Can create, edit, version, and submit processes they own for approval. Can start workflow instances for their processes. Receives review and attestation tasks. |
| **Staff (Process Participant)** | Can view assigned SOPs and step-by-step tutorials. Can complete acknowledgement assignments when a published version requires it. Cannot create, edit, or approve processes. Operational workflow tasks are not part of the default staff experience. |
| **External Auditor (Guest)** | Scoped read-only access. Time-limited. Defined at the point of access grant. Cannot take any action — view and download only. |

---

### 13.3 Permission Set

Custom roles are built by selecting from this permission list. Each permission has a **scope** — how far it applies.

**Scope options:**
- **Global** — applies across the entire tenant
- **Function** — applies only within assigned Function(s)
- **Own** — applies only to records the user created or owns

| Resource | Permission | Available Scopes |
|---|---|---|
| **Functions & Process Areas** | Create, Edit, Delete | Global |
| **Processes** | Create | Global, Function |
| | Read / View | Global, Function, Own |
| | Edit | Global, Function, Own |
| | Submit for Approval | Global, Function, Own |
| | Approve / Reject | Global, Function |
| | Retire | Global, Function, Own |
| **Workflows** | Start Instance | Global, Function |
| | View Instance | Global, Function, Own |
| | Complete Tasks | Global, Function, Own |
| | Cancel Instance | Global, Function |
| **Incidents** | Log | Global, Function |
| | Assign | Global, Function |
| | Resolve / Close | Global, Function, Own |
| | View | Global, Function, Own |
| **Agent Registry** | Create / Edit | Global, Function |
| | View | Global, Function |
| | Attest | Global, Function, Own |
| | Deprecate / Retire | Global |
| **Audit Trail** | View | Global, Function, Own |
| **Audit Packs** | Generate | Global, Function |
| | Download | Global, Function |
| **Users** | Invite / Create | Global |
| | Edit / Deactivate | Global |
| | Assign Roles | Global |
| **Roles** | Create / Edit / Delete | Global |
| **Settings & Escalation Rules** | View | Global |
| | Edit | Global |

---

### 13.4 Custom Role Creation

Institution admins create custom roles from the admin settings:

1. Name the role (e.g., "IT Systems Officer", "Academic Registrar")
2. Select permissions from the permission set above
3. Set scope for each permission
4. Assign the role to users

Custom roles are tenant-specific — they exist only within the institution that created them. They can be edited or deleted at any time (deleting a role removes it from all users who hold it).

---

### 13.5 User Management

**Invitation flow:**
- Admin invites user by email
- User receives in-app notification (Phase 1) / email (Phase 2) with a time-limited invite link
- User sets password and completes profile on first login
- Admin assigns role(s) at invitation or after

**User record:**

| Field | Notes |
|---|---|
| Name | |
| Email | Unique per tenant |
| Role(s) | One or more — permissions are additive |
| Assigned Function(s) | For Function-scoped roles |
| Status | Active / Invited / Deactivated |
| MFA | Enabled / Disabled |
| Last login | |
| Created by | |
| Created at | |

**Deactivation:** Deactivated users cannot log in. Their historical records (audit trail entries, workflow completions, approvals) are preserved exactly as they were — actor names are snapshotted at the time of the event, so history remains intact.

---

### 13.6 Access Reviews

Institutions can run an access review — a periodic check that every user's role assignments are still appropriate.

- Admin triggers an access review (manually for Phase 1, scheduled for Phase 2)
- Review lists every active user, their roles, and last login date
- Admin confirms or revokes each user's access
- Completed review is logged in the audit trail with a timestamp and reviewer name

---

### 13.7 Session & Security

- MFA available for all users (optional per user in Phase 1, enforceable by admin in Phase 2)
- Session timeout configurable per tenant (default: 8 hours of inactivity)
- Every login and logout is logged in the audit trail
- Failed login attempts are logged
- OAuth (Google, Microsoft) supported for SSO in Phase 1
- SAML / Entra ID in Phase 2

---

## 14. Data Model

Full schema lives in [`schema.sql`](./schema.sql). Summary of tables:

### Core
| Table | Purpose |
|---|---|
| `tenants` | Institution records — one row per customer |
| `users` | Extends Supabase Auth — profile, status, MFA |

### RBAC
| Table | Purpose |
|---|---|
| `permissions` | System-level permission definitions (resource + action) |
| `roles` | System-defined + custom roles per tenant |
| `role_permissions` | Role → permission with scope (global / function / own) |
| `user_roles` | User → role with optional function scope |
| `access_reviews` | Periodic access review records |
| `access_review_items` | Per-user decision within a review |

### Process Hierarchy
| Table | Purpose |
|---|---|
| `functions` | Top-level (Academics, Finance, HR) |
| `process_areas` | Mid-level (Student Records, Payroll) |
| `processes` | Process records with current version pointer |
| `process_versions` | Full version history — each approved version is a snapshot |
| `process_version_people` | Process owners and users (many-to-many) |
| `process_steps` | Steps within a version |
| `process_step_ai_agents` | Step ↔ Agent Registry linkage |

### AI Agent Registry
| Table | Purpose |
|---|---|
| `ai_agents` | Agent/model records |
| `ai_agent_data_inputs` | What data each agent processes |
| `ai_agent_tools` | Tools/integrations each agent uses |
| `ai_agent_attestations` | Append-only attestation log |

### Workflow Engine
| Table | Purpose |
|---|---|
| `workflow_instances` | Running instances of a process |
| `workflow_tasks` | Tasks within an instance (one per step) |
| `workflow_task_evidence` | Evidence attached to tasks (no delete) |
| `approval_instances` | Approval routing records |

### Incidents
| Table | Purpose |
|---|---|
| `incidents` | Incident and non-conformance records |
| `incident_actions` | Corrective and preventive actions |

### Audit & Evidence
| Table | Purpose |
|---|---|
| `audit_log` | Immutable event log — append-only, no UPDATE/DELETE |
| `evidence_files` | General evidence (incidents, attestations, access reviews) |

### Notifications & Escalation
| Table | Purpose |
|---|---|
| `notifications` | Per-user in-app notification records |
| `escalation_rules` | Institution-configured escalation rules |
| `escalation_rule_levels` | Levels within each rule (1, 2, 3) |

### Semantic Search
| Table | Purpose |
|---|---|
| `process_embeddings` | pgvector embeddings for process semantic search |
| `agent_embeddings` | pgvector embeddings for agent search |

### Immutability enforcement
Three tables are append-only enforced at the database level via PostgreSQL rules:
- `audit_log` — no UPDATE, no DELETE
- `ai_agent_attestations` — no UPDATE, no DELETE
- `workflow_task_evidence` — no DELETE
- `evidence_files` — no DELETE

---

## 15. API Design

Full API spec lives in [`api-design.md`](./api-design.md). Summary:

- **Style:** REST, versioned at `/api/v1/`
- **Auth:** Supabase JWT — tenant context extracted from JWT claims, never from headers
- **Real-time:** Socket.io WebSocket for notifications, task assignments, audit pack readiness
- **Files:** Streamed to Supabase Storage — API handles metadata only, signed URLs generated on demand
- **Phase 1:** Internal API only (frontend ↔ backend)
- **Phase 2:** External public API — workflow triggers, task completions, incident logging, registry reads. Auth via API keys, rate limited, webhook support

**Endpoint groups:** Auth, Tenants, Users, Roles & Permissions, Access Reviews, Functions, Process Areas, Processes, Process Steps, SOP Generation (AI), AI Agents, Workflows, Approvals, Incidents, Audit Log, Audit Packs, Notifications, Escalation Rules, Search, Guest Access

---

## 16. Design Principles

Based on market research (see [`research-market-pains.md`](./research-market-pains.md)). Every UI and product decision must check against these principles.

### 16.1 The Core Insight

> **Note:** The market research that produced these principles was concentrated on schools — because schools are the first wedge. The principles themselves are sector-agnostic. The same pain pattern shows up in hospitals, fintechs, NGOs, and government agencies.

Institutions have systems. They do not have operational control. They have ERPs, SIS or EMR or CRM platforms, finance tools, HR systems, productivity suites, messaging tools, spreadsheets, PDFs, and people's memory. What they lack is one place to see who owns each process, which SOP is current, which approval is overdue, which control failed, which evidence exists, which data is wrong.

Aquilens is the **operational control layer** above existing systems — not another bloated platform competing for desk space.

### 16.2 Positioning

**Long form:** *Aquilens helps institutions see, govern, and improve how work actually happens — from SOPs and approvals to audit evidence and data quality.*

**Sharper:** *Aquilens gives leadership one governed view of processes, approvals, evidence, risks, and data quality across the organisation — without replacing the systems they already use.*

**Sector-specific framings** (used in sales, not in the product itself):
- *Schools:* "Audit-readiness for your next CIS/NEASC accreditation."
- *Hospitals:* "Clinical SOP governance and incident traceability for JCI/COHSASA."
- *Financial Services:* "Operational risk processes, attestations, and audit packs — one platform."
- *NGOs:* "Programme governance and donor-ready evidence in real time."
- *Corporates:* "ISO 9001 / 27001 readiness without the consultant bill."

### 16.3 The Ten Principles

| # | Principle | What It Means in Practice |
|---|---|---|
| 1 | **Action-First, Not Data-First** | Home screen answers *"What needs attention today?"* — not *"Here are some metrics."* Every screen leads with what to do, not what to look at. |
| 2 | **Two-Mode UI** | Staff see a reference surface: assigned procedures, tutorials, and pending acknowledgements. Governance/admin see the full platform. Same database, radically different surface. Default mode is driven by role. |
| 3 | **Governance Invisible Until Needed** | Process owners, staff, and approvers never see escalation rules, risk matrices, or governance controls in their day-to-day flow. The heavy machinery sits behind admin screens. |
| 4 | **AI Assistive, Never Autonomous** | Every AI suggestion is visually marked, explains its reasoning, and is rejectable. AI never auto-publishes. Every AI action is logged in the audit trail. Customer data is never used to train models. |
| 5 | **Inline Evidence Capture** | Evidence is captured as part of completing a task — drag-drop, photo, voice note — never as a separate workflow. Required vs optional evidence is visually obvious. |
| 6 | **Plain English** | No "BPMN", "RACI", "Gemba", "QMS", "SLA breach matrix" in user-facing copy. Use: process, owner, approver, due, complete, overdue. |
| 7 | **3-Click Rule** | View today's tasks: 1 click. Complete a task: 2 clicks. Approve an SOP: 2 clicks. Generate audit pack: 3 clicks. Anything that takes more is broken. |
| 8 | **Speed & Trust Signals** | Autosave everywhere. "Last saved 2s ago" visible. Offline-tolerant uploads (queue + retry). Clear error states. Page loads under 3 seconds. |
| 9 | **Data Portability Visible** | Settings has a prominent "Your Data" section. One-click export of everything. Documented data model accessible. This is a trust signal as much as a feature. |
| 10 | **Audit Is a By-Product** | Audit evidence builds itself through normal work. Audit packs generate in one click. The product feels like operations software, but the output looks like compliance gold. |

### 16.4 Pain → Design Decisions Map

| Market Pain | Aquilens Design Response |
|---|---|
| "Tools are clunky, nobody uses them" | Plain-English workflows. Role-based defaults. Guided templates. No jargon. |
| "Approval trails are messy" | Every SOP and workflow shows owner, reviewer, approver, status, version, approval history inline. |
| "Audit prep takes weeks" | Evidence captured at task completion. One-click audit packs. Nothing assembled at audit time. |
| "Integrations are weak" | First-class CSV/SFTP/webhooks/API. "No API" mode supported. Integrations are a selling point, not a deferred feature. |
| "Data is messy" | Data quality module: duplicates, missing fields, orphaned records, cross-system reconciliation. Phase 2 once SOR access is established. |
| "Platform fatigue" | Sit *above* existing systems. Don't compete with SIS or LMS. Don't position as another teacher-facing app. |
| "Performance kills trust" | Hard UX rules: under-3-second dashboards, autosave, offline-tolerant uploads, clear errors. |
| "Vendors trap customers" | Data portability is a feature. Clean exports, documented data model, customer-owned data, exit pack. |
| "Pricing anxiety" | Institution-based pricing. No surprise charges for AI, storage, automation, exports. |
| "AI privacy concerns" | Tenant data isolation. No training on customer data. Every AI action logged. AI requires human approval. |

### 16.5 Implementation Is a Product

Onboarding new institutions follows a 4-week structured rollout, packaged as a product (not a service mess):

| Week | Focus | Deliverable |
|---|---|---|
| 1 | Process discovery + system mapping | Function tree built, key systems identified |
| 2 | Top 10 critical processes loaded | Initial SOP set live |
| 3 | Approval workflows + evidence rules configured | Workflow engine producing audit evidence |
| 4 | Dashboard, training, governance handover | "Aquilens Readiness Score" issued |

The Readiness Score is a single number summarising process coverage, approval completeness, evidence rules, and governance setup. It's the artefact that proves the institution is operationally controlled.

---

## 17. Specs To Complete

- [x] Process Architecture
- [x] SOP Creation Methods
- [x] AI Model & Agent Registry
- [x] Workflow Engine
- [x] Audit & Evidence Management
- [x] Notification & Escalation Framework
- [x] User & Access Governance / RBAC
- [x] Data model (full schema)
- [x] API design
- [x] Design principles
- [ ] UI wireframes
