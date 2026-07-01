# Process Client Docs - Extraction Module

**Purpose:** Methods for extracting structured requirements from client documents.

**Parent Command:** `/process-client-docs`

---

## Module Structure

This module is split into focused sub-modules for AI readability:

1. **[Extraction Principles & Patterns](extraction-principles.md)** - Core principles, priorities, estimation, patterns
2. **[Extraction by Document Section](extraction-by-section.md)** - Vision, features, tech stack, timeline, ambiguities
3. **[Quality & Output](extraction-quality-output.md)** - Quality checks, file generation, validation

**For AI:** Read specific modules as needed based on current task context. Each module <200 lines.

---

## Quick Reference

### Extraction Principles

**Key concepts:**

- Read between the lines (explicit + implicit requirements)
- Organize by user value (Epics → Stories)
- Assign priorities (P0/P1/P2/P3)
- Estimate story points (Fibonacci scale)
- Use user-centered extraction patterns
- Include non-functional requirements
- Synthesize across multiple documents

**[Full details →](extraction-principles.md)**

---

### Document Sections to Extract

**Extract from these sections:**

- **Vision & Goals** → scope.md (vision, objectives, success criteria)
- **Features & Requirements** → backlog.md (epics, stories, criteria)
- **Technology Stack** → technologies.md (frameworks, tools, integrations)
- **Timeline & Constraints** → constraints.md (dates, budget, compliance)
- **Ambiguities** → Flag for clarification

**[Full extraction methods →](extraction-by-section.md)**

---

### Quality & Output

**Quality checks:**

- All features captured
- Stories follow template (As a... I want... So that...)
- Acceptance criteria testable
- Priorities and estimates assigned
- Dependencies identified
- English only

**Output files:**

- scope.md
- backlog.md
- technologies.md
- constraints.md

**[Full quality guide →](extraction-quality-output.md)**

---

## Extraction Workflow

```
1. READ all client documents
   - PDFs, Word, images, text files
   - Multiple documents if provided

2. EXTRACT by section
   - Vision/goals → scope.md
   - Features → backlog.md (epics + stories)
   - Tech stack → technologies.md
   - Timeline/constraints → constraints.md

3. ORGANIZE
   - Group stories into epics
   - Assign priorities (based on client emphasis)
   - Estimate story points (Fibonacci scale)
   - Identify dependencies
   - Generate acceptance criteria

4. FLAG ambiguities
   - Document assumptions
   - List clarification questions

5. GENERATE files
   - scope.md
   - backlog.md
   - technologies.md
   - constraints.md

6. VALIDATE
   - Quality checks
   - Completeness review
   - Format verification

7. PRESENT to user
   - Extraction summary
   - Clarification questions
   - Next steps
```

---

## Related Files

**Parent:** `.claude/commands/process-client-docs.md`
**Sibling:** `process-client-docs-reading.md`
**Sub-modules:**

- `extraction-principles.md`
- `extraction-by-section.md`
- `extraction-quality-output.md`

**Templates:** `.project-management/templates/`
**Rules:** `CLAUDE.md` (English-only policy)

---

**Note:** This is a condensed module overview. For detailed extraction methods, see the sub-module files linked above.
