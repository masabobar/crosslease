---
layer: shared
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/*_test.*"
  - "**/tests/**"
  - "**/test/**"
  - "e2e/**"
  - "cypress/**"
  - "integration_test/**"
---

# Test Scoping — AC Scope Filter & Scenario Budget

**MANDATORY for every story-level / scenario test (E2E, story-level integration flows).**
Goal: no useless tests — every scenario traces to an acceptance criterion (AC) that matters;
happy path + main errors are always covered; edge-case explosion is forbidden.

---

## 1. Mandatory AC Scope Filter

**Before writing ANY story-level test, produce this classification table. Do not write a
single scenario until the table is complete.**

| AC | Description | Classification | Rationale |
|----|-------------|----------------|-----------|
| AC-01 | ... | `happy-path` | ... |
| AC-02 | ... | `main-error` | ... |
| AC-03 | ... | `edge-case` | ... |

**The five classifications:**

| Classification | Meaning | Action |
|----------------|---------|--------|
| `happy-path` | Core success flow — user completes the primary action | INCLUDE — 1 scenario (Outline across roles if role-dependent) |
| `main-error` | Directly blocks the user from completing the core workflow | INCLUDE — 1–2 scenarios max per error type |
| `edge-case` | Boundary condition, implementation detail, rare state, validation rule | SKIP at scenario level — table entry only (see §4 for unit-level handling) |
| `separate-feature` | Has its own user story, ticket, or spec file | SKIP — table entry names the owning story |
| `blocked` | Would have a scenario, but a named dependency/blocker makes it untestable now | SKIP — record the blocker ID; no scenario, no commented-out stub |

**Hard rule:** scenarios exist ONLY for `happy-path` and `main-error` ACs. All other
classifications appear in the table with their rationale but produce NO scenario — not
conditional, not commented-out, not "fixme".

---

## 2. Scenario Budget

- **Target: 5–10 scenarios per story.** If you reach 11+, go back to the filter table and
  reclassify — you are testing edge cases or someone else's story.
- **Happy path:** exactly 1 scenario; use a Scenario Outline (or parameterized test) when
  the same flow varies only by role/input — never copy-paste per role.
- **Main errors:** 1–2 scenarios per error type. Test the error once, not once per role
  (role-access denials are the exception — §5 wrong-role Outline + `role-access-matrix.md`).
- **NEVER build the role × FUNCTIONAL-error cross-product.** 5 roles × 3 validation/business
  errors = 15 scenarios is a test explosion, not coverage. Test all roles on the happy path
  (one Outline) and each functional error with a single representative role. The role ×
  ACCESS matrix is the sanctioned exception: it lives at the integration layer
  (`role-access-matrix.md`, exempt per §4) and as ONE §5 Outline — never as per-role copies
  of functional scenarios.
- **Stop-check:** if more than 4 ACs are classified `happy-path` or `main-error`,
  re-evaluate — most stories have 1 happy path and 2–3 main errors.

---

## 3. Classification Heuristics

| Signal in the AC | Classification |
|------------------|----------------|
| Timing behavior (timeouts, TTL, clock skew, session expiry) | `separate-feature` (session/timing story) |
| Input format validation (email format, password strength) | `edge-case` (unit-level, see §4) |
| Internal implementation (token flags, key management, log format) | `edge-case` |
| Lockout / throttling after N attempts | `separate-feature` |
| Requires a named unavailable dependency (blocker/D-ID) | `blocked` |
| Role access, ownership, state transition | `main-error` → apply §5 auto-negatives |
| Abuse-case AC (feature used as a weapon — `security-review.md` §1.1) | `main-error` → apply §5 abuse-case scenario (direct request) |

**Tiebreakers:**
- `main-error` vs `edge-case`: *"Does this block the primary user from completing the core
  action?"* Yes → `main-error`. No → `edge-case`.
- `blocked` vs `separate-feature`: *"Would this AC have a scenario here if the dependency
  were resolved?"* Yes → `blocked`. Belongs in another spec regardless → `separate-feature`.

**Security ACs never evaporate via `separate-feature`:** classifying a security-relevant AC
(session expiry, lockout/throttling, rate limiting, token lifecycle) as `separate-feature`
is valid ONLY when the classification table names the owning story ID (US-XXX) **and that
story exists** in the backlog. No named existing story → the AC is `[UNCOVERED AC]`
(blocker) — file the story first (`/add-scope`), then classify.

---

## 4. Layering — What the Scope Filter Does NOT Reduce

The scope filter governs **scenario-level tests only**. It never weakens the lower layers:

| Layer | Governed by | Scope filter applies? |
|-------|-------------|-----------------------|
| Per-endpoint status-code matrix (200/400/401/403/404/500) | `testing.md` | ❌ NO — all six codes stay mandatory per endpoint |
| Unit tests (functions, validation rules, boundaries) | `testing.md` + coverage target | ❌ NO — cheap unit-level boundary/edge tests are fine and count toward 80% |
| Role-access matrix (every registry role × endpoint/screen) | `role-access-matrix.md` | ❌ NO — parameterized integration layer, not scenario budget |
| Story-level integration flows & E2E scenarios | **this rule** | ✅ YES — scope filter + budget |

An `edge-case` AC (e.g. email format validation) gets NO E2E scenario, but its validation
logic is still unit-tested and its endpoint still returns a tested 400. "Skip the edge case"
means *skip the expensive scenario*, never *skip the check*.

---

## 5. Universal Auto-Applied Negative Scenarios

When the story triggers the condition, generate **exactly 1** negative scenario BLOCK each — no
expansion into per-role scenario copies (per `.claude/rules/security-and-auth.md`):

| Trigger | Auto-generated scenario |
|---------|-------------------------|
| Any AC involving role access | Wrong role cannot perform the action (403) — ONE Scenario Outline with an `Examples:` row for EVERY disallowed registry role (`role-access-matrix.md` §4, tag `@role-access`) |
| Resource by id / ownership (IDOR) | User A cannot access user B's resource (403, or the project's tenant-mismatch status from `QA-PIPELINE.md` — commonly 404 for multi-tenant isolation) |
| State transition | Valid transition succeeds; invalid transition is blocked |
| Abuse-case AC in the story (mandated by `security-review.md` §1.1) | The abuse-case AC as written, exercised by a **direct request** to the action/endpoint (`testing.md` — "Guard Parity & Direct Endpoint Testing") — never only through the UI; exactly 1 scenario per abuse-case AC |

**§5 scenarios are uncuttable:** they (including abuse-case scenarios) count toward the 5–10
budget but are NEVER the ones cut to meet it — when 11+ forces reclassification (§2), trim
happy-path variants or demote genuine edge cases; dropping an auto-negative is a blocker
(security ACs never evaporate — §3).

**Role registry (multi-role projects — MANDATORY):** a project with more than one role MUST
declare its role list (+ tenant-mismatch status where multi-tenant) in `QA-PIPELINE.md` →
"Roles", or `project-rules.md` → `## Roles`. The wrong-role negative above and the
happy-path role Outline are verified **against that registry** — never against just the
roles the story author happened to mention. Multi-role project with no registry → the
wrong-role scenario is `[UNCOVERED AC]` (blocker) until the registry is declared. Per-story
allowed-role DECLARATIONS and the per-endpoint/screen matrix test build on this registry —
see `.claude/rules/role-access-matrix.md`.

**Project-specific domain rules** (e.g. four-eyes approval, async stale indicators,
compliance tags) load from `.project-management/rules/QA-PIPELINE.md` → "Project Domain
Rules" when that file exists and is configured. Absent file = universal rules only.

---

## 6. AC Traceability

Every scenario/test MUST be traceable to an AC:

- **Gherkin:** tag `@us-X.X @ac-XX @p0` + title suffix `(AC-XX)`.
- **Code tests:** `describe('US-XXX <Title>')` + `it('... (AC-XX)')` — compatible with the
  `/run-tests story US-XXX` grep.
- Priority tags: `@p0` (blocker) … `@p3` (nice-to-have). Type tags: `@happy-path`,
  `@main-error`, `@abuse-case`, `@role-access`, `@compliance`, `@exploratory`.
- A test that cannot be traced to an AC is either a **story gap** (log it — the backlog is
  missing an AC) or **exploratory** (label `@exploratory`).
- An **uncovered `happy-path` or `main-error` AC** (no scenario traces to it) is a flagged
  blocker: report `[UNCOVERED AC: AC-XX]` — the story's tests are not complete.

---

## 7. Declarative Style

- Write scenarios declaratively: *"When I log in"*, not *"click field, type email, click
  button"*.
- One scenario tests one behavior — never mix multiple ACs in one scenario.
- No timing-dependent tests — mock timeouts, never wait real time.
- Locate elements testid-first (`getByTestId` — identifiers are mandatory per
  `.claude/rules/frontend-test-identifiers.md`); semantic selectors (`getByRole`,
  `getByLabel`) second; never XPath or CSS classes.

---

## Enforcement

- `/execute-work` quality gates require the completed Scope Filter table, AC traceability
  tags, and zero uncovered `happy-path`/`main-error` ACs before a story is complete — see
  `commands/modules/execute-work-quality-gates-core.md`.
- `/generate-test-cases` applies this rule when generating BDD test suites — see
  `commands/generate-test-cases.md`.
- `/run-tests story US-XXX` reports suite conformance against a generated test suite when
  one exists in `.project-management/output/test-suites/`.
- E2E **existence** per story is mandated by `.claude/rules/testing.md` ("E2E / Scenario
  Tests — Existence Mandate"); this rule governs only *which* scenarios exist once that
  mandate applies.

---

## Related

- `.claude/rules/testing.md` — coverage target, status-code matrix, related-test re-validation (the layers §4 protects)
- `.claude/rules/security-and-auth.md` — source of the §5 universal negatives (default-deny, IDOR)
- `.project-management/rules/QA-PIPELINE.md` — optional per-project domain rules + roles + tenant config (template: `.project-management/templates/qa-pipeline-template.md`)
- `commands/generate-test-cases.md` — BDD suite generation pipeline built on this rule
- `commands/modules/execute-work-quality-gates-core.md` (Testing block) + `execute-work-quality-gates-domain.md` (Suite Conformance Gate) — where this rule is enforced

---

**Version:** 1.3.0
