# Testing Requirements

## Mandatory Test Coverage

- Write tests for ALL new features
- Update tests when modifying existing code
- **Tests are the mandatory FINAL STEP of every task** — they always run before a task is marked complete and before any commit. This is a hard gate: if tests fail, fix and re-run; if still red, the task is **blocked** (not committed). Enforced by `/execute-work` (see `commands/modules/execute-work-quality-gates.md`).
- Minimum 80% code coverage target

---

## API Route Testing Matrix

**MANDATORY for all API endpoints:**

| Status Code | Scenario                                 | Required     |
| ----------- | ---------------------------------------- | ------------ |
| **200/201** | Success cases                            | ✅ MUST TEST |
| **400**     | Bad request / validation errors          | ✅ MUST TEST |
| **401**     | Unauthorized (no/invalid authentication) | ✅ MUST TEST |
| **403**     | Forbidden (insufficient permissions)     | ✅ MUST TEST |
| **404**     | Resource not found                       | ✅ MUST TEST |
| **500**     | Server error handling                    | ✅ MUST TEST |

**Every API endpoint MUST test ALL six status codes above.**

---

## Test Organization

Organize tests by type:

- **Unit tests:** `__tests__/unit/` or co-located `*.test.ts`
- **Functional tests:** Co-located with components `*.test.tsx`
- **Integration tests:** `__tests__/integration/` for API endpoints
- **E2E tests:** `__tests__/e2e/` for critical user flows

---

## Test Completion Criteria

A task is NOT complete until:

- [ ] All test types implemented
- [ ] All status codes tested (200, 400, 401, 403, 404, 500)
- [ ] Edge cases covered
- [ ] Error scenarios validated
- [ ] Tests pass locally
- [ ] Tests pass in CI/CD pipeline
- [ ] Code coverage meets minimum threshold (80%+)

---

## Related-Test Re-Validation (on API / DB / enum change)

**MANDATORY: when a change touches an API endpoint, a DB entity/schema, or a cross-layer enum, you MUST find and re-run ALL existing tests that exercise it — not just the new tests you wrote.** A change can break a test that was the only thing encoding a real consumer expectation; running just your new tests hides that.

Find related tests by grepping the test tree for the identifier that changed (same mechanism as `.claude/rules/api-versioning.md` §5.3):

| Change                                                                         | Find related tests with                                  | Then                                                                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **API endpoint** (handler / route / `/api/...` path)                           | `grep -rln "<path>\|<handlerName>" tests/`               | Re-run all matches; status-code matrix (above) still fully covered. See `api-versioning.md` §5.3. |
| **DB entity / schema** (`schema.prisma` model, migration, entity service/repo) | `grep -rln "<ModelName>" tests/` (+ table-name variants) | Re-run all matches. See `.claude/rules/database.md`.                                              |
| **Cross-layer enum** (value crossing DB↔BE↔FE)                                 | `grep -rln "<ENUM_VALUE>\|<EnumTypeName>" tests/`        | Re-run all matches. See `.claude/rules/enums-and-constants.md`.                                   |

A related test that **fails** is a signal — either it encoded a consumer expectation you broke, or the change is breaking and was misclassified. Fix it correctly (or version the change); never "fix" a test by mirroring the new shape just to make it green.

This re-validation is part of the mandatory final test step. `/run-tests api <path>` and `/run-tests entity <Model>` run exactly these scoped sets.

---

## Example Test Structure

```typescript
// Integration test for API endpoint
describe("POST /api/users", () => {
  it("should create user with valid data (200)", async () => {
    // Test success case
  })

  it("should reject invalid email (400)", async () => {
    // Test validation error
  })

  it("should require authentication (401)", async () => {
    // Test unauthorized access
  })

  it("should prevent non-admin access (403)", async () => {
    // Test forbidden access
  })

  it("should handle non-existent resource (404)", async () => {
    // Test not found
  })

  it("should handle database errors (500)", async () => {
    // Test error handling
  })
})
```

---

**Related:**

- `.claude/rules/api-versioning.md` §5.3 — when an endpoint changes, **all tests** touching it must re-run and pass (not just new tests)
- `.project-management/rules/project-rules.md` for project-specific testing requirements
