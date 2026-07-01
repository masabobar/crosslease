#!/usr/bin/env bash
# lib.sh — shared helpers for hook tests.
# Source this from each test-*.sh.

set -u

: "${REPO_ROOT:?REPO_ROOT must be set by runner}"

# ---- assertion counters (per-test-file) ----
_ASSERT_PASS=0
_ASSERT_FAIL=0
_ASSERT_FAILURES=()

# ---- fixture / scratch helpers ----
mk_scratch() {
  mktemp -d -t hook-tests.XXXXXX
}
cleanup_scratch() {
  [ -n "${1:-}" ] && [ -d "$1" ] && rm -rf "$1"
}

# Emit stdin JSON for a PostToolUse Write|Edit event with the given file_path.
stdin_write() {
  printf '{"tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$1"
}

# ---- assertions ----
# assert_contains <label> <actual> <expected-substring>
assert_contains() {
  local label="$1" actual="$2" expected="$3"
  if printf '%s' "$actual" | grep -q -F "$expected"; then
    _ASSERT_PASS=$((_ASSERT_PASS + 1))
    printf '  ✓ %s\n' "$label"
  else
    _ASSERT_FAIL=$((_ASSERT_FAIL + 1))
    _ASSERT_FAILURES+=("$label: expected to contain '$expected' — got: $(printf '%s' "$actual" | head -c 120)")
    printf '  ✗ %s\n' "$label"
  fi
}

# assert_empty <label> <actual>
assert_empty() {
  local label="$1" actual="$2"
  if [ -z "$actual" ]; then
    _ASSERT_PASS=$((_ASSERT_PASS + 1))
    printf '  ✓ %s\n' "$label"
  else
    _ASSERT_FAIL=$((_ASSERT_FAIL + 1))
    _ASSERT_FAILURES+=("$label: expected empty — got: $(printf '%s' "$actual" | head -c 120)")
    printf '  ✗ %s\n' "$label"
  fi
}

# assert_not_contains <label> <actual> <forbidden-substring>
assert_not_contains() {
  local label="$1" actual="$2" forbidden="$3"
  if printf '%s' "$actual" | grep -q -F "$forbidden"; then
    _ASSERT_FAIL=$((_ASSERT_FAIL + 1))
    _ASSERT_FAILURES+=("$label: expected NOT to contain '$forbidden'")
    printf '  ✗ %s\n' "$label"
  else
    _ASSERT_PASS=$((_ASSERT_PASS + 1))
    printf '  ✓ %s\n' "$label"
  fi
}

# Report pass/fail summary for this test file; returns 0 if all passed.
report_results() {
  if [ "$_ASSERT_FAIL" -gt 0 ]; then
    echo "  → $_ASSERT_PASS pass / $_ASSERT_FAIL fail"
    for msg in "${_ASSERT_FAILURES[@]}"; do echo "    $msg"; done
    return 1
  fi
  echo "  → $_ASSERT_PASS pass / 0 fail"
  return 0
}
