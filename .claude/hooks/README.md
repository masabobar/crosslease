# Hooks

Shell scripts invoked by Claude Code lifecycle events. Wired up in `.claude/settings.example.json`.

**Requires:** `jq`, `git`, `bash`.

---

## Scripts

### `post-write-validations.sh`

**Event:** PostToolUse (Write | Edit)
**Purpose:** Enforce documentation.md §2.1 file-size limits and remind about backlog sync.

Emits warnings (never blocks) when:

| Condition                                                   | Severity       | Rule                                |
| ----------------------------------------------------------- | -------------- | ----------------------------------- |
| `.project-management/input/backlog/*.md` > 200 lines        | ⚠️ warning     | documentation.md §2.1               |
| `.claude/commands/modules/*.md` > 600 lines                 | 🔴 hard max    | documentation.md §2.1               |
| `.claude/commands/modules/*.md` > 300 lines                 | 🟡 ideal       | documentation.md §2.1               |
| `.claude/commands/*.md` (top level) > 300 lines             | 🟡 soft target | documentation.md §2.1               |
| Edit touches `.project-management/input/backlog/phase-*.md` | ℹ️ reminder    | Verify README.md totals still match |

### `stop-changelog-check.sh`

**Event:** Stop
**Purpose:** Remind about CHANGELOG at session end.

Warns when the branch has commits ahead of its upstream (or `main` / `master`) but none of them modified `CHANGELOG.md`.

---

## Activating the Hooks

Hooks live in `.claude/settings.example.json` (tracked in git so framework copies inherit them). Claude Code loads `.claude/settings.json`, which is **gitignored** — so to activate hooks for a given checkout:

```bash
cp .claude/settings.example.json .claude/settings.json
```

Then restart your Claude Code session (or open `/hooks` once) so the config watcher picks up the new settings file.

If `.claude/settings.json` already exists, merge the `hooks` block from `settings.example.json` into it — don't overwrite the whole file (see `.claude/rules/permissions.md`).

---

## Customizing or Disabling

- **Disable one hook:** edit `settings.json`, remove the corresponding entry from `hooks.PostToolUse` or `hooks.Stop`, or set its command to `true` (no-op).
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
bash .claude/hooks/tests/run-tests.sh audit-pm
bash .claude/hooks/tests/run-tests.sh stop-changelog
```

Coverage (v3.2):

- `test-post-write-validations.sh` — 15 assertions: small file / oversize backlog (200-cap) / module ideal-vs-hardmax thresholds / command soft target / how-to-use exclusion / missing file / missing `file_path`.
- `test-stop-changelog-check.sh` — 7 assertions: outside-git silence, no upstream, commits ahead with/without CHANGELOG, multi-commit, SIGPIPE regression guard.
- `test-audit-pm.sh` — 13 assertions: clean repo, version mismatch, missing rule, broken link, code-fence exemption, oversize backlog, legacy command (active vs historical context).

**Run before every change to `.claude/hooks/*.sh`** — each assertion is there because it caught a real bug (SIGPIPE, false-positive false-negatives, etc.).

Add new tests by:

1. Creating a scratch dir with `mk_scratch` (from `lib.sh`).
2. Preparing a fixture under it.
3. Piping the expected hook stdin and capturing output.
4. Asserting with `assert_contains` / `assert_empty` / `assert_not_contains`.
5. Calling `report_results` at the end to tally pass/fail.
