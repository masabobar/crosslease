# Resolve Questions - Quick Guide

**Use when:** You skipped clarification questions during `/process-client-docs` (or other PM commands) and now have the answers.
**Command:** `/resolve-questions [--priority Px | Q-NNN]`
**Time:** 1 minute per question
**Files affected:** `input/open-questions.md`, plus artefacts listed in each question's `Applied to:` field (e.g. `input/technologies.md`, `input/backlog/phase-N.md`)

**All output must be in English only.**

---

## 🎯 Most Common Use Cases

### 1. Resolve every open question

```bash
/resolve-questions
```

**What it does:** Walks through every `Status: Open` entry in `input/open-questions.md`, asks via `AskUserQuestion` with the original options + Skip.
**When:** You came back from a stakeholder call with answers to multiple deferred questions.

### 2. Resolve only blockers

```bash
/resolve-questions --priority P0
```

**What it does:** Same loop but filtered to P0 entries. Use before starting Phase 1 to clear all blockers.
**When:** About to run `/init-project` or `/execute-work phase 1` and need P0 questions answered first.

### 3. Resolve one specific question

```bash
/resolve-questions Q-003
```

**What it does:** Runs the interactive loop for a single question by ID.
**When:** You have an answer to one specific question but want to defer the rest.

---

## 📝 Quick Steps

1. Run the command (optionally with a filter).
2. Approve the plan (`Yes`).
3. For each question:
   - Click the option that matches the decision, **or**
   - Click `Skip — answer later` (skip count increments, entry stays Open).
4. Review the summary — see which files were updated.
5. Commit when ready (no auto-commit — your call).

---

## 🤔 What happens to my answers?

- **Pre-defined option chosen** → answer is written verbatim to each file listed in `Applied to:`. The question moves to `## Resolved Questions` in `open-questions.md` (the decision log).
- **"Other" free-text** → passes through anonymization (`.claude/rules/anonymization.md` §3–4) before being persisted.
- **Skip** → entry stays in `## Open Questions`. Skip counter increments. Re-run anytime.
- **Target file no longer exists** → answer recorded as `Orphaned` in the summary; entry still moves to Resolved so the decision is preserved.

---

## 🔗 Related

- **Source command:** `/process-client-docs` (STEP 5 is where these questions first appear)
- **Reusable module:** `.claude/commands/modules/interactive-clarifications.md`
- **Template:** `.project-management/templates/open-questions-template.md`
- **Full command spec:** `.claude/commands/resolve-questions.md` + `resolve-questions-reference.md`
