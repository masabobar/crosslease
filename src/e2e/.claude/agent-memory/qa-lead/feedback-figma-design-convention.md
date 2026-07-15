---
name: feedback-figma-design-convention
description: RefiNext Figma design frames show happy-path state only — error, locked, and MFA states are missing from initial frames and require separate Figma frames
metadata:
  type: feedback
---

RefiNext Figma design frames consistently provide only the happy-path (default) state for login and form screens. Error states (invalid credentials, validation errors), account-blocked states, and MFA challenge screens are absent from the initial frame and must be requested as separate frames.

**Why:** Confirmed from the first Figma extraction (PRD1042-43, node 319:163, file 18XTZEeaxrGDhi4DzZ2QnJ — "Sign in" screen). The frame shows a clean two-column layout with no error message component, no MFA step, and no blocked-account variant. This is consistent with the designer's workflow — happy path first, states added later.

**How to apply:**

- In Stage 3, always expect MAJOR findings for STATE_MISSING on error and blocked states in login/form frames — this is a known design workflow pattern, not a designer oversight.
- Do not escalate missing error states as CRITICAL blockers for login stories; classify as MAJOR with a recommendation to add the state frame.
- Write behavioral assertions for missing error states (assert no session created, assert form not submitted) rather than copy assertions until the error state frame is provided.
- When error message wording is unconfirmed by design, note the ambiguity explicitly and defer copy assertions to a follow-up test update.
- For MFA flows, always check whether the auth provider (R1) is resolved before treating the missing MFA frame as a gap that blocks test generation.
- When generating POM locators, use the happy-path frame's confirmed labels (e.g., "Sign in" button, "Email address" field label) — do not infer error-state selectors without a design frame.

Related: [[project-prd1042-43]]
