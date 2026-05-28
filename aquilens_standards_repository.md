# Aquilens Standards and Regulations Repository

**Version:** 0.1  
**Date created:** 28 May 2026  
**Purpose:** Starter repository for Aquilens standards, regulations, guidance packs, applicability rules, internal audit checks, evidence expectations and source review cadence.

---

## 1. Repository Principle

Aquilens should use a **curated internal standards and regulations repository** as its controlled source of guidance.

Live search should not be used as the main decision engine for customer recommendations, audit scoring or standards alignment. Live search should only support monitoring, research and controlled updates.

Aquilens should not copy full paid standards into the product unless the business has the correct licence. For paid standards, Aquilens should store:

- Standard name
- Version
- Clause or section references where allowed
- Aquilens-created summaries
- Aquilens-created audit checks
- Evidence expectations
- Suggested SOP templates
- Applicability rules
- Review cadence
- Source links
- Change history

Aquilens should always state that its outputs are **guidance, internal audit support and standards alignment support**, not certification or legal advice.

---

## 2. Required Disclaimer

Use this wording wherever Aquilens shows standards alignment, audit results, gap analysis, evidence packs or recommendations.

> Aquilens helps organisations structure SOPs, controls, reviews and evidence against selected standards, regulations and guidance areas. Aquilens does not certify organisations, replace legal advice, or guarantee compliance. Final responsibility for compliance remains with the organisation and its appointed advisers, auditors, regulators or certification bodies.

---

## 3. Review Cadence Definitions

| Cadence | Meaning | When to use |
|---|---|---|
| Event-driven | Review immediately when an official source publishes a change, consultation, amendment, policy statement, new edition or withdrawal notice. | Regulators, high-risk sectors, standards in transition |
| Monthly | Check official source pages every month. | FCA, CQC, MHRA, DfE, Ofsted, ICO, FSA, standards known to be changing |
| Quarterly | Check official source pages every three months. | Stable ISO standards, Ghana public sources, HSE general guidance |
| Annual | Full pack review once per year, even if no source change is detected. | Stable internal packs and mature mappings |
| Pre-audit | Review pack version before a tenant exports an external audit preparation pack. | High-risk or regulated tenants |

---

## 4. Repository Governance

### 4.1 Pack Lifecycle

Each standards or regulation pack should move through the following statuses:

1. **Draft**
2. **Internal review**
3. **Approved**
4. **Published**
5. **Superseded**
6. **Retired**

### 4.2 Pack Owner

Each pack should have:

- Pack owner
- Technical reviewer
- Legal/compliance reviewer where required
- Last reviewed date
- Next review date
- Source links
- Change log
- Impact assessment for tenants

### 4.3 Change Control

When a source changes:

1. Aquilens flags the source update.
2. Admin or subject expert reviews the change.
3. Draft pack update is created.
4. Change impact is mapped to departments, processes, SOPs and evidence checks.
5. Pack is approved internally.
6. New pack version is published.
7. Affected tenants are notified.
8. Tenant decides whether to apply changes.

---

## 5. Core Repository Data Model

Each pack should use this schema.

| Field | Description |
|---|---|
| Pack ID | Unique pack identifier |
| Pack name | Human-readable pack name |
| Pack type | Standard, regulation, guidance, internal control pack |
| Sector | General, education, healthcare, finance, manufacturing, food, social care, software |
| Jurisdiction | Global, UK, Ghana, EU, US |
| Source owner | ISO, FCA, CQC, DfE, MHRA, ICO, HSE, FSA, Ghana DPC, etc. |
| Source URL | Official or preferred source |
| Current source version | Current published version or page status |
| Applicability trigger | When Aquilens should recommend this pack |
| Requirement areas | Key areas covered by the pack |
| Suggested departments | Departments likely to use it |
| Suggested processes | Processes likely to need SOPs |
| Starter SOP templates | SOPs Aquilens should recommend |
| Audit checks | Internal audit questions Aquilens should run |
| Evidence expected | Evidence Aquilens should request |
| Review frequency | Monthly, quarterly, annual, event-driven |
| Risk level | Low, medium, high |
| Legal wording | Disclaimer or special warning |
| Pack status | Draft, approved, published, superseded, retired |

---

## 6. Master Source Review Schedule

| Source / pack | Main source owner | Review frequency | Reason |
|---|---|---:|---|
| Universal SOP Control Pack | Aquilens internal | Quarterly + annual full review | Core product logic used by all tenants |
| ISO 9001 Quality Management Pack | ISO | Monthly while ISO 9001 replacement activity is active, then quarterly | ISO 9001 has a 2024 climate amendment and ISO pages indicate upcoming replacement activity |
| ISO 10013 Documented Information Pack | ISO | Quarterly | Supports controlled documented information and SOP design |
| ISO 19011 Internal Audit Pack | ISO | Monthly until ISO 19011:2026 transition stabilises, then quarterly | ISO page identifies ISO 19011:2018 as withdrawn and replaced by ISO 19011:2026 |
| ISO/IEC 27001 Information Security Pack | ISO/IEC | Quarterly + event-driven | Security standards and controls affect SaaS, finance, schools and healthcare |
| ISO/IEC 27002 Security Controls Pack | ISO/IEC | Quarterly | Supports ISO 27001 control guidance |
| ISO 45001 Health and Safety Pack | ISO + HSE | Quarterly + event-driven | HSE/legal guidance can change independently of ISO |
| ISO 14001 Environmental Pack | ISO | Monthly during ISO 14001:2026 transition, then quarterly | ISO page points organisations to ISO 14001:2026 |
| ISO 13485 Medical Device QMS Pack | ISO + MHRA | Quarterly + event-driven | Medical device QMS and regulatory requirements are high-risk |
| ISO 14971 Medical Device Risk Pack | ISO + MHRA | Quarterly + event-driven | Medical device risk management and lifecycle evidence are high-risk |
| MHRA GMP/GDP Pack | MHRA + EMA where relevant | Monthly + event-driven | Pharma and distribution guidance changes can have direct operational impact |
| UK Medical Devices Pack | MHRA + legislation.gov.uk | Monthly + event-driven | UK medical device reform is active and legally sensitive |
| CQC Health and Social Care Pack | CQC | Monthly + event-driven | CQC guidance and inspection approach can change |
| FCA Systems and Controls Pack | FCA Handbook | Monthly + event-driven | FCA Handbook and policy statements change frequently |
| FCA Operational Resilience Pack | FCA + PRA where relevant | Monthly + event-driven | Important business service mapping and scenario testing remain active areas |
| FCA Consumer Duty Pack | FCA | Monthly + event-driven | FCA continues to publish updates, reviews and good/poor practice |
| UK Data Protection Pack | ICO + legislation.gov.uk | Monthly + event-driven | ICO guidance and data protection audit expectations evolve |
| Ghana Data Protection Pack | Ghana Data Protection Commission + Act 843 | Quarterly + event-driven | Relevant to Ghana tenants handling personal data |
| UK School Safeguarding Pack | DfE | Monthly, weekly during July to September | KCSIE updates commonly apply from September |
| Ofsted / UK School Inspection Pack | Ofsted / GOV.UK | Monthly + event-driven | Ofsted framework and toolkits are subject to active change |
| Ghana School Safety / Child Protection Pack | MoE/GES/MoGCSP and partner sources | Quarterly + event-driven | Official public source availability may vary, so updates need human review |
| Food Safety / HACCP Pack | Food Standards Agency | Monthly + event-driven | Food safety guidance and HACCP resources are public and operationally important |
| ISO 22000 Food Safety Pack | ISO | Monthly while replacement activity is active, then quarterly | ISO page indicates expected replacement activity |
| BRCGS Food Safety Pack | BRCGS | Quarterly + event-driven | Certification scheme updates can affect food manufacturers |
| ISO 15189 Medical Laboratory Pack | ISO + UKAS where relevant | Quarterly + event-driven | Medical lab quality and competence requirements are high-risk |
| ISO/IEC 17025 Testing and Calibration Lab Pack | ISO/IEC + UKAS where relevant | Quarterly + event-driven | Lab accreditation requirements rely heavily on evidence and competence |

---

# 7. Standards and Regulations Packs

---

## PACK-AQL-000: Universal SOP Control Pack

| Field | Detail |
|---|---|
| Pack type | Internal Aquilens control pack |
| Sector | All |
| Jurisdiction | Global |
| Applicability trigger | Applied to every tenant by default |
| Review frequency | Quarterly + annual full review |
| Risk level | Medium |
| Source | Aquilens internal product design, informed by common management system expectations |

### Purpose

This pack defines the minimum SOP control expectations for every tenant, regardless of industry.

### Requirement Areas

- SOP ownership
- Version control
- Approval workflow
- Review cycle
- Change log
- Evidence links
- Staff acknowledgement
- Audit trail
- Retirement and archive
- Corrective actions

### Suggested Departments

- All departments

### Starter SOP Templates

- Document Control SOP
- SOP Creation and Approval SOP
- SOP Review SOP
- Staff Acknowledgement SOP
- Internal Audit SOP
- Corrective Action SOP

### Starter Audit Checks

- Does every SOP have a named owner?
- Does every SOP have a unique ID?
- Does every SOP have a version number?
- Is there an approved current version?
- Is the review date set and not overdue?
- Is there a change log?
- Are required staff acknowledgements complete?
- Are retired SOPs archived and protected from unintended use?
- Is evidence linked to the process or SOP?
- Are findings converted to corrective actions where required?

### Evidence Expected

- SOP register
- Version history
- Approval records
- Review logs
- Acknowledgement records
- Evidence attachments
- Audit findings
- Corrective action records

---

## PACK-ISO-9001: ISO 9001 Quality Management Pack

| Field | Detail |
|---|---|
| Pack type | ISO management system guidance pack |
| Sector | General business, manufacturing, services, healthcare support, education operations, logistics |
| Jurisdiction | Global |
| Applicability trigger | Tenant selects ISO 9001, quality management, process control, customer complaints, audit readiness or certification preparation |
| Review frequency | Monthly while ISO 9001 replacement activity is active, then quarterly |
| Risk level | Medium |
| Primary sources | https://www.iso.org/standard/62085.html, https://www.iso.org/standard/88431.html |

### Source Notes

- ISO 9001 defines requirements for a quality management system.
- ISO 9001:2015 has Amendment 1:2024 for climate action changes.
- ISO pages indicate replacement activity for ISO 9001.

### Requirement Areas

- Context of the organisation
- Interested parties
- Leadership and accountability
- Process approach
- Risk and opportunities
- Competence and awareness
- Documented information
- Operational planning and control
- Customer requirements
- Nonconformity and corrective action
- Internal audit
- Management review
- Continual improvement
- Climate change relevance assessment where applicable

### Suggested Departments

- Quality
- Operations
- Customer Service
- Compliance
- HR and Training
- Procurement
- Management

### Starter SOP Templates

- Quality Management SOP
- Document Control SOP
- Customer Complaint Handling SOP
- Nonconformance SOP
- Corrective Action SOP
- Internal Audit SOP
- Management Review SOP
- Supplier Evaluation SOP
- Process Change Control SOP

### Starter Audit Checks

- Are quality-critical processes documented?
- Are SOPs approved, versioned and reviewed?
- Are process owners assigned?
- Are customer complaints recorded and reviewed?
- Are nonconformities logged and investigated?
- Are corrective actions tracked to closure?
- Is there evidence of internal audit activity?
- Is there evidence of management review?
- Has the organisation assessed whether climate change is relevant to the management system?
- Are staff competent for the processes they perform?

### Evidence Expected

- SOP register
- Quality policy or quality objectives
- Complaint register
- Nonconformance log
- Corrective action register
- Internal audit report
- Management review minutes
- Training records
- Supplier assessment records
- Climate relevance assessment where applicable

---

## PACK-ISO-10013: Documented Information Guidance Pack

| Field | Detail |
|---|---|
| Pack type | ISO guidance pack |
| Sector | All |
| Jurisdiction | Global |
| Applicability trigger | Tenant needs SOP/document-control support or has ISO 9001/14001/45001-style management systems |
| Review frequency | Quarterly |
| Risk level | Medium |
| Primary source | https://www.iso.org/standard/75736.html |

### Source Notes

ISO 10013 gives guidance for developing and maintaining documented information to support an effective quality management system. ISO notes it can also support other management systems such as environmental or occupational health and safety management systems.

### Requirement Areas

- Documented information structure
- Documented information maintenance
- Document identification
- Document review and approval
- Retained information
- Document availability
- Protection and access
- Document lifecycle

### Suggested Departments

- Quality
- Compliance
- Operations
- HR
- HSE
- IT
- Governance

### Starter SOP Templates

- Documented Information SOP
- Controlled Document Lifecycle SOP
- Record Retention SOP
- Document Review SOP
- Document Archive SOP

### Starter Audit Checks

- Are documents clearly identified?
- Are controlled documents available where needed?
- Are outdated documents prevented from unintended use?
- Are records retained and retrievable?
- Are review and approval responsibilities clear?
- Is document access controlled?

### Evidence Expected

- Controlled document register
- Record retention schedule
- Review logs
- Access control logs
- Archived document records

---

## PACK-ISO-19011: Internal Audit Pack

| Field | Detail |
|---|---|
| Pack type | ISO audit guidance pack |
| Sector | All |
| Jurisdiction | Global |
| Applicability trigger | Tenant wants internal audits, audit planning or audit evidence packs |
| Review frequency | Monthly until ISO 19011:2026 transition stabilises, then quarterly |
| Risk level | Medium |
| Primary source | https://www.iso.org/standard/70017.html |

### Source Notes

ISO identifies ISO 19011:2018 as withdrawn and replaced by ISO 19011:2026. Aquilens should review and align this pack to the current edition before publishing customer-facing audit guidance.

### Requirement Areas

- Audit programme
- Audit planning
- Audit criteria
- Audit scope
- Audit evidence
- Audit findings
- Auditor competence
- Audit reporting
- Follow-up actions

### Suggested Departments

- Quality
- Compliance
- Internal Audit
- Operations
- HSE
- IT

### Starter SOP Templates

- Internal Audit SOP
- Audit Planning SOP
- Audit Evidence Review SOP
- Audit Finding Classification SOP
- Corrective Action Follow-Up SOP

### Starter Audit Checks

- Is audit scope defined?
- Are audit criteria selected?
- Are audit findings supported by evidence?
- Are findings classified by severity?
- Are corrective actions assigned?
- Is audit follow-up tracked?
- Are audit reports approved and retained?

### Evidence Expected

- Audit plan
- Audit checklist
- Evidence reviewed
- Audit findings
- Audit report
- Corrective action tracker
- Follow-up records

---

## PACK-ISO-27001: Information Security Management Pack

| Field | Detail |
|---|---|
| Pack type | ISO/IEC management system pack |
| Sector | Software, SaaS, finance, healthcare, education, professional services, any tenant handling sensitive data |
| Jurisdiction | Global |
| Applicability trigger | Tenant handles sensitive data, selects ISO 27001, operates IT systems, SaaS, finance, healthcare, school data or customer data |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary sources | https://www.iso.org/standard/27001, https://www.iso.org/standard/75652.html |

### Source Notes

ISO/IEC 27001 defines requirements for an information security management system. ISO/IEC 27002 provides information security controls guidance.

### Requirement Areas

- Information security governance
- Information security risk assessment
- Risk treatment
- Access control
- Asset management
- Supplier security
- Incident management
- Business continuity and resilience
- Backup and recovery
- Logging and monitoring
- Human resource security
- Change management
- Security awareness
- Statement of applicability where relevant

### Suggested Departments

- IT
- Information Security
- Data Protection
- Compliance
- HR
- Procurement
- Operations

### Starter SOP Templates

- Access Control SOP
- User Access Review SOP
- Information Security Incident Response SOP
- Backup and Restore SOP
- Supplier Security Review SOP
- Asset Management SOP
- Acceptable Use SOP
- Change Management SOP
- Security Awareness SOP

### Starter Audit Checks

- Are access rights approved and reviewed?
- Are joiner, mover and leaver processes documented?
- Is there an incident response SOP?
- Are backups tested?
- Are suppliers reviewed for security risk?
- Are information assets recorded?
- Are security roles assigned?
- Are staff trained on information security?
- Are changes assessed before deployment?
- Is there evidence of risk assessment and treatment?

### Evidence Expected

- Access review records
- Incident logs
- Backup test records
- Supplier due diligence records
- Asset register
- Security training records
- Risk register
- Change approval records
- Policy acknowledgement records

---

## PACK-ISO-45001: Health and Safety Pack

| Field | Detail |
|---|---|
| Pack type | ISO management system and legal guidance pack |
| Sector | Manufacturing, schools, care, healthcare, logistics, facilities, offices |
| Jurisdiction | Global for ISO, UK-specific HSE guidance where selected |
| Applicability trigger | Tenant has physical sites, staff safety obligations, HSE department, manufacturing, care, education, logistics or field operations |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary sources | https://www.iso.org/standard/63787.html, https://www.iso.org/home/insights-news/resources/iso-45001-explained-what-it-is.html, https://www.hse.gov.uk/legislation/hswa.htm, https://www.hse.gov.uk/risk/ |

### Source Notes

ISO 45001 specifies requirements for an occupational health and safety management system. HSE identifies the Health and Safety at Work etc Act 1974 as the primary legislation covering occupational health and safety in Great Britain and provides guidance on risk assessment.

### Requirement Areas

- Health and safety responsibilities
- Hazard identification
- Risk assessment
- Safe systems of work
- Worker consultation
- Incident reporting
- Near-miss reporting
- Emergency response
- PPE
- Training and competence
- Contractor control
- Corrective actions
- Legal obligation review

### Suggested Departments

- HSE
- Operations
- Facilities
- HR
- Maintenance
- Site Management

### Starter SOP Templates

- Risk Assessment SOP
- Incident Reporting SOP
- Near Miss Reporting SOP
- Emergency Response SOP
- PPE SOP
- Contractor Safety SOP
- Workplace Inspection SOP
- Fire Safety Procedure
- Manual Handling SOP

### Starter Audit Checks

- Are risk assessments completed and reviewed?
- Are hazards identified and controlled?
- Are incidents and near misses recorded?
- Are corrective actions tracked?
- Are emergency procedures documented and tested?
- Are workers trained on relevant safety procedures?
- Are contractors controlled?
- Are safety inspections performed?
- Are legal responsibilities assigned?

### Evidence Expected

- Risk assessments
- Incident logs
- Near-miss logs
- Training records
- Inspection checklists
- Emergency drill records
- PPE issue records
- Corrective action records
- Contractor induction records

---

## PACK-ISO-14001: Environmental Management Pack

| Field | Detail |
|---|---|
| Pack type | ISO management system pack |
| Sector | Manufacturing, logistics, facilities, food, laboratories, sites with environmental impact |
| Jurisdiction | Global |
| Applicability trigger | Tenant selects environmental management, has waste/emissions/discharge responsibilities, manufacturing, logistics or facilities operations |
| Review frequency | Monthly during ISO 14001:2026 transition, then quarterly |
| Risk level | Medium to high |
| Primary source | https://www.iso.org/standard/60857.html |

### Source Notes

ISO currently points organisations to ISO 14001:2026 as the latest agreed requirements for environmental management systems. Aquilens should treat ISO 14001 content as transition-sensitive.

### Requirement Areas

- Environmental aspects and impacts
- Compliance obligations
- Waste management
- Emissions and discharge control
- Emergency preparedness
- Environmental objectives
- Operational controls
- Monitoring and measurement
- Environmental incidents
- Corrective actions
- Management review

### Suggested Departments

- Environment
- HSE
- Operations
- Facilities
- Maintenance
- Logistics

### Starter SOP Templates

- Environmental Aspects and Impacts SOP
- Waste Management SOP
- Environmental Incident SOP
- Spill Response SOP
- Emissions Monitoring SOP
- Environmental Compliance Review SOP

### Starter Audit Checks

- Are environmental aspects identified?
- Are legal and other obligations tracked?
- Are waste procedures documented?
- Are incidents recorded and investigated?
- Are emergency procedures defined?
- Are environmental objectives tracked?
- Are monitoring records retained?

### Evidence Expected

- Environmental aspects register
- Waste transfer notes
- Incident logs
- Spill response records
- Monitoring data
- Legal obligation register
- Corrective action records

---

## PACK-ISO-13485: Medical Device Quality Management Pack

| Field | Detail |
|---|---|
| Pack type | ISO medical device QMS pack |
| Sector | Medical devices, diagnostics, medical software, contract manufacturers, packaging/assembly providers |
| Jurisdiction | Global, with local regulatory overlay |
| Applicability trigger | Tenant manufactures, supplies, assembles, packages, services or supports medical devices or diagnostics |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary sources | https://www.iso.org/standard/59752.html, https://www.iso.org/iso-13485-medical-devices.html |

### Source Notes

ISO 13485 sets out requirements for a quality management system specific to the medical devices industry. ISO states ISO 13485:2016 was reviewed and confirmed in 2025 and remains current.

### Requirement Areas

- Medical device QMS
- Regulatory requirements
- Document and record control
- Design and development controls where applicable
- Purchasing controls
- Production and service provision
- Traceability
- Sterility/cleanliness controls where applicable
- Complaint handling
- Adverse event or vigilance processes where applicable
- Corrective and preventive action
- Validation and verification
- Training and competence

### Suggested Departments

- Quality
- Regulatory Affairs
- Production
- Operations
- Supply Chain
- Complaints
- Engineering
- Training

### Starter SOP Templates

- Medical Device Document Control SOP
- Device Master Record SOP
- Complaint Handling SOP
- CAPA SOP
- Supplier Qualification SOP
- Production Control SOP
- Traceability SOP
- Change Control SOP
- Training and Competence SOP
- Validation SOP

### Starter Audit Checks

- Are regulatory requirements identified?
- Are device-related records controlled?
- Is traceability maintained where required?
- Are complaints logged and assessed?
- Are suppliers qualified and monitored?
- Are changes controlled?
- Is training evidence available?
- Are CAPAs linked to root cause and effectiveness checks?
- Are validation records retained where applicable?

### Evidence Expected

- QMS SOPs
- Device records
- Traceability records
- Complaint logs
- CAPA records
- Supplier approvals
- Change control records
- Training records
- Validation/verification evidence

---

## PACK-ISO-14971: Medical Device Risk Management Pack

| Field | Detail |
|---|---|
| Pack type | ISO medical device risk pack |
| Sector | Medical devices, diagnostics, software as a medical device |
| Jurisdiction | Global, with local regulatory overlay |
| Applicability trigger | Tenant develops, manufactures or supports medical devices or medical device software |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary source | https://www.iso.org/standard/72704.html |

### Source Notes

ISO 14971:2019 specifies terminology, principles and a process for risk management of medical devices, including software as a medical device and in vitro diagnostic medical devices. ISO states it was reviewed and confirmed in 2025.

### Requirement Areas

- Risk management planning
- Hazard identification
- Risk estimation
- Risk evaluation
- Risk control
- Benefit-risk evaluation
- Residual risk review
- Production and post-production monitoring
- Risk management file

### Suggested Departments

- Quality
- Regulatory Affairs
- Product
- Engineering
- Clinical/Technical
- Complaints
- Post-market Surveillance

### Starter SOP Templates

- Medical Device Risk Management SOP
- Hazard Analysis SOP
- Risk Control SOP
- Residual Risk Review SOP
- Post-Market Risk Monitoring SOP
- Risk Management File SOP

### Starter Audit Checks

- Is there a risk management plan?
- Are hazards identified?
- Are risks estimated and evaluated?
- Are risk controls documented?
- Is residual risk reviewed?
- Is post-market information fed back into risk management?
- Is the risk management file complete and controlled?

### Evidence Expected

- Risk management plan
- Hazard analysis
- Risk evaluation records
- Risk control evidence
- Residual risk review
- Post-market surveillance records
- Complaint risk review
- Risk management file

---

## PACK-MHRA-GMP-GDP: UK GMP and GDP Pack

| Field | Detail |
|---|---|
| Pack type | UK regulatory guidance pack |
| Sector | Pharma, medicines, wholesalers, distributors, contract manufacturers |
| Jurisdiction | UK, with EU/EMA reference where relevant |
| Applicability trigger | Tenant manufactures, stores, distributes or handles medicines or medicinal products |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.gov.uk/guidance/good-manufacturing-practice-and-good-distribution-practice, https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/compliance-post-authorisation/good-distribution-practice |

### Source Notes

MHRA publishes UK guidance on Good Manufacturing Practice and Good Distribution Practice. EMA publishes GDP guidance and Q&A for human and veterinary medicines.

### Requirement Areas

- Quality system
- Document control
- Batch and distribution records
- Training
- Deviation management
- CAPA
- Change control
- Supplier and customer qualification
- Storage and transport
- Temperature control
- Recall procedures
- Self-inspection/internal audit

### Suggested Departments

- Quality
- Production
- Warehouse
- Distribution
- Regulatory
- Supply Chain
- Training

### Starter SOP Templates

- GMP Document Control SOP
- Deviation SOP
- CAPA SOP
- Change Control SOP
- Batch Record Review SOP
- Temperature Monitoring SOP
- Product Recall SOP
- Supplier Qualification SOP
- Self-Inspection SOP

### Starter Audit Checks

- Are GMP/GDP procedures controlled?
- Are deviations logged and investigated?
- Are CAPAs tracked to closure?
- Are training records complete?
- Are storage and transport conditions monitored?
- Is recall procedure documented and tested?
- Are suppliers/customers qualified?
- Are self-inspections performed?

### Evidence Expected

- Controlled SOPs
- Batch or distribution records
- Deviation logs
- CAPA records
- Training records
- Temperature logs
- Recall test records
- Supplier qualification records
- Self-inspection reports

---

## PACK-UK-MEDICAL-DEVICES: UK Medical Devices Regulatory Pack

| Field | Detail |
|---|---|
| Pack type | UK regulatory pack |
| Sector | Medical devices, diagnostics, software as a medical device |
| Jurisdiction | UK |
| Applicability trigger | Tenant places medical devices on the GB market, acts as manufacturer, UK responsible person, distributor or supplier |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.gov.uk/guidance/regulating-medical-devices-in-the-uk, https://www.legislation.gov.uk/uksi/2002/618/contents |

### Source Notes

MHRA regulates medical devices in the UK and performs market surveillance. The Medical Devices Regulations 2002 are the core UK legislation source, subject to changes and transitional arrangements.

### Requirement Areas

- Device registration
- UK responsible person where applicable
- Conformity assessment
- Post-market surveillance
- Vigilance reporting
- Technical documentation
- Labelling and instructions
- Quality management
- Corrective actions and field safety actions

### Suggested Departments

- Regulatory Affairs
- Quality
- Product
- Engineering
- Complaints
- Post-Market Surveillance

### Starter SOP Templates

- UK Medical Device Registration SOP
- Post-Market Surveillance SOP
- Vigilance Reporting SOP
- Field Safety Corrective Action SOP
- Technical Documentation Control SOP
- Labelling Review SOP

### Starter Audit Checks

- Are responsibilities for UK medical device compliance assigned?
- Is registration status recorded?
- Is technical documentation controlled?
- Are complaints and vigilance events reviewed?
- Are post-market surveillance activities documented?
- Are field safety corrective actions controlled?

### Evidence Expected

- Registration records
- Technical file index
- PMS plan and reports
- Complaint records
- Vigilance assessment records
- FSCA records
- Labelling approval records

---

## PACK-CQC: UK Health and Social Care Pack

| Field | Detail |
|---|---|
| Pack type | UK regulatory guidance pack |
| Sector | Health and social care |
| Jurisdiction | England |
| Applicability trigger | Tenant is a care provider, healthcare provider, domiciliary care provider, clinic or regulated care service |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.cqc.org.uk/guidance-regulation/providers/regulations-service-providers-and-managers, https://www.cqc.org.uk/about-us/fundamental-standards |

### Source Notes

CQC guidance describes how providers and managers can meet regulations, including fundamental standards below which care must not fall.

### Requirement Areas

- Person-centred care
- Dignity and respect
- Consent
- Safe care and treatment
- Safeguarding
- Food and nutrition where applicable
- Premises and equipment
- Complaints
- Good governance
- Staffing
- Fit and proper persons
- Duty of candour
- Display of ratings where applicable

### Suggested Departments

- Care Operations
- Clinical Operations
- Safeguarding
- Quality
- HR and Training
- Complaints
- Governance

### Starter SOP Templates

- Safeguarding SOP
- Medication Management SOP
- Incident Reporting SOP
- Care Planning SOP
- Complaint Handling SOP
- Staff Recruitment SOP
- Staff Training and Competence SOP
- Duty of Candour SOP
- Quality Assurance SOP

### Starter Audit Checks

- Are care and safeguarding SOPs documented?
- Are incidents and safeguarding concerns recorded?
- Are complaints logged and responded to?
- Is staff training evidence available?
- Are care plans reviewed?
- Are governance checks performed?
- Is duty of candour process documented?
- Are premises/equipment checks recorded where applicable?

### Evidence Expected

- Safeguarding records
- Incident logs
- Complaint register
- Training records
- Care plan review records
- Medication records
- Governance meeting minutes
- Audit findings
- Corrective action records

---

## PACK-FCA-SYSC: FCA Systems and Controls Pack

| Field | Detail |
|---|---|
| Pack type | UK financial services regulatory pack |
| Sector | Financial services, fintech, lending, payments, insurance, investment services |
| Jurisdiction | UK |
| Applicability trigger | Tenant is FCA-regulated, supports FCA-regulated activity or selects financial services controls |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary source | https://handbook.fca.org.uk/handbook?entityId=sysc |

### Source Notes

FCA SYSC covers senior management arrangements, systems and controls. Aquilens should use the FCA Handbook as the primary source for current rules and guidance.

### Requirement Areas

- Governance and responsibilities
- Systems and controls
- Risk management
- Outsourcing and third-party controls
- Conflicts of interest
- Record keeping
- Compliance monitoring
- Operational controls
- Complaints interface where relevant
- Senior management accountability where relevant

### Suggested Departments

- Compliance
- Risk
- Operations
- Governance
- Customer Operations
- IT
- Outsourcing/Vendor Management

### Starter SOP Templates

- Compliance Monitoring SOP
- Governance Responsibilities SOP
- Outsourcing Review SOP
- Conflicts of Interest SOP
- Operational Control SOP
- Record Keeping SOP
- Breach Escalation SOP

### Starter Audit Checks

- Are responsibilities documented?
- Are key controls defined and owned?
- Are outsourcing arrangements recorded and reviewed?
- Are conflicts identified and managed?
- Are breaches escalated?
- Are compliance monitoring activities evidenced?
- Are records retained?

### Evidence Expected

- Responsibility matrix
- Control register
- Outsourcing register
- Compliance monitoring plan
- Monitoring evidence
- Breach logs
- Meeting minutes
- Corrective actions

---

## PACK-FCA-OPSRES: FCA Operational Resilience Pack

| Field | Detail |
|---|---|
| Pack type | UK financial services regulatory pack |
| Sector | Financial services and critical third-party support functions |
| Jurisdiction | UK |
| Applicability trigger | Tenant is FCA/PRA-regulated, provides important business services, or supports operational resilience processes |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience, https://www.fca.org.uk/publications/good-and-poor-practice/operational-resilience-insights-observations-one-year |

### Source Notes

FCA has published operational resilience rules and later observations. FCA notes firms must develop and maintain testing plans to show they can remain within impact tolerances for important business services through severe but plausible disruptions.

### Requirement Areas

- Important business services
- Impact tolerances
- Mapping people, process, technology, facilities and third parties
- Scenario testing
- Lessons learned
- Self-assessment
- Governance
- Remediation plans

### Suggested Departments

- Operational Resilience
- Risk
- Technology
- Operations
- Vendor Management
- Compliance
- Business Continuity

### Starter SOP Templates

- Important Business Service Identification SOP
- Impact Tolerance SOP
- Service Mapping SOP
- Scenario Testing SOP
- Lessons Learned SOP
- Operational Resilience Self-Assessment SOP

### Starter Audit Checks

- Are important business services identified?
- Are impact tolerances defined?
- Are service maps documented?
- Are third-party dependencies mapped?
- Are scenario tests performed?
- Are lessons learned documented?
- Are remediation actions tracked?
- Is self-assessment evidence available?

### Evidence Expected

- IBS register
- Impact tolerance records
- Service maps
- Scenario test plans
- Test results
- Lessons learned
- Remediation tracker
- Governance minutes

---

## PACK-FCA-CONSUMER-DUTY: FCA Consumer Duty Pack

| Field | Detail |
|---|---|
| Pack type | UK financial services regulatory pack |
| Sector | Retail financial services |
| Jurisdiction | UK |
| Applicability trigger | Tenant provides or supports retail financial products or services |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.fca.org.uk/firms/consumer-duty, https://www.fca.org.uk/publications/policy-statements/ps22-9-new-consumer-duty, https://www.fca.org.uk/publication/finalised-guidance/fg22-5.pdf |

### Source Notes

FCA says the Consumer Duty sets high standards of consumer protection across financial services and requires firms to put customers’ needs first.

### Requirement Areas

- Customer outcomes
- Products and services
- Price and value
- Consumer understanding
- Consumer support
- Vulnerable customers
- Monitoring and MI
- Governance and accountability
- Remediation

### Suggested Departments

- Product
- Customer Operations
- Compliance
- Complaints
- Marketing
- Risk
- Governance

### Starter SOP Templates

- Customer Outcome Monitoring SOP
- Product Review SOP
- Fair Value Assessment SOP
- Customer Communications Review SOP
- Vulnerable Customer SOP
- Consumer Support SOP
- Remediation SOP

### Starter Audit Checks

- Are customer outcomes defined and monitored?
- Are product reviews evidenced?
- Are communications reviewed for customer understanding?
- Are support processes documented?
- Are vulnerable customer processes documented?
- Are issues escalated and remediated?
- Is management information reviewed?

### Evidence Expected

- Product review records
- Fair value assessments
- Customer communication approvals
- Vulnerable customer records
- Complaints analysis
- Outcome MI
- Governance minutes
- Remediation records

---

## PACK-UK-DP: UK Data Protection Pack

| Field | Detail |
|---|---|
| Pack type | UK legal and regulatory guidance pack |
| Sector | All tenants handling personal data |
| Jurisdiction | UK |
| Applicability trigger | Tenant processes personal data of UK data subjects or operates in the UK |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.gov.uk/data-protection, https://www.legislation.gov.uk/ukpga/2018/12/contents, https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/, https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/ |

### Source Notes

GOV.UK states UK data protection is governed by the UK GDPR and Data Protection Act 2018. ICO provides a data protection audit framework to help organisations assess their own compliance with key requirements.

### Requirement Areas

- Accountability and governance
- Lawful basis
- Privacy notices
- Data subject rights
- Records of processing
- Data protection by design and default
- DPIAs
- Data sharing
- Processor contracts
- Personal data breaches
- Retention and disposal
- Training and awareness

### Suggested Departments

- Data Protection
- IT
- HR
- Customer Operations
- Compliance
- Registry/Admissions
- Finance

### Starter SOP Templates

- Data Protection Governance SOP
- Subject Access Request SOP
- Data Breach Response SOP
- DPIA SOP
- Data Retention SOP
- Data Sharing SOP
- Privacy Notice Review SOP
- Processor Due Diligence SOP

### Starter Audit Checks

- Are data protection roles assigned?
- Are records of processing maintained?
- Are privacy notices controlled?
- Are data subject rights processes documented?
- Is breach response documented and tested?
- Are retention schedules defined?
- Are processors reviewed?
- Are staff trained?

### Evidence Expected

- ROPA
- Privacy notices
- SAR logs
- DPIAs
- Breach logs
- Retention schedule
- Data sharing agreements
- Processor contracts
- Training records

---

## PACK-GH-DP: Ghana Data Protection Pack

| Field | Detail |
|---|---|
| Pack type | Ghana legal and regulatory guidance pack |
| Sector | All Ghana tenants handling personal data |
| Jurisdiction | Ghana |
| Applicability trigger | Tenant operates in Ghana or processes personal data in Ghana |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary sources | https://dataprotection.org.gh/, https://nita.gov.gh/wp-content/uploads/2017/12/Data-Protection-Act-2012-Act-843.pdf |

### Source Notes

The Ghana Data Protection Commission states it was established under the Data Protection Act 2012, Act 843, and is responsible for enforcing Ghana’s data protection and privacy laws.

### Requirement Areas

- Data protection governance
- Lawful processing
- Data subject rights
- Data controller responsibilities
- Registration where applicable
- Data security
- Retention
- Data sharing
- Breach handling
- Staff awareness

### Suggested Departments

- IT
- Registry/Admissions
- HR
- Finance
- Customer Operations
- Compliance

### Starter SOP Templates

- Ghana Data Protection Governance SOP
- Data Subject Request SOP
- Personal Data Handling SOP
- Data Retention SOP
- Data Sharing SOP
- Data Breach Response SOP

### Starter Audit Checks

- Are data protection responsibilities assigned?
- Are personal data handling procedures documented?
- Are data subject requests recorded?
- Are retention periods defined?
- Are staff trained?
- Are security controls documented?
- Is registration status reviewed where applicable?

### Evidence Expected

- Data protection policy
- Registration evidence where applicable
- Data request logs
- Breach logs
- Retention schedule
- Training records
- Access control records

---

## PACK-UK-SCHOOL-SAFEGUARDING: UK School Safeguarding Pack

| Field | Detail |
|---|---|
| Pack type | UK statutory guidance pack |
| Sector | Schools and colleges |
| Jurisdiction | England |
| Applicability trigger | Tenant is a school, college, academy, independent school or education provider in England |
| Review frequency | Monthly, weekly during July to September + event-driven |
| Risk level | High |
| Primary sources | https://www.gov.uk/government/publications/keeping-children-safe-in-education--2, https://assets.publishing.service.gov.uk/media/68add931969253904d155860/Keeping_children_safe_in_education_from_1_September_2025.pdf |

### Source Notes

Keeping Children Safe in Education sets out legal duties to safeguard and promote the welfare of children and young people under 18 in schools and colleges. GOV.UK identifies it as guidance for headteachers, teachers, staff, governing bodies, proprietors and management committees.

### Requirement Areas

- Whole-school safeguarding approach
- Designated safeguarding lead
- Staff training
- Child protection policy
- Safeguarding concern reporting
- Referral pathways
- Online safety
- Filtering and monitoring
- Low-level concerns
- Allegations against adults
- Safer recruitment
- Information sharing
- Emergency contacts
- Child protection records

### Suggested Departments

- Safeguarding
- HR
- IT
- Academic Operations
- Attendance
- Governance
- Pastoral Care

### Starter SOP Templates

- Safeguarding Concern Reporting SOP
- Child Protection Referral SOP
- Low-Level Concerns SOP
- Allegations Against Staff SOP
- Safer Recruitment SOP
- Online Safety SOP
- Filtering and Monitoring Review SOP
- Child Protection Records Transfer SOP

### Starter Audit Checks

- Is a designated safeguarding lead assigned?
- Are safeguarding procedures clear and accessible?
- Are staff trained and refreshed at required intervals?
- Are concerns recorded and escalated?
- Are online safety controls reviewed?
- Are safer recruitment procedures documented?
- Are low-level concerns managed and recorded?
- Are child protection records controlled and transferred securely?

### Evidence Expected

- Safeguarding policy
- DSL appointment record
- Staff training logs
- Concern records
- Referral records
- Online safety reviews
- Recruitment checklists
- Low-level concern logs
- Governing body review minutes

---

## PACK-UK-OFSTED: UK Education Inspection Pack

| Field | Detail |
|---|---|
| Pack type | UK inspection guidance pack |
| Sector | Education |
| Jurisdiction | England |
| Applicability trigger | Tenant is inspected by Ofsted or wants inspection preparation |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.gov.uk/government/publications/education-inspection-framework/education-inspection-framework-for-use-from-november-2025, https://www.gov.uk/government/publications/school-inspection-toolkit-operating-guide-and-information |

### Source Notes

The education inspection framework sets out how Ofsted inspects registered early years settings, maintained schools, academies, non-association independent schools and further education and skills provision in England. The school inspection toolkit replaced the school inspection handbook from 10 November 2025.

### Requirement Areas

- Leadership and governance
- Quality of education
- Behaviour and attitudes
- Attendance
- Safeguarding
- Personal development
- Inclusion and SEND where applicable
- Staff development
- Evidence preparation
- Inspection readiness

### Suggested Departments

- Academic Operations
- Safeguarding
- Attendance
- HR
- Governance
- SEND/Inclusion
- Pastoral Care

### Starter SOP Templates

- Inspection Evidence Preparation SOP
- Attendance Monitoring SOP
- Behaviour Incident SOP
- Curriculum Review SOP
- Staff Development SOP
- Safeguarding Evidence Review SOP

### Starter Audit Checks

- Are key policies controlled and current?
- Is safeguarding evidence current?
- Are attendance processes documented?
- Are behaviour records reviewed?
- Are curriculum review records retained?
- Are governance minutes available?
- Are staff development records retained?

### Evidence Expected

- Policies
- Inspection evidence index
- Attendance records
- Behaviour logs
- Curriculum plans
- Safeguarding records
- Governance minutes
- Staff training records

---

## PACK-GH-SCHOOL-SAFETY: Ghana School Safety and Child Protection Pack

| Field | Detail |
|---|---|
| Pack type | Ghana education and child protection guidance pack |
| Sector | Schools |
| Jurisdiction | Ghana |
| Applicability trigger | Tenant is a school in Ghana, supports children, or selects safeguarding/school safety guidance |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary sources | https://www.mogcsp.gov.gh/?mdocs-file=676, https://www.safetolearncoalition.org/media/1706/file/Ghana-STL-Progress-2019-2023.pdf |

### Source Notes

Ghana’s Child and Family Welfare Policy was developed by the Government of Ghana through the Ministry of Gender, Children and Social Protection. Safe to Learn reporting references a Safe School Resource Pack published by MoE-GES and partners in 2018, including teachers’ handbook, training manual, peer-to-peer materials and school-based violence reporting materials. Because public source availability may vary, this pack should require human review before release to tenants.

### Requirement Areas

- Child protection
- Safe school environment
- Positive discipline
- Reporting mechanisms
- Referral pathways
- Staff conduct
- Safe recruitment
- Student welfare
- Violence prevention
- Online safety where applicable
- Parent and community engagement

### Suggested Departments

- Safeguarding
- Academic Operations
- HR
- Pastoral Care
- Parent Communication
- Governance

### Starter SOP Templates

- Child Protection Concern Reporting SOP
- Safe School Incident Reporting SOP
- Staff Code of Conduct SOP
- Positive Discipline SOP
- Parent Escalation SOP
- Student Welfare Referral SOP
- Visitor Management SOP

### Starter Audit Checks

- Is there a child protection reporting process?
- Are reporting pathways known to staff?
- Are staff conduct expectations documented?
- Are incidents recorded and reviewed?
- Are parents/guardians contacted where appropriate?
- Are referral pathways defined?
- Are staff trained on child protection and safe school procedures?

### Evidence Expected

- Child protection policy
- Incident logs
- Referral records
- Staff code of conduct acknowledgements
- Training records
- Parent communication logs
- Visitor logs
- Governance review minutes

---

## PACK-FOOD-HACCP: Food Safety and HACCP Pack

| Field | Detail |
|---|---|
| Pack type | UK food safety guidance pack |
| Sector | Food, hospitality, catering, food manufacturing, schools with catering |
| Jurisdiction | UK |
| Applicability trigger | Tenant prepares, stores, sells or distributes food |
| Review frequency | Monthly + event-driven |
| Risk level | High |
| Primary sources | https://www.food.gov.uk/business-guidance/hazard-analysis-and-critical-control-point-haccp, https://www.food.gov.uk/business-guidance/safer-food-better-business-sfbb, https://www.gov.uk/food-safety-hazard-analysis |

### Source Notes

Food Standards Agency guidance says HACCP is a way of managing food safety hazards and that food safety management procedures should be based on HACCP principles. GOV.UK says food businesses must have a plan based on HACCP principles.

### Requirement Areas

- Hazard analysis
- Critical control points
- Monitoring
- Corrective action
- Verification
- Record keeping
- Hygiene
- Temperature control
- Allergen control
- Cleaning
- Pest control
- Traceability and recall

### Suggested Departments

- Food Safety
- Catering
- Operations
- Quality
- Facilities
- Procurement

### Starter SOP Templates

- HACCP Plan SOP
- Temperature Monitoring SOP
- Cleaning SOP
- Allergen Control SOP
- Food Incident SOP
- Supplier Food Safety SOP
- Product Recall SOP
- Pest Control SOP

### Starter Audit Checks

- Is a HACCP plan documented?
- Are hazards identified?
- Are critical controls monitored?
- Are temperature records retained?
- Are cleaning checks completed?
- Are allergen controls documented?
- Are corrective actions recorded?
- Is recall process documented and tested?

### Evidence Expected

- HACCP plan
- Temperature logs
- Cleaning records
- Supplier records
- Allergen matrix
- Corrective action records
- Recall test records
- Pest control records

---

## PACK-ISO-22000: ISO 22000 Food Safety Management Pack

| Field | Detail |
|---|---|
| Pack type | ISO management system pack |
| Sector | Food chain organisations |
| Jurisdiction | Global |
| Applicability trigger | Tenant selects ISO 22000, food safety management, food manufacturing, catering or supply chain food safety |
| Review frequency | Monthly while replacement activity is active, then quarterly |
| Risk level | High |
| Primary source | https://www.iso.org/standard/65464.html |

### Source Notes

ISO 22000:2018 applies to food safety management systems for any organisation in the food chain. ISO states it was last reviewed and confirmed in 2023 and indicates expected replacement activity.

### Requirement Areas

- Food safety management system
- Context and leadership
- Planning and risk
- Prerequisite programmes
- Hazard control
- Traceability
- Emergency preparedness
- Validation and verification
- Nonconformity and corrective action
- Continual improvement

### Suggested Departments

- Food Safety
- Quality
- Production
- Supply Chain
- Procurement
- Operations

### Starter SOP Templates

- Food Safety Management SOP
- Prerequisite Programme SOP
- Hazard Control SOP
- Traceability SOP
- Emergency Preparedness SOP
- Food Nonconformance SOP
- Corrective Action SOP

### Starter Audit Checks

- Are food safety responsibilities assigned?
- Are prerequisite programmes documented?
- Are hazards identified and controlled?
- Is traceability maintained?
- Are nonconformities investigated?
- Are corrective actions tracked?
- Are food safety records retained?

### Evidence Expected

- Food safety plan
- PRP records
- Hazard analysis
- Traceability records
- Nonconformance logs
- Corrective action records
- Verification records

---

## PACK-BRCGS-FOOD: BRCGS Food Safety Pack

| Field | Detail |
|---|---|
| Pack type | Private certification scheme guidance pack |
| Sector | Food manufacturing and supply chain |
| Jurisdiction | Global |
| Applicability trigger | Tenant supplies retailers, food brands or selects BRCGS preparation |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary source | https://www.brcgs.com/our-standards/food-safety/ |

### Source Notes

BRCGS states its Global Standard Food Safety is used by more than 22,000 sites in over 130 countries and accepted by leading brands and retailers. Because this is a certification scheme with controlled content, Aquilens should store only summaries, mapping and evidence expectations unless licensed.

### Requirement Areas

- Senior management commitment
- Food safety plan
- Quality management system
- Site standards
- Product control
- Process control
- Personnel
- Traceability
- Internal audit
- Corrective actions

### Suggested Departments

- Quality
- Food Safety
- Production
- Warehouse
- Procurement
- HR and Training

### Starter SOP Templates

- BRCGS Audit Preparation SOP
- Site Standards Inspection SOP
- Product Control SOP
- Process Control SOP
- Internal Audit SOP
- Traceability Test SOP
- Personnel Hygiene SOP

### Starter Audit Checks

- Is senior management review evidenced?
- Are food safety and quality responsibilities assigned?
- Are internal audits performed?
- Are traceability tests performed?
- Are personnel hygiene records retained?
- Are corrective actions closed?
- Are product and process controls documented?

### Evidence Expected

- Internal audit records
- Traceability test records
- Hygiene checks
- Product release records
- Corrective action records
- Training records
- Site inspection records

---

## PACK-ISO-15189: Medical Laboratory Quality and Competence Pack

| Field | Detail |
|---|---|
| Pack type | ISO laboratory accreditation pack |
| Sector | Medical laboratories, diagnostics, point-of-care testing |
| Jurisdiction | Global |
| Applicability trigger | Tenant operates medical laboratory, diagnostic testing or POCT |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary source | https://www.iso.org/standard/76677.html |

### Source Notes

ISO 15189:2022 specifies requirements for quality and competence in medical laboratories and is applicable to medical laboratories developing management systems and assessing competence. ISO states it is also applicable to point-of-care testing.

### Requirement Areas

- Laboratory quality management
- Personnel competence
- Equipment
- Reagents and consumables
- Pre-examination processes
- Examination processes
- Post-examination processes
- Result reporting
- Risk management
- Nonconforming work
- Internal audit
- Management review

### Suggested Departments

- Laboratory Operations
- Quality
- Clinical Governance
- Training
- Equipment/Facilities

### Starter SOP Templates

- Sample Collection SOP
- Sample Handling SOP
- Test Method SOP
- Result Validation SOP
- Equipment Calibration SOP
- Nonconforming Work SOP
- Laboratory Internal Audit SOP
- Competence Assessment SOP

### Starter Audit Checks

- Are test methods controlled?
- Are staff competence records maintained?
- Are equipment calibration records current?
- Are samples handled according to procedure?
- Are results validated before release?
- Are nonconformities recorded?
- Are internal audits completed?
- Are risks reviewed?

### Evidence Expected

- Test method SOPs
- Competence records
- Calibration logs
- Sample logs
- Result validation records
- Nonconformance records
- Audit reports
- Management review minutes

---

## PACK-ISO-17025: Testing and Calibration Laboratory Pack

| Field | Detail |
|---|---|
| Pack type | ISO/IEC laboratory accreditation pack |
| Sector | Testing laboratories, calibration laboratories |
| Jurisdiction | Global |
| Applicability trigger | Tenant operates testing or calibration laboratory |
| Review frequency | Quarterly + event-driven |
| Risk level | High |
| Primary source | https://www.iso.org/ISO-IEC-17025-testing-and-calibration-laboratories.html |

### Source Notes

ISO states ISO/IEC 17025 enables laboratories to demonstrate that they operate competently and generate valid results, promoting confidence in their work.

### Requirement Areas

- Impartiality
- Confidentiality
- Personnel competence
- Facilities and environmental conditions
- Equipment
- Measurement traceability
- Method validation
- Sampling
- Handling test or calibration items
- Technical records
- Reporting results
- Complaints
- Nonconforming work
- Management system

### Suggested Departments

- Laboratory Operations
- Quality
- Calibration
- Technical Services
- Customer Service

### Starter SOP Templates

- Test Method Control SOP
- Calibration SOP
- Equipment Management SOP
- Sampling SOP
- Technical Records SOP
- Results Reporting SOP
- Nonconforming Work SOP
- Laboratory Complaints SOP

### Starter Audit Checks

- Are test/calibration methods controlled?
- Are staff competent and authorised?
- Are environmental conditions monitored where required?
- Is equipment calibrated and maintained?
- Are technical records complete?
- Are results reviewed before release?
- Are complaints and nonconforming work managed?
- Is measurement traceability evidenced?

### Evidence Expected

- Method SOPs
- Competence records
- Calibration certificates
- Environmental monitoring logs
- Technical records
- Result reports
- Complaint records
- Nonconforming work logs
- Internal audit reports

---

# 8. Applicability Rules

Aquilens should recommend packs using the following logic.

## 8.1 Organisation-Level Rules

| Tenant answer | Recommended packs |
|---|---|
| Any organisation | Universal SOP Control Pack |
| Wants quality management or certification preparation | ISO 9001, ISO 10013, ISO 19011 |
| Handles personal data in UK | UK Data Protection Pack |
| Handles personal data in Ghana | Ghana Data Protection Pack |
| Software, SaaS, fintech, healthcare data, school systems | ISO 27001, ISO 27002, data protection packs |
| Manufacturing | ISO 9001, ISO 45001, ISO 14001 |
| Medical device or diagnostics | ISO 13485, ISO 14971, UK Medical Devices where UK applies |
| Pharma, medicine storage or distribution | MHRA GMP/GDP |
| Health and social care in England | CQC, UK Data Protection, ISO 45001 |
| School in England | UK School Safeguarding, Ofsted, UK Data Protection, ISO 45001 |
| School in Ghana | Ghana School Safety, Ghana Data Protection, ISO 9001-style quality controls |
| Food business in UK | HACCP, Food Safety, ISO 22000 if selected, BRCGS if selected |
| Medical laboratory | ISO 15189, ISO 9001-style controls, data protection |
| Testing/calibration laboratory | ISO/IEC 17025, ISO 9001-style controls |

## 8.2 Department-Level Rules

| Department | Recommended packs |
|---|---|
| Quality | ISO 9001, ISO 10013, ISO 19011 |
| IT | ISO 27001, ISO 27002, data protection |
| HSE | ISO 45001, HSE, ISO 14001 where environmental impact exists |
| HR | Data protection, safeguarding where children/vulnerable people involved, training controls |
| Safeguarding | UK School Safeguarding, Ghana School Safety, CQC where care context applies |
| Finance | ISO 9001-style controls, FCA where regulated, data protection |
| Operations | ISO 9001, ISO 45001, sector-specific packs |
| Clinical Operations | CQC, ISO 13485 where medical devices, ISO 15189 where lab |
| Food Safety | HACCP, ISO 22000, BRCGS where relevant |
| Laboratory Operations | ISO 15189 or ISO/IEC 17025 |
| Customer Service | ISO 9001, Consumer Duty where FCA retail context applies, complaints controls |

## 8.3 Process-Level Rules

| Process keyword or type | Recommended guidance |
|---|---|
| Complaint | ISO 9001, CQC if care, FCA Consumer Duty if financial services |
| Incident | ISO 45001, safeguarding, data breach, CQC, ISO 27001 depending incident type |
| Access request | ISO 27001, data protection |
| Staff onboarding | HR controls, safeguarding where children/vulnerable people involved, ISO 9001 competence |
| Supplier onboarding | ISO 9001, ISO 27001, ISO 13485, food safety, outsourcing depending sector |
| Equipment maintenance | ISO 9001, ISO 45001, ISO 15189/17025 if lab |
| Medication | CQC, healthcare controls |
| Student incident | Safeguarding, health and safety, parent communication, record retention |
| Data breach | UK/Ghana data protection, ISO 27001 |
| Product recall | Food safety, GMP/GDP, ISO 13485 depending product |
| Internal audit | ISO 19011, selected standards |
| Corrective action | ISO 9001, GMP/GDP, ISO 13485, CQC, ISO 22000 depending sector |

---

# 9. Internal Audit Scoring Language

Aquilens should use careful language.

## 9.1 Allowed Status Terms

- Not started
- In progress
- Evidence missing
- Owner missing
- Review overdue
- Acknowledgement overdue
- Action required
- Ready for internal review
- Ready for external review preparation
- No material gaps found in selected checks

## 9.2 Avoided Status Terms

- Compliant
- Certified
- Passed
- Regulator-approved
- Guaranteed
- Legally compliant
- ISO-approved
- CQC-compliant
- FCA-compliant

## 9.3 Recommended Report Wording

Use:

> Aquilens reviewed the selected SOPs against the chosen guidance checks. The review identified evidence gaps, overdue reviews and missing ownership items. This is an internal audit support report and does not constitute certification, legal advice or regulatory approval.

Avoid:

> Aquilens confirms the organisation is compliant.

---

# 10. Evidence Pack Standard Contents

Every generated evidence pack should include:

- Organisation profile
- Selected standards and guidance areas
- Pack version used
- Audit scope
- Audit date
- Departments reviewed
- Processes reviewed
- SOP register
- Current approved versions
- SOP owners
- Review dates
- Approval history
- Version history
- Staff acknowledgement records
- Evidence list
- Findings
- Corrective actions
- Open risks
- Closed findings
- Disclaimer

---

# 11. Source Links Index

## ISO and Standards Bodies

- ISO 9001: https://www.iso.org/standard/62085.html
- ISO 9001 Amendment 1:2024: https://www.iso.org/standard/88431.html
- ISO 10013: https://www.iso.org/standard/75736.html
- ISO 19011: https://www.iso.org/standard/70017.html
- ISO/IEC 27001: https://www.iso.org/standard/27001
- ISO/IEC 27002: https://www.iso.org/standard/75652.html
- ISO 45001: https://www.iso.org/standard/63787.html
- ISO 45001 explained: https://www.iso.org/home/insights-news/resources/iso-45001-explained-what-it-is.html
- ISO 14001: https://www.iso.org/standard/60857.html
- ISO 13485: https://www.iso.org/standard/59752.html
- ISO 13485 overview: https://www.iso.org/iso-13485-medical-devices.html
- ISO 14971: https://www.iso.org/standard/72704.html
- ISO 22000: https://www.iso.org/standard/65464.html
- ISO 15189: https://www.iso.org/standard/76677.html
- ISO/IEC 17025 overview: https://www.iso.org/ISO-IEC-17025-testing-and-calibration-laboratories.html
- ISO copyright: https://www.iso.org/copyright.html

## UK Regulators and Public Sources

- MHRA GMP/GDP: https://www.gov.uk/guidance/good-manufacturing-practice-and-good-distribution-practice
- MHRA medical devices: https://www.gov.uk/guidance/regulating-medical-devices-in-the-uk
- UK Medical Devices Regulations 2002: https://www.legislation.gov.uk/uksi/2002/618/contents
- CQC provider regulations: https://www.cqc.org.uk/guidance-regulation/providers/regulations-service-providers-and-managers
- CQC fundamental standards: https://www.cqc.org.uk/about-us/fundamental-standards
- FCA SYSC Handbook: https://handbook.fca.org.uk/handbook?entityId=sysc
- FCA Operational Resilience PS21/3: https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience
- FCA Operational Resilience observations: https://www.fca.org.uk/publications/good-and-poor-practice/operational-resilience-insights-observations-one-year
- FCA Consumer Duty: https://www.fca.org.uk/firms/consumer-duty
- FCA Consumer Duty PS22/9: https://www.fca.org.uk/publications/policy-statements/ps22-9-new-consumer-duty
- FCA Consumer Duty FG22/5: https://www.fca.org.uk/publication/finalised-guidance/fg22-5.pdf
- UK data protection: https://www.gov.uk/data-protection
- Data Protection Act 2018: https://www.legislation.gov.uk/ukpga/2018/12/contents
- ICO data protection audit framework: https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/
- ICO accountability and governance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/
- HSE Health and Safety at Work Act: https://www.hse.gov.uk/legislation/hswa.htm
- HSE risk assessment guidance: https://www.hse.gov.uk/risk/
- DfE Keeping Children Safe in Education: https://www.gov.uk/government/publications/keeping-children-safe-in-education--2
- Ofsted Education Inspection Framework: https://www.gov.uk/government/publications/education-inspection-framework/education-inspection-framework-for-use-from-november-2025
- School inspection toolkit: https://www.gov.uk/government/publications/school-inspection-toolkit-operating-guide-and-information
- Food Standards Agency HACCP: https://www.food.gov.uk/business-guidance/hazard-analysis-and-critical-control-point-haccp
- Food Standards Agency SFBB: https://www.food.gov.uk/business-guidance/safer-food-better-business-sfbb
- GOV.UK HACCP food plan: https://www.gov.uk/food-safety-hazard-analysis

## Ghana Sources

- Ghana Data Protection Commission: https://dataprotection.org.gh/
- Ghana Data Protection Act 2012, Act 843: https://nita.gov.gh/wp-content/uploads/2017/12/Data-Protection-Act-2012-Act-843.pdf
- Ghana Child and Family Welfare Policy: https://www.mogcsp.gov.gh/?mdocs-file=676
- Safe to Learn Ghana progress report referencing MoE/GES Safe School Resource Pack: https://www.safetolearncoalition.org/media/1706/file/Ghana-STL-Progress-2019-2023.pdf

## Food Scheme Sources

- BRCGS Food Safety: https://www.brcgs.com/our-standards/food-safety/
- BRCGS main site: https://www.brcgs.com/

---

# 12. Initial Build Recommendation

For the first product build, implement these packs first:

1. Universal SOP Control Pack
2. ISO 9001 Quality Management Pack
3. ISO 10013 Documented Information Pack
4. ISO 19011 Internal Audit Pack
5. UK Data Protection Pack
6. Ghana Data Protection Pack
7. UK School Safeguarding Pack
8. Ghana School Safety Pack
9. CQC Health and Social Care Pack
10. ISO 27001 Information Security Pack

Then add:

11. ISO 45001 Health and Safety Pack
12. Food Safety and HACCP Pack
13. ISO 13485 Medical Device Pack
14. MHRA GMP/GDP Pack
15. FCA Systems and Controls Pack
16. FCA Operational Resilience Pack

This gives Aquilens a strong foundation for schools, care providers, small healthcare organisations, software companies, financial services firms and manufacturers.
