# Aquilens — Market Research: Pain Points & Design Implications

> Source: User-supplied research, May 2026
> Purpose: Inform UI design principles before wireframing

---

## The Core Insight

People are not asking for *more* software. They are complaining about systems that create more admin, more confusion, and more places to check.

The market gap is not "school management software" — that space is crowded. The gap is that **schools have systems, but they do not have operational control.** They have SIS, finance tools, HR systems, Google Workspace, Microsoft 365, WhatsApp, spreadsheets, PDFs, and people's memory. What they lack is one place to see:

- Who owns each process
- Which SOP is current
- Which approval is overdue
- Which control failed
- Which evidence exists
- Which data is wrong
- Which workflow is bypassed
- Which audit risk is building

**That is Aquilens.**

---

## Pain Points & Product Response

| Pain | Implication for Aquilens |
|---|---|
| Tools are clunky and nobody uses them | Build "Action Required" home screen. Plain-English workflows. No BPMN language for normal users. |
| Approval trails are messy | Every SOP and workflow has owner, reviewer, approver, status, review date, approval history, version comparison, attestation evidence. |
| Audit prep still takes weeks | Collect evidence as work happens, not at audit time. Generate audit packs automatically. |
| Integrations are weak | First-class integrations: REST APIs, CSV, SFTP, webhooks, M365, Google Workspace, SIS, HR, finance, LMS. "No API" mode with controlled uploads. |
| Data quality is bad | Data quality assessment as an early paid module: duplicate detection, missing fields, orphaned records, cross-system reconciliation. |
| Platform fatigue | Don't position as another teacher-facing app. Sit *above* existing systems. Integrate, don't replace. |
| Performance kills trust | Every common task under 3 clicks. Dashboards under 3 seconds. Autosave. Offline-tolerant evidence upload. |
| Vendors trap customers | Data portability as a feature. Clean exports. Documented data models. Customer-owned data. Clear exit pack. |
| Pricing anxiety | Transparent institution-based pricing. No surprise charges for AI, storage, automation, exports. |
| AI privacy concerns | AI must be assistive, not autonomous. Explain suggestions. Require human approval. Tenant data isolation. No training on customer data. Log every AI action. |

---

## Positioning

**Long form:**
*Aquilens helps schools see, govern, and improve how work actually happens — from SOPs and approvals to audit evidence and data quality.*

**Sharper, for GIS-type institutions:**
*Aquilens gives school leadership one governed view of processes, approvals, evidence, risks, and data quality across the institution — without replacing the systems they already use.*

---

## Design Principles (extracted)

1. **Action-First, Not Data-First** — Home screen answers *"What needs attention today?"*, not *"Here are some metrics."*
2. **Two-Mode UI** — Staff see only tasks. Governance/admin see the full platform. Same user, different defaults by role.
3. **Governance Invisible Until Needed** — Most users never see the heavy machinery. They see "Approve this." "Upload that." "Confirm completion."
4. **AI Assistive, Never Autonomous** — Every AI suggestion shows reasoning. Every AI-generated change requires human approval. AI-generated content is visually marked.
5. **Inline Evidence Capture** — Evidence capture is part of completing a task, not a separate flow.
6. **Plain English** — No "BPMN", "RACI", "Gemba", "QMS" in user-facing copy. Use: process, owner, approver, due, complete.
7. **3-Click Rule** — View today's tasks: 1 click. Complete a task: 2 clicks. Approve an SOP: 2 clicks. Generate audit pack: 3 clicks.
8. **Speed & Trust Signals** — Autosave on every input. Offline-tolerant uploads. Clear error states. "Last saved" indicators.
9. **Data Portability Visible** — "Your Data" section in settings. Clear export. Trust signal.
10. **Audit Is a By-Product** — Evidence builds itself through normal work. Audit packs in one click.

---

## MVP Priorities (from research, validated against current plan)

| # | Capability | In Plan? |
|---|---|---|
| 1 | Process repository | ✓ |
| 2 | SOP lifecycle management | ✓ |
| 3 | AI SOP generator | ✓ |
| 4 | Approval workflow | ✓ |
| 5 | Evidence capture | ✓ |
| 6 | Review reminders | ✓ (Phase 1.5 scheduled triggers) |
| 7 | Audit trail | ✓ |
| 8 | Basic dashboard | Need to design — "Operational Control Room" |
| 9 | Data quality upload checker | Partially — process-level only in Phase 1; full module is Phase 2 (needs SOR access) |
| 10 | CSV/API integration layer | Phase 2 |

**Deprioritised for v1 (matches plan):**
- Complex incident management
- Branching workflow logic
- Advanced AI prediction
