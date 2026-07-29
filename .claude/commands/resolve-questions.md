---
name: resolve-questions
description: Re-open unanswered clarification questions from input/open-questions.md and run the interactive Q&A loop
---

# Resolve Questions Command

Reads `.project-management/input/open-questions.md`, filters questions with `Status: Open`, and runs them back through the interactive Q&A loop defined in `modules/interactive-clarifications.md`. Use when you skipped questions during a PM command and now have the answers.

**All output must be in English only.**

---

## Usage

```bash
/resolve-questions                 # All open questions
/resolve-questions --priority P0   # Only P0 (blockers)
/resolve-questions --priority P1   # Only P1 (important)
/resolve-questions Q-003           # Single question by ID
```

---

## YOUR TASK — MANDATORY WORKFLOW

**🔧 RULES:**

- **`CLAUDE.md`** — all output in English
- **`.claude/rules/anonymization.md`** — anonymize free-text answers before persisting
- **`.claude/rules/git.md`** — if committing, NO AI credits, conventional commits

---

### STEP 0 — Enter plan mode (MANDATORY)

1. **Check the file exists.** If `.project-management/input/open-questions.md` is missing, emit `✅ No open-questions.md found — nothing to resolve.` and exit.
2. **Parse arguments.** Filter scope: all / `--priority P0|P1|P2` / single `Q-NNN` id.
3. **Read `open-questions.md`** and extract every entry under `## Open Questions` with `Status: Open` matching the filter.
4. **Build a question list** in the schema defined by `modules/interactive-clarifications.md` (STEP A). Source fields directly from the entry (id, priority, category, question, default, impact, options_presented, applies_to). If `applies_to` is missing in an old entry, set `(manual)` so STEP F of the module logs the resolution without auto-insertion.
5. **Present a plan:**

   ```
   RESOLVE QUESTIONS PLAN

   Open questions in input/open-questions.md: {{total_open}}
   Filter: {{scope_description}}
   Will run interactively: {{n_to_run}} questions
     - P0 (Blocker):       {{n_p0}}
     - P1 (Important):     {{n_p1}}
     - P2 (Nice-to-know):  {{n_p2}}

   Each will be asked with the original options + Skip.
   Skipped questions stay Open; answered questions move to ## Resolved Questions
   and applies_to files are updated.

   Proceed? [Yes / No / Revise]
   ```

6. **Wait for user approval** (`Yes / No / Revise`). Only continue on `Yes`.

---

### STEP 1 — Run the interactive loop

Invoke the loop defined in `.claude/commands/modules/interactive-clarifications.md`, **STEPS B → G**. The same `AskUserQuestion` shape, `Skip` option, anonymization, and artefact-write logic apply.

Two differences vs the original invocation:

- **Skip semantics:** when the user skips again, increment the `Skipped:` counter on the existing entry instead of creating a duplicate (the module already does this, but it's the primary path here).
- **No file generation step preceded this.** If an `applies_to` target file no longer exists (e.g., user reorganized the backlog), log the answer as `Applied to: (orphaned — target file missing)` with a `Notes:` line, keep the entry in `Resolved` so it's traceable.

---

### STEP 2 — Summary report

After the loop, emit:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RESOLVE QUESTIONS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Asked:     {{n_asked}}
Answered:  {{n_answered}}    → moved to ## Resolved Questions
Skipped:   {{n_skipped}}     → remain Open (skip count incremented)
Orphaned:  {{n_orphaned}}    → answer recorded, target file missing

📝 FILES MODIFIED:
{{list_of_changed_paths_incl_open_questions_md}}

REMAINING OPEN:
- P0: {{n_p0_remaining}}
- P1: {{n_p1_remaining}}
- P2: {{n_p2_remaining}}

NEXT STEPS:
- Review modified files
- If P0 remaining → resolve before next /execute-work
- Re-run: /resolve-questions [--priority Px | Q-NNN]
```

---

## Edge Cases

- **Empty `open-questions.md`** (placeholder `*No open questions.*` still present): emit `✅ All clear — no open questions.` and exit cleanly. Do not invoke the loop.
- **Filter matches nothing:** emit `No questions match {{filter}}.` Show counts per priority. Exit.
- **Malformed entry** (missing required schema fields like `question` or `options`): skip it, log a warning to the summary, leave the entry untouched for manual repair.
- **Commit:** never auto-commit. If the user wants to commit, suggest `git commit -m "docs: resolve N open clarifications"` per `.claude/rules/git.md`.

---

## 📚 Module References

| Module                                  | Covers                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `modules/interactive-clarifications.md` | The Q&A loop (STEPS A–G) — schema, AskUserQuestion call, skip/answer handling |

---

## Related

- **Template:** `.project-management/templates/open-questions-template.md`
- **Live file:** `.project-management/input/open-questions.md` (created on first skip)
- **Rule:** `.claude/rules/anonymization.md` (free-text answer anonymization)
- **Reference:** `resolve-questions-reference.md` (worked example + edge-case detail)

---

**Version:** 1.0
**Created:** 2026-05-14
**Command Type:** PM Maintenance
