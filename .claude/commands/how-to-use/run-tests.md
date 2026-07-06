# Run Tests - Quick Guide

**Use when:** You want to run tests manually (outside `/execute-work`).
**Command:** `/run-tests [scope]`
**Time:** varies by scope (seconds → several minutes)
**Output:** Pass/fail summary, failure details, required-tests check.

**All documentation is in English only.**

---

## 🎯 What It Does

Runs the project's checks with optional filtering. `/execute-work` already runs tests automatically before every commit; this command is for manual runs and debugging outside of that flow.

---

## 📋 Command Formats

```bash
/run-tests all            # Unit tests + type-check + lint
/run-tests unit           # Vitest unit tests only
/run-tests type-check     # TypeScript check only
/run-tests lint           # ESLint only
/run-tests story US-XXX   # Tests tied to a specific user story
/run-tests file <path>    # Tests for a specific source file
```

> E2E (Playwright) is QA-owned — not run through this command.

---

## 📊 Output

The command reports:

- Tests passed / failed / skipped
- Total runtime
- Per-failure stack traces
- Required-tests check: new Zod schemas / store actions / utilities without tests
- Flaky/slow tests (when detected)

---

## 🧭 When to Use Which Scope

| Goal                                      | Scope          |
| ----------------------------------------- | -------------- |
| Fast feedback during implementation       | `unit`         |
| Before raising a PR                       | `all`          |
| Reproducing a specific story's regression | `story US-XXX` |
| Narrow debugging of one file              | `file <path>`  |

---

## 🚦 Failure Handling

1. Read the failure details printed in the terminal.
2. If the failure is new, open the source and fix the bug — don't relax assertions.
3. Re-run the narrowest scope that covers the failing test.
4. Before committing, run `/run-tests all` to avoid regressions in other suites.
5. If a test is genuinely flaky, log it in `blockers.md` rather than masking it.

---

## 🎓 Tips

- The test gate is **behavior-based** — every new Zod schema, store action, and utility needs tests; no numeric coverage target (see `.claude/rules/testing.md`).
- Every consumed BE error code needs an `errors.<CODE>` i18n key (per `.claude/rules/api-error-display.md`).
- i18n projects also gate on translation completeness when enabled.
- `/execute-work` refuses to commit if tests fail — use this command to unblock fast.

---

## 📚 Full Documentation

**This is the quick guide (~80 lines).**

Full command docs: [`.claude/commands/run-tests.md`](../run-tests.md)
Rule: [`.claude/rules/testing.md`](../../rules/testing.md)

---

**Part of:** Claude Project Management System v3.3
