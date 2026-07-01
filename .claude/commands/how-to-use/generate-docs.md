# Generate/Update Documentation - Quick Guide

**Use when:** Need to create or update project documentation (PRD, tech spec, architecture)
**Command:** `/generate-docs`
**Time:** 2-3 minutes
**Files updated:** PRD, technical spec, architecture docs

**All documentation is in English only.**

---

## 🎯 What It Does

Generates or updates documentation based on current input files:

- ✅ **PRD** (Product Requirements Document) - from `scope.md` + `backlog.md`
- ✅ **Technical Spec** - from `technologies.md` + `backlog.md`
- ✅ **Architecture Doc** - system design and components
- ✅ **API Spec** (optional) - if API endpoints defined

**All generated in English, regardless of input language.**

---

## 📋 When to Use

### First Time (Project Initialization)

Use `/init-project` instead - it runs `/generate-docs` automatically.

### After Changes to Input Files

Run `/generate-docs` when you modify:

- `input/scope.md` - changed vision, goals, or objectives
- `input/backlog.md` - added/removed features or stories
- `input/technologies.md` - changed tech stack
- `input/constraints.md` - changed timeline or team size

### After Adding Scope

After `/add-scope`, choose to auto-update or run `/generate-docs` later.

---

## 📝 Quick Steps

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Always enter plan mode before regenerating docs**

1. Claude reads all 4 input files
2. Reads existing documentation (if any)
3. Identifies what changed
4. Creates update plan showing:
   - Which docs will be regenerated
   - What content will change
   - New sections to add
5. Presents plan for approval
6. Waits for [Yes/No/Revise]

**Only proceeds after you approve the plan.**

### STEP 1: Generate PRD

From `input/scope.md` + `input/backlog.md`:

- Product vision and goals
- Target users
- Features and user stories
- Success criteria

**Output:** `.project-management/output/docs/prd.md`

### STEP 2: Generate Technical Spec

From `input/technologies.md` + `input/backlog.md`:

- Tech stack details
- Architecture overview
- Implementation approach for each story
- API design
- Database schema

**Output:** `.project-management/output/docs/technical-spec.md`

### STEP 3: Generate Architecture Doc

From technical spec + system design:

- High-level architecture
- Component diagram
- Data flow
- Security considerations
- Deployment strategy

**Output:** `.project-management/output/docs/architecture.md`

### STEP 4: Generate API Spec (Optional)

If API endpoints are defined in backlog:

- Endpoint definitions
- Request/response formats
- Authentication
- Status codes

**Output:** `.project-management/output/docs/api-spec.md`

---

## 🔍 Example Walkthrough

```
You: /generate-docs

Claude: [STEP 0: Plan Mode]
        Reading input files...
        ✅ scope.md - Last modified: 2 days ago
        ✅ backlog.md - Last modified: 1 hour ago (5 stories added)
        ✅ technologies.md - No changes
        ✅ constraints.md - No changes

        Reading existing docs...
        ✅ prd.md - Exists (generated 1 week ago)
        ✅ technical-spec.md - Exists
        ✅ architecture.md - Exists

        CHANGES DETECTED:
        - 5 new stories in backlog.md
        - Need to update PRD and Technical Spec
        - Architecture doc unchanged (no architectural changes)

        PLAN:
        1. Regenerate PRD (add 5 new features)
        2. Regenerate Technical Spec (add implementation details)
        3. Skip Architecture (no changes needed)

        Proceed? [Yes/No/Revise]

You: Yes

Claude: Generating documentation...

        ✅ PRD updated (180 lines, +30 new)
           - Added: US-019 through US-023
           - Updated: Feature list, success criteria

        ✅ Technical Spec updated (320 lines, +50 new)
           - Added: Implementation details for 5 stories
           - Updated: API endpoints section

        ⏭️  Architecture unchanged (no architectural changes)

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ✅ DOCUMENTATION UPDATED
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        FILES UPDATED:
        - prd.md (added 5 features)
        - technical-spec.md (added implementation details)

        NEXT STEPS:
        1. Review: .project-management/output/docs/prd.md
        2. Review: .project-management/output/docs/technical-spec.md
        3. Continue development: /execute-work [scope]
```

---

## ⚠️ Common Issues

| Issue                   | Solution                                                     | Reference                                       |
| ----------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| "Input files not found" | Fill input files first                                       | `.project-management/input/` folder             |
| "Input files empty"     | Add content to scope.md and backlog.md                       | [init-project.md](./init-project.md)            |
| Docs in wrong language  | Add English enforcement to input files                       | `.project-management/README.md` language policy |
| "No changes detected"   | Command skips if input files unchanged since last generation | This is expected behavior                       |

---

## 🎯 Best Practices

**Update docs regularly:**

- After major scope changes
- Before starting new phase
- When onboarding new team members
- For stakeholder reviews

**Don't update docs for:**

- Minor code changes (refactoring, bug fixes)
- Implementation details (tracked in code)
- Progress updates (use `/project-status`)

**Docs are generated, not edited:**

- Edit input files, then regenerate
- Don't manually edit generated docs (changes will be lost)

---

## 📚 Full Documentation

**This is a quick guide (100 lines).**

For complete details, see: [`.claude/commands/generate-docs.md`](../generate-docs.md) (174 lines)

Includes:

- Template structure and placeholders
- Content mapping from input to output
- Language enforcement details
