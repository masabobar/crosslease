# refinext-app

## API-first rule (MANDATORY before any FE implementation)

Before writing any FE code for a screen — whether from a design or a task description — read the corresponding API endpoint(s) in `refinext-api`:

- **Request fields:** every form field the design shows must map to an actual API field. Don't skip fields just because the design omits them (e.g. `password_confirm`).
- **Post-action navigation:** check whether the endpoint leaves the user authenticated or not. Success redirects must match that state — don't send an unauthenticated user to a protected route.
- **Error codes:** note what codes the endpoint can return and handle each one in the UI.

Check the route schema and service logic in `refinext-api` directly. Do this before touching any component or form.

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

---

## Docker (local dev)

The project has a multi-stage Dockerfile (development / builder / production). For local dev:

```bash
docker compose up
```

BuildKit must be enabled (`DOCKER_BUILDKIT=1`) for cache mounts to work.

See `refinext-app-notes.md` for full rationale on Docker and CI/CD decisions.

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

- `UserRole`: `system_admin` | `support_user` | `auditor` | `front_office` | `back_office_risk` | `leasing_company_user`
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

Commit message: single line, conventional commit format — `type: short description #TICKET`. No body, no newlines, no author attribution.

Every commit must end with either a Jira ticket (`#PRD1006-42`) or `#no-ticket` when there's no associated ticket.

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
