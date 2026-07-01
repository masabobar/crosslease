#!/usr/bin/env bash
# Claude Code PostToolUse hook for Write|Edit.
# Runs after a file write and emits warnings for documentation.md §2.1 size limits
# + backlog README sync reminder. Never blocks — all warnings only.
#
# Requires: jq (for parsing tool input and building JSON output).
# Invoked by: .claude/settings.example.json hooks section.

set -euo pipefail

# Read hook input (Claude Code pipes JSON on stdin)
input=$(cat)

# Extract file path — prefer tool_response (post-write accuracy), fall back to tool_input
f=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // empty')

# Nothing to validate if path missing or file gone
[ -z "$f" ] && exit 0
[ ! -f "$f" ] && exit 0

lines=$(wc -l < "$f" 2>/dev/null || echo 0)

# Collect warnings; emit one combined systemMessage so all rules render
warnings=()

# Rule 4: backlog phase-*.md edit → remind to sync README totals
case "$f" in
  */.project-management/input/backlog/phase-*.md)
    warnings+=("ℹ️  Modified $(basename "$f") — verify totals in input/backlog/README.md still match (or use /add-scope which auto-updates).")
    ;;
esac

# Rule 1: backlog files > 200 lines (documentation.md §2.1)
case "$f" in
  */.project-management/input/backlog/*.md)
    if [ "$lines" -gt 200 ]; then
      warnings+=("⚠️  $(basename "$f") is $lines lines (limit: 200 per documentation.md §2.1). Consider splitting into sub-phases or moving items to future.md.")
    fi
    ;;
esac

# Rule 2: modules — 300 ideal, 600 hard max
case "$f" in
  */.claude/commands/modules/*.md)
    if [ "$lines" -gt 600 ]; then
      warnings+=("🔴 $(basename "$f") is $lines lines (HARD MAX: 600 per documentation.md §2.1). Must be split.")
    elif [ "$lines" -gt 300 ]; then
      warnings+=("🟡 $(basename "$f") is $lines lines (ideal ≤300 per documentation.md §2.1). Consider splitting.")
    fi
    ;;
esac

# Rule 3: top-level commands (not modules/, not how-to-use/) > 300 lines
case "$f" in
  */.claude/commands/modules/*|*/.claude/commands/how-to-use/*)
    : # skip — handled above (Rule 2) or uncovered by spec
    ;;
  */.claude/commands/*.md)
    if [ "$lines" -gt 300 ]; then
      warnings+=("🟡 $(basename "$f") is $lines lines (soft target ≤300 per documentation.md §2.1). Consider splitting.")
    fi
    ;;
esac

# Emit combined message
if [ "${#warnings[@]}" -gt 0 ]; then
  msg=$(printf '%s\n' "${warnings[@]}")
  jq -nc --arg m "$msg" '{systemMessage: $m}'
fi

exit 0
