# Process Client Docs - Reading Module

**Purpose:** Strategies for reading and understanding different types of client documents.

**Parent Command:** `/process-client-docs`

---

## Document Discovery

### Find All Documents

**Search in:**

```bash
.project-management/client-input/
```

**Supported file types:**

- PDF (`.pdf`)
- Word Documents (`.docx`, `.doc`)
- Text files (`.txt`, `.md`)
- Images (`.png`, `.jpg`, `.jpeg`)
- Spreadsheets (`.xlsx`, `.csv`) - optional

**Discovery process:**

1. List all files in `client-input/` directory
2. Filter by supported extensions
3. Categorize by type (PDFs, Word, text, images, spreadsheets)
4. Read in recommended order (see below)

---

## Reading Strategies by File Type

### PDF Documents

**Reading approach:**

- Read entire document page by page
- Extract text content and structure
- Identify sections, lists, tables
- Capture hierarchy and page references

**Content to extract:** Headings, paragraphs, lists, tables, page numbers

---

### Word Documents (.docx)

**Reading approach:**

- Read complete document
- Preserve formatting (bold = emphasis, italic = notes)
- Extract headings hierarchy (H1, H2, H3)
- Capture tables and track changes

**Content to extract:** Document structure, formatted text, lists, tables, comments

---

### Text Files (.txt, .md)

**Reading approach:**

- Read entire file
- Parse Markdown syntax (if .md)
- Identify structure from formatting
- Extract sections and lists

**Example Markdown structure:**

```markdown
# Project Name

## Requirements

- Feature 1
- Feature 2

## Timeline

Launch: Q2 2026
```

---

### Images (Wireframes, Mockups)

**Reading approach:**

1. View image visually
2. Identify type (wireframe, mockup, diagram)
3. Extract visual elements and labels
4. Note user flows and layouts

**What to extract:**

- Screen layouts and component placement
- User interaction flows
- Button labels and text
- Navigation structure

**Use for:** Creating user stories, defining UI requirements, understanding flows

---

### Spreadsheets (.xlsx, .csv)

**Reading approach:**

- Read each sheet/tab
- Identify headers and data relationships
- Extract rows of structured data

**Common uses:** User stories lists, feature priorities, timelines, budgets

---

## Document Type Identification

**Categorize documents by purpose:**

1. **Requirements Document** - Features, user stories, functional requirements
2. **Project Brief/Proposal** - Vision, goals, objectives, scope
3. **Technical Specification** - Tech stack, architecture, infrastructure
4. **Timeline/Schedule** - Dates, milestones, deadlines
5. **Wireframes/Mockups** - Visual UI representations, user flows
6. **Meeting Notes/Emails** - Informal requirements, decisions, assumptions

**Extract keywords to identify type:**

- Requirements: "must have", "should have", "features"
- Brief: "vision", "objectives", "goals", "purpose"
- Technical: "technology", "stack", "architecture", "database"
- Timeline: "deadline", "milestone", "launch", "schedule"
- Decisions: "decided", "agreed", "must", "need"

---

## Reading Techniques

### Sequential Reading

**For comprehensive documents:**

- Read beginning to end
- Take notes on each section
- Mark important items and ambiguities

### Scanning

**For quick overview:**

- Read headings and subheadings
- Skim first/last paragraphs
- Note bullet points and tables

### Targeted Reading

**For specific information:**

- Search for keywords
- Jump to relevant sections
- Cross-reference with other documents

---

## Language Detection and Translation

**CRITICAL per `CLAUDE.md`:**

- ALL output MUST be in English
- Translate non-English sources during extraction
- Preserve meaning, not literal translation

**Detection approach:**

- Sample first few paragraphs
- Check for non-English keywords
- Flag for translation during extraction

---

## Handling Multiple Documents

### Recommended Reading Order

1. **Project brief/proposal** - Understand vision first
2. **Requirements document** - Get detailed features
3. **Wireframes/mockups** - Visualize the product
4. **Technical specs** - Understand tech constraints
5. **Timeline/budget** - Know constraints
6. **Meeting notes** - Fill in gaps

### Cross-Referencing

**Link information across documents:**

```
Document 1: "Users should search products"
Document 2: Shows search bar in header
Document 3: "Search with filters by category, price"

Combined requirement:
US-045: Product Search with filters and real-time results
```

---

## Extraction Notes Template

**While reading, capture:**

```markdown
# Document: [filename]

## Vision

[Key vision statement]

## Features Mentioned

- [ ] Feature 1 (page/section reference)
- [ ] Feature 2 (page/section reference)

## Technology Preferences

- [Technology constraint]

## Timeline

- [Key dates]

## Ambiguities

- [Unclear or missing details]
```

---

## Quality Checks During Reading

**Ensure you:**

- [ ] Read EVERY document completely
- [ ] Don't skip tables, diagrams, footnotes
- [ ] Note page/section references
- [ ] Flag unclear requirements
- [ ] Identify implicit requirements
- [ ] Cross-reference contradictions
- [ ] Capture ALL features (no cherry-picking)

---

## Error Handling

**If file cannot be read:**

- Skip file, log warning
- Notify user after processing

**If file is empty:**

- Skip file, log warning

**If format is unsupported:**

- Skip file, suggest conversion to PDF or image

---

**Related:**

- Parent: `.claude/commands/process-client-docs.md`
- Sibling: `process-client-docs-extraction.md`
- Rules: `CLAUDE.md` (English-only documentation)
