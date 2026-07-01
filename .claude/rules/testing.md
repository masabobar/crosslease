# Testing Requirements

## Mandatory Test Coverage

- Write tests for ALL new features
- Update tests when modifying existing code
- Run tests before marking task as completed
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
