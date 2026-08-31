# Execute Work — Quality Gates

**Referenced by:** `execute-work.md` STEP 4

The unit is not complete until every gate below passes. They run in this order because each is blind to
what the next one catches.

---

## 4.1 Mechanical checks

```bash
pnpm test:run      # Vitest, once
pnpm type-check    # TypeScript, no emit
pnpm lint          # ESLint
```

Then **stage the change** and run the invariants script — it reads `git diff --cached`, so it is a silent
no-op on unstaged work:

```bash
git add <files>
node scripts/check-project-invariants.js
```

It enforces three things the other checks cannot see: **i18n locale parity** (en ⇄ de), **required-test
parity** (a new schema / store / utility without tests), and **enum wire literals** (an inline
`"system_admin"` where the schema enum should be referenced). All four commands also run in pre-commit,
so a failure here is a failure you would hit at commit time anyway.

---

## 4.2 Fix loop

On any failure, do not proceed and do not weaken the check. Repeat until clean:

1. Read the full error — stack trace, rule name, or invariant message.
2. Find the root cause; fix the cause, not the assertion.
3. Add whatever the gate says is missing:
   - **Missing required test** → cover the new Zod schema (accepts the documented shape, rejects wrong
     types / missing fields / bad enum values), store action (state transition via `getState()`), or
     `src/lib/` utility. Behaviour-based, per `.claude/rules/project/testing.md`.
   - **Missing i18n key** → add to **both** `en/<feature>.json` and `de/<feature>.json`. A new namespace
     also needs `i18n/types.d.ts` and `i18n/config.ts` (bundle en, add the de loader entry).
   - **Missing Zod schema** → API data must be parsed in the `queryFn`; no `response.data as SomeType`.
   - **Missing `data-testid`** → every new interactive element, for QA's E2E suite.
   - **Enum literal** → import the schema enum (`UserRoleSchema.enum.system_admin`), never the raw string.
4. Re-run all four commands.

Never `.skip` or delete a test to get green. Never bypass a hook.

---

## 4.3 Diff review

The checks above prove the code compiles, lints, and tests green. They do not prove it follows the review
checklist. Run the diff review as the last gate before the commit:

```bash
/code-review          # scope: this unit's staged diff
```

- **Critical** — blocks the unit; fix and re-run
- **High** — fix before the commit, unless the fix needs a coordinated change across many call-sites; then
  state that scope explicitly rather than applying it half-way (non-breaking rule, `.claude/rules/project/code-review.md`)
- **Medium / Low** — report them in STEP 7; do not silently defer

`/code-review` applies its own fix-on-encounter repairs inline (a missing `onError`, a missing i18n key)
per `.claude/rules/project/api-error-display.md` §4 — re-run `pnpm test:run` after it touches anything.

**Do not** run `/review-codebase` here. It audits all of `src/`, so its findings are mostly unrelated to
this unit and mixing them in makes the MR unreviewable.

---

## 4.4 Browser verification

Every gate so far is blind to rendering — none of them draw a page. Exercise the change in a real browser
per **`.claude/rules/project/browser-verification.md`**:

- Dev server at `http://localhost:5173`, driven with the Playwright MCP. Reuse a running server; the BE's
  `CORS_ORIGINS` allows only `:5173`, so a fallback to `:5174` fails every request.
- Walk the unit's **acceptance criteria** — not a general smoke test.
- Read `browser_console_messages`. An error there is a finding even when the UI looks right.
- Confirm no raw i18n key renders. A key missing from **both** locales passes every automated gate.
- **Name the role you signed in as.** For role-gated surfaces, also check a role that should _not_ see
  the control.

This adds no `.spec.ts` files — E2E specs stay QA's per `.claude/rules/project/testing.md`. If something cannot be
reached locally (no seed data, role unavailable), **say so** rather than reporting a pass.

---

## 4.5 Checklist

**Code**

- [ ] SOLID & DRY; no over-engineering; no orphaned imports or dead code left behind
- [ ] `pnpm type-check` and `pnpm lint` clean
- [ ] `/code-review` clean of Critical and High
- [ ] No magic strings; enum values referenced from their schema, route paths from `router/paths.ts`

**Testing**

- [ ] `pnpm test:run` green
- [ ] New Zod schemas, store actions, and `src/lib/` utilities tested, in `src/__tests__/` mirroring source
- [ ] Bug fixes have a regression test that fails without the fix
- [ ] No `.only`; no component tests; no Playwright specs

**i18n** (always active — `I18N-RULES.md` is present in this repo)

- [ ] No hardcoded user-visible strings; all via `t()`
- [ ] Keys in both `en/` and `de/`; new namespace registered in `types.d.ts` and `config.ts`
- [ ] Every BE error code the unit can hit has an `errors.<CODE>` key in both locales

**Frontend** (any new screen or component)

- [ ] Phase A contract verification passed at plan time and still holds
- [ ] Phase B design check done per new `.tsx`
- [ ] No invented response shapes, no stub masking a missing field
- [ ] shadcn/ui primitive used wherever one exists; any raw element carries a `NOTE:` comment with a reason

**API integration**

- [ ] Every response shape parsed through a Zod schema in `features/<name>/api/schema.ts`
- [ ] All calls via `api` from `@/lib/api` — no raw `fetch`/`axios` in components
- [ ] Query keys are constants beside their query function
- [ ] Every mutation has `onError`; every foreground query an `isError` branch
- [ ] Errors branch on `ApiError.code`, never on `.message`
- [ ] If the contract changed: `pnpm fetch:openapi`, then update feature schemas

**Security**

- [ ] Tokens live only in the Zustand auth store, whose `persist` middleware owns localStorage — nothing
      else reads or writes them. Never in the React Query cache, a URL param, or component state.
- [ ] The 401 → refresh → retry flow stays in the `@/lib/api` interceptor; feature code never implements it
- [ ] Role gates use the wire values from `project-rules.md`, referenced via the schema enum
- [ ] No secrets in `VITE_`-prefixed vars; base URL from `import.meta.env.VITE_API_URL`, never hardcoded
- [ ] No tokens or PII in `console.*`, error messages, or test fixtures

---

## 4.6 Before pushing

`pre-push` runs the full Vitest suite **and an OpenAPI drift check** against the dev API. If the backend
has changed since `openapi.json` was refreshed, the push is rejected:

```bash
pnpm fetch:openapi && corepack pnpm exec prettier --write openapi.json
git add openapi.json src/generated/api.ts
```

Drift is not a nuisance — it means the contract you planned against has moved. Re-check the Phase A
findings for this unit before committing the refresh.

---

## 4.7 Passed

Report the gates as observed, with real numbers from the real run — never a placeholder:

```
✅ Gates — PRD1042-XXXX
   tests            <X>/<X> passed          type-check  clean
   lint             clean                   invariants  clean
   /code-review     no Critical / High
   browser          <what you exercised>, signed in as <role>
```

**Next:** `execute-work.md` STEP 5 (commit).
