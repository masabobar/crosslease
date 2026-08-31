# Documentation Rules

**Version:** 1.1
**Last Updated:** 2026-05-10
**Status:** Active

Core documentation rules: language, file-size limits, writing style, and the quality checklist. See companion files for templates and extras:

- **`.claude/rules/project/documentation-templates.md`** — where each artifact lives (Jira, `openapi.json`, `open-questions.md`) and what shape to expect
- **`.claude/rules/project/documentation-extras.md`** — Code Comments, Diagrams, Tools, Good/Bad Examples

---

## 1. Language Requirements

### 1.1 Primary Rule: English Only

**ALL documentation MUST be written in English.**

This includes:

- ✅ All `.md` files (README, PRD, technical specs, architecture docs)
- ✅ Code comments (inline comments, docstrings, JSDoc)
- ✅ Commit messages
- ✅ Pull request descriptions
- ✅ Issue descriptions
- ✅ User stories and acceptance criteria
- ✅ Technical tasks descriptions
- ✅ API documentation
- ✅ Inline code examples
- ✅ Error messages in code
- ✅ Log messages
- ✅ Configuration file comments

**Exceptions:**

- ❌ User-facing UI text (use i18n - see I18N-RULES.md)
- ❌ Client communications (use client's language)
- ❌ Translation files (locales/\*.json)

### 1.2 Rationale

English-only keeps the project collaboration-ready, AI/tooling-compatible, searchable, and consistent across reviews.

---

## 2. File Size Limits

### 2.1 Strict Limits

**Every documentation file MUST follow these limits — except registers, which are exempt per §2.3:**

| File Type           | Max Lines     | Target Lines | Rationale                        |
| ------------------- | ------------- | ------------ | -------------------------------- |
| Phase backlog files | **200 lines** | 150-180      | Readability, AI token efficiency |
| README.md (backlog) | **200 lines** | 150          | Quick reference, master index    |
| User stories        | **50 lines**  | 30-40        | Focused, single purpose          |
| Technical specs     | **600 lines** | 400-500      | Comprehensive but manageable     |
| Architecture docs   | **600 lines** | 400-500      | Detailed but scannable           |
| PRD (Product Req)   | **400 lines** | 300-350      | Complete but concise             |
| Progress snapshots  | **300 lines** | 200-250      | A status at one point in time    |
| Registers, journals | **no cap**    | —            | Grow by design — see §2.3        |
| Templates           | **300 lines** | 200-250      | Reusable patterns                |

### 2.2 When to Split Files

**If a file exceeds the limit:**

1. **Phase backlogs (> 200 lines):**
   - Split into sub-phases (e.g., phase-2a, phase-2b)
   - Move lower-priority stories to next phase
   - Move future features to `future.md`

2. **Technical specs (> 600 lines):**
   - Split by component (backend, frontend, infrastructure)
   - Create separate files (e.g., `api-spec.md`, `database-spec.md`)

3. **README files (> 200 lines):**
   - Keep only essential overview
   - Link to detailed docs in separate files

### 2.3 Registers Are Exempt — Archive, Don't Compress

A **register** is a document you land in rather than read through: `open-questions.md`, `DASHBOARD.md`,
per-epic status files. They accumulate by design, so a line cap forces deleting history to make room for
history. `open-questions.md` has run past 800 lines for months and is the most-used artefact in
`.project-management/` — length was never what made it usable; structure was.

Registers are governed by structure instead:

- Summary or index at the top, one entry per item below — the reader greps, never scrolls
- Superseded / resolved / cancelled entries **move** to a `## Resolved` or `## Superseded` section, or to
  `<name>-archive.md`. Never deleted, never summarised away
- Split only on a real seam in meaning — status versus cross-cutting findings, say. **Never on line
  count**: splitting a register by range just means grepping two files instead of one

Compressing a register to hit a number is a defect, not housekeeping. If it feels lossy, it is.

---

## 3. Writing Style Guidelines

### 3.1 Tone and Voice

**Use:**

- ✅ Clear, concise, professional English
- ✅ Active voice ("Create a user account" not "A user account should be created")
- ✅ Present tense for descriptions ("The system validates..." not "The system will validate...")
- ✅ Imperative mood for instructions ("Run the tests" not "You should run the tests")
- ✅ Technical precision (use exact terms, avoid ambiguity)

**Avoid:**

- ❌ Jargon without explanation
- ❌ Overly casual language ("gonna", "wanna")
- ❌ Ambiguous terms ("soon", "later", "might")
- ❌ Marketing speak ("revolutionary", "game-changing")
- ❌ Passive voice when active is clearer

### 3.2 Structure and Formatting

**Every documentation file MUST include:**

1. **Header with metadata:**

   ```markdown
   # Document Title

   **Version:** 1.0
   **Last Updated:** YYYY-MM-DD
   **Status:** Draft | Active | Deprecated
   ```

2. **Table of contents (if > 100 lines):**

   ```markdown
   ## Table of Contents

   - [Section 1](#section-1)
   - [Section 2](#section-2)
   ```

3. **Clear section hierarchy:**
   - Use `#` for document title
   - Use `##` for main sections
   - Use `###` for subsections
   - Use `####` for sub-subsections (max 4 levels)

4. **Code examples with language tags:**

   ````markdown
   ```typescript
   function example() {
     return "Always specify language"
   }
   ```
   ````

5. **Consistent formatting:**
   - Use `**bold**` for emphasis
   - Use `*italic*` for technical terms on first use
   - Use `code` for inline code, variables, file names
   - Use `> blockquote` for important notes
   - Use `- [ ]` for checklists

---

## 4. Quality Checklist

**Before committing documentation:**

- [ ] **Language:** All text in English
- [ ] **File size:** Within limits (see §2.1)
- [ ] **Header:** Includes version, date, status
- [ ] **Grammar:** No typos, proper punctuation
- [ ] **Links:** All internal links work
- [ ] **Code examples:** Syntax-highlighted with language tag
- [ ] **Formatting:** Consistent markdown style
- [ ] **TOC:** Present if file > 100 lines
- [ ] **Readability:** Clear, concise, professional tone
- [ ] **Accuracy:** Technical details verified

---

## Summary

**Key Rules:**

1. ✅ **English only** for all documentation
2. ✅ **File size limits** strictly enforced (< 200 lines for backlogs)
3. ✅ **Clear structure** with headers, TOC, metadata
4. ✅ **Professional tone** — active voice, present tense
5. ✅ **Code examples** always syntax-highlighted
6. ✅ **Consistent formatting** across all docs

---

**Maintained By:** Development Team
**Status:** ✅ Active
