---
name: review-codebase
description: Full-codebase audit of src/ against all 11 sections of .claude/rules/project/code-review.md — the whole-tree sibling of /code-review
---

# /review-codebase

Perform a comprehensive code review of the entire codebase (or a scoped subset) against
senior frontend standards defined in `.claude/rules/project/code-review.md`.

Reviews all files in `src/` — not just the diff — checking every feature, shared component,
hook, utility, and store against all 11 sections of the review checklist.

**Out of scope:** `src/components/ui/` (vendored shadcn primitives, already excluded from
ESLint's `react-refresh` rule) and `src/generated/` (OpenAPI codegen, regenerated via
`pnpm fetch:openapi`). Neither is hand-authored, so findings there aren't actionable by
the team — match ESLint's own `globalIgnores`.

---

## Usage

```
/review-codebase                    # full audit of all src/
/review-codebase --feature auth     # one feature only (src/features/auth/)
/review-codebase --section 2        # React 19 patterns across entire codebase
/review-codebase --fix              # after reporting, apply Critical + High findings
```

---

## Your Task

### Step 1 — Load the checklist

Read `.claude/rules/project/code-review.md` in full. This is the evaluation standard for every finding.

### Step 2 — Discover the surface

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "src/components/ui/*" -not -path "src/generated/*" | sort
```

Group files by:

| Group        | Path                                           |
| ------------ | ---------------------------------------------- |
| Features     | `src/features/<name>/` — one group per feature |
| Shared UI    | `src/components/` (excluding `ui/`)            |
| Shared hooks | `src/hooks/`                                   |
| Utilities    | `src/lib/`                                     |
| Stores       | `src/store/`                                   |
| Router       | `src/router/`                                  |
| i18n         | `src/i18n/`                                    |
| Tests        | `src/__tests__/`                               |

`src/components/ui/` and `src/generated/` are out of scope (see note above).

If `--feature <name>` is passed, scope to `src/features/<name>/` only.
If `--section <N>` is passed, apply only that checklist section across the full surface.

### Step 3 — Review each group

For each group, read the files and evaluate against every applicable section of the checklist.
Use the **Explore** subagent for broad pattern scanning (e.g., grep for `any`, `forwardRef`,
`useEffect`, `console.log`, hardcoded strings); then read flagged files directly for depth.

Key patterns to scan for across the entire codebase before reading individual files:

```bash
# TypeScript anti-patterns — excludes src/components/ui (vendored shadcn) and
# src/generated (OpenAPI codegen), neither of which the team hand-authors
grep -rn ": any" src --include="*.ts" --include="*.tsx" --exclude-dir=ui --exclude-dir=generated
grep -rn "as any" src --include="*.ts" --include="*.tsx" --exclude-dir=ui --exclude-dir=generated
grep -rn "React\.FC" src --include="*.tsx" --exclude-dir=ui --exclude-dir=generated
grep -rn "forwardRef" src --include="*.tsx" --exclude-dir=ui --exclude-dir=generated
grep -rn "useMemo\|useCallback\|React\.memo" src --include="*.tsx" --exclude-dir=ui --exclude-dir=generated
grep -rn "useEffect" src --include="*.tsx" --exclude-dir=ui --exclude-dir=generated
grep -rn "dangerouslySetInnerHTML" src --include="*.tsx" --exclude-dir=ui --exclude-dir=generated

# console.log/warn/debug — excludes .test./.spec. files to match the actual
# enforcement in scripts/check-forbidden-code.js, which allows console in test files
grep -rn "console\.\(log\|warn\|debug\)" src --include="*.ts" --include="*.tsx" \
  --exclude-dir=ui --exclude-dir=generated | grep -v "\.test\.\|\.spec\."

# Default exports outside route-level page components (MUST NOT DO in CLAUDE.md).
# *Page.tsx files are the sanctioned exception — React Router lazy-loaded route
# components — confirmed as the only pattern behind every current default export.
grep -rln "^export default" src/features src/hooks src/lib src/store --include="*.ts" --include="*.tsx" \
  | grep -v "Page\.tsx$"

# Barrel files (index.ts/index.tsx re-exports) — forbidden except the router config
# entry point, which CLAUDE.md explicitly mandates lives at src/router/index.tsx
find src -type f \( -name "index.ts" -o -name "index.tsx" \) -not -path "src/router/index.tsx"

# Test-coverage parity — every Zod schema, Zustand store, and lib utility must have
# a matching unit test (testing.md). Flags drift as features/stores/utils are added.
for f in $(find src/features -path "*/api/schema.ts"); do
  feat=$(echo "$f" | sed -E 's#src/features/([^/]+)/.*#\1#')
  test="src/__tests__/features/$feat/api/schema.test.ts"
  [ -f "$test" ] || echo "NO TEST: $f (expected $test)"
done
for f in $(find src/store -name "*.ts" ! -name "*.test.ts"); do
  base=$(basename "$f" .ts)
  test="src/__tests__/store/$base.test.ts"
  [ -f "$test" ] || echo "NO TEST: $f (expected $test)"
done
for f in $(find src/lib -name "*.ts" ! -name "*.test.ts"); do
  base=$(basename "$f" .ts)
  test="src/__tests__/lib/$base.test.ts"
  [ -f "$test" ] || echo "NO TEST: $f (expected $test)"
done

# TODO/FIXME must reference a ticket (git.md) — accepts "#PRD1234-56", "PRD1234-56",
# or "#no-ticket"; src/generated is already excluded above
grep -rnE "TODO|FIXME" src/features src/hooks src/lib src/store --include="*.ts" --include="*.tsx" \
  | grep -viE "#?[A-Z]{2,}[0-9]+-[0-9]+|#no-ticket"

# i18n violations
grep -rn '"[A-Z][a-z]\{2,\}' src/features --include="*.tsx"  # hardcoded sentences

# i18n en/de key parity — every namespace must have identical key sets in both locales
for f in src/i18n/locales/en/*.json; do
  base=$(basename "$f")
  de="src/i18n/locales/de/$base"
  if [ ! -f "$de" ]; then
    echo "MISSING: $de has no counterpart for $f"
    continue
  fi
  diff <(jq -r 'paths(scalars) | join(".")' "$f" | sort) \
       <(jq -r 'paths(scalars) | join(".")' "$de" | sort) \
    && echo "OK: $base keys match" \
    || echo "DRIFT: $base — see diff above"
done

# Interactive elements potentially missing data-testid (QA Playwright target)
# Covers both raw HTML and shadcn primitives — most interactive elements in this
# codebase are shadcn components (<Button>, <Input>, <Select>, <Dialog>, ...), so
# limiting this to raw HTML misses the vast majority of real cases.
grep -rn "<button\|<input\|<select\|<textarea\|<a \|<Button\|<Input\b\|<Select\b\|<Checkbox\|<Switch\|<RadioGroup\|<Textarea\|<DialogTrigger\|<AlertDialogTrigger\|<DropdownMenuTrigger" \
  src/features --include="*.tsx" | grep -v "data-testid"

# UI component primitives — raw HTML used where a src/components/ui/ primitive exists.
# NOTE comments are written on the line ABOVE the element, not inline — a same-line
# `grep -v "NOTE:"` never matches and produces false positives on every already-
# documented exception. Use -B1 and check the preceding line before flagging a hit.
grep -rn -B1 "<button\b" src/features src/hooks --include="*.tsx"
grep -rn -B1 "<input\b" src/features src/hooks --include="*.tsx"
grep -rn -B1 "<select\b" src/features src/hooks --include="*.tsx"
grep -rn -B1 "<textarea\b" src/features src/hooks --include="*.tsx"
grep -rn -B1 "<table\b\|<tr\b\|<td\b\|<th\b" src/features src/hooks --include="*.tsx"

# Hardcoded enum wire-value literals — role/status values must be referenced from
# their schema/const, never freehand strings (enums-and-constants.md, code-review.md §10)
grep -rnE '===\s*"(system_admin|support_user|auditor|front_office|back_office|leasing_company_user|active|invited|suspended|expired|deactivated|platform|bank_tenant|leasing_company)"' \
  src --include="*.ts" --include="*.tsx" --exclude-dir=ui --exclude-dir=generated
```

Focus findings — only flag real violations per the checklist, not style preferences.

**Coverage note:** a single full-`src` run is triage-level, not exhaustive — the search
space (11 checklist sections × every group) is too large for one pass to read every file
in full depth, so different runs allocate their reading depth differently and can surface
different findings. For a thorough audit, prefer `--feature <name>` per feature so each
run can read its files completely. Treat repeated full-`src` runs as convergent, not
redundant — keep running until two consecutive runs surface nothing new.

### Step 4 — Categorise each finding

| Severity        | Meaning                                      |
| --------------- | -------------------------------------------- |
| **Critical**    | Violates a MUST rule; fix before next commit |
| **High**        | Violates a SHOULD rule; fix this sprint      |
| **Medium**      | Technical debt; address before feature ships |
| **Low / Style** | Minor; fix when touching the file anyway     |

### Step 5 — Emit the report

```
## Codebase Review Report

**Date:** YYYY-MM-DD
**Scope:** full / feature: X / section: Y
**Files reviewed:** N

### Critical (fix before next commit)
- `src/features/auth/api/schema.ts:42` [TypeScript §1.2] Response type is hand-written interface; must be z.infer<typeof Schema>
- `src/features/users/components/UserList.tsx:22` [Security §7] Role check uses hardcoded "admin" string; must use wire value `system_admin`

### High (fix this sprint)
- `src/features/dashboard/components/Chart.tsx:88` [React 19 §2.3] Array index used as React key on mutable list
- `src/store/uiStore.ts:14` [State §3] API response data stored in Zustand (server state belongs in React Query)

### Medium (address before feature ships)
- `src/features/leases/api/queries.ts:31` [API §5] Query key is inline string; extract as typed constant

### Low / Style
- `src/lib/format.ts:7` [Style §10] Magic number 1000 — extract as named constant

### Passed ✅
No findings in: [list groups with zero violations]

---
N Critical, N High, N Medium, N Low findings across N files.
```

### Step 6 — Apply fixes (if `--fix` passed)

Apply all **Critical** and **High** findings to the working tree. Every fix MUST follow
the non-breaking rule from `.claude/rules/project/code-review.md`'s header — a codebase-wide
sweep touches far more call-sites than a single-file review, so an unsafe fix has a much
larger blast radius. For each fix:

- Read the file first
- Verify the change doesn't remove/rename an export, alter a prop or hook signature, or
  change behavior other files/tests depend on
- Make the minimal targeted change
- Do not refactor surrounding code

After applying, re-scan to confirm the violations are gone.
Ask the user before applying **Medium** and **Low** findings.

---

## Related

- `.claude/rules/project/code-review.md` — the review checklist (11 sections)
- `.claude/rules/project/code-quality.md` — SOLID & DRY depth
- `.claude/rules/project/testing.md` — required-tests gate (schemas / stores / utils)
- `.claude/rules/project/security-and-auth.md` — RBAC wire values, role guards
- `.claude/hooks/pre-commit-code-review.sh` — hook that prompts review on staged files before commit
