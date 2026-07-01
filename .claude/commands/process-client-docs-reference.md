# Process Client Docs — Reference

Companion to `process-client-docs.md`. Holds file-format specs, the summary report template, quality checks, common pitfalls, and an example trace.

---

## File-Format Specs (STEP 3 outputs)

### `input/scope.md`

Sections:

- **Project name** + vision
- **Target audience**
- **Core objectives** — 3-5 key goals
- **Success criteria** — measurable outcomes
- **Out of scope** — what's explicitly NOT included
- **Stakeholders**
- **Dependencies, assumptions, risks**

### `input/backlog/` (modular)

Generated **directly** — no migration step. Structure:

```
input/backlog/
├── README.md                   # master index + totals + links
├── phase-1-foundation.md       # infra, auth, DB, core API (P0)
├── phase-2-core.md             # main features, critical flows (P0/P1)
├── phase-3-advanced.md         # secondary features (P1/P2)
├── phase-4-polish.md           # testing, deployment, bug fixes
└── future.md                   # post-launch (P3)
```

**Phase categorization logic:**

- **Phase 1** — infrastructure, authentication, database, core API. P0 only.
- **Phase 2** — main features, critical user flows. P0/P1.
- **Phase 3** — secondary features, enhancements. P1/P2.
- **Phase 4** — testing, deployment, bug fixes, optimizations.
- **Future** — post-launch, v2.0+ enhancements. P3 or "Future" marked.

**File size:** each file < 200 lines (hard). Target 150-180 (optimal). If a phase exceeds 200L, split into sub-phases: `phase-2a-core-features.md` + `phase-2b-integrations.md`.

**Templates:**

- `phase-backlog-template.md` — phase files
- `backlog-readme-template.md` — README.md

### `input/technologies.md`

- Technologies mentioned in source docs
- Client preferences
- Constraints ("must use X", "cannot use Y")
- Recommendations if there are gaps (note as "Claude recommendation" so client can reject)

### `input/constraints.md`

- **Timeline** — deadlines, milestones
- **Budget** — hard limits, flexibility
- **Team** — size, skills, availability
- **Technical** — existing systems, infrastructure, integrations
- **Compliance** — GDPR, HIPAA, SOC2, etc.
- **Quality** — performance (latency, throughput), security, scalability targets

---

## STEP 4 — Summary Report Template

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 CLIENT DOCUMENTS PROCESSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 DOCUMENTS READ:
✅ {{document_1.pdf}} ({{pages}} pages)
✅ {{document_2.docx}} ({{pages}} pages)
✅ {{mockup.png}} (wireframe analyzed)

📊 EXTRACTED INFORMATION:

Project Overview:
- Name:             {{project_name}}
- Type:             {{project_type}}
- Target Audience:  {{audience}}

Features Identified:
- Total Epics:      {{epic_count}}
- Total Stories:    {{story_count}}
- Priorities:       P0 {{p0}} / P1 {{p1}} / P2 {{p2}} / P3 {{p3}}

Tech Stack:
- Mentioned:        {{tech_list}}
- Preferences:      {{preferences}}
- Constraints:      {{tech_constraints}}

Constraints:
- Timeline:         {{timeline}}
- Budget:           {{budget}}
- Team:             {{team_size}}

📝 FILES GENERATED/UPDATED:
✅ input/scope.md
✅ input/backlog/ (modular structure)
   ├─ README.md                  ({{lines}} lines)
   ├─ phase-1-foundation.md      ({{lines}} lines)
   ├─ phase-2-core.md            ({{lines}} lines)
   ├─ phase-3-advanced.md        ({{lines}} lines)
   ├─ phase-4-polish.md          ({{lines}} lines)
   └─ future.md                  ({{lines}} lines)
✅ input/technologies.md
✅ input/constraints.md

⚠️  CLARIFICATION QUESTIONS IDENTIFIED:
- Total:        {{total_questions}}
- P0 Blocker:   {{p0_count}}
- P1 Important: {{p1_count}}
- P2 Nice:      {{p2_count}}
(Full text + options will be presented one-by-one in STEP 5 — interactive Q&A.)

🎯 PROCEEDING TO STEP 5 — Interactive Clarification Gate
   (See modules/interactive-clarifications.md. Skip option always available.
    Skipped questions land in input/open-questions.md and can be resumed
    later via /resolve-questions.)

💡 Modular backlog structure generated automatically — no need to run /migrate-to-modular.
```

After STEP 5 completes, the final next-steps block (STEP 6 in `process-client-docs.md`) shows:

```
NEXT STEPS:
1. Review files in .project-management/input/
2. If any P0 questions remain Open → /resolve-questions --priority P0
3. /estimate-ai-hours for an immediate AI rapid-dev hours estimate
4. /init-project to generate PRD, technical spec, and sprint structure
```

---

## Quality Checks (before finishing)

- [ ] All documents read and processed
- [ ] All input files generated/updated (scope, backlog/, technologies, constraints)
- [ ] Backlog is modular (directory, not single file)
- [ ] Each phase file < 200 lines (strict)
- [ ] README.md < 200 lines
- [ ] Epics and stories well-organized by phase
- [ ] Priorities assigned logically (based on client emphasis, not arbitrary)
- [ ] Constraints documented
- [ ] Ambiguities flagged for clarification (don't silently guess)

---

## Common Pitfalls

❌ Skipping documents or sections ("it's just appendix")
❌ Missing implicit requirements (a process sketch in a diagram is a requirement)
❌ Poor organization (dumping every feature into one epic)
❌ Not flagging ambiguities — silently choosing is worse than asking
❌ Guessing tech stack the client hasn't committed to (mark as recommendation)
❌ Generating a single monolithic `backlog.md` — framework expects modular since v3.1

---

## Example Trace

```
user: /process-client-docs

Claude (STEP 0): Found 3 docs, creates plan...
                 [shows plan with extracted summary]
                 Proceed? [Yes]

user:  Yes

Claude (STEP 1): 🔍 Reading project-proposal.pdf (12 pages)...
                 🔍 Reading wireframes.png (mockup)...
                 🔍 Reading requirements-email.txt...

Claude (STEP 2): Extracting requirements...
                 - 6 epics identified
                 - 25 stories total
                 - Priorities: 8 P0, 12 P1, 5 P2

Claude (STEP 3): ✍️  Writing input/scope.md
                 ✍️  Writing input/backlog/ (6 files)
                 ✍️  Writing input/technologies.md
                 ✍️  Writing input/constraints.md

Claude (STEP 4): [shows summary block]

                 ⚠️  NEEDS CLARIFICATION:
                 - "fast" response time — what p95 latency target?
                 - Is the existing user database being migrated or replaced?
                 - Client mentioned "international" — which regions?

                 🎯 NEXT STEPS:
                 1. Review generated files
                 2. Ask client about the 3 items above
                 3. Run /estimate-ai-hours for AI rapid-dev hours estimate
                 4. Run /init-project
```

---

**Version:** 3.3.0
**Created:** 2026-04-21 (split from `process-client-docs.md`)
