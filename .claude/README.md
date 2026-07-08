# Claude Configuration

This folder contains Claude Code configuration files for the project management system.

---

## 📁 Folder Structure

```
.claude/
├── commands/              # Slash commands for project management
│   ├── init-project.md
│   ├── execute-work.md
│   ├── generate-docs.md
│   ├── project-status.md
│   ├── process-client-docs.md
│   └── modules/          # Modular command components
│
├── rules/                # Core coding standards and rules
│   ├── code-quality.md   # SOLID & DRY principles (MANDATORY)
│   ├── testing.md        # Testing requirements
│   ├── git.md           # Git workflow and commit conventions
│   └── stack-specific.md # React 19 + Vite SPA guidelines (see rules/README.md for full index)
│
├── settings.local.json   # Your local permissions (gitignored)
└── settings.example.json # Template for settings (tracked in git)
```

---

## ⚙️ Settings Files

### `settings.local.json` (Your Personal Settings)

**Location:** `.claude/settings.local.json`
**Status:** Gitignored (not tracked in version control)
**Purpose:** Your personal Claude Code permissions

This file contains your user-specific permissions for Claude Code operations. It's gitignored so each developer can have their own preferences.

**Setup (First Time):**

```bash
# Copy the example file to create your local settings
cp .claude/settings.example.json .claude/settings.local.json

# Edit permissions as needed
# (or keep the recommended defaults)
```

---

### `settings.example.json` (Template)

**Location:** `.claude/settings.example.json`
**Status:** Tracked in git
**Purpose:** Template with recommended permissions

This file serves as a template showing the recommended permissions for this project management system.

**Recommended Permissions (Full Automation):**

```json
{
  "permissions": {
    "allow": [
      "Bash(*)", // All bash commands (git, npm, docker, etc.)
      "Read(**)", // Read any file
      "Edit(**)", // Edit any file
      "Write(**)", // Create any file
      "Glob(**)", // Search for files
      "Grep(**)", // Search in files
      "SlashCommand(*)", // All project commands
      "Skill(*)", // All skills
      "TodoWrite", // Task tracking
      "AskUserQuestion", // User prompts
      "WebFetch(*)", // Fetch web content
      "WebSearch(*)" // Search the web
    ],
    "deny": [
      "Bash(rm -rf *)", // Block recursive deletion
      "Bash(git push --force *)", // Block force push
      "Bash(git reset --hard *)" // Block hard reset
    ],
    "ask": []
  },
  "defaultMode": "acceptEdits"
}
```

**Why these permissions?**

**Allow All Tools:**

- **`Bash(*)`**: All bash commands for full automation
- **`Read/Edit/Write(**)`\*\*: File operations without prompts
- **`SlashCommand(*)`**: All project commands auto-execute
- **`Skill(*)`**: All skills available
- **`WebFetch/WebSearch`**: Documentation lookup and research

**Safety Blocks:**

- **`Bash(rm -rf *)`**: Prevents accidental mass deletion
- **`Bash(git push --force *)`**: Prevents force push disasters
- **`Bash(git reset --hard *)`**: Prevents losing uncommitted work

**Benefits:**

- ✅ Full `/execute-work` automation (no interruptions)
- ✅ No manual approvals needed
- ✅ Continuous execution mode works perfectly
- ✅ Safe operations (destructive commands blocked)

---

## 🔐 Security Note

**What's gitignored:**

- ✅ `settings.local.json` - Your personal settings
- ✅ Any `*.local.*` files in this folder

**What's tracked:**

- ✅ `settings.example.json` - Template for new users
- ✅ All command files (`commands/*.md`)
- ✅ All rule files (`rules/*.md`)

**Privacy:** Your personal permission preferences stay on your machine and are never committed to git.

---

## 📖 Usage

### For New Users

1. **Copy the example settings:**

   ```bash
   cp .claude/settings.example.json .claude/settings.local.json
   ```

2. **Review and adjust permissions** (optional):
   - Open `.claude/settings.local.json`
   - Modify the `allow`, `deny`, or `ask` arrays as needed
   - Keep recommended permissions for full automation

3. **Start using slash commands:**
   ```bash
   /init-project
   /execute-work phase 1
   /project-status
   ```

---

### For Teams

**Recommended approach:**

1. Keep `settings.example.json` updated with team-recommended permissions
2. Let each developer customize their own `settings.local.json`
3. Document any required permissions in project README

**Alternative (strict team settings):**

- Remove `settings.local.json` from `.gitignore`
- Track it in git
- Everyone uses the same permissions
- (Not recommended - reduces developer flexibility)

---

## 🚀 Automation Features

With recommended permissions enabled, you get:

✅ **Automatic Documentation Generation**

- `/generate-docs` runs without asking for permission
- Updates technical specs, PRD, architecture docs

✅ **Automatic Bash Commands**

- All bash commands execute without prompting (git, npm, composer, tests, etc.)
- Blocked: `rm -rf *` and `git push --force *` for safety
- Full automation for development workflow

✅ **Automatic File Edits**

- `defaultMode: "acceptEdits"` eliminates manual approval for every file change
- Speeds up implementation significantly
- Claude can edit files continuously without pausing

✅ **Automatic Git Operations**

- Auto-commit after completing stories
- Follows `.claude/rules/git.md` conventions
- NO AI credits in commit messages
- Can auto-push to remote (optional)

✅ **Automatic Progress Tracking**

- Updates progress files during `/execute-work`
- Tracks completed work, blockers, phase status

✅ **Continuous Execution Mode**

- `/execute-work phase N` runs continuously without interruptions
- Implements multiple stories end-to-end
- Auto-commits and auto-tracks progress
- True "hands-free" execution

---

## 📚 Related Documentation

- **Core Standards:** [/CLAUDE.md](../CLAUDE.md)
- **Project Management:** [/.project-management/README.md](../.project-management/README.md)
- **Code Quality Rules:** [/rules/code-quality.md](./rules/code-quality.md)
- **Git Workflow:** [/rules/git.md](./rules/git.md)
- **Testing Rules:** [/rules/testing.md](./rules/testing.md)

---

## ❓ FAQ

**Q: Do I need to create `settings.local.json`?**
A: It's recommended but not required. Without it, Claude will ask for permission each time.

**Q: Can I use different permissions than the example?**
A: Yes! Customize `.claude/settings.local.json` to your preferences.

**Q: What happens if I commit `settings.local.json`?**
A: Nothing breaks, but your personal preferences will be shared with the team. It's gitignored to avoid this.

**Q: Can I disable automation?**
A: Yes! Simply don't create `settings.local.json`, or set fewer permissions in the `allow` array.

**Q: What does `Bash(*)` allow?**
A: It's a wildcard that allows ALL bash commands (git, npm, composer, tests, etc.). Specific dangerous commands are blocked in the `deny` list.

**Q: Why block `rm -rf *` and `git push --force *`?**
A: These commands can cause irreversible data loss. They're blocked for safety, but you can manually run them if truly needed.

**Q: What does `defaultMode: "acceptEdits"` do?**
A: It automatically accepts all file edit operations without prompting you for approval each time. This dramatically speeds up implementation.

---

**Updated:** 2026-04-27
