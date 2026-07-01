#!/usr/bin/env bash
# test-audit-pm.sh — exercises .claude/hooks/audit-pm.sh against synthetic repos.
set -u
TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$TESTS_DIR/lib.sh"

HOOK="$REPO_ROOT/.claude/hooks/audit-pm.sh"
SCRATCH=$(mk_scratch)
trap 'cleanup_scratch "$SCRATCH"' EXIT

echo "  [scratch: $SCRATCH]"

# --- helper: create a minimal "clean" framework skeleton ---
make_clean_repo() {
  local d="$1"
  mkdir -p "$d"/.project-management/input/backlog \
           "$d"/.project-management/output/progress \
           "$d"/.claude/rules \
           "$d"/.claude/commands

  echo '**Version:** 1.0.0' > "$d/README.md"
  echo '**Version:** 1.0.0' > "$d/CLAUDE.md"

  cat > "$d/CHANGELOG.md" <<'EOF'
# Changelog

## [1.0.0] - 2026-01-01

Initial release.
EOF

  for r in code-quality testing git documentation permissions; do
    echo "rule" > "$d/.claude/rules/$r.md"
  done

  echo "# Scope" > "$d/.project-management/input/scope.md"
  echo "# Backlog index" > "$d/.project-management/input/backlog/README.md"
  for p in phase-1-foundation phase-2-core phase-3-advanced phase-4-polish future; do
    echo "# $p" > "$d/.project-management/input/backlog/$p.md"
  done
  echo "# PM README" > "$d/.project-management/README.md"
}

# --- scenario: clean repo → no critical/high findings ---
clean="$SCRATCH/clean"
make_clean_repo "$clean"
out=$(cd "$clean" && bash "$HOOK" 2>/dev/null)
assert_contains "clean repo detects modular structure" "$out" "modular"
assert_not_contains "clean repo: no broken links" "$out" "🔴 CRITICAL: "
assert_contains "clean repo: version consistency OK" "$out" "All **Version:** strings agree"
assert_contains "clean repo: no monolithic stale refs" "$out" "No stale monolithic references"

# --- scenario: version mismatch (CHANGELOG has 1.0.0 but README claims 2.0.0) ---
mismatch="$SCRATCH/mismatch"
make_clean_repo "$mismatch"
echo '**Version:** 2.0.0' > "$mismatch/README.md"
out=$(cd "$mismatch" && bash "$HOOK" 2>/dev/null)
assert_contains "version mismatch flagged as HIGH" "$out" "Multiple distinct"
assert_contains "CHANGELOG missing entry flagged" "$out" "CHANGELOG.md missing entry for v2.0.0"

# --- scenario: missing required file ---
missing="$SCRATCH/missing"
make_clean_repo "$missing"
rm "$missing/.claude/rules/testing.md"
out=$(cd "$missing" && bash "$HOOK" 2>/dev/null)
assert_contains "missing rule file flagged as HIGH" "$out" "Missing rule: .claude/rules/testing.md"

# --- scenario: broken markdown link ---
broken="$SCRATCH/broken"
make_clean_repo "$broken"
cat > "$broken/.project-management/README.md" <<'EOF'
# PM README

See [the docs](./does-not-exist.md) for details.
EOF
out=$(cd "$broken" && bash "$HOOK" 2>/dev/null)
assert_contains "broken link is detected" "$out" "does-not-exist.md"
assert_contains "broken link is CRITICAL" "$out" "🔴 CRITICAL"

# --- scenario: broken link INSIDE a code fence → must be ignored ---
fenced="$SCRATCH/fenced"
make_clean_repo "$fenced"
cat > "$fenced/.project-management/README.md" <<'EOF'
# PM README

Code example:

```markdown
See [the docs](./does-not-exist.md) for details.
```

That's it.
EOF
out=$(cd "$fenced" && bash "$HOOK" 2>/dev/null)
assert_not_contains "fenced broken link is ignored" "$out" "does-not-exist.md"

# --- scenario: oversized backlog file ---
oversize="$SCRATCH/oversize"
make_clean_repo "$oversize"
printf 'line\n%.0s' {1..250} > "$oversize/.project-management/input/backlog/phase-1-foundation.md"
out=$(cd "$oversize" && bash "$HOOK" 2>/dev/null)
assert_contains "oversized backlog flagged" "$out" "250 lines (cap: 200)"

# --- scenario: legacy /plan-sprint reference in prose → flagged ---
legacy="$SCRATCH/legacy"
make_clean_repo "$legacy"
cat > "$legacy/.project-management/README.md" <<'EOF'
# PM README

Just run /plan-sprint 1 to start.
EOF
out=$(cd "$legacy" && bash "$HOOK" 2>/dev/null)
assert_contains "legacy /plan-sprint flagged" "$out" "/plan-sprint"

# --- scenario: legacy /plan-sprint reference WITH historical keyword → not flagged ---
histo="$SCRATCH/histo"
make_clean_repo "$histo"
cat > "$histo/.project-management/README.md" <<'EOF'
# PM README

The /plan-sprint command was removed in v2.0.
EOF
out=$(cd "$histo" && bash "$HOOK" 2>/dev/null)
assert_not_contains "historical /plan-sprint not flagged" "$out" "actively referenced"

report_results
