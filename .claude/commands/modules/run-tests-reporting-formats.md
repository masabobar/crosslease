# Run Tests — Report Formats

Companion to `run-tests-reporting.md`. Holds the concrete report blocks emitted by `/run-tests` — success, failure, coverage, API-codes, quality-gate summary.

---

## Success Report (all tests passing)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
✅ Unit Tests:         45/45 passed
✅ Integration Tests:  18/18 passed
✅ E2E Tests:           6/6 passed
⏱  Duration:          12.3s
📊 Coverage:          87% (target 80%+)

✅ ALL TESTS PASSED

✅ QUALITY GATES:
- Coverage:         ✅ 87% (target 80%+)
- API Status Codes: ✅ all tested
- Critical Paths:   ✅ E2E passing

🎯 READY TO COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Failure Report (some tests failing)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
⚠️  Unit Tests:         43/45 passed (2 failed)
⚠️  Integration Tests:  17/18 passed (1 failed)
✅ E2E Tests:           6/6 passed
⏱  Duration:          12.3s
📊 Coverage:          82% (target 80%+)

❌ FAILED TESTS (3):

1. UserService.createUser — handles duplicate email
   File:  src/services/user.service.test.ts:45
   Error: Expected status 400, received 500

2. UserService.updateUser — validates permissions
   File:  src/services/user.service.test.ts:78
   Error: AssertionError: expected false to be true

3. POST /api/products — returns 401 when unauthorized
   File:  test/api/products.integration.test.ts:23
   Error: Expected status 401, received 403

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDATIONS:

1. UserService.createUser (line 45)
   → Check duplicate-email handling in user.service.ts
   → Verify database UNIQUE constraint

2. UserService.updateUser (line 78)
   → Review permission check logic
   → Verify user-role assignment

3. POST /api/products auth (line 23)
   → Check auth middleware order
   → Verify token validation logic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 NEXT STEPS:
1. Fix failed tests above
2. Re-run: /run-tests all
3. Verify all pass before committing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Coverage Report (informational, ≥ 80%)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COVERAGE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Coverage: 87% ✅ (target 80%+)

Breakdown:
  Statements: 87.5%  (350/400)  ✅
  Branches:   82.3%  (140/170)  ✅
  Functions:  91.2%  (104/114)  ✅
  Lines:      87.5%  (350/400)  ✅

Top uncovered files:
1. src/services/payment.service.ts — 45%  ⚠️
   Missing: lines 23-45, 67-89

2. src/utils/validators.ts — 72%  ⚠️
   Missing: lines 15-18

3. src/api/webhooks.ts — 68%  ⚠️

💡 RECOMMENDATIONS:
- Add tests for payment error handling (payment.service.ts:23-45)
- Test validation edge cases (validators.ts:15-18)
- Test webhook failure scenarios (webhooks.ts:34-56)

📄 Full report: coverage/index.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Coverage Below Threshold (< 80%)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COVERAGE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Coverage: 73% ❌ (target 80%+)

Breakdown:
  Statements: 73.2%  (293/400)  ❌
  Branches:   68.8%  (117/170)  ❌
  Functions:  79.8%   (91/114)  ⚠️
  Lines:      73.2%  (293/400)  ❌

❌ COVERAGE BELOW THRESHOLD

Critical uncovered files:
1. src/services/payment.service.ts — 28%  ❌
   Missing: lines 12-89 (77 lines)
   Impact:  HIGH — payment processing uncovered

2. src/api/checkout.ts — 45%  ❌
   Missing: lines 23-67 (44 lines)
   Impact:  HIGH — checkout flow partially tested

3. src/utils/validators.ts — 55%  ⚠️
   Missing: lines 15-38 (23 lines)
   Impact:  MEDIUM

🔧 REQUIRED ACTIONS:
1. Add payment service tests (priority: CRITICAL)
2. Add checkout API tests   (priority: CRITICAL)
3. Complete validator tests (priority: HIGH)

Target: +107 lines of test coverage to reach 80%

❌ CANNOT MARK STORY COMPLETE UNTIL COVERAGE ≥ 80%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## API Status-Code Missing

````
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  API STATUS-CODE COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking all endpoints for required status codes…

✅ POST /api/users
   ✅ 200, 400, 401, 403, 404, 500

❌ POST /api/products
   ✅ 200, 400, 404
   ❌ 401 MISSING
   ❌ 403 MISSING
   ❌ 500 MISSING

⚠️  PUT /api/users/:id
   ✅ 200, 400, 401, 404, 500
   ❌ 403 MISSING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 MISSING TESTS:

POST /api/products:
- 401 Unauthorized
- 403 Forbidden
- 500 Server error

PUT /api/users/:id:
- 403 Forbidden

📝 Example test stub for POST /api/products (401):

```javascript
it('should require authentication (401)', async () => {
  const res = await request(app)
    .post('/api/products')
    .send({ name: 'Test Product' });

  expect(res.status).toBe(401);
  expect(res.body.error).toBe('Unauthorized');
});
````

❌ CANNOT MARK STORY COMPLETE UNTIL ALL STATUS CODES TESTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

---

## Quality-Gate Summary (final block)

### Ready to commit

```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ QUALITY GATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All Tests: ✅ 69/69 passing
Coverage: ✅ 87% (target 80%+)
API Status Codes: ✅ all tested
Branch Coverage: ✅ 82%
Function Coverage: ✅ 91%
Critical E2E: ✅ all passing

🎯 READY TO COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

### Not ready

```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ QUALITY GATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All Tests: ❌ 66/69 passing (3 failed)
Coverage: ⚠️ 73% (target 80%+)
API Status Codes: ❌ 4 missing
Branch Coverage: ❌ 68%
Function Coverage: ✅ 91%
Critical E2E: ✅ all passing

❌ NOT READY — fix above before committing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

---

**Version:** 3.3.0
**Created:** 2026-04-21 (split from `run-tests-reporting.md`)
**Parent:** `run-tests-reporting.md`
```
