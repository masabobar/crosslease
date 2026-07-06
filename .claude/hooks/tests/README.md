# Hook Tests

Automated tests for `.claude/hooks/*.sh`. Bash-only (no npm/pytest), runnable in any environment that has the hooks themselves.

## Run

```bash
bash .claude/hooks/tests/run-tests.sh            # all tests
bash .claude/hooks/tests/run-tests.sh post-write # one file by substring
```

Exit code: 0 on all-pass, 1 on any failure.

## Layout

```
tests/
├── README.md                          # this file
├── run-tests.sh                       # orchestrator
├── lib.sh                             # assert helpers + fixture utilities
├── test-post-write-validations.sh     # 18 assertions
└── test-audit-pm.sh                   # 13 assertions
```

Each `test-*.sh`:

1. Sources `lib.sh`.
2. Creates a throwaway scratch dir with `mk_scratch`.
3. Builds fixtures inside (files, git repos, synthetic frameworks).
4. Pipes the expected stdin to the hook and captures stdout.
5. Asserts with `assert_contains` / `assert_empty` / `assert_not_contains`.
6. Calls `report_results` at end; `trap` cleans up scratch dir.

## Why These Tests Exist

- **SIGPIPE bug** (in the since-removed stop-changelog hook) was caught only by piped-testing with `set -o pipefail` — capture-then-grep instead of `cmd | grep -q` remains the house pattern for hooks under `pipefail`.
- **Code-fence false positives** in audit-pm sent 24 false "broken link" findings before the filter was added — the "fenced broken link is ignored" assertion locks the fix.
- **Historical-vs-active legacy refs** in audit-pm have a context filter with a ±2-line window; "historical /plan-sprint not flagged" guards against regressions on that logic.

If you edit a hook, re-run the tests before committing. If you extend a hook (new rule, new threshold), add the matching assertion here.

## Adding a New Test

```bash
# At the top of a new test-foo.sh:
set -u
TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$TESTS_DIR/lib.sh"

SCRATCH=$(mk_scratch)
trap 'cleanup_scratch "$SCRATCH"' EXIT

# ... build fixtures, invoke hook, capture output ...

out=$(printf '{"tool_input":{"file_path":"..."}}' | bash "$REPO_ROOT/.claude/hooks/post-write-validations.sh" 2>/dev/null)
assert_contains "description of what should be true" "$out" "expected substring"

report_results
```

Then make it executable: `chmod +x test-foo.sh`.
