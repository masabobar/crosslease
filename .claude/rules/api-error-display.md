# API Error Display — Exhaustive BE Error Handling

**Version:** 1.0
**Last Updated:** 2026-06-05
**Status:** Active

**MANDATORY: Every API mutation and every user-visible query error MUST be caught and surfaced to the user. Silent API failures are bugs. When reviewing or modifying code, FIX missing error handling immediately — do not flag for later.**

Complements `.claude/rules/code-review.md` §5 (API Integration checklist) and `.claude/rules/error-handling-and-logging.md` (BE error taxonomy and codes).

---

## 1. The Rule

No API call may fail silently. Every path through an async operation that results in a 4xx, 5xx, network error, or timeout MUST produce visible feedback to the user.

**Trigger:** any file in `features/<name>/` or `components/` that calls `useMutation`, `useQuery`, `api.*`, or any React Query hook.

**Fix-on-encounter:** when reviewing code with `/code-review` or `/review-codebase`, or when modifying a file that contains API calls — if an API call is missing the required error handling, **apply the fix in that same pass.** Do not leave it as a comment or flag for later. The fix is additive only and cannot break existing behavior.

---

## 2. Mutations — Required Pattern

Every `useMutation` call site MUST handle errors. Use `onError` on the `mutate()` call or on the `useMutation` hook itself.

```ts
// ✅ CORRECT — dynamic lookup: every BE code translates via errors.<CODE>,
// generic fallback covers unknown codes and non-ApiError throws.
const mutation = useMutation({ mutationFn: createUser })

mutation.mutate(payload, {
  onError: err => {
    toast.error(
      err instanceof ApiError
        ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
        : t("errors.generic")
    )
  },
})

// ❌ MISSING onError — silent failure, user sees nothing
mutation.mutate(payload)

// ❌ switch per error code — drifts and breaks every time the BE adds a code
mutation.mutate(payload, {
  onError: err => {
    if (err instanceof ApiError) {
      switch (err.code) {
        case "CONFLICT_EMAIL_EXISTS":
          return toast.error(t("errors.CONFLICT_EMAIL_EXISTS"))
        default:
          return toast.error(t("errors.generic"))
      }
    }
  },
})
```

**What error codes to handle:**

- Check `openapi.json` (or `../refinext-api/`) for every code the endpoint documents, and add an `errors.<CODE>` i18n key for each — the dynamic lookup then handles display with no code change. Note `openapi.json` **understates** the taxonomy: it declares only `422 HTTPValidationError`, while the real codes are registered in `../refinext-api/src/app/shared/errors/handlers.py`. Read the handlers.
- Unknown codes and non-`ApiError` throws (network down, timeout) fall back to `errors.generic`.
- **No side effects from `onError`** — no step navigation driven by error codes, and no `form.setError` keyed off a specific code. The UI shows what went wrong, nothing more. The single exception is §2.1, which is driven by the payload rather than by a code list.

---

## 2.1 The One Exception — `VALIDATION_ERROR` Field Detail

The backend emits exactly two error shapes:

| Shape                                                                   | Produced by                                    | Field detail?                                   |
| ----------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| `{code, message}`                                                       | `create_error_response()` — every domain error | ❌ never; the function has no `field` parameter |
| `{code: "VALIDATION_ERROR", message, errors:[{field, message, input}]}` | the `RequestValidationError` handler           | ✅ always, per field                            |

So for a domain error there is **no field to map** and the toast is the only possible display. For `VALIDATION_ERROR` the BE names the exact fields, and discarding them to show "Something went wrong" is a defect, not a policy.

```ts
onError: err => {
  if (applyApiFieldErrors({
    error: err,
    fields: Object.keys(getValues()),
    setError,
  })) return

  toast.error(
    err instanceof ApiError
      ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
      : t("errors.generic")
  )
},
```

Why this does not reopen the drift the rest of this file prevents:

- It branches on **one** code that means "field detail follows", not on a list of domain codes — so it never needs editing when the BE adds a code.
- `applyApiFieldErrors` (`src/lib/apiFieldErrors.ts`) returns `false` unless it attached at least one error to a field the form actually has, so the toast still fires for unmappable payloads. It cannot silently swallow an error.
- The attached message is `common:validation.rejectedByServer`, never the BE's own English prose (§6 of `code-review.md`).

Add `errors.VALIDATION_ERROR` to a feature's namespace as the fallback for when no field resolves.

---

## 3. Queries — Required Pattern

Query errors appear in the component that renders the data. Use the `error` + `isError` fields from `useQuery` and render a visible error state.

```ts
// ✅ CORRECT
const { data, error, isError } = useQuery({ queryKey: KEYS.user(id), queryFn: fetchUser })

if (isError) {
  const message = error instanceof ApiError
    ? t(`errors.${error.code}`, { defaultValue: t('errors.generic') })
    : t('errors.generic')
  return <ErrorState message={message} />
}

// ❌ MISSING error handling — blank or stale content on failure
const { data } = useQuery({ queryKey: KEYS.user(id), queryFn: fetchUser })
return <UserProfile user={data} />
```

For background refetches (not initial load), the global React Query `onError` callback in `queryClient` covers those — individual query `isError` handling is for render-blocking foreground fetches.

---

## 4. Fix-on-Encounter Procedure

When `/code-review` or `/review-codebase` finds an API call missing error handling:

1. Identify the mutation/query call site.
2. Look up the endpoint's error codes in `openapi.json` (grep by path) or `../refinext-api/`.
3. Apply the fix using §2 (mutation) or §3 (query) pattern.
4. Add i18n keys for any new error codes to both `en/<feature>.json` and `de/<feature>.json`.
5. Do not leave a TODO — complete the fix inline.

---

## 5. Anti-Patterns

| ❌                                            | Why it breaks                       | ✅                                            |
| --------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| `mutation.mutate(payload)` with no `onError`  | User sees nothing on failure        | Add `onError` with dynamic lookup (§2)        |
| `switch (err.code) { case ... }` in `onError` | Breaks on every new BE code         | Dynamic `errors.<CODE>` lookup + fallback     |
| `catch (e) { console.error(e) }`              | Logged only, invisible to user      | `toast.error(t('errors.generic'))`            |
| `onError: () => toast.error('Failed')`        | Hardcoded string, no code handling  | `t(\`errors.${err.code}\`, { defaultValue })` |
| Matching on `err.message`                     | Messages are not stable contracts   | Always check `err.code`                       |
| No `isError` branch in query render           | Blank or broken UI on query failure | Render `<ErrorState>` when `isError`          |

---

## Related

- `.claude/rules/code-review.md` §5 — API Integration checklist (this rule drives fix-on-encounter enforcement)
- `.claude/rules/error-handling-and-logging.md` — BE error taxonomy and `ApiError` class
- `CLAUDE.md` — error envelope shape (`detail.code`) and known error codes reference

---

**Status:** ✅ Active
