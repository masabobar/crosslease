# Backlog Organization — Migration & Details

Companion to `backlog-organization.md`. Holds the legacy-to-modular migration flow, update strategies, AI-cost math, and a worked monorepo example.

---

## Migration: monolithic → modular

Run during `/init-project` (if it detects a legacy `backlog.md`) or via `/migrate-to-modular`:

**STEP 1** — Read existing `input/backlog.md`.

**STEP 2** — Analyze + categorize stories:

- Group by epic.
- Identify priority (P0 / P1 / P2 / P3).
- Assign to phases using the categorization logic in the parent module:
  - P0 → Phase 1 (if infra/auth) or Phase 2 (if core feature)
  - P1 → Phase 2 or Phase 3
  - P2 → Phase 3 or Phase 4
  - P3 / "Future" / "Post-launch" → `future.md`

**STEP 3** — Create `backlog/` directory.

**STEP 4** — Generate phase files + `README.md`.

**STEP 5** — Archive original: `mv backlog.md backlog.md.old` (or delete — it's in git history anyway).

**STEP 6** — Verify: each file < 200 lines; totals in README match sums across phase files.

---

## Update Strategies

### Adding a new story

Command: `/add-scope add story [phase] [epic]`

Flow:

1. Identify target phase (1-4 or `future`).
2. Read `backlog/phase-N-*.md`.
3. Add story to the appropriate epic.
4. Update `README.md` summary statistics (delegates to `add-scope-readme-update.md`).
5. Write both files.

### Moving a story between phases

Command: `/add-scope edit story US-XXX`

Flow:

1. Find story in current phase backlog.
2. Ask user: "Move to different phase? [1/2/3/4/Future]".
3. Remove from current phase file.
4. Add to target phase file.
5. Update `README.md` + both affected phase files.

---

## Backward Compatibility

Legacy projects can keep running on `input/backlog.md`:

**Option 1 — Automatic migration (recommended):** `/migrate-to-modular` does the split.

**Option 2 — Keep monolithic:** `/execute-work` and `/project-status` auto-detect and work with either layout. Drawback: you don't get DASHBOARD.md auto-updates optimized for per-phase reads.

---

## AI Token Math

**Old (monolithic):**

- Read `backlog.md` (800 lines) end-to-end.
- ≈ 2,400 tokens per read.

**New (modular):**

- Read `backlog/README.md` (100 lines) → identify relevant phase.
- Read one `phase-N-*.md` (150 lines) → process only that phase's stories.
- ≈ 100 + 450 = 550 tokens (~77% savings).

**When AI does need full context** (cross-phase dependency analysis, major scope change):

- Read all phase files sequentially. Still cheaper than a single 800-line file because partial reads can be skipped once context is sufficient.

---

## Monorepo Example

`backlog/phase-1-foundation.md` for a BE + Mobile monorepo:

```markdown
# Phase 1: Foundation & Setup

**Goal:** Infrastructure, authentication, shared types
**Duration:** 1-2 months
**Stories:** 12
**Points:** 47

---

## Epic 1: User Authentication

**Priority:** P0
**Points:** 18

### Stories

- **US-001**: [BE] JWT authentication API
  - Story Points: 5
  - Priority: P0
  - Component: Backend (apps/backend/)
  - Description: JWT-based auth with login/register endpoints.
  - Acceptance Criteria:
    - POST /api/auth/login returns JWT token
    - POST /api/auth/register creates user + returns token
    - Passwords hashed with bcrypt
    - 401 on invalid credentials

- **US-002**: [Shared] User + Auth TypeScript types
  - Story Points: 2
  - Priority: P0
  - Component: Shared (packages/shared-types/)
  - Description: User, LoginRequest, AuthResponse interfaces.
  - Dependencies: None

- **US-003**: [Shared] API client wrapper
  - Story Points: 3
  - Priority: P0
  - Component: Shared (packages/api-client/)
  - Description: ApiClient class with auth methods.
  - Dependencies: US-002

- **US-004**: [Mobile] Login screen UI
  - Story Points: 5
  - Priority: P0
  - Component: Mobile (apps/mobile/)
  - Description: Login form with validation.
  - Dependencies: US-001, US-003

---

## Epic 2: Project Setup & Infrastructure

**Priority:** P0
**Points:** 13

### Stories

- **US-005**: [BE] Database setup with Prisma
  - Story Points: 3
  - Priority: P0
    …
```

**Note** the `[BE]`, `[Mobile]`, `[Shared]`, `[Full-stack]` prefixes — required for monorepo projects (see `init-project-structure-setup.md` § Backlog Prefix Convention).

---

## Verified Implementation (this repo)

Confirmed working after the v3.2 meta-repo self-hosting:

| File                                  | Lines | Note                       |
| ------------------------------------- | ----- | -------------------------- |
| `input/backlog/README.md`             | 60    | Master index               |
| `input/backlog/phase-1-foundation.md` | 110   | P0 infrastructure + auth   |
| `input/backlog/phase-2-core.md`       | 162   | Product mgmt + checkout    |
| `input/backlog/phase-3-advanced.md`   | 66    | Orders + inventory         |
| `input/backlog/phase-4-polish.md`     | 81    | Reviews + analytics + bugs |
| `input/backlog/future.md`             | 27    | Post-launch placeholder    |

All under the 200-line cap. Token savings confirmed ~60-70% on `/execute-work` runs.

---

**Version:** 3.3.0
**Created:** 2026-04-21 (split from `backlog-organization.md`)
