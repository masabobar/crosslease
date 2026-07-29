# Browser Verification (Every Feature & Bug Fix)

**Version:** 1.0
**Last Updated:** 2026-07-29
**Status:** Active

**MANDATORY: Every feature and every bug fix is exercised in a real browser before it is handed off to QA. Green unit tests, a clean type-check, and a passing lint are necessary but not sufficient — none of them render a page.**

---

## 1. This is not E2E testing

Do not confuse the two. They have different owners, artifacts, and lifetimes.

|          | Browser verification (this rule)              | E2E specs (`.claude/rules/testing.md`) |
| -------- | --------------------------------------------- | -------------------------------------- |
| Who      | Claude, driving a browser interactively       | QA                                     |
| When     | After every feature / bug fix, before handoff | QA's own cycle                         |
| Artifact | None committed — a report in the conversation | `src/e2e/specs/*.spec.ts`, committed   |
| Purpose  | Did _this change_ actually work on screen?    | Regression suite                       |

`testing.md`'s rule stands unchanged: **developers do not author Playwright spec files.** This rule adds
no spec files. Never create a `.spec.ts` to satisfy it.

## 2. Why it catches what the other gates cannot

The existing gates are blind to rendering. Real failure classes that only a browser surfaces:

- **A missing i18n key renders as its own path** — the user sees `users.status.active` instead of
  "Active". `scripts/check-project-invariants.js` verifies en/de _parity_, so a key missing from **both**
  locales passes every automated check and still ships visibly broken.
- **A role gate hides the wrong thing** — the control is absent for a role that should have it, or
  present for one that should not (`security-and-auth.md` §2).
- **An empty / loading / error state was never wired**, so the screen is blank instead of informative.
- **A runtime console error** that no test asserts against.
- **The change simply doesn't match the design** — the single most common bug type filed against this
  project by QA.

## 3. Procedure

**Setup.** Dev server on `http://localhost:5173` (`pnpm dev`; `docker compose up` maps `5173:5173`).
Reuse a running server if one is up — do not start a second.

Drive it with the Playwright MCP: `browser_navigate`, `browser_snapshot`, `browser_click`,
`browser_fill_form`, `browser_console_messages`, `browser_take_screenshot`.

**Authentication.** The app is behind login and most screens are role-gated. Credentials are not in
`.env` (only `VITE_APP_STAGE`, `PROJECT_NAME`, `VITE_API_URL`), and the e2e path depends on
`E2E_SYSTEM_ADMIN_EMAIL` + an OTP fetched by `src/e2e/helpers/helper.ts`. If those are not available
locally, **ask the user to log in once** in the browser session and continue from there. Never invent
credentials, and never paste a real one into the conversation or a file.

**Verify, in this order:**

1. Navigate to the changed screen. Take a `browser_snapshot` — it is the accessibility tree, cheaper and
   more assertable than a screenshot.
2. Walk the actual acceptance criteria for a feature, or the ticket's **Expected result** for a bug fix.
   Not a general smoke test — the specific claim the change makes.
3. Exercise the interaction: submit the form, apply the filter, open the dialog, trigger the error path.
4. **Read `browser_console_messages`.** Any error or unhandled rejection is a finding, even if the UI
   looked fine.
5. Confirm no raw i18n key is visible anywhere on screen (a `.` inside otherwise-normal label text is
   the tell).
6. **State which role you were signed in as.** A verification that doesn't name the role is not
   reproducible — and for role-gated screens, check at least one role that should _not_ see the control.
7. Take one screenshot only if a visual claim needs evidence. Screenshots go to the scratchpad directory,
   **never** into the repo.

## 4. Reporting

Report what you exercised and what you observed — not "verified in browser":

```
Browser verification — FrameworkAgreementList (US-11.3-FE), role: back_office

✅ Table renders 12 agreements; columns match the design
✅ Status filter narrows to `active` (4 rows)
✅ Utilization / Limit-breach columns correctly absent (Q-022 deferral)
⚠️  Console: GET /framework-agreements?status=draft → 422 (filter sends `draft`, API expects `DRAFT`)
❌ Empty state shows a blank table body, no message
```

A verification that found nothing is a valid result — say so plainly, and say what you exercised so the
claim can be checked.

## 5. When this rule does not apply

- No UI surface changed — pure type change, comment, build config, test-only edit
- A refactor with genuinely no rendered difference (say so; don't claim verification you didn't do)
- The change is behind a role or backend state you cannot reach locally — then **say that explicitly**
  rather than reporting a pass

Never report a pass you did not observe. "Could not verify — no local data for a suspended agreement" is
useful; a fabricated ✅ is worse than no check at all.

---

## Related

- `.claude/rules/testing.md` — unit tests (dev) and E2E specs (QA); this rule replaces neither
- `.claude/commands/modules/execute-work-quality-gates.md` — where this fires in the story flow
- `.claude/rules/security-and-auth.md` §2 — role wire values to verify gates against
- `.claude/rules/design-first.md` — the Figma design this verification compares against
- `scripts/check-project-invariants.js` — i18n **parity** check; blind to keys missing from both locales

---

**Status:** ✅ Active
