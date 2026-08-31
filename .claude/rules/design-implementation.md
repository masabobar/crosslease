---
layer: frontend
paths:
  - ".project-management/rules/QA-PIPELINE.md"
  - ".project-management/input/screens/**"
---

# Design-Driven Implementation (Figma)

**CONDITIONAL: Applies only when a frontend (web/mobile) story resolves a Figma design reference. No Figma reference, Figma MCP not connected, or Figma disabled → skip with one logged line. Nothing in this rule ever blocks work.**

This rule makes a Figma design a first-class input to frontend implementation: the design is loaded at plan time, implemented verbatim (copy, states, flows), and self-checked at the quality gate. It is the canonical home of the `**Figma:**` field and the Figma URL resolution order — `/generate-test-cases`, `/screen-map`, and `/execute-work` all resolve design references per §2 of this file.

**Auth model:** Figma MCP — the developer's own Figma session. **No API keys, no tokens, no credentials in the repo.** If the MCP is not connected, skip — never prompt for keys.

---

## 1. Scope & Skip Conditions

Applies when `/execute-work` implements or verifies a **frontend story** (per `.claude/rules/screen-driven-backlog.md`). Any one condition below → skip this rule entirely, log one line, continue exactly as if it didn't exist:

| Condition | Log |
|-----------|-----|
| Not a frontend story (no `**Type:** Frontend`) | *(no log — rule not triggered)* |
| **Kill switch:** `.project-management/rules/QA-PIPELINE.md` exists AND `Figma Enabled: no` | `[SKIP design] Figma disabled project-wide (QA-PIPELINE.md kill switch)` |
| No Figma URL resolvable per §2 | `[SKIP design] Design reference: none` |
| Figma MCP tools not available in the session | `[SKIP design] Figma MCP not connected` |

The kill switch is **explicit only**: QA-PIPELINE.md absent, or present with `Figma Enabled` still a placeholder / `yes`, is NOT a kill switch — explicit `**Figma:**` fields work standalone on projects that never enabled QA extras.

---

## 2. The `**Figma:**` Field & Resolution Order

### 2.1 Field definition

`**Figma:**` is an **optional** field carrying one Figma URL (multiple comma-separated URLs allowed for wizards — one per step). It exists at three levels, most specific first:

| Level | Where | Typical value |
|-------|-------|---------------|
| Story | Story field block (with `**Screen:**` etc., per `.claude/rules/screen-driven-backlog.md` §3) | Frame/node URL for the screen |
| Epic | Epic header (next to `**Priority:**`) | Page URL for the epic's screens |
| Phase | Phase header (next to `**Goal:**`) | File URL for the whole phase |

Omit the field entirely when no design exists — never write `**Figma:** none` or an invented link.

### 2.2 Resolution order (canonical — referenced everywhere, defined only here)

Check the kill switch (§1) first — if it fires, resolution stops. Otherwise, most specific wins:

1. `--figma <url>` flag (per-run override; `/generate-test-cases` only)
2. Story `**Figma:**` field — else any free-text `figma.com/...` URL in the story text or Notes (legacy scrape, kept for backward compatibility)
3. Epic `**Figma:**` header field
4. Phase `**Figma:**` header field
5. `QA-PIPELINE.md` `Figma File(s)` config — only when `Figma Enabled: yes`; the value `per-story` means "no fallback, stories carry their own URLs"

Nothing resolvable → **SKIP** with one logged line. Never an error, never a gate.

Inheritance is the same chain read top-down: a story without its own field inherits its epic's URL, then its phase's. An inherited file/page URL means "the design lives in this file — locate the frame matching the story's `**Screen:**` name."

---

## 3. Plan-Time Design Context (at /execute-work plan mode)

When a frontend story resolves a Figma reference, load the design **before** the plan is presented:

1. **Load Figma MCP schemas on demand** via ToolSearch — exact tool names vary by connector; never assume them. Prefer the design-context tool as primary; screenshots as supplementary evidence.
2. **Extract per resolved frame** — same extraction spec as `commands/modules/test-cases-design-comparison.md` §2 (do not duplicate it here): screen name + component hierarchy, verbatim copy (headings, labels, buttons, placeholders, helper/error text, links, tooltips), form fields, interactive states (default / hover / error / empty / loading / disabled), spacing/typography/color tokens, prototype navigation flows.
3. **Bake a design block into the plan** — the plan-mode output includes:

   ```
   🎨 DESIGN REFERENCE
   Source: <resolved Figma URL> (resolved from: story | epic | phase | config)
   Screens/frames: <names>
   Copy inventory: <headings, labels, button text — verbatim>
   States to implement: <per component>
   Design gaps: <missing error/empty/loading states, unlabeled fields — or "none">
   ```

4. **Design gaps go to plan RISKS** — a missing error/empty/loading state in the design is listed as a risk and flagged to the user; it is never silently invented.

Do not extract from locked or hidden nodes. Do not invent design data.

---

## 4. Implementation Discipline

- **Copy is verbatim.** Headings, labels, button text, placeholders, and error messages come from the design character-for-character. On i18n projects the design copy is the source-language translation value.
- **All designed states get implemented.** If the design shows error/empty/loading/disabled states, the implementation has them.
- **Undesigned states follow project patterns** (existing components, established error/empty conventions) and are recorded as deviations — never blocked on the designer mid-story.
- **Design is NOT an API contract source.** `.claude/rules/api-first.md` Phase A still governs data shapes. If the design shows data the verified contract doesn't provide, the contract wins: implement to the contract, flag the mismatch as a gap (backend story/bug per `api-first.md` §2) — do not stub imagined fields.
- **Test identifiers are unaffected** — `data-testid` / `testID` naming per `.claude/rules/frontend-test-identifiers.md` applies regardless of design source.
- **Deviations are recorded** in the story completion summary: what differs from the design and why (undesigned state, contract conflict, platform constraint).

---

## 5. Verification (quality-gate hook)

Runs inside the Frontend Gate of `/execute-work` (see `commands/modules/execute-work-quality-gates-domain.md`). Two steps, both non-blocking:

### 5.1 Design self-check (always, when a reference was resolved)

Compare the built screen against the §3 extracted context:

- [ ] Copy matches verbatim (headings, labels, buttons, placeholders, errors)
- [ ] Every designed state is present and reachable
- [ ] Layout/structure consistent with the component hierarchy
- [ ] Prototype flows match implemented navigation
- [ ] Deviations listed in the story summary with reasons

### 5.2 Screenshot comparison (when Playwright MCP is available)

If a Playwright-class MCP is connected: screenshot the implemented screen (per state where practical) and visually compare against the Figma frame image (Figma MCP screenshot-class tool). Report differences as **MINOR notes** in the gate output — spacing, color, typography drift. This step **never blocks**; Playwright MCP absent → line reads `screenshot comparison: skipped (Playwright MCP not connected)`.

No reference resolved at all → the whole gate line reads `skipped (no design reference)`.

**Division of labor:** this section verifies *the implementation against the design*. The deep *requirements-vs-design* comparison (AC ↔ design, severity CRITICAL/MAJOR/MINOR, blocking semantics) remains `/generate-test-cases` Stages 2–3.

---

## 6. Why

- A design opened at plan time costs minutes; a design discovered wrong at QA time costs a rework cycle.
- Verbatim copy extraction kills the largest class of design-QA bugs (text drift) before it exists.
- Formal `**Figma:**` fields make the design source greppable and inheritable — no more hunting links in chat threads; projects without Figma lose nothing.

---

**Related:**
- `.claude/rules/screen-driven-backlog.md` §3 — the story field block the `**Figma:**` field joins
- `.claude/rules/documentation-templates.md` §1.1 — base story format (optional-field family)
- `.claude/rules/api-first.md` — contract verification; wins over design on data shapes
- `.claude/rules/frontend-test-identifiers.md` — test identifiers, independent of design source
- `commands/modules/test-cases-design-comparison.md` — extraction spec (§2) + deep AC↔design comparison
- `.project-management/rules/QA-PIPELINE.md` — `Figma Enabled` kill switch + `Figma File(s)` fallback (template: `.project-management/templates/qa-pipeline-template.md`)
- `.claude/rules/screen-inventory.md` — screen map derives a Figma column from story fields
