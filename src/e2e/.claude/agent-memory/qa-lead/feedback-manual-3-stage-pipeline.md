---
name: feedback-manual-3-stage-pipeline
description: For manual test generation the pipeline is 3 stages only (Figma + Jira → manual test suite generator); skip the requirements-design-comparator
metadata:
  type: feedback
---

For **manual testing**, run only 3 stages: (1) figma-design-extractor, (2) jira-story-extractor, (3) manual-test-suite-generator. **Do NOT run the requirements-design-comparator** (the old Stage 3).

**Why:** The user (RefiNext QA) stated manual test suite generation only needs the Figma design + Jira story as inputs feeding directly into the generator. The comparator adds overhead without value for the manual-testing flow.

**How to apply:**

- When asked to generate a manual BDD test suite, extract Jira (Stage 1) and Figma (Stage 2), then go straight to manual-test-suite-generator. No comparison report, no CLEAN/WARNINGS/BLOCKED gate.
- The manual-test-suite-generator precondition that requires `comparison_status: CLEAN|WARNINGS` no longer applies for manual runs — proceed on `dor_status: PASS` alone.
- All other output rules still hold: happy-path + main-error Gherkin only; edge-case/separate-feature/Blocked in scope-filter table only; no Stage 3 section, no Blockers/Gaps section in the .md; 5–10 scenarios; coverage check + design gaps to terminal only.
- This supersedes the 4-stage description in the qa-lead agent definition for manual-testing requests. Note: PRD1042-747 was processed under the old 4-stage flow (with comparator); future manual runs use 3 stages.

Related: [[project-prd1042-747]], [[feedback-figma-design-convention]].
