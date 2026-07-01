# Run Tests - Quick Guide

**Use when:** You want to run tests manually (outside `/execute-work`).
**Command:** `/run-tests [scope]`
**Time:** varies by scope (seconds → several minutes)
**Output:** Pass/fail summary, coverage, failure details.

**All documentation is in English only.**

---

## 🎯 What It Does

Runs the project's test suite with optional filtering. `/execute-work` already runs tests automatically before every commit; this command is for manual runs, debugging, and coverage checks outside of that flow.

---

## 📋 Command Formats

```bash
/run-tests all            # All tests (unit + integration + e2e)
/run-tests unit           # Unit tests only
/run-tests integration    # Integration tests only
/run-tests e2e            # End-to-end tests only
/run-tests coverage       # All tests + coverage report
/run-tests story US-XXX   # Tests tied to a specific user story
/run-tests file <path>    # Tests for a specific source file
```

---

## 📊 Output

The command reports:

- Tests passed / failed / skipped
- Total runtime
- Per-failure stack traces + snapshot diffs
- Coverage (when requested): overall %, per-file %, missed lines
- Flaky/slow tests (when detected)

---

## 🧭 When to Use Which Scope

| Goal                                      | Scope          |
| ----------------------------------------- | -------------- |
| Fast feedback during implementation       | `unit`         |
| Before raising a PR                       | `all`          |
| Coverage audit before phase completion    | `coverage`     |
| Reproducing a specific story's regression | `story US-XXX` |
| Narrow debugging of one file              | `file <path>`  |
| Full release gate                         | `all` + `e2e`  |

---

## 🚦 Failure Handling

1. Read the failure details printed in the terminal.
2. If the failure is new, open the source and fix the bug — don't relax assertions.
3. Re-run the narrowest scope that covers the failing test.
4. Before committing, run `/run-tests all` to avoid regressions in other suites.
5. If a test is genuinely flaky, log it in `blockers.md` rather than masking it.

---

## 🎓 Tips

- Coverage target is **80% minimum** (see `.claude/rules/testing.md`).
- API routes must cover **200/400/401/403/404/500** status codes (per testing.md).
- i18n projects also gate on translation coverage when enabled.
- `/execute-work` refuses to commit if tests fail — use this command to unblock fast.

---

## 📚 Full Documentation

**This is the quick guide (~80 lines).**

Full command docs: [`.claude/commands/run-tests.md`](../run-tests.md)
Rule: [`.claude/rules/testing.md`](../../rules/testing.md)

---

**Part of:** Claude Project Management System v3.3
