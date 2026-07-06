# API Versioning & Change-Propagation Gate

**Version:** 1.0
**Last Updated:** 2026-05-11
**Status:** Active

**MANDATORY: Public HTTP APIs are versioned via URL path (`/api/v{N}/...`). Any backend change that modifies an endpoint's contract (request schema, response shape, status codes, semantics) MUST propagate atomically — in the same PR — to documentation, Zod schemas, ALL related tests, and the API consumer code (frontend / mobile).**

> **FE-only repo note:** endpoints live in `../refinext-api/` — the versioning and change-propagation gates below are executed there. In this repo, the operative consequences are: (1) when the BE bumps an endpoint version, update `openapi.json` (`pnpm fetch:openapi`), the feature's Zod schemas, and their tests together; (2) `api-first.md` Phase A re-verifies before any FE change ships.

This rule complements `.claude/rules/api-documentation.md` (which governs _what an endpoint doc looks like_) and `.claude/rules/testing.md` (which defines the status-code test matrix). This file defines _when a version bump is required_ and _what MUST update together when a contract changes_.

---

## 1. Why

- API consumers (frontend, mobile, third parties, queue workers, webhook receivers) hard-code field names, types, and status code expectations. Any unannounced change is a runtime failure.
- "I'll update the docs later" is the #1 source of integration bugs across web/mobile teams.
- Tests written against the old contract pass silently while real consumers break. Re-running tests as part of the change is the only reliable forcing function.
- Without an explicit version, breaking changes cannot be rolled out without coordinated multi-app deployments.

---

## 2. Versioning Strategy

**URL path versioning.** Every public endpoint lives under `/api/v{N}/...`:

```
POST /api/v1/users/signup
GET  /api/v1/orders/:id
POST /api/v2/orders          ← v2 introduced because v1 response shape was breaking
```

**Why path versioning (not header / query):**

- Discoverable in logs, dashboards, browser tools without inspecting headers
- Routing is straightforward in React Router 7 and any backend framework
- Cache-friendly at any CDN/proxy layer
- Already the de facto convention in existing endpoint docs in this project

**Starting version:** every new project / new domain begins at `v1`. Never ship an unversioned `/api/...` endpoint for a public client.

**Internal endpoints** (handlers marked `@internal` per `.claude/rules/api-documentation.md` §3) may skip the version segment (`/api/_internal/...`) because they are not contracts to third parties. They still follow the change-propagation gate (§5) for the internal callers that exist.

---

## 3. Breaking vs Non-Breaking Changes

A change is **breaking** if any existing well-formed request that succeeded before would now fail, OR if any response field a consumer relied on disappears, renames, or changes type/shape/semantics.

### 3.1 Breaking (require new major version, e.g. `v1` → `v2`)

- Remove a field from request or response
- Rename a field (request or response)
- Change a field's type (`string` → `number`, scalar → object, optional → required)
- Tighten validation (previously accepted input now rejected)
- Change a documented status code's trigger condition
- Change the semantics of an existing field (e.g., `price` was cents, now dollars)
- Remove an enum value from an output, OR add an enum value to an _input_ that wasn't documented as open
- Change authentication / authorization requirements

### 3.2 Non-Breaking (same version, doc update required)

- ADD an optional request field with a sensible default
- ADD a field to a response (consumers should ignore unknown fields)
- ADD a new endpoint
- ADD a value to an output enum (announce to consumers; some may treat it as breaking — call it out)
- Relax validation (previously rejected input now accepted)
- Performance improvements with no behavior change
- Bug fix where the previous behavior was clearly contrary to the documented contract

When in doubt, treat as breaking. The cost of an unnecessary version bump is small; the cost of an unannounced breaking change is large.

---

## 4. When to Bump Version

- **`v1` → `v2`:** any breaking change per §3.1. Old endpoints under `v1` remain available throughout the deprecation window (§6).
- **Within `v{N}` (no version bump):** non-breaking additions per §3.2. Increment the doc's "Last Updated" field and add a changelog entry.

Do not version on minor semantic changes within the same major. Versioning is for _contract_ changes, not implementation churn.

---

## 5. The Change-Propagation Gate (MANDATORY)

When any BE handler changes the request schema, response shape, status codes, or behavior of an existing endpoint, **the same PR/commit MUST update all of the following**. Missing any one is a blocker — do not merge.

### 5.1 Endpoint Documentation

Per `.claude/rules/documentation-templates.md` §2.1 — update the doc block:

- HTTP method + path (and version segment)
- Request body example
- Response example for success status
- Error responses (200/400/401/403/404/500 matrix per `.claude/rules/testing.md`)
- Allowed enum values for any enum-typed field (per `.claude/rules/enums-and-constants.md`)
- "Last Updated" timestamp incremented
- If breaking change → new version path; old version doc marked `Deprecated` with sunset date

If the project uses **OpenAPI/Swagger**, `openapi.yaml` is the source of truth — update there, and any generated Markdown derives from it.

### 5.2 Zod Schemas (Request + Response)

Both the request validation schema AND the typed response shape MUST update in the same change:

```typescript
// app/lib/schemas/order.ts — source of truth, used by handler AND tests
export const createOrderRequestSchema = z.object({
  /* ... */
})
export const createOrderResponseSchema = z.object({
  /* ... */
})
```

The handler imports these schemas; tests import these schemas; the doc is derived from them or cross-checked against them. **One source of truth — never duplicate the shape across handler / test / doc.**

### 5.3 Tests — ALL Related Tests Must Be Re-Validated

This is the hardest gate to enforce and the most often skipped. The rule:

1. **Run every test that exercises the changed endpoint** — not just new tests. Use the path / handler name to find them:
   ```bash
   grep -rln "POST /api/v1/orders\|createOrder" tests/
   ```
2. **The status-code matrix (200/400/401/403/404/500) must still be fully covered** per `.claude/rules/testing.md`. If a status code's trigger condition changed, update _both_ the test and the doc.
3. **Any test that fails because of the contract change is NOT "expected breakage"** — it is a signal that:
   - the test was the only thing exercising a real consumer expectation, OR
   - the change is breaking and was misclassified as non-breaking (§3.2 → §3.1).

   In either case: re-evaluate whether this needs a version bump. Do not "fix" the test by mirroring the new shape until §5.1 + §5.2 + §5.4 are also updated.

4. **Contract / schema tests:** if the project has tests that round-trip example payloads through the Zod schemas, those MUST pass after schema updates.
5. **Test coverage** on the changed endpoint is verified per the BE repo's testing standards after the update.

### 5.4 Consumer Code (Frontend / Mobile)

If the project consumes the API from the same monorepo (default stack: React Router 7 shares the codebase; mobile clients may be in `apps/mobile/`):

- Update the API client / fetcher
- Update the TypeScript types consumed from the schema (auto-derived from Zod / Prisma where possible)
- Update any UI that displays new/removed/renamed fields
- Update any frontend tests / Playwright scenarios that asserted the old response shape

Out-of-repo consumers (third parties, external mobile apps) cannot be updated atomically — they require the deprecation flow (§6).

### 5.5 Drift Check Before Merge

Per `.claude/rules/api-documentation.md` §2.4 — verify field names + status codes are aligned across **schema ↔ response type ↔ docs ↔ tests**. Any mismatch is a blocker.

---

## 6. Deprecation Policy (for breaking changes)

When releasing `v{N+1}` of an endpoint:

1. **Keep `v{N}` live** through a deprecation window (project default: **6 months** unless explicitly shortened with consumer sign-off).
2. **Mark `v{N}` doc as `Deprecated`** with a sunset date and a "use `v{N+1}` instead" note.
3. **Emit `Deprecation: true` and `Sunset: <RFC 7231 date>` response headers** on every `v{N}` response. Consumer logs / dashboards pick these up.
4. **Log every `v{N}` call** with a `deprecated_api_call` event so usage can be tracked toward the sunset date.
5. **Do not remove `v{N}`** until either (a) the sunset date passes AND no calls have been logged for the prior 30 days, or (b) all known consumers have confirmed migration.

Removing a `v{N}` endpoint follows the same change-propagation gate (§5) — docs + tests + consumer-side cleanup all in the same PR.

---

## 7. Pull-Request Checklist (paste into PR description)

For any PR that touches an HTTP handler:

- [ ] Endpoint version segment correct (`/api/v{N}/...`)
- [ ] If breaking change → new major version (`v{N+1}`), old version marked Deprecated with sunset header
- [ ] Endpoint doc updated per `.claude/rules/documentation-templates.md` §2.1
- [ ] Request + response Zod schemas updated in the same commit; single source of truth
- [ ] Allowed enum values listed in doc (per `.claude/rules/enums-and-constants.md`)
- [ ] **All tests** for the changed endpoint run locally — pass
- [ ] Status-code matrix still fully covered (200/400/401/403/404/500)
- [ ] No test was "fixed" by mirroring the new shape without checking whether the change is actually breaking
- [ ] Endpoint test coverage verified per the BE repo's testing standards
- [ ] Consumer code (frontend / mobile in-repo) updated
- [ ] Drift check clean: schema ↔ response type ↔ docs ↔ tests align (per `.claude/rules/api-documentation.md` §2.4)

---

## Related

- `.claude/rules/api-documentation.md` — what an endpoint doc must contain (request schema, typed response, status codes, drift check)
- `.claude/rules/documentation-templates.md` §2.1 — the endpoint doc template
- `.claude/rules/testing.md` — the 200/400/401/403/404/500 test matrix
- `.claude/rules/enums-and-constants.md` — wire format and required listing of allowed enum values in docs
- `.claude/commands/modules/execute-work-quality-gates.md` — where this gate is enforced during `/execute-work`

---

**Status:** ✅ Active
