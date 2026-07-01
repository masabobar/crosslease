# Permissions Management Rules

**Version:** 1.1
**Last Updated:** 2026-05-10
**Status:** Active

Core rules for managing `.claude/settings.json` permissions: what Claude MUST and MUST NOT do, safety deny patterns, best practices, and troubleshooting. See companion files for examples and reference:

- **`.claude/rules/permissions-patterns.md`** — Pattern syntax + common permission patterns + "permission needed" response template
- **`.claude/rules/permissions-examples.md`** — Full settings.json examples (Option A broad, Option B granular, recommended setup, corruption recovery)

---

## 🚨 CRITICAL: Settings File Behavior

### The Problem

**Claude Code default behavior:**
When adding a new permission, Claude may overwrite the entire `.claude/settings.json` file, deleting all previous permissions. This forces users to re-approve everything.

**Example of BAD behavior:**

```json
// Before: User has all permissions
{
  "permissions": {
    "allow": ["Bash(*)", "Read(**)", "Write(**)", "Edit(**)", ...]
  }
}

// After: Claude adds ONE new permission and DELETES everything else
{
  "permissions": {
    "allow": ["Bash(npm install)"]  // ❌ EVERYTHING ELSE GONE
  }
}
```

---

## ✅ CORRECT Behavior (MANDATORY)

### Rule 1: NEVER Modify `settings.json` Automatically

**If you need to add a permission:**

1. ✅ **Ask the user** to add it manually
2. ✅ **Provide exact syntax** for copy-paste (see `permissions-patterns.md` §3 for the response template)
3. ❌ **NEVER write to `settings.json`** automatically

**Example — Correct Approach:**

```
User: "Run npm install"

Claude: "I need permission to run npm install.

Please add this to .claude/settings.json:

{
  "permissions": {
    "allow": [
      "Bash(*)",           // Keep existing
      "Read(**)",          // Keep existing
      ...                  // Keep all existing
      "Bash(npm install)"  // Add this line
    ]
  }
}

Or, for broader permissions, you can use:
  "Bash(npm *)"  // Allows all npm commands

Would you like to add this permission?"
```

For the full response template Claude must use when blocked, see `.claude/rules/permissions-patterns.md` §3.

---

## 🛡️ Safety Guidelines

### Always Deny These Patterns

**Destructive file operations:**

```json
"deny": [
  "Bash(rm -rf /)",
  "Bash(rm -rf *)",
  "Bash(rm -rf .)",
  "Bash(rm -rf ~)"
]
```

**Dangerous git operations:**

```json
"deny": [
  "Bash(git push --force *)",
  "Bash(git push -f *)",
  "Bash(git reset --hard *)",
  "Bash(git clean -fd *)"
]
```

**System-level operations (optional):**

```json
"deny": [
  "Bash(sudo *)",
  "Bash(chmod 777 *)",
  "Bash(chown *)"
]
```

---

## 🎯 Best Practices Summary

### DO:

- ✅ Use broad patterns (`Bash(*)`) for trusted environments
- ✅ Always include safety deny rules (see above)
- ✅ Copy from `settings.example.json` as starting point
- ✅ Keep `settings.json` in git for team consistency
- ✅ Document any custom patterns in project README

### DON'T:

- ❌ Let Claude modify `settings.json` automatically
- ❌ Grant permissions without deny rules for safety
- ❌ Use overly restrictive permissions (slows workflow)
- ❌ Forget to backup before experimenting with patterns

---

## 🔍 Troubleshooting

### "Permission denied" messages keep appearing

**Solution:** Use broader patterns

```json
// Instead of:
"Bash(npm install)",
"Bash(npm start)",
"Bash(npm test)"

// Use:
"Bash(npm *)"
```

### Claude asks for permission already granted

**Solution:** Check pattern matching

```json
// If you have: "Bash(git commit -m *)"
// But Claude asks for: "Bash(git commit -m 'message')"
// Change to: "Bash(git commit *)" or "Bash(git *)"
```

### Settings file gets corrupted

**Solution:** See `.claude/rules/permissions-examples.md` §3 for full recovery steps. Short version:

1. Restore from `settings.example.json`
2. Or use git: `git restore .claude/settings.json`
3. Never auto-modify `settings.json`

---

## 📚 Related Documentation

- `.claude/rules/permissions-patterns.md` — Pattern matching syntax, common patterns, "permission needed" response template
- `.claude/rules/permissions-examples.md` — Full settings.json templates (broad/granular/recommended), corruption recovery
- `.claude/settings.example.json` — Template for new projects
- `.gitignore` — Settings that should be ignored
- `CLAUDE.md` — Main Claude configuration

---

**Maintained By:** Development Team
**Status:** ✅ Active
