/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The path prefix every handler matches on, taken from the same env var the app calls.
 *
 * This was previously a literal wildcard prefix — an asterisk followed by `/api/v1` — on the
 * assumption that a leading asterisk matched any origin. It did not match reliably: `POST
 * /api/v1/auth/login` fell through to `onUnhandledRequest`, MSW performed the real request, and the
 * dev API answered 422 — which looked exactly like "login is broken".
 *
 * Deriving the prefix from `VITE_API_URL` is both simpler and correct in either configuration: the
 * value is `/api/v1` when the Vite dev proxy is in use (the normal setup, and same-origin, so a
 * relative pattern matches), and an absolute origin when the app is pointed straight at an API. The
 * handlers then match whatever the app actually calls, by construction, rather than by guess.
 */
export const API = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(
  /\/+$/,
  ""
)
