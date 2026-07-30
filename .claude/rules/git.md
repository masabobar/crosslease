# Git Workflow & Commit Standards

> **This file is canonical for commit format** — CLAUDE.md §Git commits defers to it explicitly.
> If a local `.project-management/rules/project-rules.md` says anything narrower (an older copy
> stated "no commit body, no newlines"), that copy is stale: bodies are permitted, `commitlint`
> accepts them, and most commits in this repo have one. Note `.project-management/` is
> **gitignored**, so those copies are per-developer and cannot be corrected centrally — which is
> why the rule lives here instead.

## Commit Message Format

Use **conventional commits** format:

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code refactoring
- `perf:` performance improvements
- `docs:` documentation changes
- `test:` test additions/modifications
- `chore:` maintenance tasks

### Message Structure

```
type: concise description (max 72 chars)

Optional body explaining WHY, not WHAT
```

### Referencing User Stories in the Body

When a commit implements or fixes behavior covered by a user story, cite it in the body as `US-XX.XX` (e.g. `US-28.4`, `US-28.29`).

- **Source it from the conversation, not by searching the backlog.** Use a `US-XX.XX` reference only if it was already mentioned somewhere in the current conversation (e.g. the user cited it, it appeared in a linked Jira ticket, or it came up in prior discussion). Do not independently search for a match.
- **If no US reference has come up in the conversation, ask the user for it** before finalizing the commit message, rather than guessing or omitting it silently.
- **No reference given = no reference in the commit.** If the user says there isn't one (or the work has no associated story), the body still explains WHY — it just omits the `US-XX.XX` line rather than inventing one.
- A commit can cite more than one story if the fix spans acceptance criteria from both, as long as each was actually surfaced in the conversation.

Example:

```
fix: hide edit actions for deactivated users #PRD1042-1045

US-28.29's edit toggle was gated for the Identity section but not for
Role & Scope, so an admin could still open the role-edit dialog on a
user deactivated per US-28.19, hitting a save-time error instead of
never seeing the control.
```

---

## ⚠️ CRITICAL: NO AI CREDITS IN COMMITS

**NEVER include AI attribution in commit messages:**

- ❌ NO "Generated with Claude Code"
- ❌ NO "Co-Authored-By: Claude"
- ❌ NO AI attribution of any kind

**Reason:** Professional codebase should not advertise tooling in git history. Commits should be clean and professional.

---

## Multi-line Commit Messages

Use HEREDOC for proper formatting:

```bash
git commit -m "$(cat <<'EOF'
feat: add user authentication

Implemented JWT-based authentication with refresh tokens.
Security review completed.
EOF
)"
```

---

## Before Committing

**Pre-commit checklist:**

1. Run `git status` to verify changes
2. Run `git diff` to review modifications
3. Run tests and linter
4. Ensure no sensitive data (secrets, API keys)
5. Write clear commit message

---

## Commit Workflow

```bash
# 1. Review changes
git status
git diff

# 2. Stage files
git add <files>

# 3. Run tests
npm test

# 4. Commit with conventional format
git commit -m "feat: add user profile page"

# 5. Push
git push
```

---

## What to Commit

**DO commit:**

- ✅ Source code
- ✅ Configuration files
- ✅ Database migration files
- ✅ Documentation
- ✅ Tests

**DO NOT commit:**

- ❌ Secrets or API keys
- ❌ `.env` files with credentials
- ❌ `node_modules/`
- ❌ Build artifacts
- ❌ IDE-specific files (unless shared team config)
- ❌ Personal developer notes

---

**Related:** See main `CLAUDE.md` for overall development workflow.
