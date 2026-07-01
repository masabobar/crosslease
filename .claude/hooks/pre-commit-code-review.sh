#!/usr/bin/env bash
# Claude Code PreToolUse hook — fires before any Bash tool call.
# Exits early unless the command is `git commit`.
# Lists staged .ts/.tsx files and injects a systemMessage prompting Claude
# to verify .claude/rules/code-review.md before the commit is created.
# Non-blocking (exit 0) — Claude reads the prompt and decides whether to review first.
#
# Requires: jq + git.
# Registered in: .claude/settings.json PreToolUse[matcher="Bash"].

set -euo pipefail

# Read hook input (Claude Code pipes JSON on stdin)
input=$(cat)

# Extract the bash command being run
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

# Only act on git commit commands
printf '%s' "$cmd" | grep -qE '^git commit' || exit 0

root=$(git rev-parse --show-toplevel 2>/dev/null || true)
[ -z "$root" ] && exit 0
cd "$root"

# Get staged .ts/.tsx files only
staged=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
[ -z "$staged" ] && exit 0  # No TypeScript staged — skip

count=$(printf '%s\n' "$staged" | wc -l | tr -d ' ')
file_list=$(printf '%s\n' "$staged" | sed 's/^/  • /')

msg="📋 CODE REVIEW GATE — $count TypeScript file(s) staged for this commit:

$file_list

Per .claude/rules/code-review.md, verify the following before this commit is created:
  • TypeScript: no \`any\`, explicit return types on exports, \`import type\` used, Zod for API shapes
  • React 19: no \`forwardRef\`, no manual memoization, no \`useEffect\` for data fetching
  • State: server state in React Query only — not duplicated in Zustand
  • Forms: RHF + Zod resolver, server errors via setError, submit gated on isSubmitting
  • i18n: all strings via t(), both en/ and de/ locales updated, namespace registered
  • Security: correct role wire values, no console.*, no sensitive data in component state
  • Tests: Zod schemas tested, coverage ≥ 80%, data-testid on all new interactive elements

If the staged diff has already been reviewed and is clean → proceed with the commit.
Otherwise run /code-review on the diff first."

jq -nc --arg m "$msg" '{systemMessage: $m}'
exit 0
