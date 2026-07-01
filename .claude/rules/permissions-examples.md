# Permissions — Settings Examples & Recovery

**Version:** 1.0
**Last Updated:** 2026-05-10
**Status:** Active

Full `settings.json` examples (broad vs granular), the recommended setup for this project, and recovery procedure if `settings.json` is overwritten. Companion to `.claude/rules/permissions.md` (core rules) and `.claude/rules/permissions-patterns.md` (pattern syntax reference).

---

## 1. Recommended Settings Structure

### 1.1 Option A: Broad Permissions (Recommended for trusted environments)

**File: `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(**)",
      "Edit(**)",
      "Write(**)",
      "Glob(**)",
      "Grep(**)",
      "SlashCommand(*)",
      "Skill(*)",
      "TodoWrite",
      "AskUserQuestion",
      "WebFetch(*)",
      "WebSearch(*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ],
    "ask": []
  },
  "defaultMode": "acceptEdits",
  "_comment": "Broad permissions for development. Claude should NEVER modify this file automatically."
}
```

**Benefits:**

- ✅ No interruptions during development
- ✅ Claude can work autonomously
- ✅ Dangerous commands still blocked (rm -rf, force push)

**Use when:**

- Working in trusted development environment
- Want fast, uninterrupted workflow
- Trust Claude with broad access

---

### 1.2 Option B: Granular Permissions (More restrictive)

**File: `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(pnpm *)",
      "Bash(git status)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(mkdir *)",
      "Read(**)",
      "Edit(**)",
      "Write(**)",
      "Glob(**)",
      "Grep(**)",
      "SlashCommand(*)",
      "TodoWrite"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ],
    "ask": ["Bash(docker *)", "Bash(kubectl *)", "WebFetch(*)", "WebSearch(*)"]
  },
  "defaultMode": "acceptEdits"
}
```

**Benefits:**

- ✅ More control over what Claude can do
- ✅ Review sensitive operations
- ⚠️ May require more approvals

**Use when:**

- Working in production environment
- Need audit trail
- Want explicit control

---

## 2. Recommended Setup for This Project

**For this project management system:**

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(**)",
      "Edit(**)",
      "Write(**)",
      "Glob(**)",
      "Grep(**)",
      "SlashCommand(*)",
      "Skill(*)",
      "TodoWrite",
      "AskUserQuestion",
      "WebFetch(*)",
      "WebSearch(*)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ],
    "ask": []
  },
  "defaultMode": "acceptEdits"
}
```

**Rationale:**

- Broad permissions for development productivity
- Slash commands need `SlashCommand(*)` for all commands
- TodoWrite needed for progress tracking
- Dangerous operations explicitly blocked

---

## 3. Settings File Corruption Recovery

### 3.1 If `settings.json` gets overwritten/corrupted

**STEP 1: Restore from example**

```bash
cp .claude/settings.example.json .claude/settings.json
```

**STEP 2: Or restore from git**

```bash
git restore .claude/settings.json
```

**STEP 3: Or recreate manually**
Copy the Option A: Broad Permissions template from §1.1 above.

---

## Related

- `.claude/rules/permissions.md` — core rules (NEVER auto-modify settings.json, safety deny patterns, best practices)
- `.claude/rules/permissions-patterns.md` — pattern syntax + common permission patterns by use case + "permission needed" response template

---

**Status:** ✅ Active
