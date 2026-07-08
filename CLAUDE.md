# RefiNext Frontend

**Type:** FE-only — React 19 + TypeScript + Vite + Tailwind v4
**BE repo:** `../refinext-api/` (read-only reference — API source of truth)
**openapi.json:** `./openapi.json` (run `pnpm fetch:openapi` to refresh from dev API)
**Swagger (local):** `http://localhost:3530/api/docs`

---

## 📋 DOCUMENT HIERARCHY

**Read priority order:**

1. **Project Planning** (`.project-management/`)
   - `input/scope.md`, `input/backlog/phase-*.md`
   - `input/screens/screen-map.md`
   - `output/docs/technical-spec.md`
   - `output/phases/phase-N.md`

2. **Core Standards** (`CLAUDE.md` — this file)

3. **Specialized Rules** (`.claude/rules/`) — load by category

   **Always:**
   - `code-quality.md` — SOLID & DRY (MANDATORY)
   - `documentation.md` — English-only, file sizes, style
   - `permissions.md` — NEVER auto-modify settings.json (CRITICAL)
   - `testing.md` — test types, coverage
   - `git.md` — conventional commits, NO AI credits

   **Conditional:**
   - `api-first.md` — before any FE story: contract verification gate
   - `screen-driven-backlog.md` — one screen per story
   - `anonymization.md` — when generating docs from client input

4. **Project Rules** (`.project-management/rules/project-rules.md`) — ALWAYS read

**Conflicts:** Project rules > Core standards (this file) > Specialized rules.
Where a specialized rule contradicts this file's Code standards, **this file wins** — flag the drift instead of following the rule file.

---

## 🎯 COMMANDS

| Command                      | When to use                                 |
| ---------------------------- | ------------------------------------------- |
| `/execute-work story US-XXX` | Implement a specific story                  |
| `/execute-work phase N`      | Run all stories in a phase sequentially     |
| `/project-status`            | Full written status report                  |
| `/add-scope`                 | Add a new story to the backlog              |
| `/add-bug`                   | File a bug                                  |
| `/run-tests all`             | Run unit tests + type-check + lint manually |
| `/promote-requirement`       | Move a future story to an active phase      |
| `/resolve-questions`         | Answer open clarification questions         |

**Live status:** open `.project-management/output/progress/DASHBOARD.md`

---

## CRITICAL PRE-IMPLEMENTATION

**Before ANY code changes:**

1. **Read the technical spec** — `output/docs/technical-spec.md`
2. **Read existing code** — understand current patterns before modifying
3. **Plan (MANDATORY)** — `/execute-work` auto-enters plan mode; for manual work use TodoWrite
4. **API contract check** — read `../refinext-api/` source or `openapi.json` before touching any screen that calls the API (see API-first rule below)

---

## BEHAVIORAL GUIDELINES

### Think before coding

- State assumptions explicitly before implementing. If uncertain, ask — don't guess silently.
- If multiple valid interpretations exist, name them and ask which to pursue. Don't pick one arbitrarily.
- If a simpler approach exists, say so and push back. A junior dev implements what's asked; a senior asks if it's the right thing.
- If something is unclear, stop and name what's confusing. Clarifying questions come **before** implementation, not after mistakes.

### Simplicity first

- Minimum code that solves the problem. Nothing speculative.
- No features, flexibility, or configurability beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios — trust internal code and framework guarantees; only validate at system boundaries (user input, external APIs).
- A bug fix doesn't need surrounding cleanup. A one-shot operation doesn't need a helper.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical changes

- Touch only what the task requires. Don't improve adjacent code, comments, or formatting.
- Match existing style even if you'd do it differently.
- If you notice unrelated dead code or issues, **mention them** — don't fix them silently.
- When your changes make imports/variables/functions unused, remove those orphans. Don't remove pre-existing dead code unless asked.
- Every changed line should trace directly to the request.

### Verifiable goals

For multi-step tasks, open with a brief plan that names the check for each step:

```
1. [step] → verify: [how you'll confirm it worked]
2. [step] → verify: [how you'll confirm it worked]
```

This lets the loop close independently without constant clarification.

---

## ⚠️ BEFORE EVERY COMMIT — ASK FOR JIRA TICKET

**MANDATORY:** Before creating any git commit, ask the user for the Jira ticket number.

```
"What is the Jira ticket number for this commit? (or reply #no-ticket)"
```

Include in the commit message: `feat: description #PRD1042-XX`

**NEVER** create a commit without first asking.

---

## 📋 PLAN MODE (MANDATORY)

**Activates automatically** when running `/execute-work`.
**Activates manually** when user says "plan this" or "enter plan mode".

```
📋 [PLAN MODE ACTIVATED]

Step 1: READ ALL CONTEXT
✅ Technical spec
✅ Backlog story
✅ Core standards (CLAUDE.md)
✅ Project rules (project-rules.md)
✅ API contract (openapi.json or ../refinext-api/)

Step 2: CREATE DETAILED PLAN
🎯 Scope / Breakdown / Estimates / Dependencies / Risks

Step 3: WAIT FOR APPROVAL
✅ Proceed? [Yes/No/Revise]
```

Never start coding without plan approval.

---

## WORKFLOW

```
-1. SYNC → in refinext-app: git checkout develop && git pull origin develop, then create new branch (feat/*, fix/*, etc.)
    ALSO → in ../refinext-api: git pull origin develop
0. PLAN MODE → analyze, create plan, get approval
1. IMPLEMENT → code changes following standards below
2. TEST → pnpm test:run + pnpm type-check + pnpm lint
3. VALIDATE → new schemas/stores/utils tested, i18n keys added, Zod schemas present
4. ASK FOR JIRA TICKET → then commit (no AI credits)
5. UPDATE → DASHBOARD.md auto-updates
```

---

## QUALITY GATES — MASTER CHECKLIST

**Before marking ANY story complete:**

**Code:**

- [ ] SOLID & DRY principles followed
- [ ] No TypeScript/linting errors (`pnpm type-check`, `pnpm lint`)
- [ ] Follows project conventions (see Code Standards below)

**Testing:**

- [ ] All unit tests passing (`pnpm test:run`)
- [ ] New Zod schemas, store logic, and utilities have tests (behavior-based — see Testing section; no numeric coverage threshold)

**i18n:**

- [ ] No hardcoded user-visible strings — all through `t()`
- [ ] Keys added to both `en/<feature>.json` and `de/<feature>.json`
- [ ] New namespace registered in `types.d.ts` and `config.ts`

**API data:**

- [ ] All API responses validated through Zod schemas (`features/<name>/api/schema.ts`)
- [ ] No raw `response.data as SomeType`

**FE story gate:**

- [ ] Story scoped to one screen; title follows `ScreenName — Action` pattern
- [ ] API contract verified before implementation (see API-first rule)
- [ ] New interactive elements have `data-testid` attributes

**Security:**

- [ ] No secrets committed
- [ ] No sensitive data in `console.log`
- [ ] Role-based gating uses correct wire values from `project-rules.md`

---

## MUST NOT DO

❌ Over-engineering — no unrequested features
❌ Premature abstractions — three similar lines beats a helper
❌ `useEffect` for data fetching — use React Query
❌ `useMemo` / `useCallback` / `React.memo` — React Compiler handles this
❌ Plain TS interfaces for API data — always Zod + `z.infer<>`
❌ Default exports except page-level route components
❌ Barrel files (`index.ts` re-exports)
❌ `git add -A` or `git add .`
❌ AI attribution in commits

---

## API-first rule (MANDATORY before any FE implementation)

Before writing any FE code for a screen — whether from a design or a task description — read the corresponding API endpoint(s):

1. Check `openapi.json` (run `pnpm fetch:openapi` if stale)
2. For source-level detail (service logic, validation rules): read `../refinext-api/`

Verify:

- **Request fields:** every form field the design shows must map to an actual API field. Don't skip fields just because the design omits them (e.g. `password_confirm`).
- **Post-action navigation:** check whether the endpoint leaves the user authenticated. Success redirects must match that state — don't send an unauthenticated user to a protected route.
- **Error codes:** note what codes the endpoint can return and handle each one in the UI.

Do this before touching any component or form.

---

## Code standards

### TypeScript

- No `any` — use `unknown` + narrowing, or a proper type
- Always `import type` for type-only imports
- Explicit return types on exported functions; infer for internal/local ones
- Use discriminated unions over optional fields when shape depends on state:
  ```ts
  // wrong
  type State = { loading: boolean; data?: User; error?: string }
  // right
  type State =
    | { status: "loading" }
    | { status: "success"; data: User }
    | { status: "error"; error: string }
  ```
- TypeScript 6: no constructor parameter properties (`public x: T` shorthand) — declare fields separately

### React (v19 conventions)

- Functional components only — no class components
- Do not use `React.FC` — type props directly on the function:
  ```ts
  // wrong
  const Button: React.FC<Props> = ({ label }) => ...
  // right
  function Button({ label }: Props) { ... }
  ```
- No `defaultProps` — use default parameter values
- No `useEffect` for data fetching — use React Query
- Avoid `useEffect` in general — most cases have a better solution (derived state, event handlers, React Query)
- One concept per component — if it needs to scroll to read, split it
- Extract repeated JSX into a component after the second time, not the first

**React Compiler is enabled** — it handles memoization automatically:

- No `useMemo`, `useCallback`, or `React.memo` — the compiler inserts these where needed
- Write plain, readable code; don't optimize manually

**React 19 APIs:**

- **No `forwardRef`** — refs are now plain props in React 19:
  ```ts
  // wrong (old)
  const Input = forwardRef<HTMLInputElement, Props>((props, ref) => ...)
  // right (React 19)
  function Input({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) { ... }
  ```
- **`useActionState`** — for tracking async action state (loading, error, result) tied to a form or button
- **`useOptimistic`** — for optimistic UI updates; show the expected result immediately, roll back on error
- **`use()`** — for reading context or unwrapping promises inside render; preferred over `useContext` for new code

### Naming

- Components: `PascalCase`
- Functions, variables, hooks: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types and interfaces: `PascalCase`, no `I` prefix
- Files: `camelCase` for utilities and hooks, `PascalCase` for components
- Boolean props and variables: prefix with `is`, `has`, `can`, `should`

### Functions

- One responsibility per function — if it does two things, split it
- Prefer pure functions — same input, same output, no side effects
- Keep functions short enough to read without scrolling
- Avoid deeply nested logic — early returns over nested `if/else`

### State

- Server state (API data) → React Query
- Client state (UI, auth tokens) → Zustand
- Local ephemeral state → `useState`
- Never put server data into Zustand

### Data fetching

- All API calls go through `api` from `@/lib/api`
- Each feature owns its query functions in `features/<name>/api/`
- Zod schema + `parse()` at the query function level — never trust raw API data
- Query keys are constants defined alongside the query function, not inline strings

### Forms

- React Hook Form + Zod resolver for all forms — no manual `onChange` state
- Zod schema defined separately from the component and reused for the API schema where shapes match

### Exports

- Named exports everywhere — no default exports except route-level page components
- No barrel files (`index.ts` that re-exports) — import directly from the source file

### Error handling

- Use `ApiError.code` for programmatic handling — never match on `message` strings
- Do not swallow errors silently — either handle them or let them propagate

### Types and interfaces

- **Global shared types** → `src/types/` (e.g. `src/types/api.ts` for API envelope types)
- **Feature-specific types** → `src/features/<name>/types.ts`
- **API response types** → never written by hand; always derived from the Zod schema via `z.infer<typeof Schema>` in `src/features/<name>/api/schema.ts`
- No types co-located inside component files unless they are props for that specific component

### Routing (React Router v7)

- Route config in `src/router/index.tsx` using `createBrowserRouter` — no file-based routing
- All route path strings in `src/router/paths.ts` as `PATHS` constants — never hardcoded inline
- Default export for page-level route components (React Router convention) — named exports for everything else
- Code-split routes with `lazy()` + `<Suspense>`:
  ```ts
  const DashboardPage = lazy(
    () => import("@/features/dashboard/components/DashboardPage")
  )
  ```
- **No `loader` functions** — use React Query for data fetching instead; loaders and React Query don't mix cleanly in a SPA setup
- **No `action` functions** — use React Hook Form + API calls directly
- Use `useNavigate` for programmatic navigation, `<Link>` for declarative links
- Use `useParams`, `useSearchParams` for reading route/query params — not `window.location`

### Constants

- No magic strings — define constants for route paths, query keys, error codes
- Route paths in `src/router/paths.ts`
- Query keys as const objects alongside their query functions

---

## First-time setup

```bash
cp .env.example .env
# then fill in VITE_API_URL in .env
pnpm install
```

**GitLab CI variables** (Settings > CI/CD > Variables) — `CI_REGISTRY_*` are predefined by GitLab automatically. The ones that need manual setup:

- `SSH_PRIVATE_KEY` — deploy key for the server (already added)
- `VITE_API_URL` — backend URL for the develop environment (still needed)

---

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # type-check + build for production
pnpm preview      # preview production build locally
pnpm lint         # run ESLint
pnpm type-check   # TypeScript check without emitting
pnpm test         # run Vitest in watch mode
pnpm test:run     # run Vitest once (used in CI)
pnpm fetch:openapi  # refresh openapi.json from dev API + regenerate src/generated/api.ts
```

## Project structure

```
src/
  __tests__/        # all unit tests (mirrors source tree)
  components/ui/    # shared UI primitives (Button, etc.)
  features/         # one folder per feature (auth, dashboard, ...)
  hooks/            # shared custom hooks
  store/            # Zustand stores
  router/           # React Router config + route path constants
  lib/              # utilities (cn, api client, etc.)
  types/            # global shared TypeScript types
  i18n/             # i18next config + locales/{en,de}/<feature>.json
```

Feature folders follow this internal structure:

```
features/example/
  api/              # fetch functions + Zod schemas
  components/       # feature-specific components
  hooks/            # feature-specific hooks
  types.ts          # feature-specific types and interfaces
```

---

## Path alias

`@/` maps to `src/`. Use it for all imports — no relative `../../` paths.

```ts
import { cn } from "@/lib/utils"
```

---

## Key conventions

**API data — always use Zod, not plain interfaces**
TypeScript types disappear at runtime. Use Zod schemas for anything that crosses a network boundary and derive the TS type from the schema:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

Parse inside the React Query `queryFn` so bad data throws before it reaches the UI.

**No `any`**
`@typescript-eslint/no-explicit-any` is set to error. Use `unknown` + narrowing instead.

**Type-only imports**
Use `import type` for imports that are only used as types:

```ts
import type { User } from "@/features/users/api/schema"
```

**No `var`, always `const`**
`no-var` and `prefer-const` are both enforced.

---

## Responsive design

This app is primarily used on desktop. Responsiveness is **not a priority** — do not spend time perfecting mobile layouts. That said, components should be semi-responsive: avoid fixed pixel widths that would break obviously on smaller viewports, use Tailwind's responsive prefixes where it costs nothing, but do not add breakpoint complexity just for mobile.

---

## UI components

Components in `src/components/ui/` are built with:

- **BaseUI** (`@base-ui/react`) — headless primitives
- **CVA** (class-variance-authority) — variant management
- **Tailwind CSS** — styling
- **`cn()`** — class merging (`clsx` + `tailwind-merge`)

`src/components/ui/` is excluded from ESLint's react-refresh rule by design.

### shadcn/ui — MANDATORY

**Always use shadcn/ui components from `src/components/ui/`. Never use raw HTML elements or third-party UI components when a shadcn equivalent exists.**

- Use `<Button>` not `<button>`, `<Input>` not `<input>`, `<Select>` not `<select>`, etc.
- If the needed component does not exist yet, install it first: `npx shadcn@latest add <component>`
- **When encountering existing code that uses raw HTML or third-party components instead of shadcn equivalents — convert them to the shadcn version as part of the change.** Do not leave non-shadcn UI code in place.
- When a raw element is genuinely necessary (no shadcn equivalent, or a specific accessibility constraint), add an inline comment: `{/* NOTE: raw <element> — reason */}`

See `.claude/rules/code-review-ui.md` for the full shadcn-first checklist.

---

## Docker (local dev)

The project has a multi-stage Dockerfile (development / builder / production). For local dev:

```bash
docker compose up
```

BuildKit must be enabled (`DOCKER_BUILDKIT=1`) for cache mounts to work.

See `.project-management/docs/refinext-app-notes.md` for full rationale on Docker and CI/CD decisions.

---

## Environment variables

Vite exposes env vars prefixed with `VITE_` to the client. Key ones:

- `VITE_API_URL` — backend base URL
- `VITE_APP_STAGE` — environment name (dev / staging / production)

---

## API integration

**Base URL:** `http://localhost:3530/api/v1` (local), `https://api.refinext-dev.projects.holycode.com/api/v1` (dev)

**Swagger docs:** `http://localhost:3530/api/docs` (when BE is running)

### Authentication

JWT Bearer tokens. Send the access token in every authenticated request:

```
Authorization: Bearer <access_token>
```

- Access token expires in 30 minutes
- Refresh token expires in 7 days
- On 401, use the refresh token to get a new access token, then retry the request

### Response envelope

Every response — success or error — is wrapped. Never access data directly from `response.json()` without accounting for this.

**Success:**

```json
{
  "code": "USER_REGISTERED",
  "message": "Human-readable message",
  "data": { ... }
}
```

**Error:**

```json
{
  "detail": {
    "code": "INVALID_CREDENTIALS",
    "message": "Human-readable message",
    "field": "email",
    "errors": [
      { "field": "email", "message": "Invalid email", "input": "bad-value" }
    ]
  }
}
```

Use `detail.code` for programmatic error handling — not `message` (message is for display only).

### Error codes (reference)

Auth / user: `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `EMAIL_ALREADY_EXISTS`, `USER_NOT_FOUND`, `ACCOUNT_DISABLED`, `INVALID_TOKEN`

OTP: `INVALID_OTP`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS`

Rate limiting: `RATE_LIMIT_EXCEEDED`

Generic: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `BAD_REQUEST`

### Known data shapes

**User** (derive Zod schema from this when building the feature):

```ts
{
  id: string // UUID
  user_id: string // "USR-00001"
  username: string
  display_name: string
  email: string
  role: UserRole | null
  user_type: UserType | null
  tenant_scope: string | null
  status: UserStatus
  access_valid_from: string | null // ISO datetime
  access_valid_until: string | null // ISO datetime
  last_login: string | null // ISO datetime
  created_at: string // ISO datetime
  updated_at: string // ISO datetime
}
```

**Enums:**

- `UserRole`: `system_admin` | `support_user` | `auditor` | `front_office` | `back_office` | `leasing_company_user`
- `UserType`: `platform` | `bank_tenant` | `leasing_company`
- `UserStatus`: `active` | `invited` | `suspended` | `expired` | `deactivated`

---

## Testing

### Stack

- **Vitest** — unit tests; all test files under `src/__tests__/`
- **Playwright** — E2E tests; owned by QA, lives under `src/e2e/`

Developers write unit tests only. Do not add Playwright specs — E2E is QA's responsibility.

No component testing (`@testing-library/react`). Logic is covered by unit tests; UI flows are covered by QA's E2E suite.

---

### Test file location

All unit tests live in `src/__tests__/`, mirroring the source tree:

```
src/__tests__/
  features/
    auth/
      api/          # tests for src/features/auth/api/
  lib/              # tests for src/lib/
  store/            # tests for src/store/
```

Use `@/` alias imports in test files — never relative paths pointing back into `src/`:

```ts
// correct
import { useAuthStore } from "@/store/authStore"

// wrong — breaks when tests move
import { useAuthStore } from "./authStore"
```

---

### What we test and how

#### 1. Zod schemas (API contracts)

Every API response must have a Zod schema. No plain TypeScript interfaces for external/network data — TypeScript types disappear at runtime and the BE can send anything.

Rule:

- **External data** (API responses) — Zod schema + `parse()` at the fetch layer
- **Internal data** (Zustand store, component props, local state) — plain TS interfaces are fine

Test: assert the schema rejects wrong shapes (wrong types, missing fields, extra-narrow values).

```ts
// src/__tests__/features/users/api/schema.test.ts
it("rejects years as string", () => {
  expect(() =>
    UserSchema.parse({ firstName: "Ana", lastName: "B", years: "30" })
  ).toThrow()
})
```

Wire into React Query: parse inside the `queryFn` so bad data throws before it reaches the UI.

#### 2. Utility functions

Pure functions in `src/lib/` get unit tests.

#### 3. Zustand store logic

Test state transitions and actions in isolation — no component needed.

```ts
it("clears tokens on logout", () => {
  useAuthStore.getState().setTokens("acc", "ref")
  useAuthStore.getState().clearTokens()
  expect(useAuthStore.getState().accessToken).toBeNull()
})
```

---

### What we skip

- Component tests (`@testing-library/react`) — not used
- Snapshot tests — noisy, catch the wrong things
- Coverage percentage targets — test behavior, not lines
- Testing TypeScript types — the compiler handles that
- E2E / Playwright specs — QA's responsibility

---

## Internationalisation (i18n)

The app uses `react-i18next`. English is bundled at startup; German is lazy-loaded on first language switch.

**When adding a new string:**

- Put it in the appropriate namespace JSON under `src/i18n/locales/en/`
- Add the matching key to `src/i18n/locales/de/` (even if the value is the same for now — keeps the files in sync)
- Never hardcode user-visible strings in components — always go through `t()`

**When adding a new feature:**

1. Create `src/i18n/locales/en/<feature>.json` and `src/i18n/locales/de/<feature>.json`
2. Add the namespace to `CustomTypeOptions` in `src/i18n/types.d.ts`:
   ```ts
   resources: {
     common: typeof enCommon
     auth: typeof enAuth // ← add here
   }
   ```
3. Bundle the English namespace in `config.ts` under `resources.en`
4. Add a German loader entry to `languageLoaders` in `config.ts`:
   ```ts
   de: async () => {
     const [common, auth] = await Promise.all([
       import('./locales/de/common.json'),
       import('./locales/de/auth.json'),  // ← add here
     ])
     i18n.addResourceBundle('de', 'common', common.default)
     i18n.addResourceBundle('de', 'auth', auth.default)  // ← and here
   },
   ```

**Language switching** — call `changeLanguage(lang)` exported from `src/i18n/config.ts`. A future Zustand language store should call this and persist the choice to `localStorage`.

---

## Git commits

Stage only the changed files explicitly — no `git add -A` or `git add .`.

Commit message: conventional commit format — header `type: short description #TICKET` (single line, max 150 chars). A body is optional and only used to explain WHY or cite user-story references per `.claude/rules/git.md` (canonical commit rules). **No AI attribution** (`Co-Authored-By: Claude` or similar lines are forbidden).

Every commit must end with either a Jira ticket (`#PRD1006-42`) or `#no-ticket` when there is no associated ticket.

Types: `feat`, `fix`, `chore`, `refactor`, `ci`, `docs`, `test`, `style`, `perf`, `build`, `revert`.

Examples:

- `feat: add lease table #PRD1006-42`
- `fix: correct token refresh logic #PRD1006-7`
- `chore: update dependencies #no-ticket`

### Enforcement pipeline

**pre-commit** (every commit):

- `lint-staged` — ESLint (`--max-warnings=0`) + Prettier on staged `.ts`/`.tsx` files; Prettier on staged `.json`/`.md`
- `scripts/check-forbidden-code.js` — blocks `console.log/warn/debug`, `debugger`, and focused tests (`.only`) in non-test files
- `type-check` — full TypeScript compilation check

**commit-msg:** commitlint — enforces conventional commit format and Jira ticket/`#no-ticket`

**pre-push** (before pushing):

- `test:run` — full Vitest suite

---

## Related docs

- `.project-management/rules/project-rules.md` — domain rules, roles, session rules, API conventions
- `.project-management/rules/I18N-RULES.md` — i18n completion checklist
- `.claude/rules/` — coding, testing, git, screen-driven backlog rules
- `.project-management/output/progress/DASHBOARD.md` — live project status
