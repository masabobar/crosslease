# Error Handling & Logging (Frontend)

**Version:** 2.0
**Last Updated:** 2026-07-05
**Status:** Active

**MANDATORY: Every API failure is surfaced to the user. Programmatic handling uses `ApiError.code` — never message strings. Display goes through the dynamic i18n lookup with a generic fallback. Errors are never silently swallowed. No `console.*`, PII, or tokens in shipped code.**

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

## 2. Display Pattern — Dynamic Lookup, No Switch

```ts
mutation.mutate(payload, {
  onError: err => {
    toast.error(
      err instanceof ApiError
        ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
        : t("errors.generic")
    )
  },
})
```

- Any BE code translates via the `errors.<CODE>` i18n key; unknown codes and non-`ApiError` throws (network down, timeout) fall back to `errors.generic`.
- Adding a new BE error code requires **only a new i18n key** in `en/<feature>.json` + `de/<feature>.json` — no code change.
- **No `switch` per error code.** Switches drift and break every time the BE adds a code.
- **No side effects from `onError`** — no `form.setError`, no step navigation driven by error codes. The BE tells us what went wrong via the code; the UI shows it.
- Queries render a visible error state via `isError` — never blank or stale content on failure.

Coverage requirements (every mutation has `onError`, every foreground query has an `isError` branch) and the fix-on-encounter procedure are in `.claude/rules/api-error-display.md` — that is the operative enforcement rule.

## 3. Never Swallow

```ts
// ❌ catch (e) {}                          — error lost
// ❌ catch (e) { /* toast nothing */ }     — user assumes success
// ✅ surface to the user, or rethrow so the caller / error boundary handles it
```

Retryable failures (5xx, network) get a visible retry affordance — never silent auto-retry loops.

## 4. Logging & PII

- No `console.log` / `console.warn` / `console.debug` in non-test code — the pre-commit hook blocks them.
- Never put tokens, passwords, or personal data (names, emails, phones) in any log, error message, or error-tracker payload — per `.claude/rules/anonymization.md`.
- If an error tracker (Sentry or equivalent) is added, it must scrub PII and auth headers before sending.

## 5. Anti-Patterns

| ❌                                         | Why it breaks                          | ✅                                            |
| ------------------------------------------ | -------------------------------------- | --------------------------------------------- |
| `mutation.mutate(payload)` with no handler | Silent failure — user sees nothing     | `onError` with dynamic lookup (§2)            |
| `switch (err.code) { case ... }`           | Breaks on every new BE code            | `t(\`errors.${err.code}\`, { defaultValue })` |
| Matching on `err.message`                  | Messages are not stable contracts      | Always `err.code`                             |
| `catch (e) { console.error(e) }`           | Invisible to the user, blocked by hook | Surface via toast / error state               |
| Raw `error.message` rendered in UI         | Untranslated, unstable                 | i18n key by code                              |
| No `isError` branch on a foreground query  | Blank or broken UI on failure          | Render an error state                         |

---

## Related

- `.claude/rules/api-error-display.md` — exhaustive coverage rule + fix-on-encounter procedure
- `.claude/rules/anonymization.md` — no personal info in logs or trackers
- `.claude/rules/code-review.md` §5 — API integration review checklist
- CLAUDE.md §API integration — envelope shape and known error codes reference

---

**Status:** ✅ Active
