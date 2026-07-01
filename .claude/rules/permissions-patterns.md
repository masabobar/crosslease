# Permissions — Pattern Matching & Common Patterns

**Version:** 1.0
**Last Updated:** 2026-05-10
**Status:** Active

Reference for permission pattern syntax, common patterns by use case, and the template Claude must use when a permission is missing. Companion to `.claude/rules/permissions.md` (core rules) and `.claude/rules/permissions-examples.md` (full settings examples).

---

## 1. Pattern Matching Guide

### 1.1 Wildcard Patterns

**`*` — Matches anything in that position**

```json
"Bash(git *)"        // Allows: git status, git commit, git push, etc.
"Bash(npm install *)" // Allows: npm install, npm install react, etc.
"Read(**)"           // Allows: Read any file in any directory
"Edit(src/**)"       // Allows: Edit any file in src/ directory
```

**Exact match (no wildcards):**

```json
"Bash(git status)"   // Allows ONLY: git status
"Read(.env)"         // Allows ONLY: Read .env file
```

### 1.2 Pattern Specificity

**Order from most specific to least specific:**

```json
{
  "deny": [
    "Bash(git push --force *)" // Most specific - blocks force push
  ],
  "allow": [
    "Bash(git push origin main)", // Specific branch
    "Bash(git push)", // Any push
    "Bash(git *)" // All git commands
  ]
}
```

**Priority:** `deny` rules ALWAYS override `allow` rules.

---

## 2. Common Permission Patterns

### 2.1 Development Workflow

```json
{
  "allow": [
    "Bash(npm *)",
    "Bash(pnpm *)",
    "Bash(yarn *)",
    "Bash(git status)",
    "Bash(git add *)",
    "Bash(git commit *)",
    "Bash(git push)",
    "Bash(git diff *)",
    "Bash(git log *)",
    "Read(**)",
    "Edit(**)",
    "Write(**)",
    "Glob(**)",
    "Grep(**)"
  ]
}
```

### 2.2 Testing & CI

```json
{
  "allow": [
    "Bash(npm test)",
    "Bash(npm run test:*)",
    "Bash(jest *)",
    "Bash(vitest *)",
    "Bash(playwright *)"
  ]
}
```

### 2.3 Docker & Containers

```json
{
  "ask": ["Bash(docker *)", "Bash(docker-compose *)", "Bash(kubectl *)"]
}
```

---

## 3. When Claude Needs a New Permission

### 3.1 Correct Response Template

**When blocked by permissions, Claude MUST respond as follows (never auto-modify `settings.json`):**

```markdown
I need permission to run: `[COMMAND]`

**Why I need this:**
[Brief explanation of why this command is needed]

**Add this to .claude/settings.json:**

Under `"allow"` array, add:
"Bash([PATTERN])"

**Recommended pattern:**

- For this specific command: "Bash([exact command])"
- For broader access: "Bash([tool] \*)"

**Example:**
{
"permissions": {
"allow": [
// ... existing permissions ...
"Bash([PATTERN])" // ← Add this line
]
}
}

After updating, I'll continue with the task.
```

### 3.2 Real Scenario Example

```markdown
I need permission to run: `pnpm install`

**Why I need this:**
To install project dependencies defined in package.json.

**Add this to .claude/settings.json:**

Under `"allow"` array, add:
"Bash(pnpm \*)"

This will allow all pnpm commands (install, add, remove, etc.)

**Or for just install:**
"Bash(pnpm install)"

**Example:**
{
"permissions": {
"allow": [
"Bash(*)",
"Read(**)",
"Edit(**)",
"Bash(pnpm *)" // ← Add this line
]
}
}

After updating, I'll continue with the task.
```

---

## Related

- `.claude/rules/permissions.md` — core rules (NEVER auto-modify settings.json, safety deny patterns)
- `.claude/rules/permissions-examples.md` — full settings.json examples (Option A broad, Option B granular, recommended setup, corruption recovery)

---

**Status:** ✅ Active
