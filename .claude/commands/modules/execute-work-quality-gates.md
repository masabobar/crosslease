# Execute Work - Quality Gates Module

**Referenced by:** `execute-work-implementation.md` Step 3.6 & 3.7

---

## Validation Gate (Step 3.7)

**Triggered after:** Running all tests (Step 3.6)

---

### Validation Checks

**IF ANY check failed — unit tests, type-check, lint, coverage < 80%, i18n missing, Zod schema missing, or data-testid missing on new interactive elements:**

**Display:**

```
⚠️ VALIDATION FAILED for US-XXX

Issues:
- [List failed unit tests]
- [Coverage: XX% (need 80%+)]
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

3. **Add missing tests for coverage**
   - Write additional unit tests
   - Cover edge cases
   - Test error scenarios

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
   - Check coverage report

8. **REPEAT** until ALL checks pass AND coverage ≥ 80% AND i18n complete AND Zod schemas present AND data-testid added

---

### CRITICAL Rules

**Story is NOT complete until:**

- ✅ All unit tests passing (`pnpm test:run`)
- ✅ Type check clean (`pnpm type-check`)
- ✅ Lint clean (`pnpm lint`)
- ✅ Coverage ≥ 80%
- ✅ i18n translations present in both `en/<feature>.json` and `de/<feature>.json`
- ✅ All API data consumed through Zod schemas (`features/<name>/api/schema.ts`)
- ✅ New interactive elements have `data-testid` attributes
- ✅ SOLID & DRY principles followed

---

### Validation Passed

**IF ALL checks pass AND coverage OK AND i18n OK AND Zod schemas present:**

**Display:**

```
✅ VALIDATION PASSED for US-XXX

All checks completed:
✅ Unit Tests: {{X}}/{{X}} passed
✅ Type Check: clean
✅ Lint: clean
✅ Coverage: {{XX}}% (Target: 80%+)
✅ i18n: en + de translations present
✅ Zod schemas: API data validated at query layer
✅ data-testid: interactive elements annotated
✅ Code Quality: SOLID & DRY compliant
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

### Testing

- [ ] All unit tests passing (`pnpm test:run`)
- [ ] Type check clean (`pnpm type-check`)
- [ ] Lint clean (`pnpm lint`)
- [ ] Coverage ≥ 80%
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

### Coverage < 80%

**Common issues:**

- Missing branch coverage (if/else not both tested)
- Missing edge cases (null, undefined, empty arrays)
- Missing error handling tests
- Untested utility functions

**Resolution:**

1. Run `npm run test:coverage` for detailed report
2. Check uncovered lines in HTML report
3. Write tests for uncovered code
4. Focus on critical paths first
5. Re-run coverage check

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
