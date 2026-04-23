# UK Online Safety Act 2023 (OSA) — Core Regulatory Baseline
**Last Updated:** 2026-04-23
**Regulator:** Ofcom
**Enforcement Date:** March 17, 2025 (Illegal Content Duties)

---

## 1. Core Legal Duties for Service Providers

The Online Safety Act 2023 (OSA) imposes significant legal obligations on providers of "user-to-user" (U2U) and search services to protect users from illegal content.

### 1.1 Risk Assessment Duties
Providers must conduct and document an initial assessment of:
- The risk that users may encounter illegal content.
- The risk that the service may be used to commit or facilitate priority criminal offences.
- Assessments must be version-controlled and updated following significant changes to service design.

### 1.2 Illegal Content Duties
Providers must implement proportionate systems and processes to:
- **Prevent/Minimize Exposure:** Prevent users from encountering priority illegal content.
- **Mitigate Usage for Offences:** Mitigate the risk of the service being used to facilitate priority offences.
- **Remove Illegal Content:** Ensure systems are in place to remove illegal content efficiently when identified or flagged.
- **Reporting and Complaints:** Implement user-friendly mechanisms for reporting and a transparent complaints procedure.

---

## 2. Technical Implementation Requirements (for Developers)

Compliance requires specific architectural and feature-level implementation:

### 2.1 Safety by Design
- **Algorithmic Design:** Developers must consider how recommender systems and product features (e.g., live streaming, anonymous posting) impact the dissemination of illegal content.
- **Automated Moderation:** Ofcom recommends automated systems, such as **hash-matching technology**, to detect and remove harmful content (e.g., CSAM) at scale.
- **Access Control:** Building safeguards such as preventing DMs from unknown users to children or limiting profile visibility.

### 2.2 Record Keeping & Governance
- **Audit Trails:** Detailed records of risk assessments and the reasoning behind chosen safety measures must be maintained for Ofcom inspection.
- **Proportionality:** While duties are proportional to service size, all services must perform a risk assessment and take "proportionate" action.

---

## 3. Priority Offences & Penalties

### 3.1 Priority Illegal Content
Includes content related to:
- Terrorism
- Child Sexual Abuse Material (CSAM)
- Incitement to violence
- Harassment
- Fraud and financial crimes

### 3.2 Enforcement & Penalties
- **Regulator:** Ofcom has the power to investigate and demand information.
- **Maximum Penalties:** Fines up to **£18 million or 10% of global turnover**, whichever is higher.
- **Operational Gating:** Ofcom may issue enforcement notices requiring services to implement specific technical fixes.

---
*Disclaimer: This document is a technical summary of the UK Online Safety Act 2023 for use in the PromptAccreditation Knowledge Base.*
