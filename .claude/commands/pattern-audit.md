# /pattern-audit

Deep structural analysis of `src/` focused on four dimensions that a standard diff-review misses:

1. **DRY violations** — duplicated logic, schemas, hooks, JSX across multiple files
2. **Extraction opportunities** — inline code that belongs in a shared hook, utility, or component
3. **Component composition** — inconsistent modal / form / table / empty / error / loading patterns across features
4. **Over-engineering & simplification** — premature abstractions, prop explosion, unnecessary complexity

This command reads the full source tree, not just the diff. It is complementary to `/review-codebase`
(which checks rule compliance) — this one checks _structural health and internal consistency_.

---

## Usage

```
/pattern-audit                        # full analysis of all src/
/pattern-audit --feature auth         # scope to src/features/auth/ only
/pattern-audit --fix                  # after reporting, apply safe automatic fixes
```

---

## Your Task

### Step 1 — Inventory the codebase

Run these to build a topology map before reading any files:

```bash
# Full file list grouped by area
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | sort

# Count files per feature — spots unusually large or small features
find src/features -mindepth 1 -maxdepth 1 -type d | while read d; do
  echo "$(find "$d" -type f | wc -l) $d"
done | sort -rn

# All custom hooks defined in the project
grep -rn "^export function use\|^export const use" src --include="*.ts" --include="*.tsx" | grep -v "__tests__"

# All Zod schemas exported
grep -rn "^export const.*Schema\s*=\s*z\." src --include="*.ts" | grep -v "__tests__"

# All exported utility functions from src/lib/
grep -rn "^export function\|^export const" src/lib --include="*.ts"
```

If `--feature <name>` is passed, restrict all subsequent analysis to `src/features/<name>/`.

---

### Step 2 — DRY violation scan

Goal: find code that exists in two or more places but should exist in one.

#### 2a. Duplicated hook logic

Look for hooks in different features that share the same structural shape (same combination of `useState` / `useQuery` / `useMutation` calls, same arg shape). Read each hook file under `src/features/*/hooks/` and `src/hooks/`. Flag pairs or groups where:

- Two hooks call the same query key pattern
- Two hooks manage the same local state shape (`{ open, setOpen }`, `{ page, setPage }`, `{ search, setSearch }`)
- Two hooks wire the same mutation + invalidation pattern

#### 2b. Duplicated Zod schemas

Grep for all schema definitions. For each pair of schemas, check whether one is a strict subset of the other (all fields duplicated verbatim) instead of using `.extend()`, `.pick()`, or `.omit()`. Flag schemas that share 3+ identical field definitions.

```bash
grep -rn "z\.object({" src --include="*.ts" --include="*.tsx" | grep -v "__tests__"
```

Read flagged files to compare field lists.

#### 2c. Duplicated utility / format functions

Read all files in `src/lib/`. Then grep features for inline utility-style functions (functions that take primitive args and return a formatted value). Flag any inline function that matches an existing `src/lib/` function, or that appears with the same logic in 2+ feature files.

```bash
# Inline arrow functions that look like formatters or calculators
grep -rn "const format\|const get\|const calc\|const build\|const map\|const to[A-Z]" src/features --include="*.ts" --include="*.tsx"
```

#### 2d. Duplicated JSX structure

Look for JSX blocks (minimum 4 lines) that appear structurally identical across 2+ files. Focus on:

- Card/list-item wrappers
- Empty-state blocks (illustration + heading + description)
- Error-state blocks
- Loading skeleton structures

Scan using:

```bash
grep -rn "className=.*flex.*flex-col\|className=.*grid\|className=.*rounded" src/features --include="*.tsx" | head -60
```

Read the surrounding 10 lines for each hit to compare structure.

---

### Step 3 — Extraction opportunity scan

Goal: find inline code that is one level of abstraction below where it should live.

#### 3a. Inline async / mutation logic inside components

Components should not contain `async` functions or direct `api.*` calls. They delegate to hooks. Flag any component file that:

- Defines an `async` function inside the component body (not in a hook)
- Calls `api.*` directly rather than through a query/mutation hook
- Manages `loading` / `error` state manually with `useState` instead of using React Query

```bash
grep -rn "async.*=>" src/features --include="*.tsx" | grep -v "queryFn\|mutationFn\|__tests__"
grep -rn "useState.*loading\|useState.*isLoading\|useState.*error\|useState.*isError" src/features --include="*.tsx"
grep -rn "api\.\(get\|post\|put\|patch\|delete\)" src/features --include="*.tsx" | grep -v "api/\|__tests__"
```

#### 3b. Repeated inline Tailwind class combos

When the same Tailwind class string (5+ classes) appears 3+ times across different components, it should become a `cva()` variant or a shared `cn()` constant. Flag clusters.

```bash
# Long class strings — likely candidates for cva()
grep -rn 'className="[^"]\{60,\}"' src/features --include="*.tsx" | head -40
```

Read flagged lines; group visually similar class strings.

#### 3c. Inline pagination / search / filter state

Pagination, search, and filter state is a recurring pattern. If it appears inline (as `useState` in a component) in 2+ features, it should be a shared `usePagination`, `useSearch`, or `useTableFilters` hook in `src/hooks/`.

```bash
grep -rn "useState.*page\b\|useState.*search\b\|useState.*filter\b\|useState.*sort\b" src/features --include="*.tsx"
```

#### 3d. Inline date / number formatting

Any `Intl.DateTimeFormat`, `new Date(…).toLocaleDateString`, `.toFixed(`, currency formatting, or similar recurring inline expression that appears in 2+ files should be extracted to `src/lib/format.ts`.

```bash
grep -rn "toLocaleDateString\|toLocaleString\|toFixed\|Intl\." src/features --include="*.ts" --include="*.tsx"
```

---

### Step 4 — Component composition audit

Goal: verify that the same UI problem is solved the same way everywhere.

#### 4a. Modal / dialog pattern

Every modal should use `<Dialog>` from `src/components/ui/`. Check that:

- All modal-like overlays use `<Dialog>` + `<DialogContent>` + `<DialogHeader>` + `<DialogTitle>`
- No feature rolls its own modal with a `fixed inset-0` div
- `open` state is controlled by the caller, not managed internally (unless explicitly a self-contained trigger pattern)

```bash
grep -rn "fixed inset\|z-\[9\|z-50.*absolute\|Portal\|createPortal" src/features --include="*.tsx"
grep -rn "<Dialog\b" src --include="*.tsx"
```

#### 4b. Form pattern

Every form should use React Hook Form + Zod resolver via `<Form>` / `<FormField>` / `<FormItem>` / `<FormLabel>` / `<FormMessage>`. Flag any form that:

- Uses raw `<form onSubmit>` without `useForm`
- Manages field values with `useState` instead of RHF
- Has inline validation logic instead of a Zod schema

```bash
grep -rn "useState.*value\|onChange.*e\.target\|onSubmit.*e\.preventDefault" src/features --include="*.tsx"
grep -rn "useForm\b" src/features --include="*.tsx"
```

#### 4c. Table pattern

All tables should use `<Table>` / `<TableHeader>` / `<TableBody>` / `<TableRow>` / `<TableCell>` from shadcn. Flag raw `<table>` / `<tr>` / `<td>` usage.

```bash
grep -rn "<table\b\|<tr\b\|<td\b\|<th\b" src/features --include="*.tsx" | grep -v "NOTE:"
```

Also check: do all tables handle empty state and loading state consistently? Compare how each feature renders `isLoading` and `data.length === 0` for table views.

#### 4d. Empty state pattern

Find all components that render an empty-state UI (no data, zero results). Verify they share the same visual pattern — same component or same composition of primitives — rather than each feature inventing its own layout.

```bash
grep -rn "empty\|no.*found\|no.*result\|nothing.*here\|No.*yet" src/features --include="*.tsx" -i | grep -v "__tests__\|placeholder\|aria"
```

#### 4e. Error state pattern

Find how each feature handles query errors (`isError` branch). Verify consistent rendering — same `<ErrorState>` or equivalent.

```bash
grep -rn "isError\|error &&\|error ?" src/features --include="*.tsx" | grep -v "__tests__"
```

#### 4f. Loading / skeleton pattern

Find all loading states. Verify consistent use of `<Skeleton>` from shadcn vs. custom spinners.

```bash
grep -rn "isLoading\|isFetching\|Skeleton\|spinner\|Spinner" src/features --include="*.tsx" | grep -v "__tests__"
```

---

### Step 5 — Over-engineering & simplification scan

Goal: find code that is more complex than the problem requires.

#### 5a. Single-use abstractions

A hook or utility only used in one place is premature extraction. It adds indirection without reuse benefit. Find hooks and `src/lib/` functions that are imported in exactly one file.

For each hook defined in `src/features/*/hooks/` or `src/hooks/`, count its import sites:

```bash
# For each hook, count how many files import it
grep -rn "^export function use\|^export const use" src/features --include="*.ts" --include="*.tsx" | grep -oP "use\w+" | sort -u | while read hook; do
  count=$(grep -rln "$hook" src --include="*.ts" --include="*.tsx" | grep -v "^.*hooks/.*\.ts$" | wc -l)
  echo "$count $hook"
done | sort -n | head -20
```

Flag hooks with an import count of 1. Note: hooks in `src/hooks/` (shared) are less suspicious; hooks buried in a single feature's `hooks/` folder are more so.

#### 5b. Prop explosion (components with too many props)

A component with 8+ props usually signals it is doing too much, or that state should be lifted into a hook or managed via context. Find component function signatures with many parameters:

```bash
grep -rn "^function\|^export default function\|^export function" src/features src/components --include="*.tsx" | head -5
```

Then read each component file and count props. Flag any component with ≥ 8 props. Check whether props can be grouped into a config object, moved to a context, or indicate the component should be split.

#### 5c. Wrapper components with no logic

A component that only wraps a shadcn primitive with fixed props and nothing else (no state, no event handling, no conditional rendering) is likely not needed. Flag any component file that is ≤ 15 lines and contains a single JSX return with no hooks and no conditions.

#### 5d. Conditional JSX depth

Deep ternary chains or nested `&&` conditions inside JSX make components hard to read and test. Flag JSX with 3+ levels of nesting conditions:

```bash
grep -rn "? .* : .* ? .* :" src/features --include="*.tsx"
grep -c "&&" src/features/**/*.tsx 2>/dev/null | sort -t: -k2 -rn | head -10
```

#### 5e. Zod schemas that should compose

Schemas that duplicate fields from another schema instead of using `.extend()` / `.pick()` / `.omit()`. Read schema files pairwise within each feature and across `src/types/`.

---

### Step 6 — Synthesize and report

Emit the report in this format:

```
## Pattern Audit Report

**Date:** YYYY-MM-DD
**Scope:** full / feature: X
**Files analysed:** N

---

### 1. DRY Violations

#### High — fix this sprint
- **[DRY-H1]** `src/features/users/hooks/useUserList.ts` and `src/features/leases/hooks/useLeaseList.ts` share identical pagination state logic (`page`, `pageSize`, `setPage`). Extract `usePaginatedQuery(key, fn)` to `src/hooks/`.
- **[DRY-H2]** `UserSchema` in `src/features/users/api/schema.ts` duplicates 4 fields verbatim from `ProfileSchema`. Use `.extend()`.

#### Medium — address before feature ships
- **[DRY-M1]** `formatDate()` defined inline in 3 feature components. Move to `src/lib/format.ts`.

---

### 2. Extraction Opportunities

#### High
- **[EXT-H1]** `src/features/contracts/components/ContractForm.tsx:88` — async submit handler defined inside component; move to `useMutation` hook in `src/features/contracts/hooks/`.

#### Medium
- **[EXT-M1]** Pagination state (`page`, `search`, `sortBy`) is managed with raw `useState` in 4 feature list components. Extract `useTableState()` to `src/hooks/`.

---

### 3. Composition Inconsistencies

#### High
- **[COMP-H1]** `src/features/audit/components/AuditFilter.tsx` uses a raw `<div className="fixed inset-0 ...">` for an overlay. Replace with `<Dialog>`.

#### Medium
- **[COMP-M1]** Error states: `leases` uses `<p className="text-red-500">`, `users` uses `<ErrorState>`, `audit` has no error branch. Standardise on `<ErrorState message={...} />`.
- **[COMP-M2]** Loading states: 3 features use `<Skeleton>`, 2 use a custom `<Spinner>`. Pick one.

---

### 4. Over-engineering / Simplification

#### Medium
- **[SIMP-M1]** `src/features/users/hooks/useUserSort.ts` is only imported in `UserList.tsx`. Inline the 12 lines of sort logic into the component; extract only if a second consumer appears.
- **[SIMP-M2]** `src/features/leases/components/LeaseCard.tsx` has 11 props. Consider grouping into `lease: LeaseCardData` + `actions: LeaseCardActions` objects, or moving open/close state into the component.

#### Low
- **[SIMP-L1]** `src/features/auth/components/LoginForm.tsx:44` — triple nested ternary. Extract into 3 clearly named early-return conditions.

---

### Summary

| Category | High | Medium | Low |
|----------|------|--------|-----|
| DRY violations | 2 | 1 | 0 |
| Extraction opportunities | 1 | 1 | 0 |
| Composition | 1 | 2 | 0 |
| Over-engineering | 0 | 2 | 1 |
| **Total** | **4** | **6** | **1** |

### No findings in
[list groups with zero violations per dimension]
```

---

### Step 7 — Apply fixes (if `--fix` passed)

Apply all **High** findings automatically. For each fix:

- Read the full file before editing
- Make the minimal targeted change (extract, import, replace)
- Do not touch surrounding code
- For extractions to `src/hooks/` or `src/lib/`: create the new file, update the original import, verify no other file breaks

After applying, re-run the relevant grep from the step that found the violation to confirm it is gone.

Ask for confirmation before applying **Medium** and **Low** findings.

---

## What this does NOT do

- Does not check rule compliance (TypeScript strictness, React 19 patterns, i18n) — that is `/review-codebase`
- Does not review a diff — that is `/code-review`
- Does not simplify individual functions — that is `/simplify`
- Does not run tests or type-check — run `pnpm type-check && pnpm test:run` separately

---

## Related

- `.claude/rules/code-quality.md` — SOLID & DRY principles this command enforces structurally
- `.claude/rules/code-review.md` §10 — the cross-file duplication checklist this command expands
- `/review-codebase` — rule-compliance audit (TypeScript, React 19, i18n, security, testing)
- `/simplify` — apply simplification to the current diff only
