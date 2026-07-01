# Resolve Questions — Reference

Companion to `resolve-questions.md`. Worked example, edge-case detail, and the parse/write rules for `input/open-questions.md`.

---

## Worked Example

**Scenario:** A week ago `/process-client-docs` ran on a client brief. The user skipped 3 of 8 questions. The user is back today with answers from a stakeholder call.

**State of `input/open-questions.md` (excerpted):**

```markdown
### Q-002: Email provider

**Status:** Open
**Priority:** P0 (Blocker)
**Category:** integrations
**Asked During:** /process-client-docs on 2026-05-07
**Skipped:** 2026-05-07 (1× skipped)

**Question:**
Email provider — SendGrid or AWS SES?

**Default Recommendation:**
SendGrid (simpler integration, higher per-email cost)

**Impact if Unresolved:**
Phase 1 — US-006 (email verification), US-014 (notifications)

**Options Presented:**

- SendGrid — Drop-in REST API. Higher per-email cost.
- AWS SES — Cheaper at volume. Requires SNS for bounces.
- Other (free-text) — user-provided answer, anonymized before storage

**Notes:**
Client mentioned existing AWS account; SES may be the lower-friction choice.
```

**User runs:**

```bash
/resolve-questions --priority P0
```

**Plan output:**

```
RESOLVE QUESTIONS PLAN

Open questions in input/open-questions.md: 3
Filter: priority P0 (blockers only)
Will run interactively: 2 questions
  - P0 (Blocker):       2
  - P1 (Important):     0
  - P2 (Nice-to-know):  0

Each will be asked with the original options + Skip.
Skipped questions stay Open; answered questions move to ## Resolved Questions
and applies_to files are updated.

Proceed? [Yes / No / Revise]
```

**After approval:** the interactive loop fires for Q-001 and Q-002. The user picks `AWS SES` for Q-002.

**Resulting changes:**

- `input/technologies.md` — line referencing `<!-- TBD: Q-002 -->` replaced with `**Email provider:** AWS SES (with SNS for bounce handling)`.
- `input/open-questions.md`:
  - Q-002 entry removed from `## Open Questions`
  - Appended to `## Resolved Questions` with the `## Resolution Format` block (Resolved date, Answer, Applied to, Notes).
  - Summary counts updated at the top.

**Summary report:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RESOLVE QUESTIONS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Asked:     2
Answered:  2    → moved to ## Resolved Questions
Skipped:   0
Orphaned:  0

📝 FILES MODIFIED:
- input/technologies.md
- input/backlog/phase-1-foundation.md
- input/open-questions.md

REMAINING OPEN:
- P0: 0
- P1: 1
- P2: 0

NEXT STEPS:
- Review modified files
- /resolve-questions --priority P1   (1 remaining)
```

---

## Parsing `open-questions.md`

The file is human-readable Markdown. Parse rules:

1. Each entry starts with `### Q-NNN: {{title}}` and ends at the next `### ` heading or `---` separator.
2. **Field extraction** — lines matching `**FieldName:** value` are parsed as key/value. Multi-line fields (Question, Default Recommendation, Impact, Notes) consume content until the next `**Field:**` line or blank-line + heading.
3. **Options Presented** — bullet list under that header. Each bullet of form `- {{label}} — {{description}}`. The trailing `Other (free-text)` bullet is always offered by `AskUserQuestion` and need not be re-emitted.
4. **`applies_to`** — derived from the `Impact if Unresolved:` field by scanning for file path patterns (`input/...md`, `phase-N-...md`, etc.). If none found, falls back to `(manual)`.
5. **Status filter** — entries whose `Status:` line equals `Open` are eligible. `Resolved` entries (in the lower section) are never re-asked.

---

## Writing Back

On `Skip` (re-skip during `/resolve-questions`):

- Locate the entry by `Q-NNN`.
- Increment `Skipped: (Nx skipped)` count.
- Update the date to today.
- Leave `Status: Open` untouched.

On `Answer`:

- Remove the entry from `## Open Questions`.
- Append a new block to `## Resolved Questions` per the template's Resolution Format:

  ```markdown
  ### ✅ Q-002: Email provider (RESOLVED)

  **Resolved:** 2026-05-14
  **Answer:** AWS SES
  **Applied to:** input/technologies.md, input/backlog/phase-1-foundation.md
  **Notes:** Client confirmed existing AWS account; SES chosen for cost + integration alignment.
  ```

- Update Summary counts at the top of the file.

---

## Edge-Case Details

| Case                                                | Behavior                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `open-questions.md` missing                         | Exit with `✅ No open-questions.md found — nothing to resolve.`                |
| File present but no `Open` entries                  | Exit with `✅ All clear — no open questions.`                                  |
| `--priority Px` matches nothing                     | Print priority breakdown of what IS open, exit.                                |
| `Q-NNN` arg not found                               | Print available Q-IDs, exit with error code.                                   |
| Entry missing `options:` bullets                    | Skip entry, log warning to summary, do not invoke `AskUserQuestion` for it.    |
| `applies_to` references file that no longer exists  | Record as `Orphaned` in summary; resolution still moved to `Resolved` section. |
| User picks `Other` with free-text                   | Run text through anonymization rule (§3–4) before writing.                     |
| Two `Q-NNN` entries with same id (shouldn't happen) | Use the first occurrence; warn about duplicates in summary.                    |

---

## Anti-patterns

- ❌ Do not auto-commit `open-questions.md` after running. The user reviews and commits manually.
- ❌ Do not delete the `## Resolved Questions` history — it's the audit trail for the project's decision log.
- ❌ Do not introduce a new question schema here — always defer to `modules/interactive-clarifications.md` to keep one source of truth.

---

## Related

- **Command:** `resolve-questions.md`
- **Module:** `.claude/commands/modules/interactive-clarifications.md`
- **Template:** `.project-management/templates/open-questions-template.md`
- **Anonymization rule:** `.claude/rules/anonymization.md` §3–4
