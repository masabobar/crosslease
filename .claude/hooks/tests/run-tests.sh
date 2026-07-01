#!/usr/bin/env bash
# run-tests.sh — orchestrator for .claude/hooks/ test suite.
#
# Runs every test-*.sh in this directory and tallies pass/fail.
# Each test file sources lib.sh (below) for assertion helpers and
# exits 0 on success / non-zero on failure.
#
# Usage:
#   bash .claude/hooks/tests/run-tests.sh            # run all
#   bash .claude/hooks/tests/run-tests.sh post-write # run one by substring

set -u

TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/../../.." && pwd)"
export TESTS_DIR REPO_ROOT

FILTER="${1:-}"

pass=0; fail=0; failed_names=()

for test_file in "$TESTS_DIR"/test-*.sh; do
  [ -f "$test_file" ] || continue
  name=$(basename "$test_file" .sh)
  if [ -n "$FILTER" ] && [[ "$name" != *"$FILTER"* ]]; then
    continue
  fi

  echo "▶ $name"
  if bash "$test_file"; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    failed_names+=("$name")
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pass: $pass   Fail: $fail"
if [ "$fail" -gt 0 ]; then
  echo "Failed:"
  for n in "${failed_names[@]}"; do echo "  - $n"; done
  exit 1
fi
echo "✅ All hook tests passed"
