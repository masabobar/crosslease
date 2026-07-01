#!/usr/bin/env bash
# audit-pm.sh — mechanical audit checks for the Claude Project Management framework.
#
# Runs from the project root. Emits a sectioned markdown report on stdout suitable
# for ingestion by the /audit-pm slash command (which layers judgement-based checks
# on top and prioritizes findings).
#
# Requires: bash, git (optional), standard POSIX tools.
# Invoked by: .claude/commands/audit-pm.md (the /audit-pm command).
#
# Usage:
#   bash .claude/hooks/audit-pm.sh [--root <path>]
#
# Exit code is always 0 — the point is to report, not gate.

set -u  # no -e: we don't want to stop on first missing file
ROOT="."

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

cd "$ROOT" 2>/dev/null || { echo "ERROR: can't cd to $ROOT"; exit 0; }

# ---------- helpers ----------

section() { printf '\n## %s\n\n' "$1"; }
subsection() { printf '\n### %s\n\n' "$1"; }
finding() { printf -- '- %s: %s\n' "$1" "$2"; }  # severity, message
ok() { printf -- '- ✅ %s\n' "$1"; }

count_lines() { wc -l < "$1" 2>/dev/null | tr -d ' '; }

has() { [ -e "$1" ]; }
hasfile() { [ -f "$1" ]; }
hasdir() { [ -d "$1" ]; }

# Detect backlog structure type: "modular" | "monolithic" | "none"
detect_structure() {
  if hasdir ".project-management/input/backlog" && hasfile ".project-management/input/backlog/README.md"; then
    echo "modular"
  elif hasfile ".project-management/input/backlog.md"; then
    echo "monolithic"
  else
    echo "none"
  fi
}

# ---------- report header ----------

printf '# PM Framework Audit\n\n'
printf '**Generated:** %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '**Root:** %s\n' "$(pwd)"
STRUCTURE=$(detect_structure)
printf '**Backlog structure:** %s\n' "$STRUCTURE"

# ---------- A. Structure health ----------

section "A. Structure health"

# Required top-level files
for f in CLAUDE.md README.md CHANGELOG.md; do
  if hasfile "$f"; then ok "$f exists"; else finding "🔴 CRITICAL" "Required file missing: $f"; fi
done

# Required rules
for r in code-quality.md testing.md git.md documentation.md permissions.md; do
  if hasfile ".claude/rules/$r"; then ok ".claude/rules/$r exists"; else finding "🟠 HIGH" "Missing rule: .claude/rules/$r"; fi
done

# PM system core
for f in .project-management/README.md .project-management/input/scope.md; do
  if hasfile "$f"; then ok "$f exists"; else finding "🟠 HIGH" "Missing core file: $f"; fi
done

# Modular structure integrity
if [ "$STRUCTURE" = "modular" ]; then
  for p in phase-1-foundation phase-2-core phase-3-advanced phase-4-polish future; do
    if hasfile ".project-management/input/backlog/$p.md"; then
      ok "backlog/$p.md exists"
    else
      finding "🟡 MEDIUM" "Modular backlog incomplete: missing $p.md"
    fi
  done
fi

# ---------- B. File size violations ----------

section "B. File-size limits (documentation.md §2.1)"

# Backlog files — 200 line cap
if hasdir ".project-management/input/backlog"; then
  for f in .project-management/input/backlog/*.md; do
    [ -f "$f" ] || continue
    lines=$(count_lines "$f")
    if [ "${lines:-0}" -gt 200 ]; then
      finding "⚠️ warn" "$f is $lines lines (cap: 200)"
    fi
  done
fi
if [ "$STRUCTURE" = "monolithic" ]; then
  lines=$(count_lines ".project-management/input/backlog.md")
  finding "ℹ️ info" "Monolithic backlog.md is $lines lines (consider /migrate-to-modular)"
fi

# Modules
if hasdir ".claude/commands/modules"; then
  for f in .claude/commands/modules/*.md; do
    [ -f "$f" ] || continue
    lines=$(count_lines "$f")
    if [ "${lines:-0}" -gt 600 ]; then
      finding "🔴 hard-max" "$f is $lines lines (HARD MAX: 600)"
    elif [ "${lines:-0}" -gt 300 ]; then
      finding "🟡 ideal" "$f is $lines lines (ideal: ≤300)"
    fi
  done
fi

# Top-level commands (not modules/, not how-to-use/)
if hasdir ".claude/commands"; then
  for f in .claude/commands/*.md; do
    [ -f "$f" ] || continue
    lines=$(count_lines "$f")
    if [ "${lines:-0}" -gt 300 ]; then
      finding "🟡 soft" "$f is $lines lines (soft target: ≤300)"
    fi
  done
fi

# ---------- C. Version consistency ----------

section "C. Version consistency"

# Collect all **Version:** X.Y.Z strings from top-level + .project-management docs
version_report=$(
  {
    grep -rhE '^\*\*Version:\*\*[[:space:]]+[0-9]+\.[0-9]+\.[0-9]+' \
      README.md CHANGELOG.md CLAUDE.md \
      .project-management/*.md \
      .project-management/docs/*.md \
      .project-management/guides/*.md 2>/dev/null
  } | sed -E 's/^\*\*Version:\*\*[[:space:]]+//; s/[[:space:]]+\(.*$//' | sort -u
)
distinct_versions=$(printf '%s\n' "$version_report" | sort -u | grep -c '^[0-9]')
if [ "$distinct_versions" -gt 1 ]; then
  finding "🟠 HIGH" "Multiple distinct **Version:** strings in docs:"
  printf '%s\n' "$version_report" | sed 's/^/  - /'
else
  ok "All **Version:** strings agree: $version_report"
fi

# CHANGELOG coverage for current version
if hasfile CHANGELOG.md && hasfile README.md; then
  cur_version=$(grep -hE '^\*\*Version:\*\*' README.md 2>/dev/null | head -1 | sed -E 's/^\*\*Version:\*\*[[:space:]]+([0-9]+\.[0-9]+\.[0-9]+).*/\1/')
  if [ -n "$cur_version" ]; then
    if grep -qE "^## \[?$cur_version\]?" CHANGELOG.md; then
      ok "CHANGELOG.md has entry for v$cur_version"
    else
      finding "🟠 HIGH" "CHANGELOG.md missing entry for v$cur_version (claimed in README.md)"
    fi
  fi
fi

# ---------- D. Broken internal references ----------

section "D. Broken internal references"

# Find [text](relative/path.md) links whose target is missing.
# Only scan .project-management and .claude (framework docs).
broken_count=0
check_links() {
  local from_file="$1"
  local from_dir; from_dir="$(dirname "$from_file")"
  # Strip fenced code blocks (```...``` and indented 4-space code blocks)
  # before link extraction — example code inside fences is not a real link.
  awk '
    /^```/ { fence = !fence; next }
    !fence { print }
  ' "$from_file" 2>/dev/null \
    | grep -oE '\[[^]]+\]\([^)]+\)' \
    | sed -E 's/.*\(([^)]+)\)/\1/' \
    | grep -vE '^(https?://|#|mailto:)' \
    | while read -r target; do
        target="${target%%#*}"
        [ -z "$target" ] && continue
        resolved=$(cd "$from_dir" 2>/dev/null && cd "$(dirname "$target")" 2>/dev/null && pwd)/$(basename "$target")
        if [ ! -e "$resolved" ]; then
          if [ ! -e "$from_dir/$target" ]; then
            printf '  - %s → %s\n' "$from_file" "$target"
          fi
        fi
      done
}

tmp_broken=$(mktemp)
# Skip templates/ and COMMAND-TEMPLATE.md (paths use {{placeholders}} or
# placeholder command names, instantiated at copy time — not valid as-written)
for f in $(find .project-management .claude -name "*.md" -type f 2>/dev/null \
  | grep -vE '/(templates|client-input|examples)/|/COMMAND-TEMPLATE\.md$'); do
  check_links "$f" 2>/dev/null \
    | grep -vE '\{\{.*\}\}|\$\{.*\}|\$[A-Z_]+' \
    >> "$tmp_broken"
done

if [ -s "$tmp_broken" ]; then
  broken_count=$(wc -l < "$tmp_broken" | tr -d ' ')
  finding "🔴 CRITICAL" "$broken_count broken internal link(s):"
  head -30 "$tmp_broken"
  if [ "$broken_count" -gt 30 ]; then
    printf '  - ... and %s more (showing first 30)\n' "$((broken_count - 30))"
  fi
else
  ok "No broken internal markdown links"
fi
rm -f "$tmp_broken"

# ---------- E. Backlog structure mismatches ----------

section "E. Backlog structure references"

if [ "$STRUCTURE" = "modular" ]; then
  # Detect docs still treating monolithic `input/backlog.md` as the authoritative structure.
  # A file is flagged only if it mentions `input/backlog.md` in a structural assertion —
  # we strip inline-code quotes (`input/backlog.md`) and any line whose context words include
  # "legacy", "monolithic", "migration", "option c", "v3.0" (those are legitimately explaining
  # the old form).
  # Exception (wholesale skip): MIGRATION-GUIDE, MODULAR-STRUCTURE-GUIDE, WHATS-NEW.
  stale=""
  for f in .project-management/README.md .project-management/INTEGRATION-GUIDE.md \
           .project-management/SYSTEM-OVERVIEW.md .project-management/QUICK-START.md \
           .project-management/docs/*.md .project-management/guides/*.md; do
    [ -f "$f" ] || continue
    case "$f" in
      *MIGRATION-GUIDE*|*MODULAR-STRUCTURE-GUIDE*|*WHATS-NEW*) continue ;;
    esac
    # Extract lines mentioning input/backlog.md that are NOT inside backticks
    # and NOT in a legacy/migration/monolithic context on the same line.
    hits=$(grep -nE 'input/backlog\.md' "$f" 2>/dev/null \
      | grep -viE 'legacy|monolithic|migration|option c|v3\.0|older project|if you have' \
      | grep -vE '`[^`]*input/backlog\.md[^`]*`' || true)
    [ -n "$hits" ] && stale="$stale$f\n"
  done
  stale=$(printf '%b' "$stale" | sed '/^$/d')
  if [ -n "$stale" ]; then
    finding "🟠 HIGH" "Docs reference monolithic \`input/backlog.md\` despite modular structure:"
    printf '%s\n' "$stale" | sed 's/^/  - /'
  else
    ok "No stale monolithic references in core docs"
  fi
fi

# ---------- F. Legacy / deprecated refs ----------

section "F. Legacy & deprecated references"

# Empty output/sprints/ dir (v2.0 artifact)
if hasdir ".project-management/output/sprints"; then
  finding "🟡 MEDIUM" "Legacy v2.0 directory still exists: .project-management/output/sprints/"
fi

# Removed commands
# Flag only ACTIVE references to removed commands, not historical / example mentions.
# Skip wholesale: CHANGELOG, MIGRATION-GUIDE, COMMAND-STATUS, audit-pm.md (uses them as examples).
# Then per-line: skip lines that say "was removed", "removed in v", "example", "legacy",
# "historical", or that mention them inside inline-code context.
for cmd in /plan-sprint /update-progress; do
  cmd_escaped=$(printf '%s' "$cmd" | sed 's/[\/]/\\&/g')
  candidates=$(grep -rlE "${cmd}([[:space:]]|$|\`|\")" \
    .project-management .claude --include='*.md' 2>/dev/null \
    | grep -vE '(CHANGELOG|MIGRATION-GUIDE|COMMAND-STATUS|audit-pm\.md)' || true)
  active_hits=""
  for f in $candidates; do
    [ -f "$f" ] || continue
    # Look for lines mentioning the command that AREN'T historical/migration context.
    # Check ±2 lines around each match — migration narrative often spans lines
    # (e.g. command name on one line, "was removed" two lines later).
    hits=$(awk -v cmd="${cmd}" '
      BEGIN { hist="was removed|removed in v|historical|previously|legacy|example|no longer|replaced|replaces|deprecated|deleted|v3\\.2\\.0" }
      {
        buf[NR%5] = $0
        if ($0 ~ cmd) {
          # Inspect 5-line window: current line ±2
          ctx = ""
          for (i = NR-2; i <= NR+2; i++) { ctx = ctx " " buf[i%5] }
          # Also pull 2 lines ahead from raw input
          getline la1; getline la2
          ctx = ctx " " la1 " " la2
          buf[(NR+1)%5] = la1; buf[(NR+2)%5] = la2
          if (tolower(ctx) !~ hist) print NR ": " $0
          NR += 2
        }
      }
    ' "$f" 2>/dev/null || true)
    [ -n "$hits" ] && active_hits="$active_hits$f\n"
  done
  active_hits=$(printf '%b' "$active_hits" | sed '/^$/d')
  if [ -n "$active_hits" ]; then
    hit_count=$(printf '%s\n' "$active_hits" | wc -l | tr -d ' ')
    finding "🟡 MEDIUM" "Removed command '$cmd' actively referenced in $hit_count file(s)"
    printf '%s\n' "$active_hits" | head -5 | sed 's/^/  - /'
  fi
done

# Phantom files
for phantom in MIGRATION-COMPLETE.md test-migration; do
  hits=$(grep -rl "$phantom" .project-management .claude --include='*.md' 2>/dev/null \
    | grep -vE '(CHANGELOG|README\.md$)' || true)
  if [ -n "$hits" ]; then
    finding "🟡 MEDIUM" "Reference to non-existent \`$phantom\` in:"
    printf '%s\n' "$hits" | head -3 | sed 's/^/  - /'
  fi
done

# ---------- G. How-to-use coverage ----------

section "G. How-to-use guide coverage"

if hasdir ".claude/commands/how-to-use"; then
  # Commands without guides
  for cmd_file in .claude/commands/*.md; do
    [ -f "$cmd_file" ] || continue
    base=$(basename "$cmd_file" .md)
    case "$base" in
      COMMAND-TEMPLATE) continue ;;
      *-reference) continue ;;  # companion modules, not standalone commands
    esac
    # Skip files that declare themselves companions in their first 3 lines
    if head -3 "$cmd_file" 2>/dev/null | grep -qiE '^Companion to'; then
      continue
    fi
    if [ ! -f ".claude/commands/how-to-use/$base.md" ]; then
      finding "🟡 MEDIUM" "Command /$base has no how-to-use guide"
    fi
  done
  # Orphan guides
  for guide in .claude/commands/how-to-use/*.md; do
    [ -f "$guide" ] || continue
    base=$(basename "$guide" .md)
    [ "$base" = "README" ] && continue
    if [ ! -f ".claude/commands/$base.md" ]; then
      finding "🟡 MEDIUM" "how-to-use/$base.md has no matching command (/$base)"
    fi
  done
fi

# ---------- done ----------

section "Summary"
printf 'Audit complete. Review the sections above; critical findings (🔴) block the next release, HIGH (🟠) should be scheduled, MEDIUM (🟡) are housekeeping.\n'

exit 0
