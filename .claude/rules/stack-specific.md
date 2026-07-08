# Stack-Specific Guidelines — React 19 + Vite SPA

**Version:** 2.0
**Last Updated:** 2026-07-05
**Status:** Active

Quick-reference patterns for this repo's actual stack. **CLAUDE.md §Code standards is canonical** — this file supplements it; where they ever disagree, CLAUDE.md wins.

---

## The Stack

| Concern      | Choice                                                         |
| ------------ | -------------------------------------------------------------- |
| UI           | React 19 (React Compiler enabled) + TypeScript 6               |
| Build        | Vite                                                           |
| Styling      | Tailwind CSS v4 + shadcn/ui (BaseUI primitives + CVA + `cn()`) |
| Server state | React Query                                                    |
| Client state | Zustand                                                        |
| Forms        | React Hook Form + Zod resolver                                 |
| Validation   | Zod (all network-boundary data)                                |
| i18n         | react-i18next (en bundled, de lazy-loaded)                     |
| Routing      | React Router v7, `createBrowserRouter` config in `src/router/` |

---

## Routing (React Router v7)

- Route config lives in `src/router/index.tsx`; all path strings are `PATHS` constants in `src/router/paths.ts` — never inline.
- Code-split routes with `lazy()` + `<Suspense>`.
- **No `loader` / `action` functions** — data fetching goes through React Query; submissions through RHF + API calls. Loaders and React Query don't mix cleanly in a SPA.
- `useNavigate` for programmatic navigation, `<Link>` for declarative — never `window.location`.
- `useParams` / `useSearchParams` for route state — validate before use.

## Data Fetching

- All calls through `api` from `@/lib/api` — no raw `fetch` / `axios` in components. The client handles the response envelope and the 401 → refresh → retry flow centrally.
- Each feature owns its query functions in `features/<name>/api/`; Zod `parse()` inside the `queryFn` so bad data throws before reaching the UI.
- Query keys are typed constants defined alongside the query function — no inline strings.
- Set `staleTime` intentionally; mutations invalidate via `queryClient.invalidateQueries` or use `useOptimistic`.
- Never copy server data into Zustand.

## Performance

- **React Compiler handles memoization — no `useMemo`, `useCallback`, or `React.memo`.** Write plain code.
- Lazy-load route-level components; no synchronous top-level imports of heavy libraries needed on one route only.
- Paginate or virtualize unbounded lists; images get explicit dimensions to avoid layout shift.
- Desktop-first: keep components semi-responsive, but do not add breakpoint complexity for mobile (see CLAUDE.md §Responsive design).

## Environment Variables

- Only `VITE_`-prefixed vars are exposed to the client — never put secrets in them (see `.claude/rules/security-and-auth.md` §5).
- Read via `import.meta.env`. Key vars: `VITE_API_URL`, `VITE_APP_STAGE`. New vars go into `.env.example`.

## Forms

- React Hook Form + `zodResolver`; schema defined outside the component and reused for the API schema where shapes match.
- Server-side field errors are shown via the standard error-display pattern — no manual `onChange` state, no error-code-driven `setError` wiring (see `.claude/rules/error-handling-and-logging.md` §2).

---

## Related

- CLAUDE.md §Code standards — canonical conventions (TypeScript, React 19, naming, exports)
- `.claude/rules/api-error-display.md` — mutation/query error coverage
- `.claude/rules/security-and-auth.md` — token handling, RBAC gating, env-var safety
- `.claude/rules/enums-and-constants.md` — wire format for enum-like values

---

**Status:** ✅ Active
