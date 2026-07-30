# API-First Contract Verification

**MANDATORY: Before writing any frontend code that consumes an HTTP/RPC backend, verify the API contract covers everything the screen needs. If anything is missing, BLOCK frontend implementation and open a backend story/bug instead.**

This rule applies to every screen in this browser SPA that consumes the backend API to render. It does **not** apply to backend-to-backend RPC, internal CLI tools, or pure infra work.

It works alongside `.claude/rules/screen-driven-backlog.md` (which scopes a frontend unit to one screen and produces the screen → endpoint mapping this file's Phase A consumes). This file governs _when frontend implementation is allowed to start_.

---

## 1. The Rule

**Frontend story execution is split into two phases. The second phase cannot start until the first has passed.**

### Phase A — Contract Verification (mandatory, before any frontend code)

For each screen the story implements, list every API endpoint the screen will call. For each endpoint, verify:

1. **Endpoint exists** in the backend code (or is explicitly committed in a backend story already in flight).
2. **Documentation exists** in `openapi.json` or `../refinext-api/` — request body, response shape, status codes, auth requirements.
3. **Request schema covers the data the screen sends** — every field the UI form / interaction produces is accepted by the endpoint, with correct type and required/optional flags.
4. **Response shape covers the data the screen renders** — every field the UI displays, every list it iterates, every count/timestamp/state it shows is present in the response with the right shape.
5. **Error states the UI must distinguish are exposed** — if the design shows different empty states, conflict states, validation messages, or rate-limit feedback, the API must return distinguishable status codes or `error.code` values for each.
6. **Auth model matches** — if the screen is shown only to authenticated users / admins / specific roles, the endpoint enforces the same.

If **any** of these fail → **STOP**. Do not write frontend code. Go to §2.

### Phase B — Frontend Implementation (only after Phase A passes)

Standard implementation per `.claude/rules/code-quality.md` and `.claude/rules/testing.md`. The screen consumes the verified endpoints; types are derived from the documented response shape (or imported from a generated client if the project has OpenAPI).

---

## 2. When Phase A Fails: How to Block

Do not silently work around a missing endpoint. Do not invent a response shape and stub it. Do not "do the frontend now and fix the API later." Those paths produce drift, integration bugs, and rewrites.

Instead:

1. **Write a clear gap report** in the story (or as a comment on its progress file) listing exactly what is missing per endpoint. Be specific: field names, status codes, error codes, role checks.

   Example:

   ```
   Screen: ProductDetail
   Endpoint: GET /api/v1/products/:id
   Gaps:
     - Response missing `inventory.lowStockThreshold` (UI shows "Only N left" badge)
     - No 410 Gone status for archived products (UI needs to render archived banner)
     - No `relatedProducts` array (UI shows related-products carousel)
   ```

2. **Append the gap to `.project-management/input/open-questions.md`** so it appears in `/resolve-questions`. Use priority P0, category `api-contract`, and reference the blocking story ID.

   Example entry:

   ```
   ### Q-XXX: Missing API fields for ProductDetail screen (US-042)
   **Status:** Open
   **Priority:** P0 (Blocker)
   **Category:** api-contract
   **Asked During:** /execute-work story US-042

   **Question:** GET /api/v1/products/:id is missing fields required by the ProductDetail screen.
   Gaps: `inventory.lowStockThreshold`, 410 status for archived products, `relatedProducts` array.
   Who can add these to the endpoint, and by when?

   **Impact if Unresolved:** US-042 cannot be implemented.
   ```

3. **Open a backend story or bug** that closes the gap. File it in Jira, and add a note to `input/open-questions.md` with category `api-contract`.

4. **Mark the frontend story as Blocked** with the dependency reference (`Blocked by: BUG-XXX` or `Blocked by: US-YYY`). Do not partially implement.

5. **Resume frontend work** only after the backend gap is closed and Phase A re-verifies clean.

If the gap is trivial (e.g., one missing field that takes 10 minutes), it is still valid to fix it as a small backend change _first_, commit, then continue with the frontend story. The point is: **backend lands first, frontend builds against verified contract.**

---

## 3. Verification Checklist (run during /execute-work plan mode)

For each frontend story, before exiting plan mode:

- [ ] List every screen the story touches (1 unless wizard — see `.claude/rules/screen-driven-backlog.md`)
- [ ] For each screen, list every API endpoint it calls (method + path)
- [ ] For each endpoint, locate its operation in `openapi.json` (endpoint docs are not authored in this repo — see `.claude/rules/documentation-templates.md` §3)
- [ ] Field-by-field check: every UI input → request schema; every UI output → response shape
- [ ] Distinguishable error states → distinguishable status codes / error codes
- [ ] Auth requirements match
- [ ] **Result:** ✅ contract complete (proceed) OR ⚠️ gaps documented (block + file backend work)

This checklist is part of the plan-mode output, not optional commentary. The user approves it explicitly before implementation starts.

---

## 4. Design Has It, Backend Doesn't — Don't Implement Fake UI

When a Figma design shows a UI element (button, modal, form, flow) that requires a backend API that doesn't exist yet, **do not implement placeholder or decorative versions of that element**.

This includes:

- Showing an OTP/MFA input that collects digits but never sends them
- Rendering a "Send code" button that does nothing
- Wiring a multi-step flow that skips steps silently

**Why:** Fake UI misleads users and reviewers into thinking the feature works. It also creates dead code that must be cleaned up later — and often isn't. The delta between "looks done" and "is done" becomes invisible.

**What to do instead:**

1. Omit the UI element entirely until the backend ships
2. Note the gap in the story's progress file:
   ```
   ⏳ [Element name] — design requires [API endpoint/feature]. Blocked pending Q-XXX / backend story US-YYY.
   ```
3. Implement both the UI and the wiring in the same story once the backend is ready

**Applies symmetrically to approval and rejection flows**, step-up MFA, 2FA confirmation dialogs, and any other security-sensitive interaction where the UI implies a check that the backend doesn't perform.

---

## 5. Lightweight Exemption

The contract check can be skipped only when:

- The story does not call any backend API (pure UI refactor, animation tweak, asset swap, accessibility fix on existing components)
- The story consumes a third-party API outside the project's backend (Stripe, Mapbox, etc.) — in which case substitute the third-party's published spec for the contract source

In every other frontend story, this rule applies.

---

## 6. Why

- Frontend built against an imagined contract is the single biggest source of late-stage rework.
- Stub-and-fix-later produces double work: frontend assumes shape A, backend ships shape B, both must be reconciled at the worst possible time (during integration, with deadlines).
- A 5-minute contract review at plan time prevents days of integration debugging.
- The cost of saying "API needs X first" before frontend starts is hours; the cost of discovering it during frontend testing is days.

---

**Related:**

- `.claude/rules/screen-driven-backlog.md` — scopes a frontend unit to one screen and produces the screen → endpoint mapping Phase A verifies
- `.claude/rules/testing.md` — status-code matrix that documented endpoints must cover
- `.claude/commands/execute-work.md` — plan-mode hook that enforces this gate
