---
layer: meta
paths:
  - ".claude/settings*.json"
  - "**/.claude/settings*.json"
---

# Permissions — Settings Examples & Recovery

**Version:** 1.4
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
      "Read(~/.claude/plugins/**)",
      "Edit(**)",
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
      "Bash(rm -fr *)",
      "Bash(git push --force)",
      "Bash(git push --force *)",
      "Bash(git push -f)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease)",
      "Bash(git push --force-with-lease *)",
      "Bash(git reset --hard)",
      "Bash(git reset --hard *)"
    ],
    "ask": [
      "Bash(git clean *)",
      "Bash(npx prisma migrate reset)",
      "Bash(npx prisma migrate reset *)",
      "Bash(prisma migrate reset)",
      "Bash(prisma migrate reset *)",
      "Bash(sudo *)"
    ]
  },
  "defaultMode": "acceptEdits",
  "_comment": "Broad permissions for development. Claude should NEVER modify this file automatically."
}
```

**Benefits:**
- ✅ No interruptions during development
- ✅ Claude can work autonomously
- ✅ Dangerous commands still blocked (rm -rf, force push); destructive-but-sometimes-legit commands prompt (`ask`)

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
      "Bash(cp *)",
      "Bash(diff *)",
      "Read(**)",
      "Read(~/.claude/plugins/**)",
      "Edit(**)",
      "SlashCommand(*)",
      "TodoWrite"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(git push --force)",
      "Bash(git push --force *)",
      "Bash(git push -f)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease)",
      "Bash(git push --force-with-lease *)",
      "Bash(git reset --hard)",
      "Bash(git reset --hard *)"
    ],
    "ask": [
      "Bash(git clean *)",
      "Bash(docker *)",
      "Bash(kubectl *)",
      "WebFetch(*)",
      "WebSearch(*)"
    ]
  },
  "defaultMode": "acceptEdits"
}
```

> `Bash(cp *)` + `Bash(diff *)` + the `Read(~/.claude/plugins/**)` grant are what `/holycode-pm:setup` needs: it copies FROM the plugin cache and runs the `diff -rq` freshness check. `Read(**)` matches only files inside the project — the cache lives in your home dir, hence the explicit pattern (version-agnostic on purpose; never pin the cache's version subdir). One `Read` rule covers the Glob enumeration too — see `permissions-patterns.md` §1.0.

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
      "Read(~/.claude/plugins/**)",
      "Edit(**)",
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
      "Bash(rm -fr *)",
      "Bash(git push --force)",
      "Bash(git push --force *)",
      "Bash(git push -f)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease)",
      "Bash(git push --force-with-lease *)",
      "Bash(git reset --hard)",
      "Bash(git reset --hard *)"
    ],
    "ask": [
      "Bash(git clean *)",
      "Bash(npx prisma migrate reset)",
      "Bash(npx prisma migrate reset *)",
      "Bash(prisma migrate reset)",
      "Bash(prisma migrate reset *)",
      "Bash(sudo *)"
    ]
  },
  "defaultMode": "acceptEdits"
}
```

**Rationale:**
- Broad permissions for development productivity
- Slash commands need `SlashCommand(*)` for all commands
- `Read(~/.claude/plugins/**)` — `/holycode-pm:setup` reads + enumerates the plugin cache it copies from (`Read(**)` is project-relative and does not cover it)
- No `Write(...)`/`Glob(...)`/`Grep(...)` rules: only `Read(path)` and `Edit(path)` are matchable file-tool names — see `permissions-patterns.md` §1.0
- TodoWrite needed for progress tracking
- Dangerous operations explicitly blocked — note `git push --force *` **and** `git push -f *` are
  separate entries: permission patterns match the command string literally, so blocking the long
  form does not block the short one (`permissions.md` already lists both as dangerous git operations)
- Deny entries come in **pairs** (exact + trailing ` *`): a trailing space-star enforces a word
  boundary and requires a following argument, so `Bash(git reset --hard *)` alone may not block the
  bare — and most common — `git reset --hard`; the exact-match twin closes that
  (`permissions-patterns.md` §1)
- `ask` prompts on destructive-but-sometimes-legit commands: `git clean` deletes untracked
  (uncommitted) work, `prisma migrate reset` DROPS the database (`.claude/rules/database.md`),
  `sudo` escalates. Under `Bash(*)` these would otherwise run silently
- Argument-matching in Bash rules is inherently fragile (variables, extra spaces, alternate
  spellings) — deny/ask guard the obvious forms; the hard barriers remain the pre-push hook and CI

---

### 2.1 MCP Tool Grants (per-user, `settings.local.json`)

Two rules in this framework drive MCP tools: `.claude/rules/design-implementation.md` (Figma MCP —
plan-time design context, optional screenshot compare) and
`.project-management/rules/JIRA-INTEGRATION.md` (Atlassian MCP — ticket sync at `/execute-work`).
Neither stores credentials in the repo; auth belongs to the MCP connector.

MCP permissions are named `mcp__<server>__<tool>`, and **the server segment differs per machine** —
a plugin-installed server, a claude.ai connector, and a locally-configured one each produce a
different prefix. That makes them a poor fit for a shared template: put them in
`.claude/settings.local.json`, which is per-user and gitignored.

```json
{
  "permissions": {
    "allow": [
      "mcp__claude_ai_Figma__get_design_context",
      "mcp__claude_ai_Figma__get_screenshot",
      "mcp__claude_ai_Figma__get_metadata",
      "mcp__claude_ai_Atlassian_Rovo__getJiraIssue",
      "mcp__claude_ai_Atlassian_Rovo__searchJiraIssuesUsingJql",
      "mcp__claude_ai_Atlassian_Rovo__editJiraIssue",
      "mcp__claude_ai_Atlassian_Rovo__transitionJiraIssue"
    ]
  }
}
```

**Rules of thumb:**

- **Grant read tools freely, write tools deliberately.** `get_design_context` and `getJiraIssue` only
  read. `editJiraIssue` / `transitionJiraIssue` mutate a shared board — grant them only if you want
  `/execute-work` to sync ticket status without asking each time.
- **Never guess tool names.** They vary by connector. Enumerate what is actually connected and copy
  the exact names — `design-implementation.md` §3 gives the same instruction for Figma.
- **No wildcard.** An `mcp__*`-style grant covers every tool on every connected server, including
  ones a future connector adds. List the tools you use.
- **An empty list is a valid state.** When the MCP tools are absent the rules that use them degrade
  gracefully (`skipped (Figma MCP not connected)`) — a missing grant is never a broken setup.

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
