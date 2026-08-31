# Code Review Guide — Senior Frontend Standards

**Version:** 1.2
**Last Updated:** 2026-07-30
**Status:** Active

**Run `/code-review` before every commit and push on this project.**

Synthesis checklist for reviewing all frontend code changes in refinext-app. References existing domain rules for depth — this file is the review layer.

Complements `.claude/rules/project/code-quality.md` (SOLID & DRY), `.claude/rules/project/testing.md` (test matrix), `.claude/rules/project/security-and-auth.md` (RBAC), `.claude/rules/project/error-handling-and-logging.md` (error patterns).

> **⚠️ NON-BREAKING RULE — MANDATORY**
> Every suggestion made during a code review MUST NOT break existing functionality. Before proposing any change, verify it does not: remove or rename exports consumed elsewhere, alter component props or hook signatures in a backward-incompatible way, change runtime behavior that passing tests or the UI depend on, or introduce TypeScript errors in files not touched by the change. If a suggestion cannot be applied without a coordinated update across multiple call-sites, flag that scope explicitly rather than leaving it as a simple drop-in fix.

---

## 1. TypeScript

### 1.1 Strict Correctness

- [ ] No `any` — use `unknown` + narrowing or a proper type
- [ ] Exported functions have explicit return types; internal functions may infer
- [ ] `import type` for all type-only imports
- [ ] No constructor parameter property shorthand (`public x: T`) — declare fields separately (TS 6)
- [ ] Discriminated unions over optional fields when shape depends on state:

```ts
// ❌
type State = { loading: boolean; data?: User; error?: string }
// ✅
type State =
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: string }
```

- [ ] `satisfies` for object literals that must conform to a type but keep narrow inference
- [ ] `const` assertions on literal objects/arrays that must not widen
- [ ] Generic constraints are tight — avoid unbounded `<T>` when a union or interface applies

### 1.2 API Types

- [ ] Zero hand-written interfaces for API response shapes — always `z.infer<typeof Schema>`
- [ ] Zod `parse()` is called inside the React Query `queryFn`, not inside the component

---

## 2. React 19

### 2.1 Component Shape

- [ ] Functional components only; props typed inline — no `React.FC`, no class components
- [ ] No `forwardRef` — refs passed as plain props (`ref?: React.Ref<T>`)
- [ ] No `defaultProps` — use default parameter values
- [ ] One concept per component; if it scrolls to read, split it
- [ ] Default exports only for route-level page components; named exports everywhere else
- [ ] No barrel files (`index.ts` re-exports)

### 2.2 Hooks

- [ ] No `useMemo`, `useCallback`, `React.memo` — React Compiler handles memoization
- [ ] No `useEffect` for data fetching — use React Query
- [ ] No `useEffect` where a derived value, event handler, or React Query suffices
- [ ] `useActionState` for async form/button state (loading, error, result)
- [ ] `useOptimistic` for optimistic UI updates with rollback on error
- [ ] `use()` preferred over `useContext` for new code
- [ ] Custom hooks named `useXxx`; return only what callers need

### 2.3 JSX

- [ ] No `dangerouslySetInnerHTML` without explicit `DOMPurify` sanitization
- [ ] Keys are stable entity IDs — never array index for mutable lists
- [ ] Conditional rendering: `&&` for single branch, ternary for two, extracted component for complex
- [ ] Boolean props omit `={true}`: `<Button disabled />` not `<Button disabled={true} />`

---

## 3. State Management

- [ ] Server state (API data) → React Query only; never pushed into Zustand
- [ ] Client/UI state → Zustand; local ephemeral state → `useState`
- [ ] Query keys are typed constants defined alongside the query function — no inline strings
- [ ] `staleTime` is set intentionally — not left at the default for all queries
- [ ] Mutations call `queryClient.invalidateQueries` or use optimistic updates; no manual store writes for server data
- [ ] Zustand store slices are fully typed; no `any` in store shape

---

## 4. Forms

- [ ] React Hook Form + Zod resolver — no manual `onChange` state
- [ ] Zod schema defined outside the component, exported, reused for the API schema where shapes match
- [ ] `VALIDATION_ERROR` field detail mapped onto the form via `applyApiFieldErrors()` before the toast — every **other** error code has no `field` to map (the BE's `create_error_response()` carries none), so those correctly stay toast-only. See `api-error-display.md` §2.1
- [ ] Submit button is disabled while `isSubmitting` is true
- [ ] All form fields have `data-testid` attributes

---

## 5. API Integration

- [ ] All calls go through `api` from `@/lib/api` — no raw `fetch`/`axios` in components
- [ ] Each feature owns its query functions in `features/<name>/api/`
- [ ] `ApiError.code` used for programmatic error handling — never `.message` string matching
- [ ] Every request/response shape validated through Zod at the query layer
- [ ] 401 token-refresh interceptor in `@/lib/api` handles retries before components see the error
- [ ] **Every error the BE endpoint can return is handled and surfaced to the user — no silent failures.** A 4xx, 5xx, network error, or timeout MUST result in a visible toast (or inline error). A failed request where nothing happens in the UI is a bug. Handle specific codes first, then fall back to a generic toast. Full rule + fix procedure: **`.claude/rules/project/api-error-display.md`**

> **⚠️ FIX-ON-ENCOUNTER — MANDATORY**
> When reviewing code with `/code-review` or `/review-codebase`, or when modifying any file that contains API calls: if a mutation is missing `onError`, or a query is missing an `isError` branch — **fix it in the same pass.** Do not flag it for later. Apply the pattern below, look up the endpoint's error codes in `openapi.json`, and add the i18n keys.

```ts
// ✅ CORRECT — dynamic lookup: any BE error code is translated via errors.<CODE>,
// generic fallback covers unknown codes and non-ApiError throws.
// Adding a new error code only requires a new i18n key — no code change needed.
mutation.mutate(payload, {
  onError: err => {
    toast.error(
      err instanceof ApiError
        ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
        : t("errors.generic")
    )
  },
})

// ❌ SILENT FAILURE — fix immediately on encounter
mutation.mutate(payload)

// ❌ ALSO WRONG — switch per code; breaks every time a new code is added
// onError: (err) => {
//   if (err instanceof ApiError) {
//     switch (err.code) {
//       case 'CONFLICT_EMAIL_EXISTS': return toast.error(t('errors.CONFLICT_EMAIL_EXISTS'))
//       default: return toast.error(t('errors.generic'))
//     }
//   }
// }
```

---

## 6. i18n

- [ ] Zero hardcoded user-visible strings — all through `t()`
- [ ] New strings added to both `en/<feature>.json` and `de/<feature>.json`
- [ ] New namespace registered in `types.d.ts` and `config.ts`
- [ ] Error codes translated via `t(\`errors.${code}\`)`— never raw`error.message` in UI
- [ ] Translation keys are `camelCase`, nested by feature section

---

## 7. Security & RBAC

- [ ] New gated elements use the correct role wire values: `system_admin`, `support_user`, `auditor`, `bank_power_user`, `front_office`, `back_office`, `leasing_company_user` — no freehand strings
- [ ] No `console.log` / `console.warn` / `console.debug` (pre-commit blocks these)
- [ ] No sensitive data (tokens, PII) in component state beyond the minimum render lifetime
- [ ] Route/query params validated before use — no raw `params.id` passed to queries without guard
- [ ] LC Users never see Financing, Risk, Audit, KYC, or Approval Workflow modules

---

## 8. Performance & Code Splitting

- [ ] Route-level components lazy-loaded with `lazy()` + `<Suspense>`
- [ ] No synchronous top-level imports of heavy libraries only needed on one route
- [ ] Images have explicit `width`/`height` or `aspect-ratio` to prevent layout shifts
- [ ] Unbounded lists are paginated or virtualized

---

## 9. Testing

- [ ] Zod schemas tested: valid input parses; invalid input (wrong type, missing field, bad enum) throws
- [ ] Zustand store actions tested in isolation via `getState()` / direct action calls
- [ ] Pure utility functions in `src/lib/` have unit tests
- [ ] New Zod schemas, store actions, and `src/lib/` utilities have tests per `.claude/rules/project/testing.md` (behavior-based — no numeric coverage threshold)
- [ ] No `.only` focused tests (pre-commit blocks these)
- [ ] `data-testid` present on all new interactive elements

---

## 10. Code Structure & Style

- [ ] `PascalCase` components; `camelCase` functions/hooks/utility files; `SCREAMING_SNAKE_CASE` constants
- [ ] Boolean props/vars prefixed `is`, `has`, `can`, `should`
- [ ] No magic strings — route paths in `src/router/paths.ts`, query keys as constants
- [ ] Functions short enough to read without scrolling; deep nesting replaced with early returns
- [ ] No commented-out code; no `TODO`/`FIXME` without a Jira ticket reference

**Hardcoded values:**

- [ ] No magic numbers — every numeric literal with domain meaning is a named `SCREAMING_SNAKE_CASE` constant (`MAX_ITEMS_PER_PAGE`, `TOKEN_EXPIRY_MS`, `MIN_PASSWORD_LENGTH`)
- [ ] No hardcoded non-i18n strings (API base URLs, timeout values, config flags, pixel values used in logic) — use constants or `import.meta.env` vars
- [ ] No hardcoded enum-value strings — if an enum or const object exists in `src/lib/`, `src/types/`, or a feature's `api/schema.ts`, import and reference it; never repeat the raw string inline (`"system_admin"` → `UserRole.SYSTEM_ADMIN`, `"pending_approval"` → `UserStatusSchema.enum.pending_approval`)
- [ ] No hardcoded string literals in comparisons even when no constant exists yet — if a string is compared against (`=== "bank_tenant"`, `=== "active"`, `switch (type) { case "foo": }`) and no constant/enum covers it, extract one before moving on; inline string comparisons are a bug waiting to happen when the value changes
- [ ] Repeated Tailwind class strings across 3+ components extracted via `cva()` variants or a shared `cn()` utility constant

**Cross-file duplication (DRY gate):**

- [ ] No duplicate utility functions — search `src/lib/` before writing a new one; if a helper exists there, import it
- [ ] No duplicate custom hook logic — two components sharing identical `useState`/query/effect patterns → extract a shared `useXxx` hook in `src/hooks/` or `features/<name>/hooks/`
- [ ] No duplicate Zod schemas for the same shape — compose via `.extend()`, `.pick()`, `.omit()` from the canonical source schema rather than redefining fields
- [ ] No independently-defined TypeScript types for the same concept in two files — consolidate to one source and import
- [ ] Repeated JSX structure in 2+ files → extract a component (Rule of Three: third occurrence = mandatory extraction)

---

## 11. PR Checklist (paste into PR description)

- [ ] TypeScript: no `any`, explicit exported return types, `import type` used, Zod for API shapes
- [ ] React 19: no `forwardRef`, no manual memoization, no `useEffect` for fetching
- [ ] State: server state in React Query, client state in Zustand, no cross-contamination
- [ ] Forms: RHF + Zod, `VALIDATION_ERROR` field detail applied via `applyApiFieldErrors()`, submit gated on `isSubmitting`
- [ ] API: Zod `parse()` in `queryFn`, `ApiError.code` for error handling, no raw fetch, **every BE error code surfaced via toast / error state — no silent failures** (fix any missing `onError` or `isError` branch inline per `.claude/rules/project/api-error-display.md`)
- [ ] i18n: all strings via `t()`, both locales updated, namespace registered
- [ ] Security: role gates use correct wire values, no `console.*`, no unnecessary PII in state
- [ ] Tests: Zod schemas tested, store actions tested, utilities tested, `data-testid` present
- [ ] Style: naming conventions, no magic strings/numbers, enum values referenced from their source (never inline), no barrel files, no default exports (except pages), no cross-file duplicate logic/schemas/hooks/JSX
- [ ] UI components: shadcn/ui primitive used wherever one exists; third-party or raw HTML in its place carries a `NOTE:` inline comment with the reason; missing shadcn components installed via `npx shadcn@latest add` before falling back
- [ ] Pre-commit clean: no `console.*`, no `debugger`, no focused tests
- [ ] Non-breaking: no removed/renamed exports, no incompatible prop/hook signature changes, no behavior changes that break passing tests or existing UI flows

---

## 12. UI Components — shadcn/ui First (`src/components/ui/`)

**Principle: shadcn/ui is the default choice for every UI element. Any deviation requires an explicit inline note.**

Quick check during review: shadcn primitive used wherever one exists (`<Button>` not `<button>`, `<Select>` not `<select>`, `<Table>`/`<TableRow>`/`<TableCell>` not raw table tags); missing components installed via `npx shadcn@latest add <component>` before any fallback; every raw HTML element or third-party component in a shadcn slot carries an inline `{/* NOTE: ... */}` comment with the reason.

**Full checklist + component catalogue:** `.claude/rules/project/code-review-ui.md` (companion).

---

## Related

- `.claude/rules/project/code-review-ui.md` — full shadcn-first checklist + component catalogue (companion to §12)
- `.claude/rules/project/code-quality.md` — SOLID & DRY principles
- `.claude/rules/project/testing.md` — required-tests gate (schemas / stores / utilities)
- `.claude/rules/project/security-and-auth.md` — role wire values, RBAC guards, audit logging
- `.claude/rules/project/error-handling-and-logging.md` — error taxonomy, `ApiError.code` usage
- `.claude/rules/project/api-error-display.md` — exhaustive BE error handling rule + fix-on-encounter procedure (§5 enforcement)
- `.claude/rules/project/api-first.md` — contract verification before frontend work
- `.project-management/rules/project-rules.md` — role wire values, session rules, Four-Eyes constraints

---

**Status:** ✅ Active
