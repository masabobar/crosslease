# Screen-Driven Backlog (Web & Mobile)

**MANDATORY: Web and mobile user stories are organized one-screen-per-story. Each story must list the API endpoints the screen consumes.**

This rule applies whenever a backlog phase is built or extended for a frontend (web SPA, web SSR, iOS, Android, React Native, Flutter, Expo). It governs _how stories are written_. Backend, infra, and shared-library stories are unaffected.

It works alongside `.claude/rules/api-first.md` (which gates _when frontend implementation can start_ against API contract verification) and `.claude/rules/documentation-templates.md` §1.1 (the canonical user-story format).

---

## 1. The Rule (soft, with one explicit exception)

Default: **one frontend story = one screen** (or one modal, sheet, drawer, or full-page overlay that the user perceives as a discrete destination).

Why "soft": strict 1:1 fragments velocity for cohesive flows. So we allow exactly one exception:

### Wizard exception

A multi-step flow where each step has no standalone purpose — the user only ever moves through the steps as a unit (signup, onboarding, checkout, KYC) — may be **one story spanning all wizard steps**, provided:

- The story explicitly enumerates every step/screen in its description
- Each step has its own subtask in the story's task list
- The wizard exits cleanly to a single defined screen (the resulting target after success/cancel)
- Each step's API endpoints are listed (per §3 below)

A "tabs" pattern is **not** a wizard — tabs are independent destinations and get separate stories.

If a story would naturally cover 2+ unrelated screens, **split it.** Don't bundle "Login + ForgotPassword + Signup" — those are three stories.

---

## 2. Story Title & Identification

Frontend story titles follow the `Screen — Action / Purpose` pattern:

✅ Good:

- `US-042: ProductDetail — display product info, gallery, related items`
- `US-043: ProductDetail — add to cart interaction`
- `US-044: Checkout wizard — address, payment, review (3 steps)`

❌ Bad:

- `US-042: Implement product detail page` (vague — what part?)
- `US-043: Cart functionality` (multiple screens hidden inside)
- `US-044: Make checkout work` (no screen, no scope)

The first half (before `—`) names the screen exactly as it appears in the design / specification. Reuse the same screen name across all related stories so they're greppable.

---

## 3. Required Story Fields (frontend stories only)

Frontend stories **extend** the base user-story format from `.claude/rules/documentation-templates.md` §1.1 — do not redefine those fields here. Apply the §1.1 template, then add the four mandatory fields below. The story title also follows the `ScreenName — Short Action` pattern (see §2 above).

**Additional mandatory fields for frontend stories:**

- `**Type:** Frontend (Web / Mobile / Both)`
- `**Screen:** ScreenName` _(or for a wizard: `ScreenName step 1 → step 2 → step 3`, with each step named)_
- `**API Endpoints Used:**` — table with columns `Method | Path | Purpose | Doc reference`
- `**API contract status:** ✅ Verified` _or_ `⚠️ Gaps (link to backend story or bug)`

**Example of the API endpoints table:**

```markdown
**API Endpoints Used:**
| Method | Path | Purpose | Doc reference |
|--------|------|---------|---------------|
| GET | /api/v1/products/:id | Load product detail | docs/api/products.md §GET /products/:id |
| POST | /api/v1/cart/items | Add to cart | docs/api/cart.md §POST /cart/items |

**API contract status:** ✅ Verified
```

Notes on the table:

- **Method + Path** must match the documented endpoint exactly. No paraphrasing, no "or similar".
- **Purpose** is one short phrase tied to the screen's behavior, not a re-description of the endpoint.
- **Doc reference** is a path to the actual doc file + section anchor. If the project uses OpenAPI, link to the operation ID in `openapi.yaml`. If the doc doesn't exist yet, the row reads `⚠️ DOC MISSING — backend gap` and Phase A of `api-first.md` blocks the story.

If a screen calls **zero** backend endpoints (rare — e.g., pure static info screen), the table is replaced with a single line: `**API Endpoints Used:** none — purely client-side.`

---

## 4. Mobile-Specific Discipline

For native and cross-platform mobile, screens are the unit of navigation, so the rule maps cleanly:

- One stack screen → one story
- One modal / bottom-sheet → one story (or fold into the parent if it's a trivial confirmation)
- One tab in a tab bar → one story (each tab is a destination)
- A wizard / onboarding flow → one story (per §1 wizard exception)

Pull-to-refresh, infinite scroll, and offline-cache behavior on a screen all live in the same story as the screen — they're not separate. They become separate only if they're cross-cutting (e.g., "implement offline cache strategy across app" — that's a backend/infra story, not a screen story).

---

## 5. Web-Specific Discipline

For web, "screen" = "route" in the SPA / SSR sense. A route with multiple distinct view states (e.g., a dashboard with empty state vs populated state) is still **one story** — those are states of the same screen, not separate screens.

A route that changes drastically based on path params (e.g., `/products` vs `/products/:id`) is **two stories** — list and detail are different screens, often using different endpoints.

Modals, dialogs, and slide-over panels follow the same rule as mobile: own story unless trivial.

---

## 6. Backlog Authoring Workflow

When `/process-client-docs` or `/init-project` generates a backlog with frontend phases, or when `/add-scope` adds a frontend story:

1. **Identify all screens** in the design / specification first. Number or name them. This is the screen list.
2. **One story per screen** (or per wizard, per §1).
3. **For each story, list endpoints** per §3. If the corresponding backend endpoint does not yet exist or is not yet documented, **also create the backend story** in the appropriate backend phase, and mark the frontend story `Blocked by: US-YYY-backend`.
4. **Cross-link** — the backend story should mention which frontend story consumes it, so changes to the contract trigger a review.

This means a typical mobile project of N screens produces ≥ N frontend stories plus the backend stories they depend on. That's intentional. It maps cleanly onto velocity tracking and per-screen QA.

---

## 7. When This Rule Does NOT Apply

- Backend-only phases (Foundation, Core API, etc.)
- Infrastructure / DevOps / migrations
- Internal tooling, CLI utilities, scripts
- Shared-library / design-system work that isn't a user-visible screen (e.g., "extract Button component" is not a screen story)
- Bug fixes that don't add or restructure screens

In every web/mobile feature phase, this rule applies.

---

## 8. Why

- A flat "implement product feature" story hides scope drift. A screen-shaped story makes scope visible at planning time.
- Without the API endpoint table, integration gaps surface during implementation. With it, they surface during planning — when they're cheap to fix.
- Per-screen QA / acceptance is feasible only if stories are screen-shaped. Bundled stories produce bundled bugs.
- Designers and clients think in screens. Aligning the backlog to that mental model reduces translation overhead at every status check.

---

**Related:**

- `.claude/rules/api-first.md` — uses the API endpoint table from §3 to gate frontend implementation start
- `.claude/rules/documentation-templates.md` §1.1 — base user-story format that frontend stories extend
- `.claude/rules/api-documentation.md` — what the linked endpoint docs must contain
- `.claude/rules/screen-inventory.md` — consolidated screen map (web CMS / mobile) that derives its API columns from the tables defined here
- `.claude/commands/add-scope.md` — slash command that enforces this template when adding frontend stories
- `.claude/commands/process-client-docs.md` — extracts screens from designs and generates screen-driven stories
- `.claude/commands/screen-map.md` — refreshes the consolidated screen map from these stories
