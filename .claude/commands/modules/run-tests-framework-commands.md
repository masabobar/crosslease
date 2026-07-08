# Run Tests — Framework Commands

Companion to `run-tests-execution.md`. Verbatim invocation reference for the tools used in this project (Vitest, TypeScript, ESLint, Playwright). Keeps the parent module focused on flow + scope; this module is a lookup table.

> **This project uses Vitest for unit tests only.** Jest is not used. Playwright E2E specs are owned by QA — do not add or run them.

---

## Vitest (unit tests — developer-owned)

```bash
pnpm test                            # watch mode (development)
pnpm test:run                        # run once (CI / pre-commit)
pnpm test:run path/to/file.test.ts   # specific file
pnpm test:run -t "description"       # filter by test name pattern
pnpm test:run --reporter=verbose     # verbose output
pnpm test:run --bail 1               # stop on first failure
```

> No coverage tooling is installed (`--coverage` would error on missing `@vitest/coverage-v8`) — deliberate, per `.claude/rules/testing.md`: we test behavior, not line percentages.

**Test file location:** `src/__tests__/`, mirroring source tree.
**Import style:** use `@/` aliases, never relative `./` paths into `src/`.

---

## TypeScript type check

```bash
pnpm type-check                      # tsc -b --noEmit (no output, just errors)
```

Run this after:

- Modifying a Zod schema
- Changing a component's props interface
- Updating a Zustand store shape
- Regenerating `src/generated/api.ts` from OpenAPI

---

## ESLint

```bash
pnpm lint                            # check whole project
pnpm lint --fix                      # auto-fix fixable issues (use carefully)
```

---

## OpenAPI code generation

```bash
pnpm fetch:openapi    # curl latest openapi.json from dev API + regenerate src/generated/api.ts
pnpm generate:api     # regenerate from existing openapi.json (no fetch)
```

Run `pnpm fetch:openapi` when the backend API contract changes.

---

## Playwright (E2E — QA-owned, reference only)

> **Do not add, modify, or run these specs.** Listed for reference if QA instructions are needed.

```bash
pnpm e2e                                                # run all E2E specs
pnpm e2e:ui                                             # Playwright UI mode
pnpm e2e:headed                                         # with browser visible
pnpm e2e:report                                         # open HTML report
```

Config: `src/e2e/playwright.config.ts`

---

## Quick Reference

| Goal                       | Command                                         |
| -------------------------- | ----------------------------------------------- |
| Unit tests (watch)         | `pnpm test`                                     |
| Unit tests (one-shot)      | `pnpm test:run`                                 |
| Specific file              | `pnpm test:run <path>`                          |
| Filter by name             | `pnpm test:run -t "pattern"`                    |
| TypeScript check           | `pnpm type-check`                               |
| Lint                       | `pnpm lint`                                     |
| All checks (CI equivalent) | `pnpm type-check && pnpm lint && pnpm test:run` |

---

**Version:** 3.1.0 (FE adaptation — Jest removed, type-check + lint added)
**Updated:** 2026-06-02
**Parent:** `run-tests-execution.md`
