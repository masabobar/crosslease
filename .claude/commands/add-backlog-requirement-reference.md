# Add Backlog Requirement — Reference

Companion to `add-backlog-requirement.md`. Holds the story/epic templates, the completion-report template, and a worked example.

---

## Story Template (inserted under the target version section)

```markdown
#### US-XXX: [Story Title]

**Status:** Future
**Priority:** [High/Medium/Low]
**Target Version:** [2.0/3.0/Unversioned]
**Story Points:** [1-13]
**Epic:** [Epic name if applicable]

**Description:**
[User story]

**Acceptance Criteria:**

- [ ] Criterion 1
- [ ] Criterion 2

**Definition of Done:**

- [ ] Implementation complete
- [ ] Tests written
- [ ] Documentation updated

**Notes:**
[Additional context]
```

---

## Epic Template

```markdown
### Epic X: [Epic Name] ([X] story points)

**Status:** Future
**Target Version:** [2.0/3.0/Unversioned]
**Priority:** [High/Medium/Low]

**Goal:**
[What this epic achieves]

**User Stories:**

- (Stories will be added under this epic)

**Notes:**
[Strategic context]
```

---

## Completion Report Template (STEP 4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FUTURE REQUIREMENT ADDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ID: US-XXX
TITLE: {{Requirement title}}
TYPE: {{Story / Epic}}
TARGET VERSION: {{2.0 / 3.0 / Unversioned}}
PRIORITY: {{High / Medium / Low}}
STORY POINTS: {{X}}
STATUS: Future

ADDED TO:
- backlog-future.md ({{Version}} section)

NOT IN ACTIVE DEVELOPMENT:
This requirement is planned for a future version
and is NOT assigned to any current phase (1-4).

FUTURE BACKLOG SUMMARY:
- Version 2.0: {{X}} requirements
- Version 3.0: {{Y}} requirements
- Unversioned: {{Z}} requirements
- Total Future: {{X+Y+Z}} requirements

WHEN READY TO DEVELOP:
Promote to active development:
/promote-requirement US-XXX --to-phase N

Or view all future requirements:
cat .project-management/input/backlog-future.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Example Walkthrough — Add a Story to Version 2.0

```
User: /add-backlog-requirement story

Claude: [STEP 0: Plan Mode]
        Reading backlog files...
        - Active backlog max ID: US-045
        - Future backlog max ID: US-030
        - Next ID: US-046

        Proceed? [Yes/No]

User: Yes

Claude: [STEP 1: Gather Information]

        Story title?

User: Dark mode theme support

Claude: Target version?
        [1] 2.0 - Post-launch enhancements
        [2] 3.0 - Major future features
        [3] Unversioned - Ideas

User: 1

Claude: Priority within Version 2.0?
        [1] High  [2] Medium  [3] Low

User: 2

Claude: Description (user story format)?

User: As a user, I want to switch between light and dark themes so that I can reduce eye strain and match my system preferences.

Claude: Acceptance criteria? (enter list, press Enter twice when done)

User:
- [ ] Theme toggle in settings
- [ ] Persist theme preference
- [ ] Dark theme for all pages
- [ ] Smooth theme transition

Claude: Story points estimate: 5 (Medium complexity, UI changes)
        Accept? [Yes / Enter different number]

User: Yes

Claude: [STEP 3: Adding to future backlog]
        ✅ Added US-046 to Version 2.0 section

        [Shows completion report]
```

---

## Related

- `add-backlog-requirement.md` — orchestrator
- `add-scope.md` — active-development equivalent (for Phases 1-4)
- `promote-requirement.md` — move a future requirement into an active phase

---

**Version:** 3.3.0
**Created:** 2026-04-21 (extracted from `add-backlog-requirement.md` to meet documentation.md §2.1 soft target)
**Parent:** `add-backlog-requirement.md`
