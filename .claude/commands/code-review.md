---
name: code-review
description: Review the working diff (staged by default) against .claude/rules/code-review.md before commit
---

# /code-review

Review **only what changed** against the senior frontend standards in `.claude/rules/code-review.md`.

This is the per-commit gate referenced by `.claude/rules/code-review.md` ("Run `/code-review` before
every commit and push") and prompted by `.claude/hooks/pre-commit-code-review.sh`. It is the
diff-scoped sibling of `/review-codebase` — same 11-section checklist, same severity buckets, but the
surface is the diff instead of all of `src/`.

**Out of scope:** `src/components/ui/` (vendored shadcn primitives) and `src/generated/` (OpenAPI
codegen, regenerated via `pnpm fetch:openapi`). Neither is hand-authored — match ESLint's
`globalIgnores` and `/review-codebase`'s exclusions.

---

## Usage

```
/code-review                # staged changes only (default — the pre-commit gate)
/code-review --all          # staged + unstaged working-tree changes
/code-review --branch       # full branch diff vs origin/develop (pre-push / pre-MR gate)
/code-review --fix          # after reporting, apply Critical + High findings
```

`--fix` composes with any scope flag: `/code-review --branch --fix`.

---

## Your Task

### Step 1 — Load the checklist

Read `.claude/rules/code-review.md` in full — it is the evaluation standard for every finding, and its
header carries the **non-breaking rule** that governs every suggestion. Read
`.claude/rules/api-error-display.md` too; its fix-on-encounter procedure is mandatory in Step 5, not
optional.

### Step 2 — Resolve the diff scope

```bash
# default — staged only
BASE_ARGS="--cached"
# --all — staged + unstaged, i.e. the whole working tree vs HEAD
BASE_ARGS="HEAD"
# --branch — everything on this branch since it left develop
BASE_ARGS="$(git merge-base HEAD origin/develop)"

# Changed hand-authored TS files (A/C/M/R — deletions handled separately below)
git diff $BASE_ARGS --name-only --diff-filter=ACMR -- src \
  | grep -E '\.(ts|tsx)$' \
  | grep -v '^src/components/ui/' \
  | grep -v '^src/generated/'

# Non-TS changes that still carry review obligations
git diff $BASE_ARGS --name-only -- src/i18n openapi.json package.json
```

If the file list is empty, stop and report `No hand-authored TypeScript changes in scope.` — do not
invent findings or widen the scope to the whole tree (that is `/review-codebase`).

Also capture deletions and renames — they drive the orphan checks in Step 4:

```bash
git diff $BASE_ARGS --name-status --diff-filter=DR -- src
```

### Step 3 — Read the changed code

For each changed file:

1. `git diff $BASE_ARGS -- <file>` — see exactly which lines changed.
2. **Read the whole file.** A hunk cannot be judged in isolation: exports, imports, prop types, and
   the surrounding component shape all determine whether a changed line violates the checklist.
3. Judge **only the changed lines** against the checklist. Pre-existing violations on untouched lines
   are out of scope — that is `/review-codebase`'s job. The one exception: if a changed line makes a
   pre-existing problem materially worse (e.g. a new call-site added to an already-unsafe helper),
   flag it and say so explicitly.

For a diff spanning more than ~10 files, use the **Explore** subagent to run the Step 4 sweeps across
the changed-file list, then read the flagged files directly for depth.

### Step 4 — Scan the added lines

These sweeps read **added lines only**, so they never re-flag pre-existing code. Run them across the
changed-file list from Step 2.

```bash
# Collect the added lines once as file:line:content, so every hit below is directly
# citable in the report. awk tracks the `+++ b/` header and each `@@` hunk offset.
ADDED=$(git diff $BASE_ARGS -U0 -- src ':(exclude)src/components/ui' ':(exclude)src/generated' \
  | awk '
      /^\+\+\+ b\// { f = substr($0, 7); next }
      /^@@/         { match($0, /\+[0-9]+/); ln = substr($0, RSTART+1, RLENGTH-1); next }
      /^\+/         { print f ":" ln ":" substr($0, 2); ln++ }
    ')
scan() { printf '%s\n' "$ADDED" | grep -E "$1"; }

# TypeScript / React 19 anti-patterns (checklist §1, §2)
scan ': any|as any|<any>'
scan 'React\.FC'
scan 'forwardRef'
scan 'useMemo|useCallback|React\.memo'        # React Compiler handles memoization
scan 'useEffect'                              # never for data fetching
scan 'dangerouslySetInnerHTML'                # requires DOMPurify
scan 'defaultProps|extends React\.Component'

# Pre-commit blockers — cheaper to catch here than to have the hook reject the commit
scan 'console\.(log|warn|debug)|debugger|\.only\('

# Hardcoded enum wire values — must reference the schema enum (§10, enums-and-constants.md)
scan '(===|!==|case) *"(system_admin|support_user|auditor|front_office|back_office|leasing_company_user|active|invited|suspended|expired|deactivated|platform|bank_tenant|leasing_company)"'

# TODO/FIXME without a ticket reference (git.md)
scan 'TODO|FIXME' | grep -viE '#?[A-Z]{2,}[0-9]+-[0-9]+|#no-ticket'

# Raw HTML where a src/components/ui/ primitive exists (§12, code-review-ui.md).
# NOTE comments sit on the line ABOVE the element — check the preceding line in the
# file before flagging, or every already-documented exception becomes a false positive.
scan '<(button|input|select|textarea|table|tr|td|th)\b'
```

`scan` matches against the `file:line:` prefix as well as the code, so a path that happens to
contain a keyword can produce a hit — confirm each one in the file before flagging it.

**Structural checks that greps cannot decide** — verify these by reading, per changed file:

| Check                                                                                                                    | Rule                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| New default export outside a route-level `*Page.tsx`                                                                     | CLAUDE.md MUST NOT DO                      |
| New `index.ts` / `index.tsx` barrel file (except `src/router/index.tsx`)                                                 | CLAUDE.md MUST NOT DO                      |
| New mutation without `onError`; new foreground query without an `isError` branch                                         | `api-error-display.md` — **fix in Step 5** |
| `switch` on `err.code`, or matching on `err.message`                                                                     | `error-handling-and-logging.md` §2         |
| Hand-written interface for an API response instead of `z.infer<typeof Schema>`                                           | §1.2                                       |
| Zod `parse()` missing from the `queryFn`                                                                                 | §5                                         |
| Query key as an inline string instead of a typed constant                                                                | §3                                         |
| Server data written into a Zustand store                                                                                 | §3                                         |
| Route path hardcoded inline instead of a `PATHS` constant                                                                | §10                                        |
| New interactive element without `data-testid` (element and attribute are often on different lines — confirm in the file) | §9                                         |
| Imports/variables/functions orphaned by this change, or imports left pointing at a deleted/renamed file                  | CLAUDE.md §Surgical changes                |

### Step 5 — Fix-on-encounter (mandatory, before reporting)

Two categories are **fixed in this pass regardless of `--fix`**, because the rules require it and both
fixes are additive and cannot break existing behavior:

1. **Missing API error handling** — `.claude/rules/api-error-display.md` §4: locate the call site, look
   up the endpoint's error codes in `openapi.json`, apply the `onError` dynamic-lookup pattern (§2) or
   the query `isError` pattern (§3), and add the `errors.<CODE>` keys to **both** locales. Never leave
   a TODO.
2. **Missing i18n keys for strings added in this diff** — a `t()` call whose key does not resolve is a
   user-visible bug, not a style finding.

State clearly in the report which fixes were applied inline versus which findings are left for the
author to decide.

### Step 6 — i18n and test parity for this diff

```bash
# en/de key parity for every namespace touched by this diff
for ns in $(git diff $BASE_ARGS --name-only -- src/i18n/locales | sed -E 's#.*/(en|de)/##' | sort -u); do
  en="src/i18n/locales/en/$ns"; de="src/i18n/locales/de/$ns"
  [ -f "$de" ] || { echo "MISSING: $de"; continue; }
  diff <(jq -r 'paths(scalars) | join(".")' "$en" | sort) \
       <(jq -r 'paths(scalars) | join(".")' "$de" | sort) \
    && echo "OK: $ns keys match" || echo "DRIFT: $ns — see diff above"
done

# A new namespace must also be registered in i18n/types.d.ts AND config.ts (resources.en
# + the de languageLoaders entry) — verify by reading both files, not by grep alone.

# New schema / store / lib file must arrive with its test in the SAME diff (testing.md)
git diff $BASE_ARGS --name-only --diff-filter=A -- src \
  | grep -E 'features/[^/]+/api/schema\.ts$|^src/store/.*\.ts$|^src/lib/.*\.ts$' \
  | grep -v '\.test\.ts$'
# For each hit, confirm the matching src/__tests__/... file is also in the diff.
```

If `openapi.json` changed in this diff, re-verify the affected feature's Zod schemas and their tests
were updated alongside it.

### Step 7 — Emit the report

Same severity scale as `/review-codebase`, so findings from both commands are directly comparable:

| Severity        | Meaning                                       |
| --------------- | --------------------------------------------- |
| **Critical**    | Violates a MUST rule — blocks this commit     |
| **High**        | Violates a SHOULD rule — fix before push      |
| **Medium**      | Technical debt — fix before the feature ships |
| **Low / Style** | Minor — fix while the file is open            |

```
## Code Review — Diff

**Scope:** staged / working tree / branch vs origin/develop
**Files reviewed:** N   **Added lines:** N

### Critical (blocks this commit)
- `src/features/users/api/queries.ts:31` [API §5] Response returned without Zod parse() in queryFn
- `src/features/users/components/UserRow.tsx:22` [Security §7] Role compared to literal "system_admin"; use UserRoleSchema.enum.system_admin

### High (fix before push)
- `src/features/leases/components/LeaseTable.tsx:88` [React 19 §2.3] Array index used as key on a mutable list

### Medium
- `src/features/leases/api/queries.ts:14` [State §3] staleTime left at the default

### Low / Style
- `src/lib/format.ts:7` [Style §10] Magic number 1000 — extract a named constant

### Fixed inline (Step 5)
- `src/features/users/components/UserForm.tsx:64` Added onError with errors.<CODE> lookup + generic fallback
- `src/i18n/locales/{en,de}/users.json` Added errors.EMAIL_ALREADY_EXISTS

### Clean ✅
No findings in: [list changed files with zero violations]

---
**Verdict:** ✅ Clear to commit  |  ⚠️ N Critical must be resolved first
```

### Step 8 — Apply fixes (if `--fix` passed)

Apply all **Critical** and **High** findings; ask before Medium and Low. Every fix MUST satisfy the
non-breaking rule in `.claude/rules/code-review.md`'s header — before each edit, verify it does not
remove or rename an export consumed elsewhere, change a component prop or hook signature
incompatibly, alter behavior a passing test depends on, or introduce a type error in an untouched
file. Read the file first, make the minimal targeted change, and do not refactor surrounding code.

Then verify the tree still passes:

```bash
pnpm type-check && pnpm lint && pnpm test:run
```

Re-scan the changed lines to confirm the violations are gone. Report any finding you could not fix
without a coordinated multi-call-site change, with its scope, instead of applying it half-way.

### Step 9 — Hand off to the commit

Do **not** create the commit from this command. Report the verdict and stop. Per CLAUDE.md, the
commit flow asks for the Jira ticket number first — that is the user's call, not this command's.

---

## Related

- `.claude/rules/code-review.md` — the 11-section checklist (evaluation standard)
- `.claude/rules/api-error-display.md` — fix-on-encounter procedure enforced in Step 5
- `.claude/rules/code-review-ui.md` — full shadcn-first checklist behind Step 4's raw-HTML sweep
- `.claude/rules/testing.md` — required-tests gate behind Step 6
- `.claude/commands/review-codebase.md` — whole-`src/` audit; same checklist, wider surface
- `.claude/commands/pattern-audit.md` — structural health (DRY, extraction, composition)
- `.claude/hooks/pre-commit-code-review.sh` — hook that prompts this command on `git commit`
