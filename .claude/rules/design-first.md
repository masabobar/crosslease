# Design-First Enforcement (Web Screens & Components)

**Version:** 1.0
**Last Updated:** 2026-06-04
**Status:** Active

**MANDATORY: Before implementing any new screen, a Figma design URL must be provided and reviewed. Before creating each new component file within that screen, a Figma design URL for that component must also be provided. Implementation is blocked until designs are supplied.**

Works alongside `.claude/rules/api-first.md` (which gates implementation on API contract) and `.claude/rules/screen-driven-backlog.md` (which structures stories around screens). This rule gates implementation on design fidelity.

---

## 1. The Rule

Frontend story execution has two design-verification phases. Neither can be skipped.

### Phase A — Screen Design Verification (Plan Mode, before any code)

Before exiting plan mode for a frontend story, Claude must:

1. **Ask the user for the Figma URL** for the screen being implemented.
2. **Fetch the design** via the Figma MCP (`get_design_context` + `get_screenshot`).
3. **Extract a component inventory** — list every distinct UI component visible in the design.
4. **Confirm the design is sufficient** — it must show layout, spacing, and key states (empty, loading, error, populated) where applicable.

If the Figma URL is not provided → **STOP. Mark story as Blocked.** Do not exit plan mode. Go to §2.

### Phase B — Component Design Verification (During Implementation)

Before creating each new component file (`.tsx`), Claude must:

1. **Locate the component** in the Figma design fetched in Phase A.
2. **Ask for a component-specific Figma URL** if the component is not clearly visible in the screen-level design (e.g. it lives in a separate Figma frame or component page).
3. **Review the component design** before writing any JSX.

If the component cannot be located and no URL is provided → **STOP.** Do not create the component file. Go to §3.

---

## 2. When Phase A Fails: How to Block

Do not guess a layout from the story description. Do not build a placeholder screen to be updated later.

1. **State clearly what is missing:**
   ```
   Screen: PendingApprovalsScreen
   Design gap: No Figma URL provided.
   Implementation is blocked until the design is supplied.
   ```
2. **Append the gap to `.project-management/input/open-questions.md`** so it appears in `/resolve-questions`. Use priority P0, category `design`, and reference the blocking story ID.

   Example entry:

   ```
   ### Q-XXX: Figma design missing for PendingApprovalsScreen (US-031)
   **Status:** Open
   **Priority:** P0 (Blocker)
   **Category:** design
   **Asked During:** /execute-work story US-031

   **Question:** No Figma design URL was provided for the PendingApprovalsScreen.
   Please share the Figma link so implementation can proceed.

   **Impact if Unresolved:** US-031 cannot be implemented.
   ```

3. **Mark the story as Blocked** with reason `design_missing`.
4. **Resume** only after the Figma URL is provided and Phase A re-verifies clean.

---

## 3. When Phase B Fails: How to Block a Component

Do not create an empty or guessed component file — a wrong skeleton is worse than nothing.

1. **State the blocked component:**
   ```
   Component: ApprovalStatusBadge
   Design gap: Not visible in screen-level design. No component-specific Figma URL provided.
   Skipping — add the URL to continue.
   ```
2. **Skip that component** and continue implementing others that have designs.
3. **Log all skipped components** in the story progress under a `Design gaps` section.
4. **Append each skipped component to `.project-management/input/open-questions.md`** using priority P1, category `design`, referencing the story ID.

   Example entry:

   ```
   ### Q-XXX: Figma design missing for ApprovalStatusBadge component (US-031)
   **Status:** Open
   **Priority:** P1 (Important)
   **Category:** design
   **Asked During:** /execute-work story US-031

   **Question:** ApprovalStatusBadge is required by US-031 but has no Figma design.
   Please share the component's Figma frame URL so it can be implemented.

   **Impact if Unresolved:** Component left as a stub; screen US-031 is incomplete.
   ```

---

## 4. Verification Checklist (Phase A — run during /execute-work plan mode)

For each frontend story, before exiting plan mode:

- [ ] Figma URL requested from user
- [ ] Design fetched via Figma MCP (`get_design_context`)
- [ ] Component inventory extracted (list all distinct components)
- [ ] Key states visible (empty / loading / error / populated)
- [ ] **Result:** ✅ design complete (proceed) OR ⚠️ design missing (block + request URL)

This checklist is part of the plan-mode output, not optional commentary. User approves it before implementation starts.

---

## 5. Verification Checklist (Phase B — before each new `.tsx` file)

- [ ] Component located in screen-level Figma design (Phase A) OR separate URL provided
- [ ] Visual structure, spacing, and states reviewed
- [ ] Props and variants inferred from the design (not guessed)
- [ ] **Result:** ✅ ready to implement OR ⚠️ design missing (skip + log gap)

---

## 6. Figma MCP Usage

| Tool                 | When to use                                                 |
| -------------------- | ----------------------------------------------------------- |
| `get_design_context` | Primary — extracts component tree, text, styles, layout     |
| `get_screenshot`     | Visual confirmation for complex layouts                     |
| `get_metadata`       | Verify the file and node exist before fetching full context |

Extract `fileKey` and `nodeId` from the URL:
`figma.com/design/:fileKey/:fileName?node-id=:nodeId` — convert `-` to `:` in `nodeId`.

---

## 7. Exemptions

This rule can be skipped only when:

- The story is a **pure refactor** of an existing screen with no visual changes
- The story modifies **only data/logic** — no new components, no layout changes
- The component is **non-visual** — a context provider or data-fetching wrapper with no JSX output

In every other frontend story that creates a new screen or a new component, this rule applies.

---

## 8. Why

- Implementing from a written description produces UI that doesn't match the design. Fixing it after the screen is built costs far more than reading the design first.
- Component-level checks prevent "I'll match the design at the end" drift — catching gaps at creation time costs seconds; catching them after the screen is assembled costs hours.
- The Figma MCP makes this zero-friction: a URL and a single tool call is all that's needed.

---

**Related:**

- `.claude/rules/api-first.md` — parallel gate for API contract; both Phase A gates must pass before implementation
- `.claude/rules/screen-driven-backlog.md` — screen-level story structure that this rule extends
- `.claude/rules/code-review.md` — post-implementation design fidelity check
- `.claude/commands/execute-work.md` — plan-mode hook where Phase A fires

---

**Status:** ✅ Active
