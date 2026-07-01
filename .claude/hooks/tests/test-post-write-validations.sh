#!/usr/bin/env bash
# test-post-write-validations.sh — exercises .claude/hooks/post-write-validations.sh
set -u
TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$TESTS_DIR/lib.sh"

HOOK="$REPO_ROOT/.claude/hooks/post-write-validations.sh"
SCRATCH=$(mk_scratch)
trap 'cleanup_scratch "$SCRATCH"' EXIT

echo "  [scratch: $SCRATCH]"

# --- fixture: small backlog phase file (under 200 lines) ---
mkdir -p "$SCRATCH/.project-management/input/backlog"
small_phase="$SCRATCH/.project-management/input/backlog/phase-1-foundation.md"
printf 'line\n%.0s' {1..50} > "$small_phase"

# Expect: phase-edit reminder, no size warning
out=$(stdin_write "$small_phase" | bash "$HOOK" 2>/dev/null)
assert_contains "phase edit triggers README-sync reminder" "$out" "verify totals in input/backlog/README.md"
assert_not_contains "no size warning for small phase file" "$out" "is 50 lines"

# --- fixture: oversized backlog file (> 200 lines) ---
big_phase="$SCRATCH/.project-management/input/backlog/phase-2-core.md"
printf 'line\n%.0s' {1..250} > "$big_phase"

out=$(stdin_write "$big_phase" | bash "$HOOK" 2>/dev/null)
assert_contains "backlog > 200 lines warns" "$out" "250 lines"
assert_contains "warning mentions limit 200" "$out" "limit: 200"
assert_contains "still includes phase-edit reminder" "$out" "verify totals"

# --- fixture: module at ideal-threshold (350 lines, > 300, < 600) ---
mkdir -p "$SCRATCH/.claude/commands/modules"
ideal_mod="$SCRATCH/.claude/commands/modules/ideal.md"
printf 'line\n%.0s' {1..350} > "$ideal_mod"

out=$(stdin_write "$ideal_mod" | bash "$HOOK" 2>/dev/null)
assert_contains "module > 300 lines triggers ideal warning" "$out" "350 lines"
assert_contains "emoji 🟡 used for ideal" "$out" "🟡"
assert_not_contains "not flagged as hard-max" "$out" "HARD MAX"

# --- fixture: module over hard-max (650 lines) ---
hard_mod="$SCRATCH/.claude/commands/modules/huge.md"
printf 'line\n%.0s' {1..650} > "$hard_mod"

out=$(stdin_write "$hard_mod" | bash "$HOOK" 2>/dev/null)
assert_contains "module > 600 lines triggers HARD MAX" "$out" "HARD MAX"
assert_contains "hard-max emoji 🔴" "$out" "🔴"

# --- fixture: top-level command (> 300 lines) ---
mkdir -p "$SCRATCH/.claude/commands"
big_cmd="$SCRATCH/.claude/commands/big-cmd.md"
printf 'line\n%.0s' {1..400} > "$big_cmd"

out=$(stdin_write "$big_cmd" | bash "$HOOK" 2>/dev/null)
assert_contains "command > 300 lines warns" "$out" "400 lines"
assert_contains "soft target mentioned" "$out" "soft target"

# --- fixture: how-to-use file (excluded from command-size rule) ---
mkdir -p "$SCRATCH/.claude/commands/how-to-use"
guide="$SCRATCH/.claude/commands/how-to-use/big-guide.md"
printf 'line\n%.0s' {1..400} > "$guide"

out=$(stdin_write "$guide" | bash "$HOOK" 2>/dev/null)
assert_empty "how-to-use not flagged by command size rule" "$out"

# --- fixture: nonexistent file (hook must exit silently) ---
out=$(stdin_write "$SCRATCH/does-not-exist.md" | bash "$HOOK" 2>/dev/null)
assert_empty "missing file → silent exit" "$out"

# --- fixture: empty tool_input (no file_path) ---
out=$(printf '{}' | bash "$HOOK" 2>/dev/null)
assert_empty "missing file_path → silent exit" "$out"

report_results
