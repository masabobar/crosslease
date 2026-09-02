# Git Workflow & Commit Standards

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
