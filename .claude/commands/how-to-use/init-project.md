# Start New Project - Quick Guide

**Use when:** Initializing new project with project management system
**Command:** `/init-project`
**Time:** 5-10 minutes
**Files created:** Phase 1 plan, PRD, technical spec, architecture docs

**All documentation is in English only.**

---

## 🎯 What It Does

Creates complete project structure:

- ✅ Configures project structure (monorepo or single app)
- ✅ Sets up workspace (if monorepo with pnpm + Turborepo)
- ✅ Generates Phase 1 plan (Foundation)
- ✅ Generates PRD (Product Requirements Document)
- ✅ Generates Technical Specification
- ✅ Generates Architecture Document
- ✅ Sets up tech stack configuration
- ✅ Optionally configures i18n (internationalization)

---

## 📋 Prerequisites

**BEFORE running `/init-project`, you must have:**

1. **Input files filled** (in `.project-management/input/`):
   - `scope.md` - Project vision, goals, objectives
   - `backlog.md` - All features, user stories, priorities
   - `technologies.md` - Tech stack choices
   - `constraints.md` - Timeline, budget, team size

2. **OR client documents processed:**
   - Run `/process-client-docs` first
   - It auto-generates input files from client documents

**If input files are empty or missing:** Command will abort and ask you to fill them.

---

## 📝 Quick Steps

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Always enter plan mode before initialization**

1. Claude reads all 4 input files
2. Analyzes project scope and requirements
3. Creates initialization plan with:
   - Tech stack selection strategy
   - Phase 1 breakdown
   - Documentation structure
   - i18n setup (if applicable)
4. Presents plan for approval
5. Waits for [Yes/No/Revise]

**Only proceeds after you approve the plan.**

### STEP 1: Project Structure Selection

Claude asks what type of project:

```
[1] Backend Only
[2] Backend + Mobile App (Monorepo) ⭐ RECOMMENDED
[3] Backend + Web + Mobile (Full Monorepo)
[4] Web Only
```

**If you choose option 2 (Backend + Mobile):**

- Creates `apps/backend/` and `apps/mobile/`
- Creates `packages/shared-types/`, `packages/api-client/`, `packages/shared-utils/`
- Sets up pnpm workspace + Turborepo
- Generates package.json for each app/package

**If you choose option 1 or 4 (single app):**

- Creates standard single-app structure
- No workspace configuration needed

### STEP 2: Tech Stack Selection

Claude asks about:

- **Backend framework** (e.g., Laravel, Node.js, Django)
- **Frontend framework** (e.g., React, Vue, Angular)
- **Database** (e.g., PostgreSQL, MySQL, MongoDB)
- **Additional tools** (Redis, queues, etc.)

**Or auto-detects** if `technologies.md` already specifies stack.

### STEP 3: i18n Configuration (Optional)

If project requires multiple languages:

- Claude asks which languages to support
- Generates i18n configuration
- Creates `I18N-RULES.md` (if needed)

**Skip** if single-language project.

### STEP 4: Generate Documentation

Claude generates:

1. **PRD** (`output/docs/prd.md`)
   - From `input/scope.md` + `input/backlog.md`
   - Product vision, features, user stories

2. **Technical Spec** (`output/docs/technical-spec.md`)
   - From `input/technologies.md` + backlog
   - Architecture, tech stack, implementation details

3. **Architecture Doc** (`output/docs/architecture.md`)
   - System design, components, data flow

### STEP 4: Generate Phase 1

Creates `output/phases/phase-1.md`:

- Foundation & Setup epics
- Infrastructure stories
- Story points and estimates
- Ready to execute with `/execute-work phase 1`

### STEP 5: Initialize Progress Tracking

Creates initial tracking files:

- `output/progress/current-status.md`
- `output/progress/completed.md`
- `output/progress/blockers.md`

---

## 🔍 Example Walkthrough

```
You: /init-project

Claude: [STEP 0: Plan Mode]
        Reading input files...
        ✅ scope.md - Project: E-commerce Platform
        ✅ backlog.md - 45 user stories identified
        ✅ technologies.md - Stack: Laravel + React
        ✅ constraints.md - Timeline: 6 months, Team: 3 devs

        Plan:
        1. Confirm tech stack (Laravel, React, PostgreSQL)
        2. Generate 4 phases (Foundation, Core, Advanced, Polish)
        3. Create Phase 1 with infrastructure stories
        4. Generate PRD, Technical Spec, Architecture docs

        Proceed? [Yes/No/Revise]

You: Yes

Claude: [STEP 1: Tech Stack]
        Detected from technologies.md:
        - Backend: Laravel 11
        - Frontend: React 18 + TypeScript
        - Database: PostgreSQL 16

        Confirm? [Yes / No - I'll specify manually]

You: Yes

Claude: [STEP 2: i18n]
        Project requires multiple languages? [Yes/No]

You: No

Claude: [STEP 3-5: Generating...]
        ✅ Generated PRD (150 lines)
        ✅ Generated Technical Spec (280 lines)
        ✅ Generated Architecture Doc (200 lines)
        ✅ Generated Phase 1 plan (18 stories, 89 points)
        ✅ Initialized progress tracking

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ✅ PROJECT INITIALIZED
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        NEXT STEPS:
        1. Review: .project-management/output/docs/technical-spec.md
        2. Review: .project-management/output/phases/phase-1.md
        3. Start work: /execute-work phase 1
```

---

## ⚠️ Common Issues

| Issue                         | Solution                                          | Reference                                          |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| "Input files not found"       | Fill 4 input files OR run `/process-client-docs`  | [process-client-docs.md](./process-client-docs.md) |
| "Input files are empty"       | Add content to scope.md and backlog.md minimum    | `.project-management/README.md`                    |
| "Project already initialized" | Use `/generate-docs` to regenerate docs instead   | [generate-docs.md](./generate-docs.md)             |
| Tech stack unclear            | Specify in `input/technologies.md` before running | Full docs "Prerequisites"                          |

---

## 🎯 After Initialization

**You're ready to start development:**

1. **Read generated docs:**
   - Technical Spec: `.project-management/output/docs/technical-spec.md`
   - Phase 1 Plan: `.project-management/output/phases/phase-1.md`

2. **Start implementing:**

   ```bash
   /execute-work phase 1
   ```

3. **Check status anytime:**
   ```bash
   /project-status
   ```

---

## 📚 Full Documentation

**This is a quick guide (120 lines).**

For complete details, see: [`.claude/commands/init-project.md`](../init-project.md) (259 lines)

Includes:

- Detailed tech stack selection workflow
- i18n configuration options
- Template structure and placeholders
- Module references for advanced scenarios
