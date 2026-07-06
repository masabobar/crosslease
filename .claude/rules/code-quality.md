# Code Quality Principles - SOLID & DRY

**MANDATORY: All code MUST follow SOLID and DRY principles.**

---

## SOLID Principles

| Principle                     | Rule                        | Good                                           | Bad                                               |
| ----------------------------- | --------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| **S - Single Responsibility** | One function = one purpose  | `auth.service.ts` handles only auth            | `user.service.ts` handles auth + profile + orders |
| **O - Open/Closed**           | Extend without modifying    | Add validator without changing base            | Modify core for each new type                     |
| **L - Liskov Substitution**   | Subtypes replace base types | `ValidationError` works anywhere `Error` works | Subclass needs special handling                   |
| **I - Interface Segregation** | Small, focused interfaces   | `ReadService` has only read methods            | `Service` has 20 methods, use 3                   |
| **D - Dependency Inversion**  | Depend on abstractions      | `createUser(db, data)` injects DB              | `createUser(data)` hardcodes DB                   |

---

## SOLID Examples

### S - Single Responsibility

```typescript
// ❌ BAD: Multiple responsibilities
class UserService {
  createUser(data) {
    /* user creation */
  }
  sendEmail(email) {
    /* email sending */
  }
  logActivity(msg) {
    /* logging */
  }
}

// ✅ GOOD: Single responsibility each
class UserService {
  createUser(data) {
    /* users only */
  }
}
class EmailService {
  sendEmail(email) {
    /* email only */
  }
}
class Logger {
  logActivity(msg) {
    /* logging only */
  }
}
```

### O / D — see the table above

Open/Closed: add a new validator/variant as a new implementation — never grow an `if (type === ...)` chain inside an existing one. Dependency Inversion: pass dependencies in (parameters, props, injected clients) instead of constructing them inside the consumer — that's what makes the code swappable and testable.

---

## DRY Principle (Don't Repeat Yourself)

**When to Abstract: Pattern appears 2+ times**

### Example: Repeated Validation

```typescript
// ❌ BAD: Repeated validation
function createUser(data) {
  if (!data.email || !data.email.includes("@")) throw new Error("Invalid")
  if (data.password.length < 8) throw new Error("Too short")
}
function updateUser(data) {
  if (!data.email || !data.email.includes("@")) throw new Error("Invalid")
  if (data.password?.length < 8) throw new Error("Too short")
}

// ✅ GOOD: Shared schema
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

function createUser(data) {
  return userSchema.parse(data)
}
function updateUser(data) {
  return userSchema.partial().parse(data)
}
```

### When NOT to Abstract

```typescript
// ❌ BAD: Premature abstraction (used once)
function formatName(first, last) {
  return `${first} ${last}`
}
const name = formatName(user.firstName, user.lastName)

// ✅ GOOD: Keep simple if used once
const name = `${user.firstName} ${user.lastName}`
```

**Rule:** 1st time = inline, 2nd time = note it, 3rd time = extract

---

## Common Patterns

### 1. Repeated API Calls → Service

```typescript
// ❌ BAD: Duplicated fetch
fetch('/api/users').then(r => r.json())...

// ✅ GOOD: Shared service
async function fetchUsers() {
  const r = await fetch('/api/users');
  if (!r.ok) throw new Error('Failed');
  return r.json();
}
```

### 2. Repeated Validation → Schema

```typescript
// ❌ BAD: Inline validation everywhere
if (!email.match(/regex/)) throw new Error()

// ✅ GOOD: Shared schema
const emailSchema = z.string().email()
emailSchema.parse(email)
```

### 3. Repeated UI → Component

```typescript
// ❌ BAD: Repeated markup
<div className="card"><h2>{title}</h2><p>{text}</p></div>

// ✅ GOOD: Component
function Card({ title, text }) { return <div className="card">...</div>; }
```

### 4. Repeated Calculation → Utility

```typescript
// ❌ BAD: Duplicated logic
const total = items.reduce((sum, i) => sum + i.price, 0)

// ✅ GOOD: Utility function
function calcTotal(items) {
  return items.reduce((sum, i) => sum + i.price, 0)
}
```

---

## Rule of Three

**1st** → Inline | **2nd** → Note pattern | **3rd** → Extract

```typescript
// 1st & 2nd: Inline
const name1 = `${user.firstName} ${user.lastName}`
const name2 = `${admin.firstName} ${admin.lastName}`

// 3rd: Extract
const getFullName = p => `${p.firstName} ${p.lastName}`
```

---

## Quality Checklist

**Before committing:**

- [ ] **Single Responsibility** - Each function does ONE thing
- [ ] **Open/Closed** - Extend without modifying
- [ ] **Dependency Inversion** - Inject dependencies
- [ ] **DRY** - No duplication (2+ times = extract); search existing `src/lib/`, hooks, schemas before writing a new one
- [ ] **No magic values** - No inline numbers or strings with domain meaning; no raw enum strings when a constant/enum is already declared
- [ ] **No Premature Abstraction** - Only abstract at 3rd occurrence
- [ ] **Clear Names** - Self-documenting
- [ ] **Small Functions** - Max 50 lines

---

**Related:** `.claude/rules/enums-and-constants.md` (cross-layer enum naming) — `CLAUDE.md` (overall standards)
