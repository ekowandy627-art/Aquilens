# Aquilens — Product Review & Refined Specification

> Consolidated from working session, June 2026
> Supersedes scattered notes. This is the current source of truth for product direction.
> Positioning decision: **industry-agnostic from day one** (manufacturing-led, not school-led).

---

## What Aquilens Is (refined)

Aquilens is an **operational governance, training, and audit-readiness platform**. It sits *above* an institution's existing systems and does three things — and only three:

| Pillar | What it does |
|---|---|
| **Govern** | Document SOPs, map controls to evidence, align to standards, route approvals, version everything |
| **Train** | Turn SOPs (or standalone material) into training; prove staff are competent on current procedures |
| **Audit** | Log incidents and self-identified issues, resolve them on a governed path, produce audit packs on demand |

**What it is not:** a task manager. Staff do not log their daily work in Aquilens. The work happens in the real world; the *records* live wherever they already live (SCADA, SIS, paper logs, signing sheets). Aquilens holds the **map** — what the control is, what evidences it, where that evidence lives — plus the proof that people are trained and that issues get resolved.

**The core audit truth this serves:** every audit compares *what your procedure says* against *what actually happens*. Aquilens makes both sides visible in one place and keeps the evidence trail ready to sample.

---

# Part 1 — Errors & Risks Worth Fixing

### 1. Three AI passes + a Q&A round is four sequential waits
The composer plan ran Synthesize → Align → Questions → Re-align, each a spinner. That *feels* like heavy enterprise software — the exact opposite of the intent.
**Fix:** collapse synthesis and standards alignment into one **streamed** response. Show the draft building live (steps appearing as they generate); gaps and standards flags resolve as a second layer on the same screen. One perceived wait, not four.

### 2. Onboarding asks for compliance posture before the user has seen anything work
Forcing leadership to rate every standards pack as *aligned / working toward / not applicable* on day one is a cold, abstract gate between signup and value.
**Fix:** at onboarding, only *capture which packs are relevant* (one tap each). Posture is set later, naturally, the first time each pack appears against a real process — where it's concrete.

### 3. "Function owner auto-fills as process owner" creates silently-wrong ownership
The Admissions function owner would become default owner of every Admissions SOP, including ones someone else actually runs. Defaults that are usually wrong train people to ignore the field.
**Fix:** default to the **person creating the SOP**, not the function owner. The creator is almost always closer to the right owner.

### 4. Conflict detection has no resolution memory
"PDF says 48h, voice says 24h" — user picks 24h. Next version, same conflict re-surfaces.
**Fix:** record each resolution as a decision tied to the source, so re-runs don't re-litigate settled questions.

### 5. Evidence is not "recorded in Aquilens" — that mode shouldn't exist
Most evidence never lives in the platform and never should. Forcing it in fights every existing system and breaks the "sit above, don't replace" positioning.
**Fix:** **evidence required ≠ recorded in Aquilens.** It means *some form of record, log, or demonstrable action exists for that control point — wherever it lives.* When the agent flags a control point, ask one question — *how is this evidenced?* — with three honest modes:

| Mode | Examples |
|---|---|
| **Acknowledgement / training record** | Staff completed (and possibly passed) training on the procedure — the completion record is evidence the control is known and operated |
| **External system** | Temperature log in SCADA, attendance in the SIS, breach in CPOMS — name the system, describe where the record lives |
| **Physical / off-system** | A signing sheet, a paper log, a control-room entry book — describe what it is and where it's kept |

Aquilens maps every control to its evidence and location. Auditors sample from that map. The institution is never required to centralise its recordkeeping — only to *know where its evidence is* and be able to produce it.

### 6. The "evidence required" toggle fires in a hidden context
A bare boolean on every step does nothing during reading and means different things in different places.
**Fix:** rename and reframe — **"This step requires some form of evidence or record."** Turning it on immediately asks *where and how is it recorded?* (the three modes above). Restrict it to steps marked as **control points** — most steps are not controls, and a toggle that appears everywhere trains people to ignore it.

### 7. Training assessment must be per-module, not a platform rule
Not every SOP needs a quiz. "How to book a meeting room" with an 80% gate breeds resentment; a safeguarding or allergen-control SOP absolutely needs one.
**Fix:** one toggle per training module at creation — **acknowledge-only** or **assessed**. The owner decides based on what the content warrants. Both produce audit records showing which type was set and which version was completed.

### 8. Unlimited silent retakes let people brute-force assessments
No ceiling means a struggling staff member retries forever and a "pass" hides that it took twelve attempts.
**Fix:** **80% to pass**, draw ~10 questions from a bank of ~20 with shuffled questions and shuffled options, **fresh draw on each retake**, and after **3 failed attempts notify the line manager** instead of serving another retry. The escalation is itself useful audit/competence signal.

### 9. Single-jurisdiction assumption breaks for exporters and multinationals
A manufacturer in Ghana shipping to EU/UK/USA faces three regulatory gates at once — sometimes conflicting (an additive the EU permits and the FDA bans).
**Fix:** model **two kinds of jurisdiction** on the org and on each process:
- **Operating jurisdiction** — where the facility is (local labour, H&S, local authority)
- **Output-market jurisdiction** — where the product/service goes (import, labelling, market-specific certification)

The agent runs a **unified gap analysis** across all applicable jurisdictions, then:
- **Overlap** → "one control covers all three markets"
- **Compatible but different** → "EU is strictest here; meeting it covers all"
- **Conflict** → flag explicitly and force a documented decision (separate variant / adopt stricter / documented exception). The decision is versioned into the process so auditors get an answer, not a surprise.

---

# Part 2 — UX Moves to Make It Feel Easy & Modern

### 1. The composer feels like this chat — not a wizard
One large, open input, ready the moment you land. Copy: **"Dump everything here — notes, voice, files, rough steps. I'll help you clean it up."** Type, or tap to speak, or attach with a paperclip. No mode selection, no "choose an artifact type," no panel of equal options. Function + process area sit above for context; everything else mirrors the AI tools people already use. Zero learning curve on input; the governance structure it produces is the new thing.

### 2. Stream the generation — never a blank spinner
Render steps as they arrive. Gaps and standards flags fade in as coloured margin notes **next to the specific step they concern**, not a separate list to cross-reference. Anchoring a gap to its step is the difference between "easy" and "homework."

### 3. Gaps and control-points are one-tap actions, not a report
"No 24-hour escalation step" carries an **[Add this step]** button that inserts a pre-filled step inline. When the agent spots a likely control point, it asks the evidence question **right there**, anchored to the step. A gap you resolve in one tap feels like a copilot; a gap list you must manually action feels like a compliance chore.

### 4. Q&A as inline decision chips, not a chat thread
Each question docks to the step it concerns, with likely answers as selectable chips — "24h" / "48h" / "Other." Selecting one patches the draft live. No conversation to scroll.

### 5. A visible lifecycle spine on every process
`Draft → Approved → Published → Training active → Audit-ready`. A thin status rail on the process page so every role sees where the SOP stands at a glance — and learns the product's model without a manual.

### 6. Provenance on the steps, quietly
Each generated step carries a small source badge — *from policy.pdf*, *from recording* — visible on hover. Trust signal without a trip to another panel.

### 7. Staff see "My Training," never "Tasks"
A clean, separate surface listing what's due, overdue, or re-triggered by a new version. Open a module → read → acknowledge or assess → done. Frequency and version logic happen invisibly. Keeps the reference-first identity intact and avoids any "do your job here" feel.

### 8. The Readiness Score is the dashboard's headline
Not vanity — a specific, actionable number: processes covered, training current, control points evidenced, standards gaps open, incidents/SIAIs unresolved. It tells leadership where they stand before an auditor does, and it's the natural sales hook: *"by week one you'll have a Readiness Score — and know exactly what's pulling it down."*

---

# Part 3 — Full Functionality Set

The hierarchy, unchanged and sector-agnostic:

```
Organisation
  └── Function           (Production, Quality, Academics, Clinical…)
        └── Process Area     (Labelling, Sanitation, Enrolment…)
              └── Process        = one SOP
                    └── Steps        = the procedure (source of truth)
                          └── Control points → evidence map
```

The visual **process flow** is a *view* of the steps, never maintained separately.

---

## 3.1 Foundation
- **Multi-tenant** with row-level isolation; tenant context from JWT, never headers
- **RBAC** — system roles + custom roles, additive permissions, scope of global / function / own
- **Append-only** audit log, attestations, training attempts, evidence records

## 3.2 Onboarding & Structure
- Setup wizard: organisation name, **type**, **operating jurisdiction(s)**, **output-market jurisdiction(s)**
- Institution-type scaffolds (manufacturing, school, hospital, NGO, financial services, government, corporate) — all editable
- Function tree + process-area editor
- Standards packs **suggested** (not imposed), filtered by type + function + area + jurisdiction; user confirms relevance

## 3.3 Process Repository & SOP Editor
- Full process template: identity, purpose, who it affects, owners/users, linked systems, risk, governance controls, review frequency, regulatory references, tags, status, versioning
- Step builder: drag-reorder, step types (Manual / Approval; System reserved), inputs/outputs/controls
- **Control points** per step + evidence mode (acknowledgement / external system / physical)

## 3.4 AI SOP Composer
- Chat-style input: **type / voice / attach**, "dump everything here"
- Streamed draft generation
- Conflict detection across sources, with **resolution memory**
- Internal gap detection (missing owner, vague step, missing outputs)
- Standards alignment against confirmed packs only (cheap, retrieval-based)
- Inline decision chips for targeted questions
- Provenance badges on each generated step
- AI is **assistive, never autonomous** — every generated field is marked, editable, and never auto-published

## 3.5 Standards & Jurisdictions
- Standards library (platform-curated packs: summary + requirements + audit checks)
- **Process-level** confirmed standard set (authoritative for that process)
- **Two jurisdiction types** — operating vs output-market — on org and process
- **Unified multi-market gap analysis** with overlap / strictest / conflict handling
- **Documented conflict resolution** versioned into the process
- Library grows safely from real usage (agent proposes → platform manager curates → ships)

## 3.6 SOP Approval Lifecycle
- `Draft → Under Review → Active → Retired`; new edits on an Active SOP spawn a new draft version
- Approval queue, approve/reject with required comment, full version history with simple diff
- Publish with effective date + review-due date

## 3.7 System-Triggered Workflows (resolution engine)
Workflows are **never manually started.** The platform opens one when something needs resolution, routes it to the right role, and **keeps it open until every step on its path is complete and signed off.** Status is derived, never manually set.

| Trigger | Routed to | Resolution path |
|---|---|---|
| **SIAI created** | Owner + resolver | Gap analysis → corrective + preventive actions → senior sign-off → closed |
| **Incident logged** | Incident owner | RCA → corrective actions (evidence) → preventive actions → senior sign-off → closed |
| **Standards gap at publish** | Process owner | Remediation action → re-alignment → sign-off → closed |
| **Attestation due** | Agent owner | Review agent → outcome → escalate if flagged → closed |
| **SOP submitted** | Approver | Review → approve / reject → closed |
| **Training assigned** | Staff | Complete → acknowledge/pass → closed; fail 3× → manager notified |
| **Process review due** | Process owner | Review → update or attest-no-change → re-approve if changed → closed |

Build the engine once (in the approval flow) and reuse it for every trigger type.

## 3.8 Incident Management
- Log an incident against a **process** (and optional **step**)
- Type, severity (Low/Medium/High/Critical), description, immediate action taken
- Resolution workflow: RCA → corrective actions with evidence → preventive actions → senior sign-off
- **Cannot be closed by the raiser**; cannot close until all actions complete
- Surfaces on the process record (incident count → can auto-trigger SOP review)

## 3.9 SIAI — Self-Identified Audit Issue
- Proactive log of a gap, weakness, or control-not-working **found internally before an auditor finds it**
- The more valuable governance signal: evidence of a functioning internal audit culture
- Same resolution workflow as incidents (gap analysis → remediation → preventive → sign-off)
- **Stays open until the entire resolution path is complete and signed off** — derived status, no manual close, raiser ≠ closer
- Full trail printed in audit packs: what, who, when, analysis, actions, evidence, sign-off, time-open

## 3.10 AI Agent Registry
- Register AI models/tools: vendor, model, version, owner, owning function, **risk classification**, data inputs, tools/integrations, deployment environment
- **Risk-based attestation schedule** (High 90d / Medium 180d / Low 365d) with attestation workflow on due
- Link agents to specific SOP steps (chip on step → agent record)
- Append-only attestation history; semantic search ("agents that process student data")

## 3.11 Training & Competence
- **Two sources:** generated **from an SOP**, or **standalone** (uploaded material + intent) — same composer pattern
- **Per-module assessment type:** *acknowledge-only* or *assessed*
- **Assessed** = question bank (~20), draw ~10 per attempt, shuffle questions + options, **80% pass**, critical questions always-served-and-must-pass, fresh draw on retake, **3-fail → manager escalation**
- **AI drafts the question bank; a human reviews/approves before publish** (assistive, never autonomous)
- **Assignment by audience** (role / function / specific users), flowing from the SOP's "who it affects"
- **Recurring frequency:** monthly / quarterly / biannually / annually / on-change
- **Re-training triggers:** frequency elapsed **or** new version published (`superseded`)
- **Trainer permission** (Create/Edit/Publish training, scope global or function): function-scoped trainers **self-publish**; **org-wide or high-risk-linked** training needs a second approver. Author + publisher always recorded.
- Records (acknowledgement or passed assessment, with version + score + next-due) are **competence evidence** auditors sample — and a valid evidence mode for a control point.

## 3.12 Recurring Control Records
- For controls that repeat (per-batch, per-shift, per-event, periodic), a standing **log register** that documents *what the record is, where it lives, who owns it, and how often* — **the records themselves stay outside Aquilens.** Aquilens governs and surfaces them, with verification status (`unverified → sampled → verified`) so a description can't masquerade as proof.

## 3.13 Notifications & Dashboard
- In-app notifications + bell; role-based **Operational Control Room** dashboard
- **Readiness Score** headline
- Configurable, institution-defined **escalation rules** (role-targeted, multi-level)
- **Scheduled triggers** (cron): process review due, attestation due, training due

## 3.14 Audit Trail & Audit Packs
- Immutable, append-only log of every significant event (process, training, incident, SIAI, agent, access, config)
- Scoped audit packs (by function / process / date range / incident / SIAI / jurisdiction) as a single PDF
- Pack states the jurisdictions in scope; lists control-evidence map + where records live; embeds available evidence
- **External auditor guest access:** scoped, time-limited, read-only, every action logged, revocable

## 3.15 Roles (at a glance)
| Role | Main journey |
|---|---|
| Super Admin | Onboarding, structure, jurisdictions, standards posture, settings |
| Process Owner | Composer → draft → publish → resolve SIAIs/incidents/reviews |
| Department Head | Approvals, oversight, function-scoped training |
| Trainer (permission) | Create/operate training for their people |
| Compliance Officer | Audit packs, standards gaps, verification, read-all |
| Staff | My Training — read, acknowledge, assess |
| Platform Admin | Curate standards packs from agent proposals |
| External Auditor (guest) | Scoped, time-limited, read-only |

---

# Part 4 — Phasing

**Decision:** build the full governance/training/audit platform **industry-agnostic from the start.** Defer only the connective-tissue features that don't change the core value.

## Phase 1 — Full Platform (industry-agnostic)
Everything in Part 3 *except* the explicitly deferred items below. This is the product.

**Suggested sprint sequence** (always demoable after Sprint 4, sellable after Sprint 6):

| Sprint | Delivers |
|---|---|
| 1 | Auth + multi-tenant + onboarding + function tree + jurisdictions |
| 2 | Process repository + SOP editor |
| 3 | AI SOP composer + control-point evidence register |
| 4 | SOP approval lifecycle (+ workflow engine foundation) |
| 5 | Incident management + SIAI + system-triggered workflows |
| 6 | Training — acknowledge + assessed + standalone modules |
| 7 | AI agent registry + attestation workflow |
| 8 | Dashboard + notifications + scheduled triggers + Readiness Score |
| 9 | Recurring control records |
| 10 | Audit trail + audit packs + guest auditor access |

## Phase 2 — Intelligence Layer
- Standards library curation tooling (platform side)
- Advanced AI: audit-risk prediction, process-maturity scoring, SLA-breach prediction
- Email notifications + digests
- Access reviews (periodic)
- Sub-national jurisdictions (state / region / district)
- Area-level pipeline flows (link SOPs in sequence)
- Data governance module (requires SOR API access — confirmed per customer)
- Scribe-style process recording (browser capture → auto-SOP)

## Phase 3 — Scale *(explicitly deferred)*
- **Integration framework** (REST, webhooks, CSV/SFTP, MS365/Google/SIS/HR/finance connectors)
- **External public API** (workflow triggers, completions, incident logging, registry reads)
- **Enterprise SSO** (SAML / Entra ID)
- **Multi-region deployment** (data residency: EU / UK / US)

---

## The sentence that ties it together

**Describe your organisation and the markets you serve once; for each process, dump whatever you have and the agent builds a governed SOP, confirms which standards apply across every jurisdiction, maps each control to where its evidence actually lives, and turns the procedure into training that proves competence — while incidents and self-identified issues resolve on a governed path, and an auditor can see, in one place, that what you say matches what you do.**
