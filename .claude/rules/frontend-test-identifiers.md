---
layer: frontend
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.vue"
  - "**/*.svelte"
  - "**/*.dart"
  - "e2e/**"
  - "**/*.test.*"
  - "**/*.spec.*"
---

# Frontend Test Identifiers (`data-testid` / `testID`)

**MANDATORY: Every interactive element and key assertion target in frontend code (web and mobile) carries a stable test identifier. Tests select by these identifiers — never by XPath, CSS classes, or visible text alone.**

This rule applies to every frontend (web / mobile) story — load it alongside `.claude/rules/screen-driven-backlog.md` and `.claude/rules/api-first.md`. It governs the *production code* side of testability; `.claude/rules/test-scoping.md` §7 governs how the identifiers are consumed in tests.

---

## 1. The Rule

When implementing any frontend story, add a test identifier to:

**Interactive elements (always):**
- Buttons, links, menu items
- Form inputs, selects, checkboxes, radios, toggles, date pickers
- List/table rows or cards the user acts on (tap, click, swipe, select)
- Tabs, accordions, pagination controls

**Key assertion targets (always):**
- Error messages (per field and per form/screen)
- Empty states, loading indicators/spinners, success toasts/snackbars
- Modal / dialog / bottom-sheet containers
- The screen's root container (one per screen — lets tests assert "I am on screen X")

Purely decorative or static elements (icons, dividers, static headings) do **not** need identifiers — do not blanket every node.

### Attribute per platform

| Platform | Attribute | Why |
|----------|-----------|-----|
| Web (React, HTML, SSR) | `data-testid` | Native default of Playwright (`getByTestId`), Cypress, and Testing Library — zero config |
| Flutter (default mobile stack) | `Key('...')` / `ValueKey` | Stable widget-tree handle; widget + `integration_test` finders select via `find.byKey` |
| Flutter (Appium / native automation) | `Semantics(identifier: '...')` | Exposes the identifier to the platform accessibility tree for out-of-process drivers |
| React Native | `testID` | Built-in RN prop; surfaces to Detox / Appium on both platforms |
| React Native (Android + Appium) | `testID` **+** `accessibilityLabel` | Android exposes `testID` inconsistently through Appium; the label is the reliable fallback |

Never invent project-specific attributes (`data-qa`, `data-cy`, `data-test`) — `data-testid` is the framework standard.

---

## 2. Naming Convention

Kebab-case, functional, screen-scoped:

```
{screen}-{element}[-{qualifier}]
```

| Example | Meaning |
|---------|---------|
| `login-email-input` | Email field on Login screen |
| `login-submit-button` | Submit button on Login screen |
| `login-error-message` | Form-level error on Login screen |
| `product-list-screen` | Root container of ProductList screen |
| `product-list-item-{id}` | Repeated item — dynamic suffix from a stable domain id (never array index) |
| `checkout-step-2-next-button` | Wizard step qualifier |

Rules:
- **Name by function, not appearance** — `login-submit-button`, not `login-blue-button`. Identifiers must survive redesigns.
- **`{screen}` matches the story's `**Screen:**` field** (per `.claude/rules/screen-driven-backlog.md` §3), kebab-cased — identifiers are greppable per screen.
- **Repeated items** get a dynamic suffix from a stable domain id: `` `product-list-item-${product.id}` `` — never the array index (reordering breaks tests).
- **One identifier per element** — no duplicates within a screen.

---

## 3. Change Discipline

- **Renaming or removing an existing identifier is a breaking change for tests.** Update ALL tests referencing it in the same PR — same change-propagation principle as `.claude/rules/api-versioning.md` §5. Find them: `grep -rln "<testid>" tests/ e2e/`.
- **Tests never invent identifiers.** If a test needs an identifier the component doesn't ship, that's a frontend gap — add it to the component first (it belongs to the screen's story).
- **Identifiers are not styling or logic hooks.** No CSS selectors targeting `[data-testid]`, no runtime reads of the attribute in production code.
- Do **not** strip `data-testid` in production builds by default — E2E suites run against production-like builds. Strip only if the project explicitly decides to (and documents it in `project-rules.md`).

---

## 4. Selector Policy for Tests

When writing or generating tests (E2E, integration, component), locator preference is:

1. **`getByTestId` / `testID` — primary.** Guaranteed present by this rule; immune to copy and styling changes.
2. `getByRole` / `getByLabel` — secondary, when the assertion is *about* semantics/accessibility.
3. `getByText` / `getByPlaceholder` — only for asserting the copy itself is correct.
4. ❌ **Never:** XPath, CSS class selectors, DOM-structure traversal (`div > div:nth-child(2)`), or visible text as the sole way to *locate* an element.

**Flutter finder order** (same policy, Flutter idiom): `find.byKey` primary → `find.bySemanticsLabel` when the assertion is about semantics → `find.text` only for asserting the copy itself. Never `find.byType`-plus-index or widget-tree traversal as the sole locator.

This inverts the generic Testing Library advice deliberately: in this framework identifiers are mandatory, so testid-first gives maximum stability. `/generate-test-cases` applies this order in its locator suggestions (`commands/modules/test-cases-design-comparison.md` Stage 2).

---

## 5. Examples

### ✅ GOOD — React (web)

```tsx
<form data-testid="login-form">
  <input data-testid="login-email-input" type="email" aria-label="Email" />
  <input data-testid="login-password-input" type="password" aria-label="Password" />
  {error && <p data-testid="login-error-message" role="alert">{error}</p>}
  <button data-testid="login-submit-button" type="submit">Sign in</button>
</form>
```

### ✅ GOOD — Flutter (default mobile stack)

```dart
Scaffold(
  key: const Key('login-screen'),
  body: Column(children: [
    TextField(key: const Key('login-email-input')),
    TextField(key: const Key('login-password-input'), obscureText: true),
    if (error != null) Text(error!, key: const Key('login-error-message')),
    ElevatedButton(
      key: const Key('login-submit-button'),
      onPressed: submit,
      child: const Text('Sign in'),
    ),
  ]),
)
```

```dart
// Widget / integration_test consuming them
await tester.enterText(find.byKey(const Key('login-email-input')), 'user@example.com');
await tester.tap(find.byKey(const Key('login-submit-button')));
await tester.pumpAndSettle();
expect(find.byKey(const Key('login-error-message')), findsOneWidget);
```

The §2 naming convention is unchanged — the same kebab-case `{screen}-{element}` strings go inside `Key('...')`.

### ✅ GOOD — React Native

```tsx
<View testID="login-screen">
  <TextInput testID="login-email-input" accessibilityLabel="login-email-input" />
  <TextInput testID="login-password-input" accessibilityLabel="login-password-input" secureTextEntry />
  {error && <Text testID="login-error-message">{error}</Text>}
  <Pressable testID="login-submit-button" accessibilityLabel="login-submit-button" onPress={submit}>
    <Text>Sign in</Text>
  </Pressable>
</View>
```

### ✅ GOOD — Playwright test consuming them

```typescript
await page.getByTestId('login-email-input').fill('user@example.com');
await page.getByTestId('login-password-input').fill('secret');
await page.getByTestId('login-submit-button').click();
await expect(page.getByTestId('login-error-message')).toHaveText(/invalid credentials/i);
```

### ❌ BAD

```tsx
// No identifiers — tests will fall back to fragile selectors
<button className="btn btn-primary">Sign in</button>
```

```typescript
// XPath / structure / text-as-locator — breaks on copy or layout change
await page.locator('//div[2]/form/button[contains(text(),"Sign in")]').click();
await page.locator('.btn-primary').click();
```

---

## 6. Enforcement

- `/execute-work` frontend quality gate: a frontend story is not complete until every interactive element and assertion target introduced by the story carries an identifier per §1–§2 — see `commands/modules/execute-work-quality-gates-domain.md` (Frontend Gate).
- `/generate-test-cases` Stage 2 suggests locators testid-first per §4.
- Story-level tests written without identifiers (raw XPath/CSS) fail review — fix the component, then the test.

---

## Related

- `.claude/rules/screen-driven-backlog.md` — the `**Screen:**` field that anchors the `{screen}` prefix
- `.claude/rules/test-scoping.md` — §7 selector style for generated scenarios
- `.claude/rules/api-first.md` — the other frontend-story gate (API contract before code)
- `.claude/rules/stack-specific.md` — stack conventions these snippets follow
- `commands/modules/test-cases-design-comparison.md` — Stage 2 locator suggestion order
- `commands/modules/execute-work-quality-gates-domain.md` (Frontend Gate) — where this rule is enforced

---

**Version:** 1.1.0 (Flutter section: `Key('...')`/`Semantics` identifiers + `find.byKey`-first finder order)
