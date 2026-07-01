# Run Tests — Execution Module

**Purpose:** Test-execution strategies and scope filtering for `/run-tests`.

**Parent:** `.claude/commands/run-tests.md`
**Companion:** `run-tests-framework-commands.md` (framework-specific command reference — Vitest/Jest/Playwright)

---

## Test Type Execution

### 1. Unit Tests

**Command:** `pnpm test:run`

What to test:

- Individual functions, components, Zustand stores, Zod schemas
- Utilities, helpers, pure functions
- Business logic and role-based display logic

Tests live in `src/__tests__/`, mirroring the source tree (`src/__tests__/features/auth/api/`).
Use `@/` alias imports — never relative `./` paths pointing into `src/`.

**Variants:**

```bash
pnpm test:run                                # all unit tests (one-shot)
pnpm test                                    # watch mode
pnpm test:run path/to/file.test.ts           # specific file
pnpm test:run -t "description pattern"      # filter by test name
```

Expected output sample:

```
✓ useAuthStore — sets user on login
✓ contractSchema — rejects missing required fields
✓ formatCurrency — rounds to 2 decimal places
✓ hasRole — returns false for mismatched role
```

---

### 2. Type Check

**Command:** `pnpm type-check`

What to check:

- TypeScript compilation errors across the whole project
- Zod schema / component prop / store type mismatches
- Missing or incorrect import types

```bash
pnpm type-check              # full project check (tsc -b --noEmit)
```

Validation:

- [ ] Exits with code 0
- [ ] No `any` types introduced without justification
- [ ] All API response types derived from Zod schemas (no hand-written `interface` for API data)

---

### 3. Lint

**Command:** `pnpm lint`

What to check:

- ESLint rules across the codebase
- Import order, unused variables, React hooks rules

```bash
pnpm lint                    # full project lint
```

Validation:

- [ ] Exits with code 0
- [ ] No `eslint-disable` comments added without explanation

---

### 4. Coverage Run

**Command:** `pnpm test:run --coverage`

Runs all unit tests and emits a coverage report.

```bash
pnpm test:run --coverage                   # run + report
open coverage/index.html                   # view HTML report
```

> **Note:** E2E (Playwright) is owned by QA and lives in `src/e2e/`. Do not add or run Playwright specs.

Quality gates:

- [ ] Overall coverage ≥ 80%
- [ ] Branch coverage ≥ 75%
- [ ] Function coverage ≥ 85%

Sample output:

```
Coverage Summary:
  Statements : 87.5%  (350/400)
  Branches   : 82.3%  (140/170)
  Functions  : 91.2%  (104/114)
  Lines      : 87.5%  (350/400)
```

---

## Scope Filtering (by argument)

### Story-specific — `/run-tests story US-XXX`

1. Parse story ID from command.
2. Find tests tagged with the story ID.
3. Run matching tests only.

```bash
npm test -- --grep "US-045"        # pattern match
npm test -- __tests__/stories/US-045/   # folder match
```

Tag format inside test files:

```typescript
describe("US-045: User Profile", () => {
  // tests for this story
})
```

---

### File-specific — `/run-tests file <path>`

1. Parse file path from command.
2. Find the corresponding test file.
3. Run that test file.

Test file naming conventions:

- `ComponentName.test.tsx` — components
- `function-name.test.ts` — utilities
- `api-endpoint.integration.test.ts` — API routes

```bash
npm test -- src/services/user.service.test.ts  # direct
npm test -- src/services/user.service.ts       # infer .test neighbor
```

---

## Framework Commands

Verbatim invocation commands for Vitest, Jest, and Playwright — including watch mode, coverage flags, filters, and debug mode — live in **`run-tests-framework-commands.md`**.

---

## Error Handling During Execution

### Test failures

1. Capture failed test details (name, file, line, error message).
2. Identify root cause from the error (DB connection, validation, auth middleware, etc.).
3. Emit findings through the reporting module (`run-tests-reporting.md`) — don't hide failures behind a summary.

Example:

```
✗ POST /api/users — creates user (200)
  Expected status 200, received 500
  Error: Database connection failed
  at test/api/users.test.ts:15:20
```

### Coverage below threshold

1. Identify uncovered files.
2. Show uncovered lines.
3. Suggest where to add tests (prioritize by impact — auth, payments, checkout over utilities).

Example:

```
Coverage below threshold:
- src/services/payment.service.ts: 45% (missing: lines 23-45, 67-89)
- src/utils/validators.ts:         72% (missing: lines 15-18)

Recommendation:
1. Payment error handling  (lines 23-45)
2. Validation edge cases   (lines 15-18)
```

---

## Post-Execution Quality Checks

Before reporting success:

- [ ] All unit tests executed without errors (`pnpm test:run`)
- [ ] Coverage meets threshold (80%+)
- [ ] Type check clean (`pnpm type-check`)
- [ ] Lint clean (`pnpm lint`)
- [ ] No skipped tests (unless intentional + documented)
- [ ] No new warnings / deprecation notices

---

**Version:** 3.3.0
**Last Updated:** 2026-04-21 (split: framework-specific commands moved to companion)
**Related:**

- Parent: `.claude/commands/run-tests.md`
- Reporting: `run-tests-reporting.md` (+ `run-tests-reporting-formats.md`)
- Framework commands: `run-tests-framework-commands.md`
- Rules: `.claude/rules/testing.md`
