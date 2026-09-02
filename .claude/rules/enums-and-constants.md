# Enums & Constants — Cross-Layer Naming Convention

**Version:** 1.0
**Last Updated:** 2026-05-11
**Status:** Active

**MANDATORY: All enum-like values that cross layer boundaries (database ↔ backend ↔ frontend ↔ mobile) MUST use `SCREAMING_SNAKE_CASE` as their wire format. Each layer's symbol style follows its idiom, but the wire VALUE is shared.**

Prevents the most common cross-layer bug: DB stores `"active"`, backend serializes `"ACTIVE"`, mobile sends `"Active"`, frontend strict-equals against one of them → silent breakage at runtime.

---

## 1. Scope

**Covers:** status / state enums (`OrderStatus`, `UserRole`), event-type discriminators, API error codes, string-keyed feature flags — anything that exists in code AND on the wire AND in the DB.

**Does NOT cover:** pure internal constants (`MAX_RETRIES = 3`) — follow language idiom; UI display labels — those are i18n keys (see §6); JSON property names — those follow API style (typically `camelCase` for JS/TS stacks).

---

## 2. The Wire Format Rule

**Canonical wire value: `SCREAMING_SNAKE_CASE`.**

Examples: `ACTIVE`, `PENDING_REVIEW`, `PAYMENT_FAILED`, `ORDER_CREATED`.

This is the exact string that appears in JSON payloads, Postgres ENUM members, queue messages, webhooks, and URL query params.

**Value guidance:**

- Full words, not abbreviations (`PENDING_REVIEW`, not `PEND_REV`)
- Past tense for events (`ORDER_CREATED`), present-state for statuses (`ACTIVE`)
- One enum per domain — don't reuse a generic `status` enum across unrelated models
- Max ~40 chars; if longer, the enum is doing too much — split

**Enum _type_ name** is always `PascalCase` in code: `OrderStatus`, `UserRole`, `WebhookEventType`.

---

## 3. Database Layer (Prisma + PostgreSQL — default stack)

Define enums in `schema.prisma` with `SCREAMING_SNAKE_CASE` members. Prisma generates a matching TypeScript enum AND creates the Postgres ENUM type storing those exact strings:

```prisma
enum OrderStatus {
  ACTIVE
  PENDING_REVIEW
  PAYMENT_FAILED
  COMPLETED
  CANCELLED
}

model Order {
  id     String      @id @default(cuid())
  status OrderStatus @default(ACTIVE)
}
```

Migration produces `CREATE TYPE "OrderStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', ...)`. The stored values are exactly these strings.

**String columns** (when not using Postgres ENUM): same convention — enforce allowed set via Zod at the application boundary (§5).

**Adding / removing values:** use Prisma migrations per `.claude/rules/database.md`. Never edit Postgres ENUM types manually. Deprecate before removing — old queue/log payloads may still contain the value. **Re-run all related tests** — `grep -rln "<ENUM_VALUE>\|<EnumTypeName>" tests/` and re-validate cross-layer (per `.claude/rules/testing.md` → Related-Test Re-Validation; `/run-tests` covers this).

---

## 4. Backend / Frontend (TypeScript)

In the default stack (React Router 7), backend and frontend share one codebase. The Prisma-generated enum is the canonical TS type — import and use directly:

```typescript
import { OrderStatus } from "@prisma/client"
// OrderStatus.ACTIVE === 'ACTIVE' (identifier matches wire value)

if (order.status === OrderStatus.ACTIVE) {
  /* ... */
}
```

**Non-DB enums** (UI-only filter, client feature flag) — define as `const` object + derived type. Prefer this over TS `enum` (better tree-shaking, no runtime quirks):

```typescript
export const FilterMode = {
  ALL: "ALL",
  ACTIVE_ONLY: "ACTIVE_ONLY",
  ARCHIVED_ONLY: "ARCHIVED_ONLY",
} as const

export type FilterMode = (typeof FilterMode)[keyof typeof FilterMode]
```

**Forbidden:** mixed casing, inline string literals in business logic (`if (status === 'active')` is a refactor hazard — compare to `OrderStatus.ACTIVE`), wire value that differs from the identifier.

---

## 5. Validation Layer (Zod)

Build the schema directly from the Prisma enum or const object — never duplicate values:

```typescript
import { OrderStatus } from "@prisma/client"
import { z } from "zod"

const orderStatusSchema = z.nativeEnum(OrderStatus)
// Or for non-Prisma:
const filterModeSchema = z.enum(["ALL", "ACTIVE_ONLY", "ARCHIVED_ONLY"])
```

Unknown wire values produce a 400 — matching the API testing matrix in `.claude/rules/testing.md`.

---

## 6. Separation from UI Display Text

**Enum values are NEVER user-facing.** They are machine identifiers. UI labels come from i18next, keyed by the enum value:

```typescript
// ❌ BAD
<span>{order.status}</span>  // shows "PENDING_REVIEW"

// ✅ GOOD
<span>{t(`order.status.${order.status}`)}</span>
// en: "Pending review" / sr: "Na pregledu"
```

Translation key structure: `<domain>.<enumName>.<VALUE>` — greppable, aligned with the wire value. **Never store localized strings in the DB as enum values** — wire format stays machine-identifier; label is computed per request based on user locale.

---

## 7. Mobile Layer

Wire value is identical across all mobile stacks; only the per-language symbol style differs.

- **React Native (TypeScript)** — identical to web (§4). Share types via a shared package, or duplicate the literal-union if the mobile app isn't in the monorepo.
- **Kotlin (Android)** — entries are conventionally `SCREAMING_SNAKE_CASE`, so the wire value matches the entry name with **zero mapping**: `enum class OrderStatus { ACTIVE, PENDING_REVIEW, PAYMENT_FAILED }` — no `@SerialName` needed for kotlinx.serialization / Moshi.
- **Swift (iOS)** — cases are `camelCase`; map to the wire value via `String` raw values:

```swift
enum OrderStatus: String, Codable {
    case active = "ACTIVE"
    case pendingReview = "PENDING_REVIEW"
    case paymentFailed = "PAYMENT_FAILED"
}
// In code: .pendingReview ; on the wire: "PENDING_REVIEW"
```

---

## 8. Source of Truth (One Place per Enum)

Every cross-layer enum has **exactly one** source of truth. Never copy-paste values into multiple files — a single misspelled letter in a duplicate is invisible to typecheck.

| Stack                             | Source of truth                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Default (RR7 + Prisma)            | `schema.prisma` → `@prisma/client` enum imported everywhere                                                            |
| Separate backend + mobile clients | Shared package (e.g. `packages/shared/enums.ts`), OR contracts file (`openapi.yaml`) that generates per-language types |
| Backend-only / frontend-only      | Single `enums.ts` (or per-domain: `app/lib/enums/order.ts`) — exported and imported                                    |

---

## 9. Anti-Patterns (Quick Reference)

| ❌                                                                                | Why it breaks                                        | ✅                                       |
| --------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Mixing `"ACTIVE"` and `"active"` for same concept                                 | Strict equality fails silently                       | Pick one casing per §2, enforce with Zod |
| Storing display text in DB (`"Active"`)                                           | Locale + label changes need migrations               | Store wire value; i18n the label         |
| Numeric codes for human states (`status = 1`)                                     | Unreadable in logs, queries, dashboards              | `SCREAMING_SNAKE_CASE` strings           |
| Inline string literals (`status === 'active'`)                                    | Typo bypasses typecheck; refactor-hostile            | `status === OrderStatus.ACTIVE`          |
| Boolean for 3+ state enum (`isActive: bool` when really `ACTIVE/PAUSED/ARCHIVED`) | Forces data migration later                          | Model as enum from the start             |
| One enum reused across unrelated domains                                          | Adding value for one accidentally enables for others | One enum per domain                      |

---

## 10. Pure Internal Constants (out of scope)

Constants that never cross a boundary follow each language's idiom — this rule does NOT mandate casing for them.

```typescript
const MAX_RETRIES = 3 // TS idiom
const DEFAULT_TIMEOUT_MS = 5_000
```

```kotlin
const val MAX_RETRIES = 3                 // Kotlin idiom
```

```swift
let maxRetries = 3                        // Swift idiom (lowerCamel)
```

The cross-layer rule applies only when the value becomes a string identifier that travels.

---

## Related

- `.claude/rules/database.md` — migration workflow for enum changes
- `.claude/rules/stack-specific.md` — Zod env-var schema pattern
- `.claude/rules/testing.md` — Zod rejection of unknown enum value → 400 (testing matrix)
- `.claude/rules/api-documentation.md` — endpoint docs MUST list allowed enum values in request/response schemas

---

**Status:** ✅ Active
