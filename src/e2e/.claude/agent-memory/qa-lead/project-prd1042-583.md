---
name: project-prd1042-583
description: PRD1042-583 US 29.2 Tenant Activation processed — 17 ACs; DoR PASS; Figma extraction re-run 2026-07-06 SUCCESS via REST API (node 84:5406); Stage 3 WARNINGS with step-up MFA + copy-verbatim design evidence; 6 scenario blocks; Four-Eyes actor independence + tenant-stays-Draft on reject
metadata:
  type: project
---

Story PRD1042-583 — US 29.2 | Tenant Management | Tenant Activation. Second story processed in Epic 29 [[project-refinext-overview]] after [[project-prd1042-582]] (US 29.1 Tenant Creation & Onboarding) and [[project-prd1042-595]] (US 29.14) / [[project-prd1042-596]] (US 29.15).

**Why:** Countersignature/four-eyes step in TM-01 workflow. Depends on PRD1042-77 Four-Eyes engine (blocking). Approval window default 48h (per comment 38173 from Vesna Plakalovic 2026-06-29).

**How to apply:** Use for future Governance / Four-Eyes stories in Epic 29. Follows same pattern as [[project-prd1042-77]] for Four-Eyes rules.

**Status:** Currently "QA in progress" (moved back from Rework — Vesna comment 38531 confirms Rework was accidental).

**Pipeline outcome (v2 re-run 2026-07-06 with full Figma data):**

- **Stage 1 (Jira)**: DoR PASS — title, description, 17 derivable ACs (functional + validation + edge cases + permission matrix), stakeholder-reviewed (comments from Iva Marković, Dejan Nikolic, Vesna Plakalovic, Philipp Maute)
- **Stage 2 (Figma)**: SUCCESS — extracted via Figma REST API this run. Node 84:5406, file 7pygkopuqyeEhUTMVp9lrP. Canvas "✅ Tenant Activation" with 4 sections: (1) VIEW DETAILS pending list 84:5886, (2) PENDING APPROVALS approval flow 84:6693, (3) REJECTION FLOW 84:8250, (4) SUBMITTER NOTIFICATIONS 84:9447
- **Stage 3 (Comparison)**: WARNINGS — 2 MAJOR design gaps (step-up MFA on Approve + on Reject not modeled in v1), 2 MINOR copy mismatches. 7 ACs matched to design evidence. No CRITICAL, no BLOCKED.
- **Stage 4 (Gherkin)**: 6 scenario blocks; v2 updated with design evidence

**Key design evidence added in v2:**

- Post-approval copy verbatim: "Request was approved. New Group Trade has been activated and is now operational." (title: "Approved request")
- Post-rejection copy verbatim: "Request was rejected. New Group Trade will remain in Draft until the request is resubmitted." (title: "Rejected request") — validates Vesna comment 36741
- Step-up MFA card copy verbatim: "Step up verification required" / "You're about to approve a sensitive change. Confirm it's really you." (Approve path) / "You're about to reject a sensitive change. Confirm it's really you." (Reject path)
- Self-submission indicator: "You submitted this request" (#64748b gray) — no "Review request" CTA on own rows; confirms Four-Eyes UI guard for AC-07
- Justification field label: "Your justification" with helper "Required · stored in audit log"
- Sample data on canvas: Tenant "New Group Trade", code "CL-DE-001", requester "Ingrid Bjornstad" (Admin), countersignatory "Anna Kowalski" (Admin), Country Germany, Bank entity type
- Request chain UX: "Initial submission: Expired without approval" + "Re-initiated after expiry: Current request" — validates AC-10 narrative
- Page title: "Pending approvals" / subtitle: "Review and act on requests submitted by other administrators under the four-eyes policy."
- Filter tabs: All | Pending | Approved | Rejected | Withdrawn | Expired
- Status badge colors: Approved #16a34a, Rejected #e6000a, Pending #d97706 amber

**Key domain facts captured in test file:**

- Actor independence (requester ≠ countersignatory) enforced by PRD1042-77 [[project-prd1042-77]] + UI-level self-submission indicator
- 48-hour approval window (default, configurable at platform level)
- Optimistic locking on concurrent countersignature — 2nd returns 409
- On rejection/expiry: tenant STAYS in Draft/Provisioning; only governance request state changes to Rejected/Expired (per Vesna's comment 36741) — now anchored by verbatim design copy
- Step-up MFA required for BOTH Approve and Reject actions (design-confirmed) — new blocker: PRD1042-75 MFA harness
- Audit events: TENANT_ACTIVATED, TENANT_CREATION_REJECTED, GOVERNANCE_REQUEST_EXPIRED
- Permission Matrix: only System Admin can view pending governance / countersign / reject

**Blockers noted in file header:**

- Approval window expiry ACs (AC-04, AC-10) require clock manipulation → D16 (`APPROVAL_WINDOW_HOURS` override)
- Audit event verification (AC-11) requires admin API for audit log inspection → D-Audit
- Concurrent race (AC-13) requires parallel-request harness → D-Race
- Downstream event/queue verification (AC-16) requires event bus fixture → D-EventBus
- Step-up MFA scenarios require PRD1042-75 MFA test harness (new dependency added in v2)

**References Confluence pattern from [[project-prd1042-582]]:** No 403 for cross-role — use 404 or hide UI per Ivan Mladenovic guidance; same applies here for governance request access.
