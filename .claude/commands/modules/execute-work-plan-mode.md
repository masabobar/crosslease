# Execute Work — Plan Mode

**Referenced by:** `execute-work.md` STEP 2

Plan mode is mandatory. Nothing is implemented until the plan is approved.

```
📋 [PLAN MODE ACTIVATED]
Analyzing: PRD1042-XXXX — <title>
```

---

## 2.1 Read the context

Every path below exists in this repo — if one is missing, say so rather than inventing a substitute.
There is no technical spec and no local backlog; the PRD/architecture docs are untouched `/init-project`
stubs (Q-025), so do not cite them as a source.

1. **The Jira unit** — the sub-task _and_ its parent (acceptance criteria live on the parent), plus any
   governing CR found in STEP 1. Where a CR and the epic disagree, **the CR wins** — it is the November
   scope; the epic is the original ambition.
2. **`openapi.json`** — the API contract source of truth. Run `pnpm fetch:openapi` if it looks stale, and
   read `../refinext-api/` for service-level detail (validation rules, permission checks).
3. **`CLAUDE.md`** — code standards, MUST NOT DO list, project structure.
4. **`.claude/rules/`** — the always-load set plus whatever the unit triggers; see the CRITICAL RULES
   list in `execute-work.md`, indexed with triggers in `.claude/rules/project/README.md`.
5. **`.project-management/rules/project-rules.md`** — domain rules, role wire values, Four-Eyes constraints.
6. **`.project-management/rules/I18N-RULES.md`** — present in this repo, so **i18n is always mandatory**.
7. **`.project-management/input/open-questions.md`** — grep for the epic/unit first. An existing entry
   may already record the gap you are about to rediscover, or may itself be stale.
8. **The existing code** — the feature folder, the router, the i18n namespaces. Read before planning to
   change.

---

## 2.2 Phase A — API contract gate (`api-first.md`)

For each screen the unit touches, list every endpoint it calls (method + path), then verify:

- [ ] Endpoint exists in `openapi.json` (or is committed in a BE story already in flight)
- [ ] Every UI input maps to a request field, with the right type and required/optional flag
- [ ] Every value the UI renders exists in the response shape
- [ ] Error states the UI must distinguish have distinguishable codes
- [ ] The auth model matches — the endpoint enforces what the screen assumes

**Result:** ✅ complete → continue · ⚠️ gaps → **Blocked**, per §2.4 below.

Watch for the partial case: the catalog-style endpoints often exist while a _design-time preview_ or
_diff_ endpoint does not. Half a contract still blocks the half that is missing — scope the unit down to
what is verified rather than stubbing the rest.

---

## 2.3 Phase A — Design gate (`design-first.md`)

- [ ] Figma URL for the screen requested and fetched (`get_design_context`, `get_screenshot`)
- [ ] Component inventory extracted
- [ ] Key states visible — empty, loading, error, populated
- [ ] For a surface the CR _adds_, confirm a design exists for **that** surface; a design covering the
      old scope does not cover a new one

**Result:** ✅ complete → continue · ⚠️ missing → **Blocked** (`design_missing`), per §2.4.

Phase B still applies during STEP 3: before creating each new `.tsx`, locate that component in the design
or ask for its frame URL. A guessed skeleton is worse than no file.

---

## 2.4 When a gate fails

Do not implement around it, and do not build a decorative shell.

1. State the gap concretely — field names, status codes, error codes, role checks, missing frames.
2. Append an entry to `.project-management/input/open-questions.md` (`P0` for a blocker, category
   `api-contract` or `design`), referencing the unit key.
3. Open the backend or design work in Jira.
4. Mark the unit **Blocked by: `<KEY>`** and stay in plan mode.

If the gap is genuinely trivial and backend-side, it is still valid to land the BE change first, then
resume. The rule is only that **the contract lands before the frontend that consumes it.**

---

## 2.5 The plan

```markdown
🎯 SCOPE: PRD1042-XXXX — <title>
Governing scope: <CR key, or "epic as written">

📊 BREAKDOWN

- <task> → files touched
- <task> → files touched
- Tests: <new Zod schemas / store actions / lib utilities needing cover>
- i18n: <namespaces and keys, en + de>

✅ GATES

- API contract (Phase A): ✅ / ⚠️ <gap>
- Design (Phase A): ✅ / ⚠️ <gap>

⚠️ DEPENDENCIES: <other units, BE work, PO decisions still open>

🔴 RISKS: <risk> (impact: high / medium / low)

✅ SUCCESS CRITERIA

- pnpm test:run · type-check · lint · check-project-invariants.js all clean
- New schemas / store actions / utilities tested
- Every BE error code surfaced with errors.<CODE> keys in en + de
- /code-review clean of Critical and High
- Verified in a browser, role named
- Commit follows git.md (ticket present, no AI credits)

🎯 STRATEGY: <approach, patterns reused, key decisions, what is deliberately left out>
```

Estimate in tasks and risks, not in story points, hours, or velocity — none of those are tracked in this
project.

---

## 2.6 Approval

```
📋 [END OF PLAN]
✅ Proceed? [Yes / No / Revise]
```

- **Yes** → STEP 3 (implement)
- **No** → stop
- **Revise** → ask what to change, regenerate, ask again

If the plan reveals that the unit's scope is wrong — over-built, superseded by a CR, or larger than one
screen — say so here and propose the trim. Raising it at plan time costs minutes; discovering it mid-
implementation costs the implementation.

---

**Next:** `execute-work.md` STEP 3.
