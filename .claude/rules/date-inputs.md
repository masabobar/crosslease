# Date Inputs — Calendar Constraints & Cross-Field Validation

**Version:** 1.1
**Last Updated:** 2026-08-26
**Status:** Active

**MANDATORY: every date input constrains its calendar AND validates in Zod. A paired
from/until range keeps the end picker's floor in sync with the chosen start, and the calendar
floor is derived from the same decision as the Zod rule so the two can never disagree.**

Written because this defect class was filed by QA once per epic. It is always the same shape: the
schema is right, the calendar is not, so the user picks an impossible date and only finds out after
submitting.

---

## 1. Both layers, always

| Layer                                                  | What it does                                         | Alone it fails because                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Calendar** — `minDate` / `maxDate` on `<DatePicker>` | Makes the invalid date unpickable                    | A value can still arrive from a form default, a reset, a URL param or a programmatic `setValue`, and nothing explains the refusal |
| **Zod** — a refinement on the form schema              | Rejects the value and carries a translatable message | The user can pick freely and learns only on submit — **this is the bug QA keeps reporting**                                       |

Neither is optional. A greyed-out day with no schema rule is a UI suggestion; a schema rule with an
unconstrained calendar is a trap.

`src/components/ui/date-picker.tsx` already supports both bounds and maps them onto
`disabled={[{ before }, { after }]}`. Use it — never hand-roll a calendar or post-filter the days.

## 2. The floor must be derived from the Zod rule, not guessed

Off-by-one between the two is its own defect: the calendar offers a day the schema then rejects.

| Zod rule                              | Calendar floor for the end picker      |
| ------------------------------------- | -------------------------------------- |
| `until >= from` — equal dates legal   | `minDate = parseISO(from)`             |
| `until > from` — equal dates rejected | `minDate = addDays(parseISO(from), 1)` |

Both exist in this codebase, for good reasons — the Framework Agreement's backend rejects equal
dates, the Workflow Task Catalogue's accepts them. **Read the schema before setting the floor**, and
put the reasoning in a comment next to it so the next reader does not "simplify" one into the other.

## 3. A paired range is watched, not static

The end picker's floor depends on the _current_ value of the start field, so it must come from
`useWatch`, not from a value captured at render or from `defaultValues`:

```ts
const validFrom = useWatch({ control, name: "validFrom" })
const today = startOfToday()
const validUntilMin = validFrom ? parseISO(validFrom) : today
```

This is what QA means by "the calendars must be in sync": choosing a start date has to move the end
calendar's floor immediately. Falling back to `today` when no start is chosen keeps the end picker
from offering the past before the user has committed to a start.

## 4. Forward-looking, historical, and filters are three different things

Getting this wrong in the other direction — flooring something that should look backwards — is the
mirror-image bug, and it is worse because it blocks legitimate input.

| Surface                                                      | Floor at today?                   | Why                                                                                                                                                                                                                    |
| ------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Create** a record with a validity window                   | **Yes** on the start date         | A new record cannot start in the past; most backends reject it outright, so the calendar should too                                                                                                                    |
| **Edit** an existing record                                  | **Only while it is a draft**      | An active record legitimately started in the past — and its start date is usually locked anyway. A draft has not started, so the Create rule still applies to it — QA rejected leaving it unconstrained (PRD1042-1652) |
| **Filters** — audit history, list panels, date-range pickers | **Never**                         | These look backwards by definition. Constrain only the pair (`to >= from`)                                                                                                                                             |
| **An end date** in any of the above                          | Floor at the **start**, not today | An end before its own start is not a range                                                                                                                                                                             |

## 5. Every cross-field rule needs a message

The refinement carries a message _code_, the feature's resolver maps it to i18n, and the key exists in
**both** locales. A cross-field failure with no visible message is indistinguishable from a dead
submit button.

```ts
.refine(data => !data.validUntil || data.validUntil >= data.validFrom, {
  message: "validUntilBeforeValidFrom",
  path: ["validUntil"],   // <- put the error on the field the user must fix
})
```

`path` matters: without it the issue lands on the object root and no field renders it.

## 6. Review checklist

- [ ] Every `<DatePicker>` passes `minDate` and/or `maxDate`, or the surface is a filter / an edit of an already-active record (§4)
- [ ] Every cross-field date rule exists in Zod, not only in the calendar
- [ ] The calendar floor matches the Zod rule's inclusivity exactly (§2)
- [ ] A paired end picker derives its floor from `useWatch` on the start field (§3)
- [ ] Each refinement has a `message` code, a `path`, and a key in `en` **and** `de`
- [ ] Editing an **active** record does not floor its start date at today — but editing a **draft** does (§4)
- [ ] New pickers carry `data-testid` (QA's E2E suite selects on it)

## 7. Reference implementations

- **Strict-after pair** — `features/frameworkAgreements/components/steps/ValidityTemplatesStep.tsx`:
  `minDate={today}` on the start, `addDays(from, 1)` on the end.
- **Draft-only floor** — `features/frameworkAgreements/components/steps/EditIdentityStep.tsx`: the same
  `minDate={today}` on the start date, with the field `disabled` once the agreement leaves Draft — so
  the floor only ever reaches a draft, and an active agreement's past start date is never refused (§4).
- **Inclusive pair** — `features/workflowTaskCatalog/components/CreateWorkflowTaskCatalogDialog.tsx`:
  the same shape with `parseISO(from)` as the floor, because that schema accepts equal dates.

## 8. Known and deliberate exceptions

Do not "fix" these — they are correct, and each has a reason:

- Filter surfaces — audit history, the user and tenant filter panels, audit quick filters — floor
  nothing at today; they query the past.

---

## Related

- `.claude/rules/code-review.md` §4 — Forms checklist; this rule is the date-specific expansion
- `.claude/rules/api-first.md` — confirm the backend's own date rule before choosing a floor; the
  Workflow Task Catalogue's zero-day backdating tolerance is why its create floor is today
- `.claude/rules/testing.md` — cross-field refinements are schema logic and get unit tests
- `src/components/ui/date-picker.tsx` — the primitive; `minDate` / `maxDate` are already supported

---

**Status:** ✅ Active
