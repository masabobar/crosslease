# Interactive Clarifications Module

**Purpose:** Reusable interactive Q&A loop for any PM command that generates open clarification questions. Drives the user through questions one-by-one via `AskUserQuestion`, with an explicit **Skip** option. Skipped questions persist to `.project-management/input/open-questions.md` for later resolution via `/resolve-questions`.

**Invoked by:** `/resolve-questions`. Documented integration target: `/execute-work` (deferred — apply same invocation pattern).

---

## Question Schema (input)

Upstream extraction logic emits a list of clarification questions in this schema. Keep entries small — one decision per question. `priority` maps the existing **Blocker / Important / Nice-to-know** taxonomy onto P0 / P1 / P2.

```yaml
- id: Q-001 # sequential, zero-padded
  category: authentication # 1–12 chars, kebab-case (used as header chip)
  priority: P0 # P0 / P1 / P2
  skippable:
    true # OPTIONAL — default true. Set false for gating
    # questions where the command cannot proceed
    # without a choice (project type, scope type, …).
  question: "Authentication strategy — JWT or cookie sessions?"
  default: "cookie sessions" # recommended fallback if skipped
  impact: "Affects Phase 1 estimates (US-001, US-003, US-004)"
  options: # 2–3 concrete answers; loop adds Skip as 4th
    - label: "Cookie sessions"
      description: "HttpOnly + Secure + SameSite. XSS-resistant. Default per security-and-auth.md."
    - label: "JWT (client request)"
      description: "Client requested. localStorage exploitable to XSS — needs mitigation plan."
  applies_to: # files the answer should be written into
  notes: "" # optional free-text context preserved on skip
```

Constraints:

- `options` length: minimum 2, maximum 3. The loop always appends a 4th `Skip — answer later` option.
- `category` becomes the AskUserQuestion `header` field — truncate to 12 chars.
- Multi-select is not used (previews + multi-select don't combine — single-select only).
- `skippable` (optional, default `true`): when `false`, the loop omits the `Skip — answer later` option. Use only for questions that gate downstream work (e.g. project type). Default behavior (`true`) — Skip is always available.

---

## STEP A — Build the question list

Before invoking the loop, the parent command MUST produce a list of schema-shaped entries (above). Commands derive them from their own decision points.

Sort the list by priority: **P0 first → P1 → P2**. Within priority, preserve emission order.

If the list is empty, skip this module entirely and emit: `✅ No open clarifications.`

---

## STEP B — Announce the gate

Before the first question, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤔 INTERACTIVE CLARIFICATION ({{N}} questions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I'll ask each question with a few suggested answers + a Skip option.
Skipped questions are saved to input/open-questions.md — resolve later with /resolve-questions.

Priority: P0 (blockers) first → P1 (important) → P2 (nice-to-know).
```

---

## STEP C — Loop: one AskUserQuestion call per question

For each entry in the sorted list, invoke `AskUserQuestion` with **exactly one question**, single-select, options = schema options + Skip.

Build the call as:

```
AskUserQuestion({
  questions: [{
    question: "{{entry.question}}",
    header: "{{entry.category | truncate(12)}}",
    multiSelect: false,
    options: [
      ...entry.options,                              // up to 3
      ...(entry.skippable !== false                  // omit Skip if skippable === false
        ? [{
            label: "Skip — answer later",
            description: "Log this question to input/open-questions.md and continue. Resolve later with /resolve-questions."
          }]
        : [])
    ]
  }]
})
```

**Skip semantics:**

- When `entry.skippable` is omitted or `true` (default), the loop appends `Skip — answer later`. On skip, run STEP D (persist to `open-questions.md`).
- When `entry.skippable` is `false` (gating question), the loop does NOT append Skip. The user must select an option (or use AskUserQuestion's native `Other` for free-text). If the AskUserQuestion tool itself fails, fall back to `entry.default` and emit a warning to the STEP G summary — never block indefinitely.

**Recommended-option flag:** if the schema includes a `default`, mark the matching option's label with ` (Recommended)` per the AskUserQuestion tool convention. Place that option first.

After the call returns:

- If the user chose `Skip — answer later` → STEP D (skip handling).
- Else if the user chose `Other` (always offered by the tool) with free-text → STEP E (anonymized answer handling).
- Else → STEP F (apply chosen option to artefacts).

---

## STEP D — Skip handling

1. **Ensure `input/open-questions.md` exists.** If absent, create it by copying `.project-management/templates/open-questions-template.md` verbatim and replacing `{{TIMESTAMP}}` with today's date.
2. **Append the entry** under the `## Open Questions` section. Render the full schema (Status: Open, Priority, Category, Asked During, Skipped date, Question, Default, Impact, Options Presented, Notes).
3. **Replace the placeholder line** `*No open questions.*` if it's still there.
4. **Update the Summary counts** at the top of the file (`Total Open`, `P0`/`P1`/`P2` counters).
5. If the question is already in `open-questions.md` (matched by `id` from a prior run), increment `Skipped:` counter and update the date — do NOT duplicate.
6. Continue to the next question. **Do not commit `open-questions.md`** during the loop — final summary lists it as `Modified`.

---

## STEP E — Free-text answer ("Other")

1. **Anonymize first.** Pass the free-text through the rules in `.claude/rules/anonymization.md` §3–4 (role labels + source-context substitution). If a personal name leaks, replace per the table; if the answer is just metadata-free content, no change.
2. Persist the anonymized answer per STEP F.

---

## STEP F — Apply chosen answer to artefacts

For each path in `entry.applies_to`:

1. Read the file.
2. Locate the section referenced by `entry.impact` (story ID, section heading, or `<!-- TBD: Q-001 -->` marker if previously inserted by the extraction modules).
3. Replace the TBD marker (or insert near the relevant section) with the answer value.
4. If a corresponding entry exists in `open-questions.md` (from a previous skip), move it to the `## Resolved Questions` section using the Resolution Format from the template.

If `applies_to` is empty or no insertion point is found, write the answer to `open-questions.md` as a resolved entry with `Applied to: (manual)` and a `Notes:` line explaining no automatic insertion was possible — the user will see it in the STEP G summary.

---

## STEP G — Loop summary (emit after last question)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CLARIFICATION GATE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Answered:  {{n_answered}}  (applied to {{n_files_modified}} files)
Skipped:   {{n_skipped}}   → logged to input/open-questions.md
Resolved manually later:  /resolve-questions

📝 FILES MODIFIED:
{{list_of_changed_paths}}
```

---

## Integration Targets (future)

Documented for the deferred extension wave:

| Command         | Insertion point                                         | Question source                                   |
| --------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `/execute-work` | On `Blocked` status during STEP 3-B implementation loop | Architecture decision required mid-implementation |

Each integration follows the same pattern: emit schema-shaped questions → invoke STEPS A–G of this module.

---

## Related

- **Template:** `.project-management/templates/open-questions-template.md` — defines `open-questions.md` format
- **Resolution command:** `.claude/commands/resolve-questions.md` — re-runs this loop on existing `Open` questions
- **Anonymization rule:** `.claude/rules/anonymization.md` — applied to free-text answers
- **Doc rules:** `.claude/rules/documentation.md` §2.1 — `open-questions.md` ≤ 200 lines
- **Parent command:** `.claude/commands/resolve-questions.md`
