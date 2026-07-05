# /review-codebase

Perform a comprehensive code review of the entire codebase (or a scoped subset) against
senior frontend standards defined in `.claude/rules/code-review.md`.

Reviews all files in `src/` — not just the diff — checking every feature, shared component,
hook, utility, and store against all 11 sections of the review checklist.

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

Read `.claude/rules/code-review.md` in full. This is the evaluation standard for every finding.

### Step 2 — Discover the surface

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | sort
```

Group files by:

| Group        | Path                                           |
| ------------ | ---------------------------------------------- |
| Features     | `src/features/<name>/` — one group per feature |
| Shared UI    | `src/components/`                              |
| Shared hooks | `src/hooks/`                                   |
| Utilities    | `src/lib/`                                     |
| Stores       | `src/store/`                                   |
| Router       | `src/router/`                                  |
| i18n         | `src/i18n/`                                    |

If `--feature <name>` is passed, scope to `src/features/<name>/` only.
If `--section <N>` is passed, apply only that checklist section across the full surface.

### Step 3 — Review each group

For each group, read the files and evaluate against every applicable section of the checklist.
Use the **Explore** subagent for broad pattern scanning (e.g., grep for `any`, `forwardRef`,
`useEffect`, `console.log`, hardcoded strings); then read flagged files directly for depth.

Key patterns to scan for across the entire codebase before reading individual files:

```bash
# TypeScript anti-patterns
grep -rn ": any" src --include="*.ts" --include="*.tsx"
grep -rn "as any" src --include="*.ts" --include="*.tsx"
grep -rn "React\.FC" src --include="*.tsx"
grep -rn "forwardRef" src --include="*.tsx"
grep -rn "useMemo\|useCallback\|React\.memo" src --include="*.tsx"
grep -rn "useEffect" src --include="*.tsx"
grep -rn "console\.\(log\|warn\|debug\)" src --include="*.ts" --include="*.tsx"
grep -rn "dangerouslySetInnerHTML" src --include="*.tsx"

# i18n violations
grep -rn '"[A-Z][a-z]\{2,\}' src/features --include="*.tsx"  # hardcoded sentences

# Interactive elements potentially missing data-testid (QA Playwright target)
# Flag any <button>, <input>, <select>, <textarea>, <a> that lacks data-testid
grep -rn "<button\|<input\|<select\|<textarea\|<a " src/features --include="*.tsx" | grep -v "data-testid"

# UI component primitives — raw HTML used where a src/components/ui/ primitive exists
# These hits need a NOTE: comment or should be replaced with the ui/ component
grep -rn "<button\b" src/features src/hooks --include="*.tsx" | grep -v "NOTE:"
grep -rn "<input\b" src/features src/hooks --include="*.tsx" | grep -v "NOTE:"
grep -rn "<select\b" src/features src/hooks --include="*.tsx" | grep -v "NOTE:"
grep -rn "<textarea\b" src/features src/hooks --include="*.tsx" | grep -v "NOTE:"
grep -rn "<table\b\|<tr\b\|<td\b\|<th\b" src/features src/hooks --include="*.tsx" | grep -v "NOTE:"
```

Focus findings — only flag real violations per the checklist, not style preferences.

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

Apply all **Critical** and **High** findings to the working tree. For each fix:

- Read the file first
- Make the minimal targeted change
- Do not refactor surrounding code

After applying, re-scan to confirm the violations are gone.
Ask the user before applying **Medium** and **Low** findings.

---

## Related

- `.claude/rules/code-review.md` — the review checklist (11 sections)
- `.claude/rules/code-quality.md` — SOLID & DRY depth
- `.claude/rules/testing.md` — required-tests gate (schemas / stores / utils)
- `.claude/rules/security-and-auth.md` — RBAC wire values, role guards
- `.claude/hooks/pre-commit-code-review.sh` — hook that prompts review on staged files before commit
