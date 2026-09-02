# Prototype Mode — Mocked Data & Responsiveness Overrides

**Version:** 1.0
**Last Updated:** 2026-09-02
**Status:** Active — **scoped override, not a new default**

**This file authorises two deliberate departures from the standing rules.** Both were requested by the
user on 2026-09-02. Each reverses a rule that is otherwise in force, so each is written down here rather
than applied silently.

Precedence: `.project-management/rules/project-rules.md` > **CLAUDE.md** > `.claude/rules/project/*`.
This file sits in the last tier, so where it contradicts CLAUDE.md the contradiction is **explicit and
intentional** — flag it if you think it has outlived its purpose rather than following it blindly.

---

## 1. Override A — mocked data is permitted for review screens

### What the standing rule says

`.claude/rules/project/api-first.md` §4, _"Design Has It, Backend Doesn't — Don't Implement Fake UI"_:

> Do not implement placeholder or decorative versions of that element. […] Do not invent a response
> shape and stub it. Do not "do the frontend now and fix the API later."

Its reason, quoted because it is the thing this override must not cause: _fake UI misleads users and
reviewers into thinking the feature works, and the delta between "looks done" and "is done" becomes
invisible._

### Why it is overridden

23 of the 37 stories in PRD1042-11 have **no backing endpoint at all** (19 missing endpoint families).
There is also no usable login for the dev API on this machine. Without a mock layer the app cannot be
opened at all, so neither the design nor the built screens can be reviewed.

### What is authorised

- **Reviewing** the app against mocked data, to see what is built and how it compares to the design.
- Mocking the read surfaces that make a screen render. As built, `src/mocks/handlers/` covers:
  **auth** (login, logout, refresh, `/users/me`, `/users/me/permissions`) · **cases** (list, detail,
  create, claim, reject, startable types, LC list) · **checklist** (items, required projection, phase
  gates, item PATCH) · **business config** (partners, duplicate pairs, framework agreements,
  utilisation, product templates, and the two lookups wizard step 1 reads) · **users** (list, detail) ·
  and the **fallback** below.
- Extending that set to another screen, on the same terms.

### What is NOT authorised

- **Mocking a story that already has a contract.** Seven stories clear the API gate (US 1.2, 1.3, 1.6,
  1.13, 1.19, 1.23, 1.28) — those are built against the real API. Mocking them is work that must be
  un-done.
- **Marking a mocked screen `QA ready`.** This would collide with `/jira-handoff` and put fake UI in
  front of QA.
- **A catch-all returning empty _data_.** Returning `{ items: [] }` for everything makes every unbuilt
  screen look finished and empty — precisely the invisible delta §4 warns about.

  The catch-all in `handlers/fallback.ts` is the permitted opposite: it answers **501
  `MOCK_NOT_IMPLEMENTED`** with the method and path in the message, so the screen shows its error state
  and the toast names the endpoint to mock next. It exists because without it an unmocked call escapes
  to the real API, whose 401 sends `@/lib/api` down the refresh-then-`clearAuth()` path — so visiting
  any unmocked screen silently logged the reviewer out. It must stay registered **last**, and it must
  never return a success shape.

### Guard rails, as built

| Rule                        | How it is enforced                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cannot reach production     | Double-guarded: `import.meta.env.DEV` **and** `VITE_USE_MOCKS === "true"` in `src/main.tsx`. DEV is statically false in a production build, so Rollup drops the branch and msw never enters the bundle |
| Greppable                   | Every mock file opens with `PROTOTYPE MOCK`. `grep -rl "PROTOTYPE MOCK" src/` is the full inventory                                                                                                    |
| One directory               | All of it lives in `src/mocks/`. Deleting that directory plus the `main.tsx` block and `public/mockServiceWorker.js` removes the feature entirely                                                      |
| Fails loudly, not quietly   | Handlers parse their output through the **real** Zod schema (`UserResponseSchema`). A fixture that drifts throws in one place instead of rendering a broken screen                                     |
| Mock is the disposable half | **Zod schemas are written first, mocks second.** The schema survives when the API lands; the handler is deleted                                                                                        |

### Exit criterion

When an endpoint family ships, its handler is **deleted** — never kept as a fallback. Deletion must make
the app fail visibly (a network error), not degrade into stale fake data.

### Why MSW and not stubs

Mocking at the network layer keeps `@/lib/api`, the 401-refresh interceptor, envelope unwrapping, Zod
`parse()` and React Query all on the real code path. Stubbing inside `features/*/api/` bypasses
`parse()` — which is the drift `api-first.md` exists to prevent — and means editing real files that must
later be un-edited.

---

## 2. Override B — responsiveness is now in scope _(unresolved)_

### What the standing rule says

`CLAUDE.md` §Responsive design:

> This app is primarily used on desktop. Responsiveness is **not a priority** […] use Tailwind's
> responsive prefixes where it costs nothing, but **do not add breakpoint complexity just for mobile.**

Echoed in `screen-driven-backlog.md` §4 and `stack-specific.md`.

### Status: requested, but not yet actionable

The user asked for "everything responsive". **It cannot be implemented as stated**, for one concrete
reason: **there is no responsive design.** All 16 delivered Figma frames are desktop — a sidebar plus a
~1440px content column. `design-first.md` blocks implementation without a design and says _"Do not guess
a layout from the story description."_

And on these screens responsiveness is a **design** decision, not a CSS one. The Financings list has ten
columns; it does not become responsive by adding Tailwind prefixes. Someone must choose between
horizontal scroll, column priority with hiding, or a card layout below a breakpoint — three different
designs.

### What applies until it is settled

**CLAUDE.md's semi-responsive floor, everywhere** — it is already required and costs nothing: no fixed
pixel widths that break obviously, Tailwind prefixes where free, no breakpoint complexity invented
without a design.

### What is needed to make it actionable

1. Which viewports actually matter — tablet, phone, or both
2. Which screens — all 37, or the LC portal plus a named subset
3. What wide data tables do below the breakpoint
4. Who designs it — designer supplies frames, or FE is authorised to decide

**Recommendation on record:** scope full responsiveness to the **LC portal (US 1.35)** first. It is the
one surface with a plausible mobile user — bank back-office work is desktop — so it tests the value at
the lowest cost. Request mobile frames for it before anything else.

Tracked as **Q-012** in `.project-management/input/open-questions.md`.

---

## 3. Review checklist

When reviewing a change that touches either override:

- [ ] No mock handler exists for a story that has a live contract
- [ ] Every mock file carries the `PROTOTYPE MOCK` marker
- [ ] Nothing outside `src/mocks/` imports from `src/mocks/`, except the guarded block in `main.tsx`
- [ ] Mock output is parsed by the real schema, not hand-shaped
- [ ] No mocked screen has been handed to QA
- [ ] Responsive work beyond the semi-responsive floor is backed by an actual design

---

## Related

- `.claude/rules/project/api-first.md` §4 — the rule Override A departs from
- `CLAUDE.md` §Responsive design — the rule Override B departs from
- `.claude/rules/project/design-first.md` — why Override B is blocked
- `.project-management/output/phases/phase-3.md` — the 23 stories this exists to unblock
- `.project-management/input/open-questions.md` — Q-010 (mocks), Q-012 (responsive)

---

**Status:** ✅ Active — revisit when the first endpoint family ships
