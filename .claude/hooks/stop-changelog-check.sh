#!/usr/bin/env bash
# Claude Code Stop hook.
# Warns if the branch has unpushed commits but none of them modified CHANGELOG.md.
# Never blocks — warning only.
#
# Requires: git + jq.
# Invoked by: .claude/settings.example.json hooks section.

set -euo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null || true)
[ -z "$root" ] && exit 0
cd "$root"

# Pick a comparison base: upstream first, then main, then master
base=""
if upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null); then
  base="$upstream"
elif git rev-parse --verify main >/dev/null 2>&1; then
  base="main"
elif git rev-parse --verify master >/dev/null 2>&1; then
  base="master"
fi
[ -z "$base" ] && exit 0

# How many commits ahead of base?
unpushed=$(git rev-list --count "$base"..HEAD 2>/dev/null || echo 0)
[ "$unpushed" -eq 0 ] && exit 0

# Did any of those commits touch CHANGELOG.md? If yes, all good.
# Capture-then-grep avoids SIGPIPE (141) that `git log | grep -q` triggers under pipefail.
files=$(git log "$base"..HEAD --name-only --pretty=format: 2>/dev/null || true)
if printf '%s\n' "$files" | grep -qx 'CHANGELOG.md'; then
  exit 0
fi

# Otherwise, remind the user
jq -nc --arg n "$unpushed" --arg b "$base" \
  '{systemMessage: ("📝 " + $n + " commit(s) ahead of " + $b + " but CHANGELOG.md was not modified. Consider documenting changes before pushing.")}'
