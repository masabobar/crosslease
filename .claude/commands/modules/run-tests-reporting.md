# Run Tests — Reporting Module

**Purpose:** Reporting formats and the recommendations engine for `/run-tests`.

**Parent:** `.claude/commands/run-tests.md`
**Companion:** `run-tests-reporting-formats.md` (concrete output blocks — success, failure, coverage, API-codes, quality-gate summary)

---

## What This Module Covers

- Parsing strategy for test-runner output
- Framework-specific output markers
- Which reports to emit for which situation
- Recommendations engine
- Link to concrete report blocks (companion module)

---

## Output Parsing

Capture from test execution:

- Total tests run
- Passed / failed / skipped counts
- Execution time
- Coverage percentages (statements / branches / functions / lines)
- Failed test details — name, file, line, error message

### Framework-Specific Markers

**Vitest:**

```
Test Files  4 passed (4)
     Tests  45 passed (45)
  Start at  10:23:45
  Duration  2.34s
```

**Jest:**

```
Test Suites: 4 passed, 4 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.34 s
```

**Playwright:**

```
Running 6 tests using 3 workers

   auth-flow.e2e.test.ts:5:1 : User can login (1.2s)
   checkout.e2e.test.ts:10:1 : User can checkout (3.4s)

  6 passed (5.8s)
```

---

## Report Selection Matrix

Depending on what the run reveals, emit one or more of these blocks (full templates in `run-tests-reporting-formats.md`):

| Situation                      | Emit                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| All tests pass, coverage ≥ 80% | Success report → "Ready to commit"                                 |
| Some tests fail                | Failure report with per-test diagnostics + recommendations         |
| Coverage < 80%                 | Coverage report flagging threshold miss + critical uncovered files |
| Coverage ≥ 80% (informational) | Coverage report with breakdown + top-3 uncovered files             |
| API status-code gaps           | Missing-code report with example test stub + hard-stop message     |
| Multiple runs in one session   | Trend report (coverage delta, velocity)                            |

Always finish with the **Quality-Gate Summary** block — ready-to-commit or not-ready.

---

## API Status-Code Validation

Required per `.claude/rules/testing.md`:

| Code      | Meaning      |
| --------- | ------------ |
| 200 / 201 | Success      |
| 400       | Bad request  |
| 401       | Unauthorized |
| 403       | Forbidden    |
| 404       | Not found    |
| 500       | Server error |

Process:

1. Parse integration test results.
2. Identify API endpoints.
3. Check which status codes are tested per endpoint.
4. Flag missing tests; emit the Missing-Codes block with an example test stub.

A story **cannot** be marked complete if any endpoint is missing a code.

---

## Trend Analysis (optional)

If multiple runs happen in the same session, include a brief trend delta:

```
📈 TEST TRENDS
Current run:  87% coverage, 45 tests
Previous:     82%, 42 tests
Change:       +5%, +3 tests → improving ✅
```

---

## Recommendations Engine

**If tests are failing:**

- List each failing test with file + line.
- Suggest likely root cause (based on error message).
- Provide a fix direction (not a full patch).

**If coverage is low:**

- Identify highest-impact uncovered files.
- Rank by impact (HIGH / MEDIUM / LOW) based on criticality of the code path.
- Prioritize payment/auth/checkout over utilities.

**If API codes missing:**

- List missing codes per endpoint.
- Provide a ready-to-paste test template (example in formats companion).
- Link back to `.claude/rules/testing.md`.

Avoid generic advice — every recommendation should point at a specific file + line.

---

## Final Quality-Gate Summary

Always include at the end. Full template: `run-tests-reporting-formats.md` → Quality-Gate Summary.

- **Ready to commit** — all tests pass, coverage ≥ 80%, API codes covered, critical-path E2E green.
- **Not ready** — any of the above failing; list specifics with ❌ / ⚠️ markers.

---

**Related:**

- Parent: `.claude/commands/run-tests.md`
- Sibling: `run-tests-execution.md`
- Formats: `run-tests-reporting-formats.md`
- Rules: `.claude/rules/testing.md`

---

**Version:** 3.3.0
**Last Updated:** 2026-04-21 (split: concrete report blocks moved to formats companion)
