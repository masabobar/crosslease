---
name: audit-pm
description: Audit the PM framework in this repo for consistency, broken links, stale references, file-size violations, and orphan files. Reports findings prioritized by severity.
---

# /audit-pm — Project Management Framework Audit

**📖 Quick Start:** See [how-to-use/audit-pm.md](./how-to-use/audit-pm.md) (~80 lines)

---

## Purpose

Scan the `.project-management/` + `.claude/` trees for the same classes of problems this framework repo audited and fixed for itself in v3.2.0:

1. **Consistency** — version strings drifting across docs, CHANGELOG missing entries, backlog structure references that contradict what's on disk.
2. **Broken references** — internal Markdown links whose target doesn't exist, dead file-path mentions.
3. **Stale artifacts** — legacy v2.0 directories, references to removed commands, mentions of files that were never created.
4. **File-size violations** — documentation.md §2.1 limits (200 lines for backlog, 300 ideal / 600 max for modules, 300 soft for top-level commands).
5. **Orphans & gaps** — commands without how-to-use guides, how-to-use guides without matching commands, expected files missing.

Output is a prioritized Markdown report with severity markers.

---

## Usage

```bash
/audit-pm
```

Optional flag:

- `/audit-pm --fix` — after producing the report, offers to apply low-risk auto-fixable findings interactively. Never silent: each category is confirmed before any change. See STEP 6 below.

---

## 📋 YOUR TASK

### STEP 1 — Ensure you're in a project that uses this framework

**Verify the target repo:**

- `.project-management/` exists
- `.claude/commands/` exists
- `.claude/rules/` exists (especially `documentation.md` — it defines the file-size limits this audit enforces)

**If missing:** the repo isn't using this framework. Suggest `/init-project` instead and exit.

---

### STEP 2 — Run the mechanical audit

**Tool:** `.claude/hooks/audit-pm.sh` (shipped with the framework)

```bash
bash .claude/hooks/audit-pm.sh > /tmp/audit-pm-$$.md
```

The script emits a sectioned Markdown report covering:

- A. Structure health (required files exist)
- B. File-size limits
- C. Version consistency
- D. Broken internal references
- E. Backlog structure references (modular vs monolithic)
- F. Legacy & deprecated references
- G. How-to-use guide coverage

**Read the report** (`cat /tmp/audit-pm-$$.md`) and hold the findings in memory.

**If the script is missing:** this is an older framework copy. Tell the user and either:

- Copy `audit-pm.sh` from the source framework, or
- Fall back to manual audit (use Explore agents + grep).

---

### STEP 3 — Apply judgement checks the script cannot do

The script handles mechanical checks. These need a human + Claude:

#### 3.1 Verify "current version" claim

- Open root `README.md` and `.project-management/README.md`; note the version each declares.
- Cross-check `CHANGELOG.md`: is there an entry for that version? Is its date plausible (not in the far past)?
- If multiple "current" claims exist, surface which one is authoritative.

#### 3.2 Scan for prose drift

- Grep docs for phrases like "v3.0 feature", "introduced in v3.1", "new in v3.2" — any still-current claims about removed features?
- Look for TODO / FIXME / XXX comments in `.project-management/` and `.claude/` docs.

#### 3.3 Judge duplicate documents

The script can't tell "duplicate" from "intentional overlap". Review pairs whose filenames suggest they might cover the same ground, e.g.:

- Two files with overlapping topic-words in their names
- A `README.md` and a `SYSTEM-OVERVIEW.md` in adjacent directories
- A `*-PRACTICES.md` and a `*-GUIDE.md` covering related material

Ask three things before flagging:

1. Does the file's intro explicitly say it's an index / pointer / TL;DR? If yes, **not a duplicate** — leave it alone.
2. Do the section headers actually overlap, or are they sibling topics (workflows vs best-practices vs reference)?
3. Could a reader land on either file and get the same answer? If yes, that's the duplicate; otherwise it's intentional overlap.

Only flag as 🟡 MEDIUM when (3) is true. False positives waste user time.

(The previous version of this guide listed `WORKFLOWS-BEST-PRACTICES.md` as a candidate; that file is a deliberate index/pointer page and is **not** a duplicate. Don't re-flag it.)

#### 3.4 Check auto-generated vs hand-written boundary

- `output/` should be Claude-generated. If user edits there, they'll be overwritten by `/execute-work` auto-updates. Flag anything that looks hand-maintained in `output/progress/` or `output/phases/`.
- `input/` should be user-maintained. If Claude appears to have generated something there (e.g. strict template boilerplate with unfilled placeholders), flag it.

---

### STEP 4 — Consolidate & prioritize

Merge the script's output with your judgement findings into one report structured like this:

```markdown
# PM Framework Audit Report

**Date:** YYYY-MM-DD
**Repo:** <path>
**Framework version declared:** <version from README>

## 🔴 Critical (blocks release)

- [finding 1]
- [finding 2]

## 🟠 High (schedule this week)

- [finding]

## 🟡 Medium (housekeeping)

- [finding]

## 🟢 Low (cosmetic)

- [finding]

## Next actions

- Recommended first batch to address (top ~3 items)
- Which findings can be auto-fixed vs which need discussion
```

**Severity guide** (match what the recent v3.2 self-audit used):

- 🔴 Critical: broken command, missing critical file, broken links used in primary user path
- 🟠 High: version chaos, stale structure references, CHANGELOG missing current version
- 🟡 Medium: duplicate docs, oversized files, legacy artifacts, missing how-to-use guides
- 🟢 Low: cosmetic, naming inconsistency

---

### STEP 5 — Offer next steps (default / no `--fix`)

Present the report and **ask** before acting:

1. "Shall I batch the 🔴 critical findings and open a plan to fix them?"
2. "Should I run the same audit on a sibling project?"
3. "Just saving the report — no action now?"

Default mode is discovery only; fixes belong to a follow-up user-confirmed plan.

---

### STEP 6 — Interactive `--fix` mode

Activated when the user runs `/audit-pm --fix`. Full workflow (classify → group → confirm → apply → re-verify → manual summary → commit offer) is in `audit-pm-fix-mode.md`.

Key invariants: never silent, every category confirmed before applying, each applied group is re-verified by re-running `audit-pm.sh`.

---

## 🔧 References

- **Script:** `.claude/hooks/audit-pm.sh` — mechanical checks
- **Rules:** `.claude/rules/documentation.md` §2.1 (file size limits)
- **Related:** `/project-status` (runtime progress), this command (documentation/structural health)
- **Inspired by:** the v3.2.0 self-audit documented in `CHANGELOG.md`

---

## Output Examples

### Clean repo

```
# PM Framework Audit Report
**Date:** 2026-04-21
**Framework version declared:** 3.2.0

## 🟢 Low (cosmetic)
- 2 top-level commands slightly above 300-line soft target (execute-work 444, process-client-docs 368)

No critical, high, or medium findings. Framework is in good shape.
```

### Framework drifting

```
## 🔴 Critical
- 12 broken internal markdown links in guides/COMMANDS-REFERENCE.md (relative paths use ../.claude instead of ../../.claude)

## 🟠 High
- Version mismatch: README claims v3.2.0, 7 subordinate docs still say v3.0.0
- CHANGELOG.md has no entry for v3.2.0 (root README's declared version)

## 🟡 Medium
- output/sprints/ directory exists (v2.0 legacy; should be removed)
- /update-progress referenced in 4 files despite being removed in v3.2.0
```

---

## Design Notes

**Why a separate mechanical script?**
Grep + path-existence checks are deterministic; a shell script runs them uniformly. Offloading them means the slash-command can focus on judgement calls, which Claude handles well but scripts cannot. Same split we use in `/execute-work` (plan-mode module + implementation module).

**Why not auto-fix?**
Most "fixes" here are trade-offs (merge two docs? split a module? delete a legacy directory?). Every case deserves a human decision. The audit surfaces the problem; the user chooses the remedy.

**Reusing this across projects:**
Copy `.claude/commands/audit-pm.md` + `.claude/hooks/audit-pm.sh` into any project that already has the framework. The script is project-agnostic — it reads `.project-management/` + `.claude/` relative to the current directory.

---

**Version:** 1.0.0
**Created:** 2026-04-21
**Part of:** Claude Project Management System v3.3
