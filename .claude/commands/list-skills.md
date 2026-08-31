---
name: list-skills
description: List every skill / slash command defined in this repo, grouped by kind, with its description
---

# /list-skills

Enumerate the skills and slash commands **this repository** defines and print them grouped by kind.

Read-only — this command writes no files.

Scope: `.claude/commands/**/*.md` and `.claude/skills/*/SKILL.md`. User-level skills
(`~/.claude/skills/`), plugin skills, and Claude Code built-ins (`/help`, `/config`, …) are **not**
repo-owned and are out of scope — note that in one line at the end rather than listing them.

---

## Step 1 — Collect

Run exactly this. Descriptions come from frontmatter `description:` when present, otherwise from the
H1 — the same resolution order Claude Code itself uses, so the output matches the `/` menu.

```bash
find .claude/commands .claude/skills -name '*.md' 2>/dev/null | sort | while read -r f; do
  desc=$(awk 'NR==1&&$0=="---"{fm=1;next}
              fm&&/^description:/{sub(/^description:[[:space:]]*/,"");print;exit}
              fm&&$0=="---"{fm=0;next}
              !fm&&/^# /{sub(/^# /,"");print;exit}' "$f")
  printf '%s\t%s\n' "$f" "${desc:-—}"
done
```

## Step 2 — Derive the invocation name

- `.claude/commands/<name>.md` → `/<name>`
- `.claude/commands/<dir>/<name>.md` → `/<dir>:<name>`
- `.claude/skills/<name>/SKILL.md` → `/<name>`

## Step 3 — Group and present

Four groups, in this order. Omit a group entirely if it has no entries.

| Group                    | Contents                                              | Invoke directly?                    |
| ------------------------ | ----------------------------------------------------- | ----------------------------------- |
| **Workflow commands**    | `.claude/commands/*.md` without a `-reference` suffix | Yes — these are the day-to-day ones |
| **Reference companions** | `.claude/commands/*-reference.md`                     | No — loaded by their parent command |
| **Quick guides**         | `.claude/commands/how-to-use/*.md`                    | Yes — they explain another command  |
| **Internal modules**     | `.claude/commands/modules/*.md`                       | No — loaded by `/execute-work`      |

One markdown table per group: `Command | Description`. Keep descriptions verbatim — do not rewrite or
truncate them.

Close with a single line stating the total count and that user-level, plugin, and built-in commands are
excluded.

---

## Related

- `.claude/commands/how-to-use/README.md` — hand-written decision tree for picking a command
- `.claude/rules/project/README.md` — the parallel index for `.claude/rules/`
