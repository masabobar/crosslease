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

| Situation                              | Emit                                                           |
| -------------------------------------- | -------------------------------------------------------------- |
| All tests pass, required tests present | Success report → "Ready to commit"                             |
| Some tests fail                        | Failure report with per-test diagnostics + recommendations     |
| Required tests missing                 | Missing-tests report listing untested new schemas/stores/utils |
| Error-code i18n keys missing           | Missing-keys report with the key names to add (en + de)        |
| Multiple runs in one session           | Trend report (test-count delta, velocity)                      |

Always finish with the **Quality-Gate Summary** block — ready-to-commit or not-ready.

---

## Error-Code Surfacing Validation

Required per `.claude/rules/api-error-display.md` (the BE status-code matrix lives in `../refinext-api/`):

Process:

1. Identify the endpoints the change consumes (grep `openapi.json` by path).
2. List every error code those endpoints document.
3. Check each has an `errors.<CODE>` i18n key in both `en/<feature>.json` and `de/<feature>.json`.
4. Flag missing keys; emit the Missing-Keys block with the exact key names to add.

A story **cannot** be marked complete if a consumed error code has no i18n key.

---

## Trend Analysis (optional)

If multiple runs happen in the same session, include a brief trend delta:

```
📈 TEST TRENDS
Current run:  45 tests, 0 failures
Previous:     42 tests, 2 failures
Change:       +3 tests, failures resolved → improving ✅
```

---

## Recommendations Engine

**If tests are failing:**

- List each failing test with file + line.
- Suggest likely root cause (based on error message).
- Provide a fix direction (not a full patch).

**If required tests are missing:**

- List each new schema / store action / utility without a test.
- Rank by impact (HIGH / MEDIUM / LOW) based on criticality of the code path.
- Prioritize auth and API-contract schemas over utilities.

**If error-code i18n keys are missing:**

- List the missing `errors.<CODE>` keys per feature namespace (en + de).
- Link back to `.claude/rules/api-error-display.md`.

Avoid generic advice — every recommendation should point at a specific file + line.

---

## Final Quality-Gate Summary

Always include at the end. Full template: `run-tests-reporting-formats.md` → Quality-Gate Summary.

- **Ready to commit** — all tests pass, required tests present, error-code i18n keys complete, type-check + lint clean.
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
