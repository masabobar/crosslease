# Backlog Organization Module

**Purpose:** Split the backlog into phase-specific files for readability and AI token efficiency.

**Used by:** `/init-project`, `/add-scope`, `/add-backlog-requirement`
**Companion:** `backlog-organization-migration.md` (legacy migration, update flow, monorepo example)

---

## Problem

A single monolithic `backlog.md` at 800+ lines becomes:

- Expensive for AI to process (many tokens per read)
- Hard to navigate for humans
- Slow to parse / update

**Solution:** split by phase and priority.

---

## Directory Layout (modular)

```
.project-management/
└── input/
    ├── scope.md
    ├── technologies.md
    ├── constraints.md
    └── backlog/
        ├── README.md                   # master index
        ├── phase-1-foundation.md       # P0 stories
        ├── phase-2-core.md             # P0/P1 main features
        ├── phase-3-advanced.md         # P1/P2 secondary
        ├── phase-4-polish.md           # P2 + testing + deployment
        └── future.md                   # post-launch (v2.0+)
```

---

## Master Index — `backlog/README.md`

**Content template:**

```markdown
# Project Backlog — Master Index

**Project:** {{PROJECT_NAME}}
**Last Updated:** {{DATE}}

---

## 📊 Summary Statistics

**Total Epics:** {{EPIC_COUNT}}
**Total Stories:** {{STORY_COUNT}}
**Total Story Points:** {{TOTAL_POINTS}}

**By Phase:**

- Phase 1 (Foundation): {{P1_STORIES}} stories, {{P1_POINTS}} points
- Phase 2 (Core): {{P2_STORIES}} stories, {{P2_POINTS}} points
- Phase 3 (Advanced): {{P3_STORIES}} stories, {{P3_POINTS}} points
- Phase 4 (Polish): {{P4_STORIES}} stories, {{P4_POINTS}} points
- Future (Post-launch): {{FUTURE_STORIES}} stories

**By Priority:**

- P0 (Must Have): {{P0_COUNT}} stories, {{P0_POINTS}} points
- P1 (Should Have): {{P1_COUNT}} stories, {{P1_POINTS}} points
- P2 (Nice to Have): {{P2_COUNT}} stories, {{P2_POINTS}} points

---

## 📁 Phase Backlogs

### [Phase 1: Foundation & Setup](phase-1-foundation.md)

**Goal:** Project infrastructure, authentication, basic setup
**Stories:** {{P1_STORIES}} | **Points:** {{P1_POINTS}}
**Status:** {{P1_STATUS}} ({{P1_COMPLETE}}/{{P1_TOTAL}} completed)

### [Phase 2: Core Features](phase-2-core.md)

**Goal:** Main product features (MVP)
**Stories:** {{P2_STORIES}} | **Points:** {{P2_POINTS}}
**Status:** {{P2_STATUS}}

### [Phase 3: Advanced Features](phase-3-advanced.md)

**Goal:** Secondary features, optimization
**Stories:** {{P3_STORIES}} | **Points:** {{P3_POINTS}}
**Status:** {{P3_STATUS}}

### [Phase 4: Polish & Launch](phase-4-polish.md)

**Goal:** Final touches, testing, deployment
**Stories:** {{P4_STORIES}} | **Points:** {{P4_POINTS}}
**Status:** {{P4_STATUS}}

### [Future Features (Post-Launch)](future.md)

**Goal:** Version 2.0+ features
**Stories:** {{FUTURE_STORIES}}

---

## 🎯 Quick Navigation

- All Phase 1 stories → [phase-1-foundation.md](phase-1-foundation.md)
- All P0 (critical) stories → check Phase 1 & 2 backlogs
- Add new story to a current phase → `/add-scope add story [phase] [epic]`
- Add future feature → `/add-backlog-requirement` → [future.md](future.md)

---

**Related:**

- [Current Phase Plan](../../output/phases/phase-1.md)
- [Project Scope](../scope.md)
- [DASHBOARD](../../output/progress/DASHBOARD.md)
```

---

## Phase Backlog Files — format

Each `phase-N-*.md` has the same shape:

```markdown
# Phase N: {{PHASE_NAME}}

**Goal:** {{PHASE_GOAL}}
**Duration:** {{DURATION}}
**Stories:** {{STORY_COUNT}}
**Points:** {{TOTAL_POINTS}}

---

## Epic 1: {{EPIC_NAME}}

**Priority:** P0
**Points:** {{EPIC_POINTS}}

### Stories

- **US-001**: {{TITLE}}
  - Story Points: 5
  - Priority: P0
  - Component: [BE] (if monorepo)
  - Description: {{DESCRIPTION}}
  - Acceptance Criteria:
    - Criterion 1
    - Criterion 2
  - Dependencies: None

- **US-002**: {{TITLE}}
  - Story Points: 3
  - …

---

## Epic 2: {{EPIC_NAME}}

…
```

**Contains only stories for this phase.** Cross-phase references use `US-XXX` IDs.

---

## File Size Limits

| File                       | Target        | Hard Cap                    |
| -------------------------- | ------------- | --------------------------- |
| `README.md` (master index) | < 150 lines   | 200 (documentation.md §2.1) |
| Each `phase-N-*.md`        | 150-180 lines | 200 (strict)                |
| `future.md`                | < 150 lines   | 200                         |

**If a phase file exceeds 200 lines**, split into sub-phases (e.g. `phase-2a-core-features.md` + `phase-2b-integrations.md`) or move lower-priority stories to the next phase / `future.md`.

---

## Phase Categorization Logic

Use when assigning stories from `/process-client-docs` extraction or a migration:

| Phase                    | Accepts                               | Examples                                  |
| ------------------------ | ------------------------------------- | ----------------------------------------- |
| **Phase 1 — Foundation** | P0 infrastructure                     | auth, DB setup, core API skeleton, CI/CD  |
| **Phase 2 — Core**       | P0 + high-priority P1 features        | main flows, critical user-facing features |
| **Phase 3 — Advanced**   | P1 + P2 secondary features            | integrations, admin, enhancements         |
| **Phase 4 — Polish**     | P2 + remaining + testing + deployment | optimization, accessibility, launch prep  |
| **Future**               | P3 or explicitly "Post-launch"        | v2.0+ ideas, nice-to-have enhancements    |

---

## Benefits

- ✅ Smaller files (< 200 lines each) — readable at a glance.
- ✅ ~70-80% AI token savings — read only the relevant phase.
- ✅ Easier human navigation.
- ✅ Clear separation of concerns per phase.
- ✅ Future-proof — unlimited growth goes to `future.md`.

---

**Related:**

- Parent: `.claude/commands/init-project.md`
- Used by: `/add-scope`, `/add-backlog-requirement`, `/migrate-to-modular`
- Migration details + monorepo example + AI savings math: `backlog-organization-migration.md`

---

**Version:** 3.3.0
**Last Updated:** 2026-04-21 (split: migration material moved to companion)
