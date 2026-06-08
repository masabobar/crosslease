---
name: manual-test-suite-generator
description: "Convert Jira user story acceptance criteria into executable BDD test cases using Gherkin syntax. Invoke when the qa-lead pipeline reaches Stage 4, after jira-story-extractor (dor_status PASS) and requirements-design-comparator (comparison_status CLEAN or WARNINGS) have completed for the same story. Saves one .md file per story under src/e2e/tests/<Epic ID> <Epic Name>/ (e.g. src/e2e/tests/PRD1042-39 User Management/PRD1042-43 User Login.md). Creates the epic folder first if it does not already exist. The generated Gherkin contains ONLY happy-path and main-error scenarios — edge-case and separate-feature ACs are listed in the scope filter table but produce NO Gherkin block. Flags uncovered ACs."
allowed-tools: Read, Write, Bash, TaskCreate, TaskUpdate
model: sonnet
---

# BDD Test Case Generation from User Stories

Generate BDD test scenarios from a story, its design data, and the comparison report. Save the output as a `.md` file in `src/e2e/tests/`. This is Stage 4 of the qa-lead pipeline.

## Invocation

Called by the qa-lead agent with all three Stage 1–3 outputs sharing the same `story_id`.

**Preconditions — skip if either fails:**

- `dor_status: "PASS"` on the story object
- `comparison_status: "CLEAN"` or `"WARNINGS"` on the comparison report

On skip:

```
[SKIP] Story <ID> — <reason>. Resolve before generating tests.
```

## File output

### Epic folder resolution (run before writing the file)

1. Retrieve the parent epic from the story object returned by `jira-story-extractor` (`epic_id` + `epic_name` fields).
2. Construct the folder name: `<epic_id> <epic_name>` — title-case the epic name, strip special characters.
   - Example: epic ID `PRD1042-39`, epic name `User Management` → folder `PRD1042-39 User Management`
3. Check whether `src/e2e/tests/<folder>/` already exists:
   ```bash
   ls "src/e2e/tests/<folder>" 2>/dev/null || mkdir -p "src/e2e/tests/<folder>"
   ```
4. Write the story file inside that folder.

If the story object does not carry `epic_id` or `epic_name`, call `mcp__jira__get_issue` with the story ID and read the `Epic Link` or `Parent` field to resolve the epic before proceeding.

### File path and naming

- **Full path:** `src/e2e/tests/<Epic ID> <Epic Name>/<story-id> <Title Subject>.md`
  - Example: `src/e2e/tests/PRD1042-39 User Management/PRD1042-43 User Login.md`
- **Title Subject** — the shortest noun phrase that identifies the story's subject (2-4 words, title case, no special characters)
- **Format:** Single structured Markdown document with one unified Feature file block — never split into per-AC code blocks (see Output format section)
- Write the file using the `Write` tool; overwrite if it already exists

---

## Why this skill exists

User stories contain acceptance criteria (ACs) that must be testable and executable. This skill converts those ACs into **BDD scenarios** — plain-English test cases that:

- Bridge business requirements and test automation
- Create living documentation (human-readable test cases)
- Enable non-technical stakeholders to understand coverage
- Focus on **happy path + main error states** (not edge case explosion)

**Without this skill:** Testing departments write 50+ scenarios per user story, including every edge case. Tests become slow, flaky, and unmaintainable.

**With this skill:** Write 5-10 focused scenarios per US covering happy path + 1-2 main error types. Fast, maintainable, aligned with business logic.

---

## General workflow: US → BDD scenarios

### 0. MANDATORY Scope Filter — run this before writing any scenario

**This step is required. Do not skip it. Do not write a single scenario until this classification table is complete.**

For every AC in the story, assign one of five classifications:

| Classification     | Meaning                                                                                                                 | Action                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `happy-path`       | Core success flow — user completes the primary action                                                                   | INCLUDE — 1 Scenario Outline covering all roles                                                                 |
| `main-error`       | Directly blocks the user from completing the core workflow                                                              | INCLUDE — 1–2 scenarios max per error type                                                                      |
| `Blocked`          | Would have a Gherkin scenario but a specific named dependency (D-ID or R-ID) makes it untestable at E2E layer right now | SKIP — list in Blocked ACs table AND in scope filter with `Blocked` classification; no Gherkin, no pending stub |
| `edge-case`        | Boundary condition, implementation detail, rare state, or validation rule                                               | SKIP — appear in scope filter table only, no Gherkin                                                            |
| `separate-feature` | Has its own user story, own ticket, or own test file                                                                    | SKIP — appear in scope filter table only, no Gherkin                                                            |

> **Hard rule:** The `.md` file contains Gherkin blocks **only** for `happy-path` and `main-error` ACs. All other classifications are listed in the scope filter table with their rationale but produce **no Gherkin** — not conditional, not commented-out, not marked "fixme". Omit them entirely from the Gherkin output.

**Classification rules:**

- If the AC requires a specific named infrastructure dependency (D16, D17, D18, D19, D20, D21, etc.) to be testable → `Blocked`; record the dependency ID in the Blocked ACs table
- If the AC describes timing behaviour (timeouts, clock skew, token TTL) → `edge-case`
- If the AC describes internal implementation (JWT flags, key management, audit log format) → `edge-case`
- If the AC is about lockout after N attempts → `separate-feature`
- If the AC is about email/password format validation → `edge-case`
- If the AC is a RefiNext domain rule trigger (role access, Four-Eyes, tenant isolation) → generate exactly 1 auto-applied negative scenario, do not expand further
- If unsure between `main-error` and `edge-case`: ask "Does this block the primary user from completing the core action?" If yes → `main-error`. If no → `edge-case`.
- If unsure between `Blocked` and `separate-feature`: ask "Would this AC have a scenario here if the dependency were resolved?" If yes → `Blocked`. If it belongs in a different spec file regardless → `separate-feature`.

**Stop check:** If your classification table has more than 4 ACs labelled `happy-path` or `main-error`, re-evaluate — most stories have 1 happy path and 2–3 main errors. Everything else is edge-case or separate-feature.

**Total target after filtering: 5–10 scenarios. If you reach 11+, go back to the filter table and reclassify.**

---

### 1. Parse & Filter

```
Input: User story with ACs, roles, dependencies

US 28.1: User Login
  Roles: Bank Admin, Front Office, Back Office, LC User, Auditor
  ACs: AC-03 (valid login), AC-05 (role redirect), AC-06 (generic error), AC-07 (blocked users)
```

**Identify scope — Happy Path + Main Errors:**

- ✅ Happy path: Valid credentials → authenticated & redirected
- ✅ Main error #1: Wrong password → generic error (no account exposure)
- ✅ Main error #2: Suspended/deactivated user → login blocked
- ❌ Skip: Email format validation, account lockout (separate feature), session timeout (separate feature)

### 2. Build Role-AC Matrix (Minimal)

| Role            | Happy Path           | Error #1                 | Error #2              |
| --------------- | -------------------- | ------------------------ | --------------------- |
| Bank Admin      | ✓ Login → /admin     | ✓ Wrong password → error | ✓ Suspended → blocked |
| Front Office    | ✓ Login → /fo        | —                        | —                     |
| All other roles | ✓ (Scenario Outline) | —                        | —                     |

**Rule:** Test 1 role in detail with all error scenarios. Use Scenario Outline for happy path across all roles. Avoid role × error combinations (test explosion).

### 3. Write Scenarios

- **Happy path:** 1 Scenario Outline with all roles (concise, covers breadth)
- **Main errors:** 1-2 scenarios per error type (wrong password, user blocked)
- **Total:** ~7 scenarios per US (not 20-50)

---

## Gherkin patterns

### Feature file structure

```gherkin
@us-X.X @p0 @ac-XX
Feature: Feature Title (US X.X)
  As a [role]
  I want [action]
  So that [business value]

  Background:
    Given [shared precondition for all scenarios]

  @pattern-tag
  Scenario: [Title describing AC being tested]
    Given [initial state]
    When [action]
    Then [expected outcome]
    And [additional assertion]
```

### Pattern 1: Happy Path (All Roles in Scenario Outline)

```gherkin
@happy-path @ac-03 @ac-05
Scenario Outline: Valid login redirects to role dashboard (AC-03, AC-05)
  Given a <role> user with email <email> exists
  When I log in with email <email> and valid password
  Then I should be redirected to <landing_page>
  And a session should be created with role <role>

  Examples:
    | role          | email          | landing_page     |
    | Bank Admin    | admin@bank.com | /dashboard/admin |
    | Front Office  | fo@bank.com    | /dashboard/fo    |
    | Back Office   | bo@bank.com    | /dashboard/bo    |
```

**Why:** Tests happy path once per role. Fast. Covers all roles.

### Pattern 2: Main Error #1 (Wrong Credentials)

```gherkin
@main-error @ac-06
Scenario: Wrong password shows generic error (AC-06)
  Given a user with email "valid@bank.com" exists
  When I log in with email "valid@bank.com" and password "wrong_password"
  Then I should see an error message
  And the message should NOT contain "password incorrect"
  And the message should NOT contain "account does not exist"
```

**Why:** Tests error message doesn't expose account existence (security). Tests once, not once per role.

### Pattern 3: Main Error #2 (Lifecycle State Blocks Action)

```gherkin
@main-error @ac-07
Scenario Outline: Blocked users cannot log in (AC-07)
  Given a <state> user with email <email> exists
  When I log in with email <email> and valid password
  Then I should NOT be authenticated

  Examples:
    | state       | email                 |
    | suspended   | suspended@bank.com    |
    | deactivated | deactivated@bank.com  |
```

**Why:** Tests 2 lifecycle states (main error). Avoids testing every state for every role.

---

## RefiNext domain rules — auto-applied

In addition to AC-driven scenarios, always generate these scenarios when the story triggers the condition:

| Trigger                           | Auto-generated scenario                                         |
| --------------------------------- | --------------------------------------------------------------- |
| Any AC involving role access      | Negative: wrong role cannot perform the action (403)            |
| Four-Eyes (submit + approve)      | Negative: same user cannot submit and approve                   |
| Tenant isolation                  | Negative: cross-tenant request returns 404, not 403             |
| Async op (cashflow / score)       | Verify stale indicator appears; result updates after completion |
| State transition                  | Valid transition succeeds; invalid transition is blocked        |
| Regulatory (MaRisk / BAIT / GDPR) | Compliance scenario tagged `@compliance`                        |

---

## RefiNext login example (focused scope)

```gherkin
@auth @us-28.1 @p0
Feature: User Login (US 28.1 — PRD1042-43)
  As a user
  I want to authenticate with email and password
  So that I can access the system with my role context

  Background:
    Given the login page is accessible at "/login"

  @happy-path @ac-03 @ac-05
  Scenario Outline: Valid login redirects to role dashboard (AC-03, AC-05)
    Given a <role> user with email <email> exists
    When I log in with email <email> and valid password
    Then I should be redirected to <landing_page>
    And a session should be created with role <role>

    Examples:
      | role          | email            | landing_page       |
      | Bank Admin    | admin@bank.com   | /dashboard/admin   |
      | Front Office  | fo@bank.com      | /dashboard/fo      |
      | Back Office   | bo@bank.com      | /dashboard/bo      |
      | LC User       | lc@lender.com    | /workspace/lc      |
      | Auditor       | auditor@bank.com | /audit/trail       |

  @main-error @ac-06
  Scenario: Wrong password shows generic error (AC-06)
    Given a user with email "valid@bank.com" exists
    When I log in with email "valid@bank.com" and password "wrong_password"
    Then I should see an error message
    And the message should NOT contain "password incorrect"
    And the message should NOT contain "account does not exist"

  @main-error @ac-07
  Scenario Outline: Blocked users cannot log in (AC-07)
    Given a <state> user with email <email> exists
    When I log in with email <email> and valid password
    Then I should NOT be authenticated

    Examples:
      | state       | email                 |
      | suspended   | suspended@bank.com    |
      | deactivated | deactivated@bank.com  |
```

**Coverage:** 1 happy path Outline (5 roles) + 2 error scenarios = **7 total**. Fast. Focused. Maintainable.

**Not included (edge cases):**

- ❌ Non-existent email (same error as wrong password, redundant)
- ❌ Account lockout after 5 attempts (separate feature: US 28.9)
- ❌ Session timeout after 15min (separate feature: US 28.10)
- ❌ JWT expiry/tampering (separate feature: session management)

---

## RBAC example (access control)

```gherkin
@rbac @us-28.12 @p0
Feature: Role-Based Access Control (US 28.12)
  As a Bank Admin
  I want role-based permissions enforced
  So that users only access allowed actions

  @happy-path @ac-02
  Scenario Outline: Navigation reflects user role (AC-02)
    Given I am logged in as <role>
    Then I should see <visible_modules> in navigation
    And I should NOT see <hidden_modules>

    Examples:
      | role         | visible_modules        | hidden_modules     |
      | Bank Admin   | Users, Audit Trail     | LC Workspace       |
      | Front Office | Refinancing, Dashboard | Approval, Risk     |
      | Back Office  | Approval, Risk         | Refinancing, Audit |
      | LC User      | Dashboard              | Approval, Risk     |

  @main-error @ac-03
  Scenario: FO user cannot approve financing (AC-03)
    Given I am logged in as Front Office
    And financing request "FIN-001" exists
    When I POST to "/api/financings/FIN-001/approve"
    Then the response status should be 403

  @main-error @ac-03
  Scenario: BO user cannot originate request (AC-03)
    Given I am logged in as Back Office
    When I POST to "/api/refinancing-requests"
    Then the response status should be 403
```

---

## Main error states vs edge cases

**Main Error States** (INCLUDE):

- Blocks user from completing core workflow
- Directly related to AC in user story
- Affects primary user roles
- Examples: Wrong password, suspended user, unauthorized role, missing required field

**Edge Cases** (SKIP):

- Optimization or enhancement scenarios
- Extreme boundary conditions
- Implementation details (timing, token formats)
- Rare or admin-only states
- Examples: Email format validation, password strength, lockout after N attempts, clock skew tolerance

### Decision table

| Scenario                           | Type       | Include? | Why                               |
| ---------------------------------- | ---------- | -------- | --------------------------------- |
| User enters wrong password         | Main error | ✅       | Blocks login                      |
| User enters email without @        | Edge case  | ❌       | Validation rule, separate feature |
| Suspended user tries to log in     | Main error | ✅       | Blocks login                      |
| Deactivated user tries to log in   | Main error | ✅       | Blocks login                      |
| Account locked after 5 attempts    | Edge case  | ❌       | Separate feature (US 28.9)        |
| Session timeout after 15min        | Edge case  | ❌       | Separate feature (US 28.10)       |
| Unauthorized role tries API action | Main error | ✅       | Blocks action                     |
| User without specific permission   | Edge case  | ❌       | RBAC policy detail                |

---

## AC coverage check

After generating scenarios, run a coverage check and print the result to terminal output only — do not write it to the `.md` file:

- Every `happy-path` and `main-error` AC must have ≥ 1 scenario tracing to it
- Print gaps as `[UNCOVERED AC: AC-X]` in terminal output
- Every scenario must cite its AC via `@ac-XX` tag and title suffix `(AC-XX)`
- If a scenario cannot be traced to a specific AC, it is either a story gap (log it to terminal) or exploratory (label `@exploratory`)

---

## Best practices

### DO ✅

- **1 happy path Outline** — Tests all roles in one Scenario Outline
- **1-2 main error scenarios** — Test primary error cases, not every variation
- **Identify main vs edge errors** — Main = blocks user, Edge = optimization
- **Use Scenario Outline for happy path** — Avoid repeating same test per role
- **Declarative, not scripted** — Write "I log in" not "click field, enter email, click button"
- **Tag every scenario** — Use `@us-X.X`, `@ac-XX`, `@p0`, `@happy-path`, `@main-error`
- **Use semantic selectors** — `button:has-text("Login")` not `button.btn-primary-lg`
- **Skip blocked ACs** — if a required environment override, seam, or API is unavailable, do not write a scenario and do not write a pending stub; list the AC in the Blocked ACs table in the file header only

### DON'T ❌

- **Don't test every role × every error** — "5 roles × 3 errors = 15 scenarios" = test explosion
- **Don't include every edge case** — Email format, password strength, rare states
- **Don't mix multiple ACs in one scenario** — Each scenario tests one behavior
- **Don't test implementation details** — Clock skew, token refresh timing, internal functions
- **Don't create timing-dependent tests** — Mock timeouts, don't wait real time
- **Don't skip main error cases** — Must cover wrong password, user blocked, unauthorized role

**Rule of thumb:** If writing 20+ scenarios per US, reduce scope to happy path + main errors.

---

## Tagging convention

```gherkin
@us-28.1 @ac-03 @p0 @auth @happy-path
Scenario: Valid login creates session

@us-28.12 @ac-03 @p0 @rbac @main-error
Scenario: Unauthorized API action rejected

```

**Tag format:**

- `@us-X.X` — User Story ID (e.g., `@us-28.1`)
- `@ac-XX` — Acceptance Criterion (e.g., `@ac-03`)
- `@p0` / `@p1` / `@p2` / `@p3` — Priority (P0 = blocker, P3 = nice-to-have)
- `@happy-path` / `@main-error` / `@compliance` / `@exploratory` — Scenario type (use `@main-error`, never `@error-handling`)
- `@pending` — Blocked; no scenario generated, no pending stub written; listed in the Blocked ACs table in the file header only

---

## Output format (per story)

The `.md` file is a **single structured document** with six mandatory sections in this exact order. Do not include Stage 3 comparison reports, traceability notes, or pipeline metadata. All Gherkin scenarios go into one unified Feature file block — never split into per-AC code blocks.

````markdown
# <Story ID> — <US Number> | <Epic Area> | <Story Title>

Generated: <YYYY-MM-DD>
Story: <story-id> — <US number> | <Epic Area> | <Story Title>
Epic: <epic-id> — <Epic number>: <Epic Title>
DoR status: PASS (<N> ACs, description present, stakeholder-reviewed, <Jira status>)
ACs with Gherkin scenarios: <N> of <Total> | Blocked: <N> (<dependency IDs>) | Excluded: <N> (edge-case or separate-feature — scope filter table only)
Figma design: Node <node-id>, file <file-key> — Screen "<Screen Name>" (Stage 2 <COMPLETE|PARTIAL> — <note if partial>)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                             | Blocking dependency             |
| ----- | ---------------------------------- | ------------------------------- |
| AC-XX | <why this AC cannot be tested E2E> | <dependency ID> — <short label> |

---

## AC Scope Filter

| AC    | Description      | Classification     | Rationale                                  |
| ----- | ---------------- | ------------------ | ------------------------------------------ |
| AC-01 | <AC description> | `happy-path`       | <why included and how tested>              |
| AC-02 | <AC description> | `Blocked`          | <dependency and why it blocks E2E testing> |
| AC-03 | <AC description> | `separate-feature` | <which other story/spec covers it>         |
| AC-04 | <AC description> | `edge-case`        | <why it is not an E2E concern>             |

**Gherkin generated for:** AC-01, AC-05, AC-07, ...
**Blocked (pending stubs only):** AC-02, AC-06, ...
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04, ...

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.** Never interleave.

| Tag           | Scenario                                             | AC    | Priority |
| ------------- | ---------------------------------------------------- | ----- | -------- |
| `@happy-path` | <Scenario title> (Scenario Outline — <N> <variants>) | AC-XX | P0       |
| `@main-error` | <Scenario title>                                     | AC-XX | P0       |

Active scenario blocks: <N> (<N> Outlines + <N> Scenarios)

---

## Feature file

```gherkin
@<domain> @us-X.X @p0
Feature: <Story Title> (US X.X — <story-id>)
  As a <role>
  I want <action>
  So that <business value>

  Background:
    Given <shared precondition>
    And <shared precondition>

  # ---------------------------------------------------------------------------
  # <HAPPY PATH | MAIN ERROR> — AC-XX[, AC-YY]
  # <1–3 lines explaining what this scenario group tests and WHY.>
  # <Note any design gap, copy source, or important constraint.>
  # ---------------------------------------------------------------------------

  @<happy-path|main-error> @ac-XX @p0
  Scenario[Outline]: <Title> (AC-XX)
    Given ...
    When ...
    Then ...

    [Examples:
      | col |
      | val |]

  # ---------------------------------------------------------------------------
  # <next group header>
  # ---------------------------------------------------------------------------

  @<tag> @ac-YY @p0
  Scenario: ...
```
````

---

## Blockers and Gaps Summary

| Severity       | Item                                                | AC    | Resolution required from                            |
| -------------- | --------------------------------------------------- | ----- | --------------------------------------------------- |
| MAJOR          | <design gap or ambiguity>                           | AC-XX | <Designer / BA / Dev team / PO> — <action required> |
| BLOCKER (<ID>) | <dependency label>                                  | AC-XX | <Dev team> — <what to provide>                      |
| INFO           | <open question that does not block test generation> | AC-XX | <who answers it>                                    |

```

### Format rules (enforced — do not deviate)

1. **Header** — six fields exactly as shown; `DoR status` includes AC count, description/stakeholder status, and Jira status in parentheses; `Figma design` includes node ID, file key, screen name, and PARTIAL/COMPLETE note
2. **Blocked ACs** — always the first section after the header, before the Scope Filter; omit the section entirely if there are no blocked ACs
3. **AC Scope Filter** — column names are `AC | Description | Classification | Rationale`; `Classification` values are exactly `happy-path`, `main-error`, `edge-case`, `separate-feature`, or `Blocked` (title-case for Blocked); ends with the three-line `**Gherkin generated for / Blocked / No Gherkin**` summary
4. **Scenarios summary** — table plus `Active scenario blocks: N (N Outlines + N Scenarios)` line; backtick-wrap tag values (e.g. `` `@happy-path` ``); all `@happy-path` rows must appear before any `@main-error` rows — never interleave
5. **Feature file** — one single fenced `gherkin` block containing the Feature header, Background, and all scenarios; scenario groups separated by `# ---` comment blocks; never split into per-AC sections
6. **Comment block format** — exactly 75 dashes, keyword on first line (`# HAPPY PATH`, `# MAIN ERROR`), 1–3 explanation lines, 75 dashes closing; always present before every scenario group
7. **Blockers and Gaps Summary** — always the last section; `Severity` values are `CRITICAL`, `MAJOR`, `MINOR`, `BLOCKER (<ID>)`, or `INFO`; `BLOCKER` entries use the dependency ID in parentheses

**Framework:** Cucumber + Playwright | **Language:** Gherkin
```
