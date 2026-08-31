# Enums & Constants — Cross-Layer Naming Convention

**Version:** 2.0
**Last Updated:** 2026-07-05
**Status:** Active

**MANDATORY: An enum-like value that crosses a layer boundary (API ↔ frontend) has exactly one wire format, defined by the backend — the frontend matches it exactly, references it through one source of truth, and never renders it directly to the user.**

Prevents the most common cross-layer bug: BE sends `"active"`, FE strict-equals against `"ACTIVE"` → silent breakage at runtime.

---

## 1. Scope

**Covers:** status / state enums (`UserStatus`, `UserRole`), event-type discriminators, API error codes, string-keyed feature flags — anything that exists in code AND on the wire.

**Does NOT cover:** pure internal constants (`MAX_RETRIES = 3`) — follow language idiom (§7); UI display labels — those are i18n keys (§5); JSON property names — those follow API style.

## 2. The Wire Format Is BE-Defined — Match It Exactly

The backend (`../refinext-api/`) owns every wire value; this repo consumes them. In this project:

- **Error codes** are `SCREAMING_SNAKE_CASE`: `INVALID_CREDENTIALS`, `RATE_LIMIT_EXCEEDED`
- **Roles / statuses / types** are lowercase snake: `system_admin`, `leasing_company_user`, `active`, `bank_tenant`

Never "normalize" a wire value to a different casing on the FE side. Verify the exact strings in `openapi.json` (or `src/generated/api.ts`); adding or removing values happens in the BE repo via its migration workflow, never here.

**Enum _type_ names** in code are always `PascalCase`: `UserRole`, `UserStatus`.

## 3. Frontend Source of Truth

Every wire enum has **exactly one** definition in this repo — the Zod schema in the owning feature's `api/schema.ts` — and everything else derives from it:

```ts
// features/users/api/schema.ts — single source of truth
export const UserRoleSchema = z.enum([
  "system_admin", "support_user", "auditor", "bank_power_user",
  "front_office", "back_office", "leasing_company_user",
])
export type UserRole = z.infer<typeof UserRoleSchema>

// elsewhere — reference, never retype
if (user.role === UserRoleSchema.enum.system_admin) { ... }
```

- Unknown wire values fail `parse()` at the query layer — bad data never reaches the UI (per CLAUDE.md §API data).
- Never copy-paste the value list into a second file — a misspelled duplicate is invisible to typecheck. Compose with `.extend()` / `.pick()` or import the schema.

**UI-only enums** (filter modes, client feature flags) that never touch the wire — define as a `const` object + derived type; prefer this over TS `enum` (better tree-shaking, no runtime quirks):

```ts
export const FilterMode = {
  ALL: "ALL",
  ACTIVE_ONLY: "ACTIVE_ONLY",
} as const
export type FilterMode = (typeof FilterMode)[keyof typeof FilterMode]
```

## 4. No Inline Literals

Inline string comparisons are a refactor hazard — a typo bypasses typecheck:

```ts
// ❌ if (user.role === "system_admin")
// ✅ if (user.role === UserRoleSchema.enum.system_admin)
```

If a string is compared against and no constant covers it yet, extract one before moving on (per `.claude/rules/project/code-review.md` §10).

## 5. Separation from UI Display Text

**Enum values are NEVER user-facing.** They are machine identifiers; labels come from i18next, keyed by the value:

```tsx
// ❌ <span>{user.status}</span>          — shows "pending_approval"
// ✅ <span>{t(`users.status.${user.status}`)}</span>
```

Translation key structure: `<domain>.<enumName>.<value>` — greppable, aligned with the wire value.

## 6. Anti-Patterns (Quick Reference)

| ❌                                                     | Why it breaks                             | ✅                                        |
| ------------------------------------------------------ | ----------------------------------------- | ----------------------------------------- |
| FE re-casing a wire value (`"ACTIVE"` for `"active"`)  | Strict equality fails silently            | Match `openapi.json` exactly              |
| Inline literals (`role === "system_admin"`)            | Typo bypasses typecheck                   | Reference the Zod schema enum             |
| Retyping the value list in a second file               | Duplicate drift invisible to typecheck    | One schema, import everywhere             |
| Rendering the wire value in UI                         | Untranslated machine identifier on screen | i18n key per §5                           |
| Plain TS union for API enum (`type Role = "a" \| "b"`) | No runtime rejection of unknown values    | `z.enum()` + `parse()` at the query layer |
| Boolean for a 3+ state concept                         | Forces rework when a third state appears  | Model as an enum from the start           |

## 7. Pure Internal Constants (out of scope)

Constants that never cross a boundary follow language idiom — this rule does not mandate casing for them:

```ts
const MAX_RETRIES = 3
const DEFAULT_TIMEOUT_MS = 5_000
```

The cross-layer rule applies only when the value becomes a string identifier that travels.

---

## Related

- `../refinext-api/` — owns wire values and their migrations
- `.claude/rules/project/code-review.md` §10 — hardcoded-value review gate
- `.claude/rules/project/error-handling-and-logging.md` — error codes are enums too (`errors.<CODE>` i18n keys)

---

**Status:** ✅ Active
