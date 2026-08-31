---
layer: shared
paths:
  - "**/*auth*"
  - "**/*role*"
  - "**/middleware/**"
  - ".project-management/input/backlog/**"
  - "**/routes/**"
  - "**/api/**"
  - "**/controllers/**"
  - "**/handlers/**"
  - "**/loaders/**"
  - "**/actions/**"
  - "**/pages/**"
  - "**/screens/**"
---

# Role-Access Matrix — Every Role × Every Endpoint/Screen

**Version:** 1.1
**Status:** Active

**MANDATORY on multi-role projects whenever a role-guarded endpoint or screen is added/changed.** Authorization holes hide in the roles nobody tried: the happy path is tested with the intended role and one wrong-role scenario uses one representative role — every OTHER role's access to every action stays unproven. This rule closes that with a declared allowed-roles set per story and one **parameterized** access test per endpoint/screen iterating the FULL role registry.

> Single-role projects: this rule reduces to the existing 401/403 matrix rows (`testing.md`) — no declaration or matrix test needed.

---

## §1 Declaration — `**Allowed Roles:**` on the story

- **Every story that touches a role-guarded endpoint or screen MUST declare** `**Allowed Roles:** <Role, Role, ...>` (template: `documentation-templates.md` §1.1). Sentinels: `public` (no auth), `all-authenticated` (any logged-in role). Hierarchy shorthand `ADMIN+` is allowed on projects where `requireRole` is ordinal (`security-and-auth.md` §3.1) — the matrix test still iterates the registry, expanding the shorthand to the explicit set.
- **Frontend stories** additionally fill the `Allowed roles` column of the `**API Endpoints Used:**` table (per-endpoint — `screen-driven-backlog.md` §3); the story-level field covers the screen itself.
- **Values are validated against the role registry** — `QA-PIPELINE.md` → `Roles`, or `project-rules.md` → `## Roles` (`test-scoping.md` §5). A role name not in the registry is a blocker. Roles mentioned in story prose/ACs NEVER substitute for the declaration — prose describes intent; the field is the contract.
- **Default state:** the project declares `**Default Allowed Roles:**` next to the registry (QA-PIPELINE.md wins over project-rules.md when both configured; unset = `all-authenticated`). Story generators (`/process-client-docs`, `/init-project`, `/adopt-project`, `/add-scope`, `/resolve-questions`) always WRITE an explicit value — doc/code evidence first, else the default — never leave the field implied; a default-filled value is confirmed via a skippable clarification question (external-id precedent).
- **Missing declaration** (multi-role project, guarded surface touched) → **`[DoR FAIL]`** in `/generate-test-cases` Stage 1 and **Blocked** at the `/execute-work` quality gate.

## §2 API Matrix Test — one parameterized test per endpoint

For EVERY touched role-guarded endpoint, ONE parameterized integration test iterating `registry ∪ {anonymous}`:

| Caller | Expected |
|--------|----------|
| Each ALLOWED role | 2xx (the action succeeds) |
| Each DISALLOWED registry role | 403 `FORBIDDEN_*` (or the project's tenant-mismatch status from `QA-PIPELINE.md` where the denial is tenant-scoped) |
| Anonymous (no credential) | 401 `AUTH_REQUIRED` |

- **Direct request** (request-context/supertest), never through the UI (`testing.md` — "Guard Parity & Direct Endpoint Testing").
- **Mutation denials assert unchanged state** — a 403 whose side effect still happened is a failing test.
- Test data comes from the mandated per-role seed (`test-construction.md` §1 — "one user per role"); iterate the registry programmatically (`for role of ROLES`) so a registry change fails the test instead of silently shrinking coverage.

```typescript
describe.each(ROLES)('POST /api/v1/orders/:id/approve as %s', (role) => {
  it(ALLOWED.includes(role) ? 'succeeds (200)' : 'is denied (403) and state unchanged', async () => { ... });
});
it('rejects anonymous (401)', async () => { ... });
```

## §3 Screen Matrix Test — per-role access smoke

For EVERY touched role-guarded screen, one parameterized per-role access check:

- Each ALLOWED role → the screen renders (screen-root `data-testid` / `Key` visible — `frontend-test-identifiers.md`).
- Each DISALLOWED registry role → redirected/denied (never a rendered screen with dead buttons).
- Anonymous → login redirect.

This is an ACCESS smoke, not a per-role E2E flow — the happy-path Scenario Outline (`test-scoping.md` §2) already exercises the flow across allowed roles. Remember the loader redirect is UX, not security (`testing.md` Guard Parity) — the screen's actions are covered by §2.

## §4 Budget & Gherkin Representation

- The matrix is an **integration-layer requirement**, exactly like the per-endpoint status-code matrix: the `test-scoping.md` scope filter and 5–10 scenario budget do NOT reduce it (`test-scoping.md` §4).
- In generated Gherkin suites, wrong-role coverage is **ONE Scenario Outline** with an `Examples:` row for EVERY disallowed registry role, tagged `@role-access` (`test-cases-suite-generator.md` Pattern 3) — one scenario block, full visible coverage.
- The role × FUNCTIONAL-error ban stands (`test-scoping.md` §2): never duplicate validation/business-error scenarios per role. The ACCESS axis is the sanctioned exception because each cell is one cheap assertion, not a flow.

## §5 Validation Chain

How coverage is verified, end to end:

1. **DoR gate** — `/generate-test-cases` Stage 1 fails a multi-role story touching a guarded surface without `**Allowed Roles:**` (`test-cases-story-extraction.md`).
2. **Quality gate** — `/execute-work` requires the matrix test for every touched guarded endpoint/screen, iterating the FULL registry (`execute-work-quality-gates-core.md` Testing block); missing declaration or partial registry coverage = **Blocked**.
3. **Screen-map drift** — `/screen-map` cross-checks the hand-curated `Auth` column and derived endpoint roles against story declarations; disagreement is a drift finding (`screen-inventory.md`).
4. **`/run-tests role <Role>`** — runs the matrix tests + `@role-access` scenarios touching one role (e.g. after changing that role's permissions).
5. **Roles change AFTER completion** — `/add-scope edit story` updating `**Allowed Roles:**` on a `Completed` story appends `**Retest Required:** roles changed <old> → <new> (<date>)` to the story + logs to `blockers.md`; the story STAYS `Completed` (dashboard counters untouched). `/execute-work story US-XXX` then runs a **re-verification unit**: adjust the guards, update the matrix test to the new declaration, `/run-tests role` for every role added/removed, full gates — and clears the marker. A declaration edit alone never counts as done.

---

## Related

- `.claude/rules/test-scoping.md` — §2 functional-error ban (stands), §4 layering exemption, §5 wrong-role Outline
- `.claude/rules/testing.md` — status-code matrix, Guard Parity & Direct Endpoint Testing
- `.claude/rules/security-and-auth.md` §3.1/§8 — `requireRole`, per-role 403 test
- `.claude/rules/screen-driven-backlog.md` §3 — the `Allowed roles` endpoint-table column
- `.claude/rules/screen-inventory.md` — screen `Auth` cross-check + drift
- `.claude/rules/test-construction.md` §1 — per-role seed users (the fixture substrate)
- `.claude/rules/documentation-templates.md` §1.1 — the `**Allowed Roles:**` story field

---

**Status:** ✅ Active
