---
name: run-tests
description: Run tests with detailed reporting and coverage analysis (Vitest + type-check + lint)
---

# Run Tests Command

Execute testing with comprehensive reporting and analysis.

---

## Usage

```bash
/run-tests all              # Run unit tests + type-check + lint
/run-tests unit             # Vitest unit tests only
/run-tests type-check       # TypeScript type-check only
/run-tests lint             # ESLint only
/run-tests coverage         # Unit tests with coverage report
/run-tests story US-XXX     # Tests related to specific story
/run-tests file <path>      # Tests for specific file
```

> **Note:** E2E (Playwright) is owned by QA. Do not add or run Playwright specs.

---

## 📋 YOUR TASK

### STEP 1: PARSE ARGUMENTS

**Parse the command argument:**

- `all` → Run unit tests + type-check + lint
- `unit` → Vitest unit tests only (`pnpm test:run`)
- `type-check` → TypeScript check only (`pnpm type-check`)
- `lint` → ESLint only (`pnpm lint`)
- `coverage` → Unit tests with coverage (`pnpm test:run --coverage`)
- `story US-XXX` → Unit tests tagged/related to story US-XXX
- `file <path>` → Tests for specific file

---

### STEP 2: EXECUTE TESTS

**📖 See:** `modules/run-tests-execution.md` for detailed execution steps.

**Summary by test type:**

**Unit Tests (`pnpm test:run`):**

- Test individual functions, components, stores, Zod schemas
- Fast execution, no external dependencies
- Live in `src/__tests__/`, mirroring source tree

**Type Check (`pnpm type-check`):**

- Full TypeScript compilation check (`tsc -b --noEmit`)
- Catches type mismatches, missing imports, schema drift
- Run this when API schemas or component props change

**Lint (`pnpm lint`):**

- ESLint check across the codebase
- Catches code quality and style issues

**Coverage (`pnpm test:run --coverage`):**

- Run all unit tests with coverage
- Generate HTML report
- Check coverage threshold (80%+)

---

### STEP 3: ANALYZE RESULTS

**📖 See:** `modules/run-tests-reporting.md` for detailed reporting.

**Capture output:**

- Total tests run
- Passed / Failed counts
- Execution time
- Coverage percentage (if applicable)
- Type errors or lint errors

**Display results:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
✅ Unit Tests: {{passed}}/{{total}} passed
✅ Type Check: no errors
✅ Lint: no errors
⏱️  Duration: {{duration}}
📈 Coverage: {{coverage}}% {{(Target: 80%+)}}

{{If all passed:}}
✅ ALL CHECKS PASSED

{{If any failed:}}
❌ FAILURES:
- {{test_name}}: {{error_message}}
```

---

### STEP 4: VALIDATION CHECKS

**Verify quality gates:**

**Code Coverage:**

- [ ] Overall coverage ≥ 80%
- [ ] Branch coverage ≥ 75%
- [ ] Function coverage ≥ 85%

**TypeScript:**

- [ ] `pnpm type-check` exits with 0
- [ ] No `any` types introduced in new code without justification

**Lint:**

- [ ] `pnpm lint` exits with 0
- [ ] No eslint-disable comments added without explanation

**i18n (when I18N-RULES.md exists):**

- [ ] New user-visible strings use `t()` — no hardcoded text
- [ ] Translation keys added to both `en/<feature>.json` and `de/<feature>.json`

**API Data:**

- [ ] New API data consumed through Zod schemas (no raw `response.data as SomeType`)

---

### STEP 5: RECOMMENDATIONS

**If tests failed:**

- List failed tests with file locations
- Suggest potential fixes
- Recommend running specific test files

**If type-check failed:**

- List type errors with file:line references
- Identify whether the issue is in a Zod schema, component prop, or store

**If coverage < 80%:**

- Identify uncovered files/functions
- Suggest where to add tests

---

## 📚 Module References

- `modules/run-tests-execution.md` - Test execution details
- `modules/run-tests-framework-commands.md` - Vitest/tsc/eslint command reference
- `modules/run-tests-reporting.md` - Reporting & analysis

---

## ⚠️ IMPORTANT NOTES

### Test Requirements (from `project-rules.md`)

- **Developers write unit tests only** — Vitest
- **No Playwright E2E** — that is QA-owned (`src/e2e/`)
- Tests live in `src/__tests__/`, mirroring source (`src/__tests__/features/auth/api/`)
- Use `@/` alias imports in test files

### Quality Gates

Tests must pass before:

- Marking story as complete
- Creating git commit
- Merging to main branch

### Test Organization

**File naming:**

- `ComponentName.test.tsx` — component tests
- `function-name.test.ts` — utility/store/schema tests

**Test location:**

- `src/__tests__/features/<name>/` — mirrors `src/features/<name>/`
- `src/__tests__/shared/` — shared utilities and components

---

## 📝 Example Execution

```bash
# User runs:
/run-tests all

# Claude executes:
🧪 Running All Checks...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
✅ Unit Tests: 87/87 passed
✅ Type Check: no errors
✅ Lint: no errors
⏱️  Duration: 4.2s
📈 Coverage: 84% (Target: 80%+)

✅ ALL CHECKS PASSED

✅ QUALITY GATES:
- Coverage: ✅ 84% (Target: 80%+)
- Type Check: ✅ clean
- Lint: ✅ clean
- i18n: ✅ all new strings translated (en + de)

🎉 Ready to commit!
```

---

**Version:** 3.1.0 (FE adaptation — integration tests removed, type-check + lint added)
**Updated:** 2026-06-02
