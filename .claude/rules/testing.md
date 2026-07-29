# Testing Requirements (Frontend)

**Version:** 2.0
**Last Updated:** 2026-07-05
**Status:** Active

**MANDATORY: Every new feature ships with unit tests for its Zod schemas, store logic, and utilities. Tests are updated when the code they cover changes, and the full suite passes before a task is marked complete. We test behavior, not line-coverage percentages.**

> **FE-only repo.** The API status-code test matrix (200/400/401/403/404/500 per endpoint) applies to `../refinext-api/`, not here. The FE equivalent: every error code the UI distinguishes has an i18n key, and logic that branches on a code has a test.

---

## Stack

- **Vitest** — unit tests; all test files under `src/__tests__/`, mirroring the source tree
- **Playwright** — E2E under `src/e2e/`, **owned by QA**. Developers do not write Playwright specs.
- No component testing (`@testing-library/react`) — logic is covered by unit tests; UI flows by QA's E2E suite.

> **Not a substitute for looking at the page.** Every feature and bug fix is also exercised in a real
> browser before handoff — see `.claude/rules/browser-verification.md`. That is interactive verification
> by Claude, produces **no committed spec files**, and does not change the rule above: E2E specs stay
> QA's. It exists because no gate here renders a page — an i18n key missing from _both_ locales, a
> mis-scoped role gate, or a console error all pass unit tests, type-check, and lint.

Use `@/` alias imports in test files — never relative paths back into `src/`.

## What We Test

**1. Zod schemas (API contracts)** — every API response schema gets tests asserting it accepts the documented shape and rejects wrong ones (wrong types, missing required fields, invalid enum values):

```ts
// src/__tests__/features/users/api/schema.test.ts
it("rejects unknown status value", () => {
  expect(() => UserSchema.parse({ ...validUser, status: "banana" })).toThrow()
})
```

**2. Zustand store logic** — state transitions and actions in isolation, no component needed:

```ts
it("clears tokens on logout", () => {
  useAuthStore.getState().setTokens("acc", "ref")
  useAuthStore.getState().clearTokens()
  expect(useAuthStore.getState().accessToken).toBeNull()
})
```

**3. Utility functions** — pure functions in `src/lib/` get unit tests.

## What We Skip (deliberately)

- Component tests — not used in this project
- Snapshot tests — noisy, catch the wrong things
- **Coverage percentage targets** — test behavior, not lines; no numeric threshold is enforced
- Testing TypeScript types — the compiler handles that
- E2E / Playwright specs — QA's responsibility

## Definition of Done

- [ ] New Zod schemas, store actions, and `src/lib/` utilities have tests
- [ ] Existing tests touching modified code are updated (not deleted or `.skip`ped to pass)
- [ ] `pnpm test:run`, `pnpm type-check`, `pnpm lint` all pass locally
- [ ] No `.only` focused tests (pre-commit blocks these)
- [ ] New interactive elements have `data-testid` attributes (for QA's E2E suite)

---

## Related

- `.claude/rules/code-review.md` §9 — testing review checklist
- `.claude/rules/api-error-display.md` — error codes the UI must distinguish
- `../refinext-api/` — backend endpoint test matrix lives with the backend
- `.project-management/rules/project-rules.md` — project-specific testing requirements

---

**Status:** ✅ Active
