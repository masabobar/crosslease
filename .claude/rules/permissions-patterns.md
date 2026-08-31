---
layer: meta
paths:
  - ".claude/settings*.json"
  - "**/.claude/settings*.json"
---

# Permissions — Pattern Matching & Common Patterns

**Version:** 1.3
**Status:** Active

Reference for permission pattern syntax, common patterns by use case, and the template Claude must use when a permission is missing. Companion to `.claude/rules/permissions.md` (core rules) and `.claude/rules/permissions-examples.md` (full settings examples).

---

## 1. Pattern Matching Guide

### 1.0 Which tool names are matchable (READ FIRST)

A permission rule only does something if its tool name is one the permission engine resolves.
**File operations collapse onto exactly two names:**

| Write this | It covers | Never write this |
|---|---|---|
| `Read(path)` | Read, Glob, Grep — every file-**reading** tool | `Glob(...)`, `Grep(...)` |
| `Edit(path)` | Edit, Write, NotebookEdit — every file-**editing** tool | `Write(...)` |

Other matchable names: `Bash`, `WebFetch`, `WebSearch`, `SlashCommand`, `Skill`, `TodoWrite`,
`AskUserQuestion`.

**A `Write(...)` / `Glob(...)` / `Grep(...)` rule is inert** — it matches nothing, grants nothing,
and Claude Code prints a startup warning naming it. It is not harmless: it reads as a granted
permission that was never granted. `Edit(**)` already allows file creation; `Read(**)` already
allows globbing and grepping.

> Do not confuse this with **hook matchers**. `"matcher": "Write|Edit"` in a `hooks` block is a
> different mechanism that matches literal tool names, and `Write` is correct there.

### 1.1 Wildcard Patterns

**`*` — Matches anything in that position** (a single `*` spans spaces, so one wildcard can cover
multiple arguments)
```json
"Bash(git *)"        // Allows: git status, git commit, git push origin main, etc.
"Bash(npm install *)" // Allows: npm install react, npm install --save-dev x — NOT bare `npm install` (see word boundary below)
"Read(**)"           // Allows: read/glob/grep any file — INSIDE the project directory (see §1.1b)
"Edit(src/**)"       // Allows: edit or create any file in src/ directory
```

**Word boundary — pair exact + star for bare forms.** A trailing ` *` (space before the star)
enforces a word boundary: the prefix must be followed by a further argument, so `Bash(ls *)`
matches `ls -la` but neither `lsof` nor reliably the bare `ls`. Consequence for deny lists: a rule
like `Bash(git reset --hard *)` may not block the bare — and most common — `git reset --hard`.
**Always ship destructive-command rules as a pair:** the exact match (`Bash(git reset --hard)`)
plus the star form (`Bash(git reset --hard *)`).

**Colon form `Bash(cmd:*)`** — equivalent prefix matcher; this is the form the harness itself
writes into `settings.local.json` when you approve a command interactively. Both forms are valid;
treat `Bash(mkdir:*)` and `Bash(mkdir *)` as the same grant when reviewing a settings file.

**Exact match (no wildcards):**
```json
"Bash(git status)"   // Allows ONLY: git status
"Read(.env)"         // Allows ONLY: Read .env file
```

### 1.1b Paths OUTSIDE the project (`~/` and `//` forms)

`Read(**)` is **project-relative** — it never matches files outside the CWD, so reads elsewhere
still prompt. Two explicit forms exist:

```json
"Read(~/.claude/plugins/**)"        // home-relative — e.g. the plugin cache /holycode-pm:setup copies FROM
"Read(//opt/shared/config/**)"      // double-slash = absolute path
```

- The plugin-cache grant (`Read(~/.claude/plugins/**)`) is part of the shipped template — without
  it every `/holycode-pm:setup` run prompts on reading/enumerating the cache. One `Read` rule is
  enough: per §1.0 it covers the Glob enumeration too.
- **Anti-pattern:** never pin the cache's version subdir
  (`Read(~/.claude/plugins/cache/holycode/holycode-pm/3.5.0/**)`) — `/plugin update` changes that
  segment and silently invalidates the grant. Wildcard the whole `plugins/**` subtree instead.

### 1.2 Pattern Specificity

**Order from most specific to least specific:**
```json
{
  "deny": [
    "Bash(git push --force *)"  // Most specific - blocks force push
  ],
  "allow": [
    "Bash(git push origin main)", // Specific branch
    "Bash(git push)",              // Any push
    "Bash(git *)"                  // All git commands
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
    "Edit(**)"
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
  "ask": [
    "Bash(docker *)",
    "Bash(docker-compose *)",
    "Bash(kubectl *)"
  ]
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
- For broader access: "Bash([tool] *)"

**Example:**
{
  "permissions": {
    "allow": [
      // ... existing permissions ...
      "Bash([PATTERN])"  // ← Add this line
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
  "Bash(pnpm *)"

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
      "Bash(pnpm *)"  // ← Add this line
    ]
  }
}

After updating, I'll continue with the task.
```

---

## Related

- `.claude/rules/permissions.md` — core rules (NEVER auto-modify settings.json, safety deny patterns)
- `.claude/rules/permissions-examples.md` — full settings.json examples (Option A broad, Option B granular, recommended setup, MCP tool grants, corruption recovery)

---

**Status:** ✅ Active
