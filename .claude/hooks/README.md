# Hooks

Shell scripts invoked by Claude Code lifecycle events. Wired up in `.claude/settings.example.json`.

**Requires:** `jq`, `git`, `bash`.

---

## Scripts

### `pre-commit-code-review.sh`

**Event:** PreToolUse (Bash)
**Purpose:** When the command is `git commit` with staged `.ts`/`.tsx` files, inject the `.claude/rules/code-review.md` checklist as a reminder before the commit is created. Non-blocking.

### `post-write-validations.sh`

**Event:** PostToolUse (Write | Edit)
**Purpose:** Enforce documentation.md §2.1 file-size limits and remind about backlog sync.

Emits warnings (never blocks) when:

| Condition                                       | Severity       | Rule                                 |
| ----------------------------------------------- | -------------- | ------------------------------------ |
| `.claude/rules/*.md` > 200 lines                | 🟡 budget      | rules/README.md file-size discipline |
| `.claude/commands/modules/*.md` > 600 lines     | 🔴 hard max    | documentation.md §2.1                |
| `.claude/commands/modules/*.md` > 300 lines     | 🟡 ideal       | documentation.md §2.1                |
| `.claude/commands/*.md` (top level) > 300 lines | 🟡 soft target | documentation.md §2.1                |

> The former `stop-changelog-check.sh` (Stop-event CHANGELOG reminder) was removed 2026-07-05 — no `CHANGELOG.md` exists in this repo; conventional commits + GitLab MRs are the change history.

---

## Activating the Hooks

Hooks are wired in `.claude/settings.json` (tracked in git — active for every checkout). `.claude/settings.example.json` mirrors it as the template; only `.claude/settings.local.json` (personal overrides) is gitignored.

After changing hook config, restart your Claude Code session (or open `/hooks` once) so the config watcher picks it up. Per `.claude/rules/permissions.md`, Claude never modifies `settings.json` without explicit approval.

---

## Customizing or Disabling

- **Disable one hook:** edit `settings.json`, remove the corresponding entry from `hooks.PreToolUse` or `hooks.PostToolUse`, or set its command to `true` (no-op).
- **Change thresholds:** edit the relevant script directly (`post-write-validations.sh`). Thresholds are plain numbers, easy to tweak.
- **Disable all hooks globally:** add `"disableAllHooks": true` at the top level of `settings.json`.

---

## Design Principles

1. **Never block.** All hooks emit warnings via `systemMessage`; none return a blocking decision. File-size discipline is a gentle nudge, not a gate.
2. **Silent on success.** A hook that didn't fire leaves zero output. Only actionable messages appear.
3. **Self-contained.** Each script handles its own JSON parsing (via `jq`) and failure modes (missing files, no git upstream, etc.). If a dependency is missing, the hook exits silently rather than erroring.

---

## Tests

Hooks come with an automated test suite under `.claude/hooks/tests/`.

**Run all tests:**

```bash
bash .claude/hooks/tests/run-tests.sh
```

**Run one test file** (substring match):

```bash
bash .claude/hooks/tests/run-tests.sh post-write
```

Coverage (v3.3):

- `test-post-write-validations.sh` — 18 assertions: small file / oversize backlog (200-cap) / rule-file budget (200) / module ideal-vs-hardmax thresholds / command soft target / how-to-use exclusion / missing file / missing `file_path`.

**Run before every change to `.claude/hooks/*.sh`** — each assertion is there because it caught a real bug (SIGPIPE, false-positive false-negatives, etc.).

Add new tests by:

1. Creating a scratch dir with `mk_scratch` (from `lib.sh`).
2. Preparing a fixture under it.
3. Piping the expected hook stdin and capturing output.
4. Asserting with `assert_contains` / `assert_empty` / `assert_not_contains`.
5. Calling `report_results` at the end to tally pass/fail.
