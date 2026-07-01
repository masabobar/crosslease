# API Documentation & Schema Validation

**MANDATORY: Every API endpoint MUST have request/response schema validation in code AND matching documentation before the story is marked complete.**

This rule fires whenever a story adds, modifies, removes, or renames an HTTP endpoint (REST, RPC, or webhook handler). It works alongside `.claude/rules/testing.md` (status-code matrix), `.claude/rules/documentation-templates.md` §2 (endpoint doc template), and `.claude/rules/api-versioning.md` (version bumps + change-propagation gate) — those define the _what_; this file defines _when it blocks completion_ and _how to verify it_.

---

## 1. Two Tiers: Public vs Internal

Not all endpoints carry the same risk. Treat them differently.

| Tier                       | Definition                                                                                                               | Rule strength                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Public / client-facing** | Consumed by frontend, mobile clients, third-parties, partners, or any caller outside the backend's own process           | **STRICT** — story cannot be completed without schema validation + docs                               |
| **Internal / admin-only**  | Cron handlers, internal RPC between trusted services, admin-only endpoints behind staff auth, healthchecks, debug routes | **SOFT** — strongly recommended; opt-out requires explicit `@internal` JSDoc/TSDoc tag on the handler |

**Default to STRICT.** An endpoint counts as internal _only_ when the handler carries an explicit marker:

```typescript
/**
 * @internal — admin dashboard only, behind requireAdmin middleware.
 * Schema validation + docs not required by api-documentation rule.
 */
app.post("/api/admin/internal/reindex", requireAdmin, reindexHandler)
```

No marker → STRICT applies. The marker exists so the choice is visible in code review and grep-able later.

---

## 2. STRICT Tier Requirements

For every public/client-facing endpoint added or modified, the story is **NOT complete** until all four gates pass:

### 2.1 Request schema validation in code

Request body, path params, and query params must be parsed through a schema validator (Zod, Joi, Yup, or `class-validator`) at the handler boundary. Reuse the `validateBody(schema)` middleware pattern from `.claude/rules/stack-specific.md` §"Required Middleware" rather than inventing a new wrapper.

```typescript
// ✅ GOOD — schema-validated at boundary
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
})

app.post("/api/users", validateBody(createUserSchema), createUser)
```

```typescript
// ❌ BAD — manual ad-hoc checks, no schema
app.post("/api/users", (req, res) => {
  if (!req.body.email || !req.body.email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" })
  }
  // ...
})
```

### 2.2 Typed response shape

The response body must have a declared TypeScript type (or the equivalent in the project's stack). Untyped `res.json(anything)` is forbidden in handlers. Follow the canonical response envelope (`{ success, data }` / `{ success, error, code }`) defined in `.claude/rules/stack-specific.md` §"Node.js Backend".

```typescript
interface CreateUserResponse {
  success: true
  data: { id: string; email: string; name: string }
}

app.post<{}, CreateUserResponse, CreateUserRequest>(
  "/api/users",
  validateBody(createUserSchema),
  async (req, res) => {
    /* ... */
  }
)
```

### 2.3 Documentation present and matching

Every public endpoint must have a doc block matching the template in `.claude/rules/documentation-templates.md` §2.1. Required fields:

- HTTP method + path
- Description (one sentence)
- Authentication (None / Bearer token / API key / requireAdmin / etc.)
- Request body example (JSON, realistic values)
- Response example for the success status code
- Error responses — at minimum 400, 401, 403, 404, 500 (the matrix from `.claude/rules/testing.md`)
- For any enum-typed field in request or response, **list the allowed values** (e.g., `status: "ACTIVE" | "PENDING_REVIEW" | "CANCELLED"`) — per `.claude/rules/enums-and-constants.md`
- Rate limiting note (if applicable)

Doc location: project's chosen API doc directory (e.g., `docs/api/`, or co-located `.md` next to the handler). One endpoint per doc block. If the project uses **OpenAPI/Swagger**, `openapi.yaml` is the source of truth and the Markdown can be generated from it; the gate then verifies the OpenAPI entry exists, not the Markdown.

### 2.4 Documentation matches implementation

Before marking the story complete, perform a **drift check**:

1. Field names in the documented request body match the schema (case-sensitive).
2. Field names in the documented response match the typed response shape.
3. Required vs optional flags match between schema and docs.
4. Status codes listed in docs match the status codes the handler can actually return (cross-reference with the test file — every documented status code must have a test, every tested status code must be documented).

Drift is a blocker, not a warning. Fix the doc OR the code, then re-verify.

---

## 3. SOFT Tier (Internal endpoints)

For `@internal`-marked endpoints, the gate is reduced to:

- Schema validation **recommended** (not required) — at minimum, runtime input must not blow up on malformed bodies
- Inline JSDoc/TSDoc on the handler explaining purpose, expected caller, and shape of input/output (one paragraph is fine)
- No separate Markdown/OpenAPI entry required

Example:

```typescript
/**
 * @internal — invoked by the nightly cron job (see infra/cron/reindex.yaml).
 * Body: { batchSize?: number } default 1000.
 * Returns: { processed: number, failed: number }.
 */
app.post("/api/_internal/reindex", requireServiceToken, async (req, res) => {
  /* ... */
})
```

If an `@internal` endpoint is later exposed to clients, **promote it to STRICT** and apply §2 in full before shipping that change.

---

## 4. Verification Steps (run before closing a story)

For each endpoint touched in the story:

1. **Identify tier.** Public unless the handler carries `@internal`.
2. **Read the handler file.** Confirm a schema (Zod/Joi/etc.) wraps the request and the response is typed. If missing → block.
3. **Open the doc file.** Confirm the endpoint block exists and follows the §6.1 template. If missing → block.
4. **Drift check.** Diff field names + status codes between schema, response type, docs, and tests. Any mismatch → block until reconciled.
5. **Confirm tests cover all documented status codes** (per `.claude/rules/testing.md` matrix).

A blocked endpoint means the story stays in progress. Do not commit and close out a story with a blocked endpoint — fix it or demote the endpoint to `@internal` (and justify the demotion in the commit message) before completing.

---

## 5. When This Rule Does NOT Apply

- The story doesn't add/modify/remove any HTTP endpoint (purely frontend, infra, refactor of pure functions, etc.)
- The change is doc-only (typo fix in an existing API doc) — no schema work needed
- The endpoint already had compliant schema + docs and the story doesn't change either

In all other cases involving HTTP handlers, this rule applies.

---

## 6. Quick Checklist (paste into PR / story DoD)

Public endpoint:

- [ ] Request schema (Zod/Joi/etc.) validates body, params, query at boundary
- [ ] Response shape declared as typed interface
- [ ] Doc block exists per `.claude/rules/documentation-templates.md` §2.1
- [ ] All status codes from `.claude/rules/testing.md` matrix documented
- [ ] Field names match between schema, response type, docs, tests
- [ ] Tests cover every documented status code

Internal endpoint:

- [ ] Handler has `@internal` JSDoc/TSDoc tag
- [ ] Tag explains purpose, caller, input/output shape
- [ ] Input is at least guarded against malformed bodies

---

**Related:**

- `.claude/rules/testing.md` — status-code matrix (200/400/401/403/404/500)
- `.claude/rules/api-versioning.md` — version-bump policy + mandatory change-propagation (docs + schemas + tests + consumers)
- `.claude/rules/documentation-templates.md` §2 — endpoint doc template
- `.claude/rules/stack-specific.md` — `validateBody(schema)` middleware, response format, env Zod schema
- `.claude/rules/enums-and-constants.md` — wire format and required listing of allowed enum values
- `.claude/commands/modules/execute-work-quality-gates.md` — where this gate is enforced inside `/execute-work`
