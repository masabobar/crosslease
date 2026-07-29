# Execute Work - Quality Gates Module

**Referenced by:** `execute-work-implementation.md` Step 3.6 & 3.7

---

## Validation Gate (Step 3.7)

**Triggered after:** Running all tests (Step 3.6)

---

### Validation Checks

**IF ANY check failed — unit tests, type-check, lint, required tests missing (new schema / store / utility without tests), i18n missing, Zod schema missing, or data-testid missing on new interactive elements:**

**Display:**

```
⚠️ VALIDATION FAILED for US-XXX

Issues:
- [List failed unit tests]
- [Missing tests: new Zod schema / store action / utility without unit tests]
- [Type check errors: ...]
- [Lint errors: ...]
- [Missing i18n translations: en/<feature>.json or de/<feature>.json]
- [Missing Zod schema: API data consumed without schema in features/<name>/api/schema.ts]
- [Missing data-testid: interactive element added without data-testid attribute]

🔧 Fixing issues...
```

---

### Fix Loop

**Execute these steps until validation passes:**

1. **Analyze test failures**
   - Read error messages
   - Identify root cause
   - Check related code

2. **Fix bugs in code**
   - Update implementation
   - Follow SOLID & DRY principles
   - Test locally

3. **Add missing required tests**
   - Every new Zod schema, store action, and `src/lib/` utility gets unit tests
   - Cover edge cases and error scenarios (behavior-based per `.claude/rules/testing.md`)

4. **Add missing i18n translations** (I18N-RULES.md is always active for this project)
   - Find hardcoded text
   - Add translation keys
   - Update both `en/<feature>.json` and `de/<feature>.json`

5. **Add missing Zod schemas** (if new API data consumed)
   - Check `features/<name>/api/schema.ts` exists with Zod schema for every API response shape
   - No raw `response.data as SomeType` — always parse through Zod

6. **Add missing data-testid attributes** (if new interactive elements added)
   - Buttons, form inputs, modals, and key interactive elements must have `data-testid`

7. **Re-run all checks**
   - `pnpm test:run` — unit tests
   - `pnpm type-check` — TypeScript
   - `pnpm lint` — ESLint

8. **REPEAT** until ALL checks pass AND required tests present AND i18n complete AND Zod schemas present AND data-testid added

---

### CRITICAL Rules

**Story is NOT complete until:**

- ✅ All unit tests passing (`pnpm test:run`)
- ✅ Type check clean (`pnpm type-check`)
- ✅ Lint clean (`pnpm lint`)
- ✅ New Zod schemas, store logic, and utilities have tests
- ✅ i18n translations present in both `en/<feature>.json` and `de/<feature>.json`
- ✅ All API data consumed through Zod schemas (`features/<name>/api/schema.ts`)
- ✅ New interactive elements have `data-testid` attributes
- ✅ SOLID & DRY principles followed
- ✅ `/code-review` run on the story diff — no Critical or High findings outstanding

---

### Diff Review (after the mechanical checks pass)

The checks above are mechanical — they prove the code compiles, lints, and tests green. They do not
prove it follows the review checklist. Run the diff review as the last gate before the commit:

```bash
/code-review          # scope: the story's staged diff
```

Treat its findings as part of this gate:

- **Critical** — blocks the story; fix and re-run
- **High** — fix before the commit, unless the fix needs a coordinated multi-call-site change; then
  state the scope rather than applying it half-way (non-breaking rule, `.claude/rules/code-review.md`)
- **Medium / Low** — record in the story progress file; do not silently defer

`/code-review` applies its own fix-on-encounter fixes inline (missing `onError`, missing i18n keys) per
`.claude/rules/api-error-display.md` §4 — re-run `pnpm test:run` after it touches anything.

**Do not** run `/review-codebase` here. It audits all of `src/`, so its findings are mostly unrelated to
this story and mixing them into the story diff makes the MR unreviewable. Save it for the
per-feature run when the feature lands.

---

### Browser Verification (last gate before handoff)

Every gate above is blind to rendering — none of them draw a page. Before the story is complete, exercise
the change in a real browser per **`.claude/rules/browser-verification.md`**:

- Dev server at `http://localhost:5173`, driven with the Playwright MCP
- Walk the story's **acceptance criteria**, not a general smoke test
- Read the browser console — an error there is a finding even when the UI looks correct
- Check no raw i18n key is rendered (a key missing from **both** locales passes every automated gate)
- **Name the role you signed in as**, and for role-gated screens check a role that should _not_ see the control

This adds no `.spec.ts` files — E2E specs remain QA's per `.claude/rules/testing.md`.

Report what you exercised and observed. If something could not be reached locally (no test data, role
unavailable), say so explicitly — never report a pass you did not observe.

---

### Validation Passed

**IF ALL checks pass AND required tests present AND i18n OK AND Zod schemas present:**

**Display:**

```
✅ VALIDATION PASSED for US-XXX

All checks completed:
✅ Unit Tests: {{X}}/{{X}} passed
✅ Type Check: clean
✅ Lint: clean
✅ Required Tests: new schemas / stores / utils covered
✅ i18n: en + de translations present
✅ Zod schemas: API data validated at query layer
✅ data-testid: interactive elements annotated
✅ Code Quality: SOLID & DRY compliant
✅ Code Review: /code-review clean — no Critical/High findings
```

**Mark "Run all tests" todo as completed**

**Proceed to:** Git commit (Step 3.8)

---

## Quality Gates Checklist

**Before marking story complete:**

### Code Quality

- [ ] SOLID & DRY principles followed
- [ ] No TypeScript/linting errors
- [ ] Follows project conventions
- [ ] No over-engineering
- [ ] No unused code
- [ ] `/code-review` run on the diff — no Critical or High findings

### Testing

- [ ] All unit tests passing (`pnpm test:run`)
- [ ] Type check clean (`pnpm type-check`)
- [ ] Lint clean (`pnpm lint`)
- [ ] New Zod schemas, store actions, and utilities tested
- [ ] Edge cases covered
- [ ] Error scenarios tested (API error codes from `detail.code`, 401 redirect, empty states)

### i18n (Conditional - if I18N-RULES.md exists)

- [ ] No hardcoded user-facing text
- [ ] All text uses translation keys
- [ ] Translation files updated for all languages
- [ ] Keys follow naming convention

### Documentation

- [ ] Tech spec consulted
- [ ] README updated (if user-facing changes)
- [ ] Comments added for complex logic

### Frontend (Web/Mobile) Gate (Conditional — only if story is a frontend story)

Refs: `.claude/rules/api-first.md`, `.claude/rules/screen-driven-backlog.md`

- [ ] Story scoped to one screen (or wizard with all steps enumerated)
- [ ] Story title follows `Screen — Action` pattern
- [ ] **API Endpoints Used** table present (method + path + purpose + doc reference)
- [ ] Phase A contract verification ✅ — every UI input maps to request schema, every UI output maps to response shape, error states distinguishable, auth matches
- [ ] If gaps were found at plan time: backend story/bug filed, frontend resumed only after gap closed
- [ ] No invented response shapes, no stubs masking missing fields

### API Integration Gate (Conditional — only if new API data consumed)

- [ ] New API response shapes have Zod schemas in `features/<name>/api/schema.ts`
- [ ] No raw `response.data as SomeType` — always parse through Zod
- [ ] If OpenAPI schema changed: run `pnpm fetch:openapi` to regenerate `src/generated/api.ts`, then update feature schemas accordingly
- [ ] API errors handled by branching on `detail.code`, not `detail.message`

### Security Gate (FE-specific)

- [ ] Bearer token not stored in localStorage — handled by Axios interceptor only
- [ ] No sensitive data (tokens, PII) logged to console in production paths
- [ ] Role-based UI gating uses the correct role value from `project-rules.md` wire format
- [ ] 401 response from API triggers session clear + redirect to login (via Axios interceptor)
- [ ] No hardcoded API base URLs — uses env var (`VITE_API_BASE_URL`)

---

## Error Handling Strategies

### Test Failures

**Common issues:**

- **Import errors:** Check file paths, ensure modules exist
- **Type errors:** Verify TypeScript types, check interfaces
- **Assertion failures:** Review expected vs actual, update logic
- **Timeout errors:** Increase timeout, optimize code, check async/await

**Resolution:**

1. Read full error stack trace
2. Locate failing test and code
3. Fix root cause
4. Re-run specific test
5. Run full suite when fixed

---

### Missing Required Tests

**Common issues:**

- New Zod schema without rejection tests (wrong types, missing fields, bad enum values)
- New store action without a state-transition test
- New `src/lib/` utility without unit tests
- Missing edge cases (null, undefined, empty arrays)

**Resolution:**

1. Diff the change: list every new schema / store action / utility
2. Write behavior-based tests for each per `.claude/rules/testing.md`
3. Focus on critical paths and error scenarios first
4. Re-run `pnpm test:run`

---

### Missing i18n

**Common issues:**

- Hardcoded strings in JSX: `<h1>Welcome</h1>`
- Hardcoded strings in error messages
- Missing translation keys in JSON files
- Keys not synced across languages

**Resolution:**

1. Search for hardcoded text: `grep -r "\"[A-Z]" src/`
2. Replace with `{t('key')}`
3. Add key to all language files
4. Follow naming convention: `section.subsection.key`
5. Verify all languages have the key

---

## Next Step

**After validation passes:**

- Return to `execute-work-implementation.md` Step 3.8 (Git Commit)
