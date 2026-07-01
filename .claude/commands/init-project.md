---
name: init-project
description: Initialize project management structure for this FE-only project
---

# Initialize Project

**📖 Quick Start:** See [how-to-use/init-project.md](./how-to-use/init-project.md) for quick guide (~120 lines)

You are initializing the Claude Project Management System for RefiNext Frontend.

---

## Your Task

**🔧 DOCUMENTATION RULES:**
All documentation generated must follow:

- **`CLAUDE.md`** - All documentation in English only, coding standards
- **`.claude/rules/git.md`** - If committing initialization (NO AI credits, conventional commits)

---

### STEP 0: STACK CONFIRMATION (no selection needed)

This is a **Frontend Only** project. Stack is fixed and must not be changed.

**Stack (from `.project-management/rules/project-rules.md`):**

- React 19 + TypeScript + Vite + Tailwind v4
- i18next + react-i18next (en + de)
- Vitest (unit tests, written by developers)
- Playwright (E2E, owned by QA — do not add specs)
- API: pre-existing `refinext-api` (out of scope)

**No structure scaffolding needed.** The `refinext-app/` directory already exists.

Emit:

```
✅ Stack confirmed — RefiNext Frontend (React 19 + Vite + TypeScript + Tailwind v4)
```

---

### STEP 1: i18n STATUS CHECK

Check whether `.project-management/rules/I18N-RULES.md` already exists and is configured.

**📖 See:** `modules/init-project-i18n-setup.md` for the full setup flow.

**If file exists and has real content (not placeholder `{{VARIABLES}}`):**

- Skip setup. Emit: `✅ i18n already configured (en + de)`

**If file is missing or is placeholder-only:**

- Run the i18n setup module (`init-project-i18n-setup.md`)
- Note: default languages for this project are **English (en)** and **German (de)**

---

### STEP 2: READ INPUT FILES AND HANDLE BACKLOG FORMAT

**Read all input files from `.project-management/input/`:**

- `scope.md` - Project scope and objectives
- `backlog/` (preferred) OR `backlog.md` (legacy) - Features and user stories
- `technologies.md` - Technology stack
- `constraints.md` - Project constraints

**🔄 BACKLOG FORMAT DETECTION:**

**Check which format exists:**

1. **If `backlog/` directory exists (MODERN):**
   - ✅ Read modular structure: `backlog/README.md`, `backlog/phase-*.md`
   - ✅ This is the preferred format (< 200 lines per file)
   - ✅ Continue to STEP 3

2. **If only `backlog.md` exists (LEGACY):**
   - ⚠️ Detected monolithic backlog (old format)
   - 🔄 **Automatic migration:** Run `/migrate-to-modular` internally
   - ✅ After migration, continue with modular structure
   - 📝 Note in summary: "Migrated monolithic backlog to modular structure"

3. **If neither exists:**
   - ❌ Error: No backlog found. User must add content to `input/backlog/` first.

**Analyze the inputs to understand:**

- Feature requirements and priorities
- Timeline and resource constraints
- Screen inventory (screens listed in scope/backlog)

---

### STEP 3: GENERATE DOCUMENTATION

**🌍 CRITICAL: Generate ALL documentation in English only. No exceptions.**

**🔒 Anonymization (mandatory):** Personal names from input docs MUST NOT appear in generated docs. Replace with role labels. Full rule: `.claude/rules/anonymization.md`.

**Generate initial documentation in `.project-management/output/docs/`:**

**1. `prd.md` - Product Requirements Document**

- Use template: `.project-management/templates/prd-template.md`
- Extract project vision from scope.md
- List all features from backlog organized by priority
- Define success metrics
- Document assumptions and risks

**2. `technical-spec.md` - Technical Specification**

- Use template: `.project-management/templates/technical-spec-template.md`
- **FE-specific sections to include:**
  - Technology stack (from `project-rules.md` and `technologies.md`)
  - Component architecture (feature-based folder structure under `src/features/`)
  - State management (Zustand stores per feature)
  - Routing structure (React Router routes)
  - API integration layer (Zod schemas in `features/<name>/api/schema.ts`, query functions)
  - i18n structure (namespaces per feature, `src/i18n/locales/{en,de}/<feature>.json`)
  - Testing strategy (Vitest unit tests in `src/__tests__/`, mirroring source tree)
  - Security considerations (bearer token auth, role-based UI gating)
- **Do NOT include:** database schema, backend API design, server-side architecture

**3. `architecture.md` - Frontend Architecture Document**

- Component hierarchy and composition patterns
- Data flow (API → Zod schema → query function → Zustand store → component)
- Routing and navigation structure
- Error handling strategy (Axios interceptor, 401 redirect, error boundaries)
- Build and deployment approach

---

### STEP 4: CREATE PHASE STRUCTURE

**Read modular backlog from `backlog/` directory:**

**Create `.project-management/output/phases/` directory**

**Generate initial phase files based on epic priorities:**

**Phase 1: Foundation & Setup**

- All "Project Setup", "Infrastructure", "Authentication" epics
- Estimated: 1-2 months

**Phase 2: Core Features**

- Main product features (P0 priority)
- Estimated: 2-3 months

**Phase 3: Advanced Features**

- Secondary features (P1 priority)
- Estimated: 2 months

**Phase 4: Polish & Launch**

- Final optimizations, testing, deployment
- Estimated: 1 month

**For each phase, create `phase-N.md` using `.project-management/templates/phase-template.md`**

---

### STEP 5: POST-GENERATION CLARIFICATION GATE

**📖 See:** `modules/interactive-clarifications.md` for the full loop.

After STEP 3 and STEP 4, run the interactive Q&A gate:

**Sources of questions:**

1. **TBD markers** in generated docs (`<!-- TBD: Q-NNN -->`)
2. **Existing P0/P1 entries** in `input/open-questions.md` with `Status: Open`

**Behavior:**

- Zero questions → emit `✅ No open clarifications.` and skip.
- Otherwise, invoke `modules/interactive-clarifications.md` STEPS B–G.
- Skipped questions remain in `open-questions.md` with incremented `Skipped:` count.

---

### STEP 6: CREATE PROGRESS TRACKING

**Create in `.project-management/output/progress/`:**

**1. `current-status.md`** - Initialize with project start status

- Use `.project-management/templates/progress-template.md`
- Set all metrics to 0%
- Set project start date
- List Phase 1 as current phase

**2. `completed.md`** - Empty initially (for tracking completed work)

**3. `blockers.md`** - Empty initially (for tracking blockers)

---

### STEP 6.5: SCREEN INVENTORY (always scaffold — this is a web FE project)

**Per `.claude/rules/screen-inventory.md`:**

1. Create directory `.project-management/input/screens/`.
2. Copy `.project-management/templates/screen-map-template.md` to `.project-management/input/screens/screen-map.md`.
3. Substitute placeholders: `{{PROJECT_NAME}}` → `RefiNext`, `{{VERSION}}` → `0.1.0`, `{{DATE}}` → today, `{{STATUS}}` → `Draft`.
4. Leave screen entries as template placeholders — filled in during story authoring or hand-curated.
5. Inform user in summary that the screen map was scaffolded.

---

### STEP 7: SUMMARY REPORT

Render the comprehensive summary. Substitute actual values for stack, i18n status, epic/story/point totals, per-phase breakdown, and next-step commands.

---

## 📚 Module References

- `modules/init-project-i18n-setup.md` - STEP 1 (i18n check/setup)
- `modules/interactive-clarifications.md` - STEP 5 (post-generation Q&A gate)

---

## Important Guidelines

- **Use the templates** from `.project-management/templates/` and replace all `{{PLACEHOLDERS}}`
- **Be comprehensive** - generate complete documentation, don't leave TODOs
- **Follow project rules** in `CLAUDE.md` and `project-rules.md`
- **No backend content** in generated docs — this is FE only

---

**Version:** 3.1.0 (FE adaptation)
**Updated:** 2026-06-02
