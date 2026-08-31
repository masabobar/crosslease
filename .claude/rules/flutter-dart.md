---
layer: frontend
paths:
  - "**/*.dart"
  - "**/pubspec.yaml"
  - "**/analysis_options.yaml"
---

# Flutter & Dart Engineering Practices

**MANDATORY whenever a Dart file, `pubspec.yaml`, or `analysis_options.yaml` is written or changed.** Consolidates Dart-side engineering practice for the default mobile stack: the analyze/fix loop, `lib/` layering, routing, JSON conventions, and widget-test patterns. Testing WHAT/gates live in `testing.md`; test construction discipline in `test-construction.md`; this rule covers the Dart/Flutter HOW.

---

## §1 Static Analysis & Format Loop

**`flutter analyze` (pure Dart package: `dart analyze`) MUST report 0 issues** — errors AND warnings AND infos — at every Story Gate that touches a pub-managed app. This is the Dart equivalent of the `tsc --noEmit` + lint gate (`testing.md` → Tiered Full-Suite Gate).

**Remediation order (cheapest first):**

1. `dart fix --dry-run` → review → `dart fix --apply` — auto-fixes lint violations with safe, deterministic edits.
2. Manual fixes for whatever remains (analyzer errors, logic-level warnings).
3. Never silence with `// ignore:` / `// ignore_for_file:` to pass the gate — an ignore comment requires a justifying reason on the same line and is reviewable like a `**E2E Exempt:**` marker.

**Formatting:** `dart format .` clean before commit (CI equivalent: `dart format --set-exit-if-changed .`). Never hand-format against the formatter.

**Lint config:** `analysis_options.yaml` includes `package:flutter_lints/flutter.yaml` (+ project rules like `prefer_single_quotes`). Weakening the ruleset to pass a gate is prohibited — fix the code, not the config.

---

## §2 `lib/` Architecture — UI → Logic → Data

The Flutter mirror of `business-logic-layer.md` (thin transport wrappers, logic in services): **widgets are the thin wrapper; domain logic and I/O never live in them.**

| Layer | Location | Contains | MUST NOT contain |
|-------|----------|----------|------------------|
| **UI** | `lib/src/<feature>/ui/` | Screens, widgets, view-models/controllers | `http` calls, JSON parsing, business rules |
| **Logic** | `lib/src/<feature>/logic/` (optional for trivial features) | Use-cases / domain services, validation | Widget imports (`flutter/material.dart`), direct I/O |
| **Data** | `lib/src/<feature>/data/` | Repositories, API client calls, DTO/model mapping | Widget or navigation code |

- **Repository pattern:** every backend resource gets ONE repository class in `data/`; the app-wide Dart API client lives under `lib/src/api/` and is the only place that touches `http`/`dio`. UI calls repositories, never the client directly.
- **Models own their serialization** (§4) and live next to the repository that produces them.
- **Dependency direction is one-way:** UI → Logic → Data. A `data/` file importing from `ui/` is an architecture violation.
- Cross-cutting app shell (`app.dart`, `theme.dart`, `router.dart`) stays at `lib/src/` root; everything feature-specific goes in its feature folder.

---

## §3 Declarative Routing — go_router

**`go_router` is the default router** for the default mobile stack (deep links, URL-based navigation, guard support). Raw `Navigator.push` chains are reserved for trivial single-screen dialogs/sheets.

- All routes are declared in **`lib/src/router.dart`** — one `GoRouter` instance, routes named after screens (`home`, `login`, `order-details`).
- **Named navigation only:** `context.goNamed('order-details', pathParameters: {'id': order.id})` — never string-concatenated paths at call sites.
- **Path params are typed at the route boundary:** parse/validate `state.pathParameters` in the route builder, pass typed values into the screen widget.
- **Auth guard via `redirect`:** unauthenticated access to a guarded route redirects to login in the router's `redirect` callback — the mobile counterpart of default-deny middleware (`security-and-auth.md`); screens never self-check "am I logged in" as their only guard.

---

## §4 JSON Serialization

Models converse with the API through explicit `fromJson` / `toJson` — no dynamic maps leaking past the data layer.

```dart
class Order {
  const Order({required this.id, required this.status, this.note});

  final String id;
  final OrderStatus status; // wire value stays SCREAMING_SNAKE_CASE
  final String? note;

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as String,
        status: OrderStatus.fromWire(json['status'] as String),
        note: json['note'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'status': status.wire,
        if (note != null) 'note': note,
      };
}
```

- **Explicit casts per field** (`as String`, `as String?`) — parsing fails loudly at the boundary, not deep in the widget tree.
- **Optional fields are nullable** (`String?`) and omitted from `toJson` when null; required fields are non-nullable constructor params.
- **Enums cross the wire as `SCREAMING_SNAKE_CASE`** (`enums-and-constants.md` §7): map wire string ↔ Dart enum in one place on the enum itself (`fromWire` / `wire`), never scattered `switch`es.
- `fromJson`/`toJson` live on the model; repositories call them — widgets never see `Map<String, dynamic>`.
- Codegen (`json_serializable`) is an acceptable project-level choice for large models; the boundary rules above are unchanged.

---

## §5 Widget & Unit Test Patterns

Complements `test-construction.md` (AAA, determinism, E2E discipline) and `frontend-test-identifiers.md` (`Key('...')`, `find.byKey`-first) with Flutter mechanics:

- **`pump` vs `pumpAndSettle`:** `tester.pump()` for a single frame (known state change), `pumpAndSettle()` after navigation/animations. Never `await Future.delayed` in tests — that is the sleep anti-pattern (`test-construction.md`).
- **Finder order:** `find.byKey` → `find.bySemanticsLabel` → `find.text` (copy assertions only). Never `find.byType` + index.
- **Mocks via `mockito` + `build_runner`:** annotate `@GenerateNiceMocks([MockSpec<OrderRepository>()])`, run `dart run build_runner build --delete-conflicting-outputs`, commit the generated `*.mocks.dart`. Mock the layer below the unit under test (repository under a view-model, API client under a repository) — never the unit itself (`testing.md` → Test Integrity).
- **Widget tests pump the widget with faked dependencies** — no network, no real router unless routing is the behavior under test.
- **Coverage:** `flutter test --coverage` → `coverage/lcov.info`; counts toward the coverage floors like every other workspace (`testing.md`).

---

## §6 Layout & UI Discipline

- **`const` everywhere possible** — const constructors, const literals in `build()`. `flutter_lints` flags most misses; do not ignore them.
- **Responsive by constraints, not device checks:** `LayoutBuilder` for parent-constraint decisions, `MediaQuery.sizeOf(context)` for viewport-level breakpoints. No hardcoded pixel widths for full-width elements.
- **Overflow fixes in order:** wrong-sized child → fix the child; child legitimately larger than parent → `Expanded`/`Flexible` inside flex parents; scrollable content → `SingleChildScrollView`/`ListView`. Never "fix" an overflow by hardcoding a smaller size that only fits one device.
- **Unbounded-constraint errors** (`ListView` in a `Column`, etc.): bound the child (`Expanded`, `shrinkWrap` only for short lists) instead of wrapping everything in fixed-height `SizedBox`es.

---

## Related

- `.claude/rules/testing.md` — Tiered Full-Suite Gate (pub-managed apps), coverage floors, Test Integrity
- `.claude/rules/test-construction.md` — AAA, determinism, E2E runtime discipline (`integration_test`)
- `.claude/rules/frontend-test-identifiers.md` — `Key('...')` / `Semantics` identifiers, `find.byKey`-first finder order
- `.claude/rules/business-logic-layer.md` — the thin-wrapper discipline §2 mirrors on the client
- `.claude/rules/enums-and-constants.md` §7 — `SCREAMING_SNAKE_CASE` wire enums across layers
- `.claude/rules/security-and-auth.md` — default-deny guarding that §3's `redirect` mirrors; token storage per `security-auth-mechanisms.md` §2.3
- `commands/modules/init-project-flutter-templates.md` — scaffolding that instantiates this structure
- `.project-management/defaults/default-stack.md` → "Default Mobile Stack (Flutter)" — package versions

**References:** practices distilled from the official [flutter/agent-plugins](https://github.com/flutter/agent-plugins) and [dart-lang/skills](https://github.com/dart-lang/skills) agent-skill repos (BSD-3-Clause) — kept self-contained here; no external plugin or MCP server required.

---

**Version:** 1.0.0 (initial: analyze/fix loop, UI→Logic→Data layering, go_router, JSON conventions, widget-test patterns, layout discipline)
