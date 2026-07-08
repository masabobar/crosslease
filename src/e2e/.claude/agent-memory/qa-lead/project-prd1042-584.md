---
name: project-prd1042-584
description: PRD1042-584 US 29.3 Tenant List View & Search — 17 ACs, DoR PASS, Figma FAILED, Stage 3 WARNINGS, 5 scenario blocks, 2 ACs blocked by PRD1042-1046, 404-not-403 confirmed, Support User scoped list via grant
metadata:
  type: project
---

US 29.3 Tenant List View & Search (PRD1042-584) processed 2026-07-06.

**Why:** Epic 29 Tenant Management, QA pipeline run for tenant list view story.

**Key facts:**

- 17 ACs extracted from Jira description (structured field spec embedded in story body)
- DoR: PASS — title present, 17 ACs, description present, status "QA in progress"
- Figma node 9:6160, file 7pygkopuqyeEhUTMVp9lrP — Stage 2 FAILED (MCP rate-limited, Bash/curl unavailable in session)
- Stage 3: WARNINGS — no CRITICAL blockers; design evidence unverified across all ACs
- Stage 4: 5 scenario blocks generated (2 Outlines + 3 Scenarios)

**Blocked ACs:**

- AC-08, AC-09 — blocked by PRD1042-1046 ("Active Module filter is missing" open bug)

**AC classifications:**

- happy-path: AC-01, AC-02, AC-04, AC-05 (6 Gherkin scenarios generated from these)
- main-error: AC-13 (Support User no grants → empty list not error), AC-16 (404-not-403 for FO/BO/LC)
- edge-case: AC-03, AC-06, AC-07, AC-10, AC-11, AC-12, AC-14, AC-15, AC-17

**Domain rule hits:**

- 404-not-403 confirmed in AC-16 for Front Office, Back Office, LC User
- Support User scope enforcement via Support Access Grant (TM-16 dependency)
- SUPPORT_LIST_ACCESS audit event (AC-14) — backend-only, not E2E assertable

**Open questions:**

- Iva Marković comment references open questions at end of story — questions not visible in Jira body; needs follow-up
- TM-04 not mapped to a PRD1042 ticket number — link target for Tenant Name column unknown
- AC-02 grant expiry evaluation: per-request or cached? Affects session-boundary edge case
- AC-14 audit event: assertable via admin API endpoint in E2E? Could promote to compliance scenario if accessible

**E2E automation candidates:**

- 3 of 5 scenarios marked ✅: Admin list columns Outline, Status filter scenario, 404-not-403 Outline
- 2 scenarios ⚙️: Support User scoped list and Support User no-grant empty state (require seeded Support Access Grant)

**How to apply:** When processing other Tenant Management list-view stories, reuse the 404-not-403 Outline pattern. Support User scoped list pattern (grant-based visibility) is unique to this story and PRD1042-51 LC Access Restrictions.

Related: [[project-prd1042-582]] [[project-prd1042-583]] [[project-prd1042-595]] [[project-prd1042-596]]
