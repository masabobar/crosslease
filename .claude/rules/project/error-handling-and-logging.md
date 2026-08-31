# Error Handling & Logging (Frontend)

**Version:** 2.2
**Last Updated:** 2026-08-21
**Status:** Active

**MANDATORY: Every API failure is surfaced to the user. Programmatic handling uses `ApiError.code` — never message strings. Display goes through `@/lib/apiErrorMessage`, never a hand-rolled lookup. Errors are never silently swallowed. No `console.*`, PII, or tokens in shipped code.**

> **FE-only repo.** The backend error taxonomy, status-code mapping, and server logging rules live in `../refinext-api/`. This file covers how the frontend consumes and displays those errors.

---

## 1. The Canonical Envelope (what the API actually returns)

**Success:**

```json
{ "code": "USER_REGISTERED", "message": "Human-readable message", "data": { ... } }
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

`@/lib/api` unwraps this and throws `ApiError` with `.code` populated from `detail.code`. **Use `.code` for all programmatic handling — `message` is display-only and not a stable contract.** Known codes are listed in CLAUDE.md §API integration.

## 2. Display Pattern — One Shared Helper, No Switch

Use `resolveApiErrorMessage` / `showApiError` from `@/lib/apiErrorMessage`. Do not re-implement the
ternary inline — the resolution order below is the contract, and a hand-rolled copy silently loses
the last two steps.

```ts
import { showApiError } from "@/lib/apiErrorMessage"

mutation.mutate(payload, {
  onError: err => showApiError(err, t),
})

// with a curated per-action fallback, when "something generic" is not good enough:
onError: err => showApiError(err, t, t("submit.errors.lcNumberAddFailed", { number })),
```

Resolution order:

1. `errors.<CODE>` in the caller's namespace — the curated, translated message.
2. `errors.<CODE>` in `common` — reached via `fallbackNS: "common"` in `src/i18n/config.ts`. The
   ~35 codes any endpoint can raise (`PERMISSION_DENIED`, `VALIDATION_ERROR`,
   `RATE_LIMIT_EXCEEDED`, `MODULE_NOT_ACTIVE`, …) are keyed **once** there, not copied into all 13
   namespaces. i18next consults `fallbackNS` before `defaultValue`, which is what makes this work.
3. The caller's `fallback` argument, if supplied.
4. **The BE's `detail.message`** — untranslated English, but a real description. This is a
   deliberate, narrow exception to the no-raw-`message` rule in §5: the BE adds codes faster than
   this repo keys them, and an unkeyed code collapsing to "Something went wrong" tells the user
   nothing. The helper ignores the placeholder `@/lib/api` substitutes when a response carries no
   message, so this step never re-displays that string.
5. `errors.generic` — transport failures and messageless responses.

- Adding a new BE error code requires **only a new i18n key** — feature-specific in
  `en/<feature>.json` + `de/<feature>.json`, or `common.json` when any endpoint can raise it. No
  code change. Until the key exists, step 4 keeps the user informed.
- `src/__tests__/i18n/errorCatalogue.test.ts` asserts every code in the BE taxonomy resolves in
  **both** locales. Refresh `src/__tests__/fixtures/beErrorCodes.json` from
  `../refinext-api/src/app/shared/errors/codes.py` when the BE adds codes.
- **No `switch` per error code.** Switches drift and break every time the BE adds a code.
- **No side effects from `onError`** — no step navigation driven by error codes, and no `form.setError` keyed off a specific domain code. The BE tells us what went wrong via the code; the UI shows it. **One exception:** `VALIDATION_ERROR` is the only code that carries `errors:[{field,…}]`, and that detail is applied to the form via `applyApiFieldErrors()` before falling back to the toast — see `.claude/rules/project/api-error-display.md` §2.1. Every other code comes from `create_error_response()`, which has no `field` at all.
- Queries render a visible error state via `isError` — never blank or stale content on failure.

Coverage requirements (every mutation has `onError`, every foreground query has an `isError` branch) and the fix-on-encounter procedure are in `.claude/rules/project/api-error-display.md` — that is the operative enforcement rule.

## 3. Never Swallow

```ts
// ❌ catch (e) {}                          — error lost
// ❌ catch (e) { /* toast nothing */ }     — user assumes success
// ✅ surface to the user, or rethrow so the caller / error boundary handles it
```

Retryable failures (5xx, network) get a visible retry affordance — never silent auto-retry loops.

## 4. Logging & PII

- No `console.log` / `console.warn` / `console.debug` in non-test code — the pre-commit hook blocks them.
- Never put tokens, passwords, or personal data (names, emails, phones) in any log, error message, or error-tracker payload — per `.claude/rules/project/anonymization.md`.
- If an error tracker (Sentry or equivalent) is added, it must scrub PII and auth headers before sending.

## 5. Anti-Patterns

| ❌                                         | Why it breaks                           | ✅                                                   |
| ------------------------------------------ | --------------------------------------- | ---------------------------------------------------- |
| `mutation.mutate(payload)` with no handler | Silent failure — user sees nothing      | `onError: err => showApiError(err, t)` (§2)          |
| `switch (err.code) { case ... }`           | Breaks on every new BE code             | `showApiError(err, t)`                               |
| Re-implementing the ternary inline         | Loses the common + BE-message fallbacks | `@/lib/apiErrorMessage`                              |
| Matching on `err.message`                  | Messages are not stable contracts       | Always `err.code`                                    |
| `catch (e) { console.error(e) }`           | Invisible to the user, blocked by hook  | Surface via toast / error state                      |
| Raw `error.message` as the _first_ choice  | Untranslated, unstable                  | i18n key by code; §2 step 4 is the only fallback use |
| No `isError` branch on a foreground query  | Blank or broken UI on failure           | Render an error state                                |

---

## Related

- `.claude/rules/project/api-error-display.md` — exhaustive coverage rule + fix-on-encounter procedure
- `.claude/rules/project/anonymization.md` — no personal info in logs or trackers
- `.claude/rules/project/code-review.md` §5 — API integration review checklist
- CLAUDE.md §API integration — envelope shape and known error codes reference

---

**Status:** ✅ Active
