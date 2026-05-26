# Aquilens — API Design

> Phase 1: Internal API only (Next.js frontend ↔ NestJS backend)
> Phase 2: External public API (workflow triggers, task completions, incident logging)

---

## 1. Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Style | REST | Simpler to build solo, NestJS has first-class REST support |
| Versioning | URL prefix `/api/v1/` | Clean, easy to version-bump without breaking clients |
| Auth | Supabase JWT (Bearer token) | Auth is handled by Supabase; JWT carries user ID and tenant ID |
| Tenant context | Extracted from JWT claims | Never passed as a header — prevents tenant spoofing |
| Real-time | WebSocket (Socket.io) | For in-app notifications and live workflow status updates |
| File uploads | Multipart form data → Supabase Storage | Files go straight to storage; API only handles metadata |
| Response format | Consistent JSON envelope (see below) | Predictable shape for every response |
| Pagination | Cursor-based | Stable with real-time data; avoids offset drift |
| Error format | RFC 7807 Problem Details | Standard, parseable error shape |

---

## 2. Base URL

```
https://api.aquilens.app/api/v1/
```

All endpoints are prefixed with `/api/v1/`.

---

## 3. Authentication

Every request (except `/auth/*`) requires a Bearer token in the Authorization header:

```
Authorization: Bearer <supabase_jwt>
```

The JWT contains:
- `sub` — user ID
- `tenant_id` — extracted from Supabase user metadata
- `roles` — array of role keys for the user

The NestJS auth guard:
1. Validates the JWT signature
2. Extracts `tenant_id` — all subsequent queries are scoped to this tenant
3. Loads the user's full permissions from the database
4. Attaches `user`, `tenant`, and `permissions` to the request context

No endpoint can access data outside the JWT's `tenant_id`. This is enforced both at the application layer and at the database layer via Supabase Row Level Security.

---

## 4. Response Envelope

Every response uses a consistent shape:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": { "cursor": "abc123", "hasMore": true, "total": 142 }
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "PROCESS_NOT_FOUND",
    "message": "Process with ID abc123 does not exist in this tenant.",
    "status": 404,
    "details": {}
  }
}
```

`meta` is only present on list responses. `details` is only present when additional context is useful (e.g., validation errors listing which fields failed).

---

## 5. Pagination

Cursor-based pagination on all list endpoints.

**Request:**
```
GET /api/v1/processes?limit=20&cursor=eyJpZCI6ImFiYzEyMyJ9
```

**Response meta:**
```json
{
  "meta": {
    "page": {
      "cursor": "eyJpZCI6InhjejQ1NiJ9",
      "hasMore": true,
      "total": 142
    }
  }
}
```

Default page size: 20. Maximum: 100.

---

## 6. Standard Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Valid token but insufficient permission |
| `NOT_FOUND` | 404 | Resource does not exist in this tenant |
| `CONFLICT` | 409 | Duplicate — e.g., process code already exists |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 7. Endpoints

### 7.1 Auth

```
POST   /auth/login              Sign in — returns Supabase JWT
POST   /auth/logout             Invalidate session
POST   /auth/refresh            Refresh JWT
POST   /auth/mfa/enrol          Enrol MFA
POST   /auth/mfa/verify         Verify MFA code
POST   /auth/invite             Admin invites a new user (sends invite link)
POST   /auth/accept-invite      New user accepts invite and sets password
POST   /auth/reset-password     Request password reset
```

---

### 7.2 Tenants

```
GET    /tenants/me              Get current tenant details and settings
PATCH  /tenants/me              Update tenant settings (Super Admin only)
```

---

### 7.3 Users

```
GET    /users                   List all users in tenant (paginated)
GET    /users/:id               Get a user
PATCH  /users/:id               Update user profile or status
DELETE /users/:id               Deactivate a user (soft delete)

GET    /users/:id/roles         Get roles assigned to a user
POST   /users/:id/roles         Assign a role to a user
DELETE /users/:id/roles/:roleId Remove a role from a user
```

---

### 7.4 Roles & Permissions

```
GET    /roles                   List all roles (system + custom)
POST   /roles                   Create a custom role
GET    /roles/:id               Get a role with its permissions
PATCH  /roles/:id               Update a custom role (system roles are immutable)
DELETE /roles/:id               Delete a custom role

GET    /permissions             List all available permissions
POST   /roles/:id/permissions   Assign permissions to a role
DELETE /roles/:id/permissions/:permissionId  Remove a permission from a role
```

---

### 7.5 Access Reviews

```
GET    /access-reviews               List access reviews
POST   /access-reviews               Initiate a new access review
GET    /access-reviews/:id           Get a review with all items
PATCH  /access-reviews/:id/items/:userId  Submit decision (confirm / revoke)
POST   /access-reviews/:id/complete  Mark review as complete
```

---

### 7.6 Functions

```
GET    /functions               List all functions
POST   /functions               Create a function
GET    /functions/:id           Get a function
PATCH  /functions/:id           Update a function
DELETE /functions/:id           Delete a function (only if no process areas exist under it)

GET    /functions/:id/process-areas   List process areas under a function
```

---

### 7.7 Process Areas

```
GET    /process-areas                  List all process areas (filterable by function)
POST   /process-areas                  Create a process area
GET    /process-areas/:id              Get a process area
PATCH  /process-areas/:id             Update a process area
DELETE /process-areas/:id             Delete (only if no processes exist under it)

GET    /process-areas/:id/processes   List processes under a process area
```

---

### 7.8 Processes

```
GET    /processes                      List processes (filter: status, risk, function, area, tag)
POST   /processes                      Create a process (creates first draft version)
GET    /processes/:id                  Get a process with current version
PATCH  /processes/:id                  Update process metadata (tags, risk rating)
DELETE /processes/:id                  Retire a process

GET    /processes/:id/versions         List all versions of a process
GET    /processes/:id/versions/:vId    Get a specific version (full detail + steps)
POST   /processes/:id/versions         Create a new draft version from current

POST   /processes/:id/submit           Submit current draft for approval
POST   /processes/:id/approve          Approve submitted version (sets status → active)
POST   /processes/:id/reject           Reject with comment (returns to draft)
POST   /processes/:id/retire           Retire an active process

GET    /processes/:id/audit            Get audit trail for this process
```

---

### 7.9 Process Steps

```
GET    /processes/:id/versions/:vId/steps           List steps for a version
POST   /processes/:id/versions/:vId/steps           Add a step
PATCH  /processes/:id/versions/:vId/steps/:stepId   Update a step
DELETE /processes/:id/versions/:vId/steps/:stepId   Delete a step
POST   /processes/:id/versions/:vId/steps/reorder   Reorder steps (body: [{id, stepNumber}])

POST   /processes/:id/versions/:vId/steps/:stepId/agents        Link an AI agent to a step
DELETE /processes/:id/versions/:vId/steps/:stepId/agents/:agentId  Unlink an agent
```

---

### 7.10 SOP Generation (AI)

```
POST   /sop/generate            Generate SOP from natural language description
                                Body: { description: string, functionId, processAreaId }
                                Returns: draft process_version with steps populated

POST   /sop/parse               Parse an uploaded file into SOP template structure
                                Body: multipart — file + { functionId, processAreaId }
                                Returns: draft process_version with steps populated

POST   /sop/gap-check/:vId      Run AI gap analysis on a process version
                                Returns: list of identified gaps with suggestions

POST   /sop/transcribe          Transcribe voice input to text (pre-step before /generate)
                                Body: multipart — audio file
                                Returns: { transcript: string }
```

---

### 7.11 AI Agents

```
GET    /agents                  List agents (filter: status, risk, vendor, function)
POST   /agents                  Register a new agent
GET    /agents/:id              Get an agent (full record + linked processes + attestation history)
PATCH  /agents/:id              Update agent details
POST   /agents/:id/deprecate    Deprecate an agent (triggers impact check)
POST   /agents/:id/retire       Retire a deprecated agent

GET    /agents/:id/processes    List all processes that reference this agent
GET    /agents/:id/attestations Get attestation history

POST   /agents/:id/attest       Submit an attestation
                                Body: { outcome, notes }
                                Appends to attestation log, updates next_attestation_due

GET    /agents/due-attestation  List agents with attestation due or overdue
```

---

### 7.12 Workflows

```
GET    /workflows                     List workflow instances (filter: status, process, started_by)
POST   /workflows                     Start a new workflow instance
                                      Body: { processId, title, context }
GET    /workflows/:id                 Get instance with all tasks and their status
PATCH  /workflows/:id                 Update instance metadata
POST   /workflows/:id/cancel          Cancel a running instance (requires reason)

GET    /workflows/:id/tasks           List tasks for an instance
GET    /workflows/:id/tasks/:taskId   Get a specific task
POST   /workflows/:id/tasks/:taskId/start     Mark task as in_progress
POST   /workflows/:id/tasks/:taskId/complete  Complete a task
                                              Body: { notes, skipEvidenceCheck? }
POST   /workflows/:id/tasks/:taskId/skip      Skip a task (requires reason)
POST   /workflows/:id/tasks/:taskId/approve   Approve (for approval-type tasks)
POST   /workflows/:id/tasks/:taskId/reject    Reject with comment

POST   /workflows/:id/tasks/:taskId/evidence  Upload evidence to a task
                                              Body: multipart — file + { notes }
GET    /workflows/:id/tasks/:taskId/evidence  List evidence for a task

GET    /workflows/:id/audit           Get full audit trail for this instance
```

---

### 7.13 Approvals

```
GET    /approvals                    List pending approvals for the current user
GET    /approvals/:id                Get an approval instance
POST   /approvals/:id/approve        Approve with optional comment
POST   /approvals/:id/reject         Reject with required comment
```

---

### 7.14 Incidents

```
GET    /incidents                    List incidents (filter: status, severity, type, assignee)
POST   /incidents                    Log a new incident
GET    /incidents/:id                Get incident with actions and evidence
PATCH  /incidents/:id                Update incident details
POST   /incidents/:id/assign         Assign incident to a user
POST   /incidents/:id/submit-rca     Submit root cause analysis
                                     Body: { rcaDescription }

GET    /incidents/:id/actions        List corrective/preventive actions
POST   /incidents/:id/actions        Add an action
PATCH  /incidents/:id/actions/:actionId  Update action status or details
POST   /incidents/:id/actions/:actionId/complete  Mark action complete (with evidence)

POST   /incidents/:id/close          Close incident (requires senior sign-off)
                                     Body: { closureNotes }

POST   /incidents/:id/evidence       Upload evidence to an incident
GET    /incidents/:id/evidence       List evidence for an incident
GET    /incidents/:id/audit          Audit trail for this incident
```

---

### 7.15 Audit Log

```
GET    /audit                        Query audit log
                                     Filters: entityType, entityId, actorId,
                                              eventType, dateFrom, dateTo
                                     Paginated — cursor-based

GET    /audit/export                 Export filtered audit log as CSV
```

---

### 7.16 Audit Packs

```
POST   /audit-packs/generate         Generate an audit pack PDF
                                     Body: {
                                       scope: 'function' | 'process' | 'date_range' | 'incident',
                                       scopeId?: string,
                                       dateFrom?: string,
                                       dateTo?: string
                                     }
                                     Returns: { jobId } — generated async

GET    /audit-packs/:jobId/status    Check generation status (pending / ready / failed)
GET    /audit-packs/:jobId/download  Download completed PDF
GET    /audit-packs                  List previously generated packs
```

---

### 7.17 Notifications

```
GET    /notifications               List notifications for current user
                                    Filter: isRead, type
PATCH  /notifications/:id/read      Mark a notification as read
POST   /notifications/read-all      Mark all as read
DELETE /notifications/:id           Dismiss a notification
```

---

### 7.18 Escalation Rules

```
GET    /escalation-rules             List all escalation rules
POST   /escalation-rules             Create a rule
GET    /escalation-rules/:id         Get rule with levels
PATCH  /escalation-rules/:id         Update rule
DELETE /escalation-rules/:id         Delete rule
POST   /escalation-rules/:id/toggle  Activate or deactivate a rule
```

---

### 7.19 Search

```
GET    /search                       Global search across processes and agents
                                     Query: { q: string, type?: 'process' | 'agent' | 'all' }
                                     Uses pgvector semantic search + full-text fallback

GET    /search/processes             Search processes only
GET    /search/agents                Search agents only
                                     Supports natural language:
                                     "agents that process student data"
                                     "show me all high-risk agents in admissions"
```

---

### 7.20 External Auditor Access

```
POST   /guest-access                 Admin generates a scoped guest access link
                                     Body: { scope, scopeId, expiresAt, auditorEmail }
                                     Returns: { accessUrl, token }

GET    /guest-access                 List active guest access grants
DELETE /guest-access/:id             Revoke a guest access grant
```

---

## 8. WebSocket Events

Real-time events delivered via Socket.io. Client subscribes on login, scoped to their tenant and user.

| Event | Payload | Trigger |
|---|---|---|
| `notification.new` | Notification object | New notification created for this user |
| `workflow.task_assigned` | Task summary | A task is assigned to this user |
| `workflow.task_updated` | Task summary | A task the user is watching changes status |
| `approval.requested` | Approval summary | An approval is routed to this user |
| `incident.assigned` | Incident summary | An incident is assigned to this user |
| `audit_pack.ready` | `{ jobId, downloadUrl }` | An audit pack finishes generating |

---

## 9. File Upload Pattern

All file uploads follow the same pattern:

1. Client sends `POST` with `multipart/form-data`
2. NestJS streams the file directly to Supabase Storage
3. API saves metadata (filename, type, size, storage path, SHA-256 checksum) to the relevant evidence table
4. API returns the evidence record — **not** a signed URL
5. To download, client calls a separate `GET /evidence/:id/download` endpoint which generates a short-lived signed URL (15 minutes) on demand

Files are never served through the NestJS API directly — always via Supabase Storage signed URLs.

---

## 10. Phase 2 — External Public API (outline)

When the integrations module ships, the public API will expose:

```
POST   /v1/external/workflows/trigger       Trigger a workflow from an external system
POST   /v1/external/tasks/:taskId/complete  Mark a task complete from an external system
POST   /v1/external/incidents               Log an incident from an external monitoring tool
GET    /v1/external/processes               Read process registry
GET    /v1/external/agents                  Read agent registry
```

Auth: API keys (not JWTs). Rate limited. Scoped to specific resources at key creation.
Webhooks: Aquilens pushes events to a configured endpoint when workflow instances complete, incidents are closed, or attestations are submitted.
