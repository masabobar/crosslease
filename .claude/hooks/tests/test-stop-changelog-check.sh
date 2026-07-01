#!/usr/bin/env bash
# test-stop-changelog-check.sh — exercises .claude/hooks/stop-changelog-check.sh
#
# Each scenario runs the hook from within a throwaway git repo so we have
# full control over branch state and upstream.
set -u
TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$TESTS_DIR/lib.sh"

HOOK="$REPO_ROOT/.claude/hooks/stop-changelog-check.sh"
SCRATCH=$(mk_scratch)
trap 'cleanup_scratch "$SCRATCH"' EXIT

echo "  [scratch: $SCRATCH]"

# Silence git hint noise
export GIT_AUTHOR_NAME="Test" GIT_AUTHOR_EMAIL="t@t" \
       GIT_COMMITTER_NAME="Test" GIT_COMMITTER_EMAIL="t@t"

# --- scenario: not a git repo → silent exit ---
out=$(cd "$SCRATCH" && printf '{}' | bash "$HOOK" 2>/dev/null)
assert_empty "outside git repo → silent" "$out"

# --- scenario: git repo with no commits past main → silent ---
repo1="$SCRATCH/repo1"; mkdir -p "$repo1"
(
  cd "$repo1"
  git init -q -b main
  echo "init" > README.md; git add .; git commit -q -m "init"
) >/dev/null 2>&1
out=$(cd "$repo1" && printf '{}' | bash "$HOOK" 2>/dev/null)
assert_empty "no commits ahead of main → silent" "$out"

# --- scenario: commits ahead of main, CHANGELOG NOT touched → warn ---
repo2="$SCRATCH/repo2"; mkdir -p "$repo2"
(
  cd "$repo2"
  git init -q -b main
  echo "init" > README.md; git add .; git commit -q -m "init"
  git checkout -q -b feature
  echo "change" > file.txt; git add .; git commit -q -m "feat: something"
) >/dev/null 2>&1
out=$(cd "$repo2" && printf '{}' | bash "$HOOK" 2>/dev/null)
assert_contains "commits ahead, no CHANGELOG → warn" "$out" "CHANGELOG.md was not modified"
assert_contains "count of 1 commit shown" "$out" "1 commit"

# --- scenario: commits ahead, CHANGELOG touched → silent ---
repo3="$SCRATCH/repo3"; mkdir -p "$repo3"
(
  cd "$repo3"
  git init -q -b main
  echo "init" > README.md; git add .; git commit -q -m "init"
  git checkout -q -b feature
  echo "change" > file.txt
  echo "## 1.0" > CHANGELOG.md
  git add .; git commit -q -m "feat: with changelog"
) >/dev/null 2>&1
out=$(cd "$repo3" && printf '{}' | bash "$HOOK" 2>/dev/null)
assert_empty "CHANGELOG touched → silent" "$out"

# --- scenario: multiple commits, at least one touches CHANGELOG → silent ---
repo4="$SCRATCH/repo4"; mkdir -p "$repo4"
(
  cd "$repo4"
  git init -q -b main
  echo "init" > README.md; git add .; git commit -q -m "init"
  git checkout -q -b feature
  echo "a" > a; git add .; git commit -q -m "feat: a"
  echo "b" > b; git add .; git commit -q -m "feat: b"
  echo "## 1.0" > CHANGELOG.md; git add .; git commit -q -m "docs: changelog"
) >/dev/null 2>&1
out=$(cd "$repo4" && printf '{}' | bash "$HOOK" 2>/dev/null)
assert_empty "any of N commits touches CHANGELOG → silent" "$out"

# --- regression: previously SIGPIPE-141 killed this check under set -o pipefail ---
# Already covered by repo4; explicit: hook must exit 0 even when grep finds a match
(cd "$repo4" && printf '{}' | bash "$HOOK" >/dev/null 2>&1) && exit_ok=yes || exit_ok=no
assert_contains "hook exits 0 on success (no SIGPIPE regression)" "$exit_ok" "yes"

report_results
