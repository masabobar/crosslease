---
name: requirements-design-comparator
description: "Use this skill to compare story acceptance criteria against Figma design data and produce a structured mismatch report. Invoke when the qa-lead pipeline reaches Stage 3, after jira-story-extractor and figma-design-extractor have completed for the same story. Maps each AC to design frames, checks copy consistency, validates interactive state completeness, and verifies navigation flows. Applies RefiNext domain rules for role-based access, Four-Eyes enforcement, async operation indicators, and tenant isolation. Classifies mismatches as CRITICAL, MAJOR, or MINOR. Stories with comparison_status BLOCKED must not proceed to Stage 4."
allowed-tools: Read, TaskCreate, TaskUpdate
model: sonnet
---

# requirements-design-comparator

Compare story ACs against Figma design data and produce a structured mismatch report. This is Stage 3 of the qa-lead pipeline.

## Invocation

Called by the qa-lead agent with a story object (Stage 1) and a design object (Stage 2). If the design object has `extraction_status: "FAILED"`, return `comparison_status: "BLOCKED"` with reason `"Design data unavailable"` — do not proceed.

## Comparison steps

1. **AC → Design mapping** — for each AC, identify which frame(s) provide evidence. No evidence → `AC_NOT_IN_DESIGN`
2. **Design → AC mapping** — for each significant UI element, identify which AC it covers. No match → `DESIGN_NOT_IN_AC`
3. **Copy validation** — compare label/button text in design against AC wording. Mismatch → `COPY_MISMATCH`
4. **State completeness** — for AC-covered components, verify error/loading states exist in design. Missing → `STATE_MISSING`
5. **Flow validation** — for ACs describing a user journey, verify the prototype flow matches. Mismatch → `FLOW_MISMATCH`
6. **RefiNext domain rules** — apply checks below regardless of whether the AC mentions them explicitly

## RefiNext domain rules

| Rule              | Missing evidence                                                  | Severity |
| ----------------- | ----------------------------------------------------------------- | -------- |
| Role-based access | Design does not differentiate UI per role                         | MAJOR    |
| Four-Eyes         | Approval flow has no guard preventing submit+approve by same user | CRITICAL |
| Async operations  | No loading/stale indicator for cashflow or score ACs              | MAJOR    |
| Tenant isolation  | Cross-tenant AC shows 403 pattern instead of 404                  | CRITICAL |

## Severity + action

| Severity | Definition                                                     | Action                                                                                                   |
| -------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| CRITICAL | AC absent from design, design contradicts a hard business rule | Set `comparison_status: "BLOCKED"`, populate `blockers`, emit escalation message, do NOT pass to Stage 4 |
| MAJOR    | Important element missing from one side                        | Flag in `mismatches`                                                                                     |
| MINOR    | Copy variation, cosmetic gap                                   | Flag in `mismatches` as note                                                                             |

Escalation message format:

```
[BLOCKER] Story <ID> cannot proceed to test generation.
Critical mismatch: <description>
Resolution required from: BA / Designer / PO
```

## Output shape

```json
{
  "story_id": "PRD1042-XX",
  "comparison_status": "CLEAN | WARNINGS | BLOCKED",
  "matched": [{ "ac_ref": "AC-1", "design_evidence": "..." }],
  "mismatches": [
    {
      "type": "...",
      "severity": "...",
      "ac_ref": "...",
      "design_ref": "...",
      "description": "...",
      "recommendation": "..."
    }
  ],
  "ambiguities": [{ "ac_ref": "...", "description": "...", "question": "..." }],
  "blockers": []
}
```

Do not resolve ambiguities yourself — document them for human review.
