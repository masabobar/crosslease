# Process Client Documents - Quick Guide

**Use when:** Client provides documents (PDFs, Word, images, etc.) with requirements
**Command:** `/process-client-docs`
**Time:** 3-5 minutes
**Output:** Auto-generated input files (scope, backlog, technologies, constraints)

**All output is in English only, regardless of source document language.**

---

## 🎯 What It Does

Extracts project requirements from client documents and generates structured input files:

- ✅ Reads PDFs, Word docs, images, text files
- ✅ Extracts requirements, features, user stories
- ✅ Generates `input/scope.md`
- ✅ Generates `input/backlog.md`
- ✅ Generates `input/technologies.md`
- ✅ Generates `input/constraints.md`
- ✅ **Translates to English** if source is in another language

---

## 📋 Supported File Types

**Reads:**

- PDF documents (`.pdf`)
- Word documents (`.docx`, `.doc`)
- Text files (`.txt`, `.md`)
- Images with text (`.png`, `.jpg`) - OCR extraction
- Spreadsheets (`.xlsx`) - for feature lists

**Place in:** `.project-management/client-input/` folder

---

## 📝 Quick Steps

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Always enter plan mode before processing**

1. Claude scans `client-input/` folder
2. Lists all documents found
3. Creates extraction plan:
   - Which docs contain what
   - How to map to input files
   - Content organization strategy
4. Presents plan for approval
5. Waits for [Yes/No/Revise]

**Only proceeds after you approve the plan.**

### STEP 1: Add Client Documents

```bash
# Place documents in this folder
.project-management/client-input/

# Example:
├── project-brief.pdf
├── requirements.docx
├── mockups.png
└── timeline.txt
```

### STEP 2: Run Command

```bash
/process-client-docs
```

**No arguments needed** - automatically finds all documents in `client-input/`.

### STEP 3: Review Extracted Content

Claude shows:

- What was found in each document
- How it will be organized
- Preview of generated files

### STEP 4: Approve & Generate

Choose:

- **Yes** - Generate input files
- **No** - Cancel
- **Revise** - Adjust extraction, see preview again

### STEP 5: Review Generated Files

Claude creates:

1. `input/scope.md` - Project vision, goals, objectives
2. `input/backlog.md` - All features and user stories
3. `input/technologies.md` - Tech stack (if specified)
4. `input/constraints.md` - Timeline, budget, team (if specified)

**All in English**, even if source documents were in another language.

---

## 🔍 Example Walkthrough

```
You: /process-client-docs

Claude: [STEP 0: Plan Mode]
        Scanning client-input/ folder...

        FOUND:
        ✅ project-brief.pdf (3 pages)
        ✅ feature-list.docx (12 pages)
        ✅ wireframes.png (2 images)

        Reading documents...

        EXTRACTED:
        From project-brief.pdf:
        - Project name: "TaskFlow Pro"
        - Vision: Team task management platform
        - Target users: Small teams (5-20 people)
        - Timeline: 6 months
        - Budget: $50,000

        From feature-list.docx:
        - 25 features identified
        - Categorized into 4 epics
        - Priority levels assigned

        From wireframes.png:
        - UI references extracted
        - 3 main screens identified

        PLAN:
        Generate input files:
        1. scope.md - from project-brief.pdf
        2. backlog.md - from feature-list.docx (25 stories)
        3. technologies.md - suggest stack based on requirements
        4. constraints.md - timeline & budget from project-brief.pdf

        Proceed? [Yes/No/Revise]

You: Yes

Claude: Generating input files...

        ✅ scope.md created (85 lines)
           - Project vision: TaskFlow Pro
           - Goals: Streamline team collaboration
           - Target users: Small teams

        ✅ backlog.md created (320 lines)
           - 4 epics extracted
           - 25 user stories created
           - Story IDs: US-001 through US-025
           - Priorities assigned

        ✅ technologies.md created (60 lines)
           - Suggested stack: Laravel + React
           - Based on requirements analysis

        ✅ constraints.md created (40 lines)
           - Timeline: 6 months
           - Budget: $50,000
           - Team: 3 developers (assumed)

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ✅ CLIENT DOCUMENTS PROCESSED
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        GENERATED:
        - 4 input files (495 total lines)
        - 25 user stories created
        - All content in English

        NEXT STEPS:
        1. Review: .project-management/input/scope.md
        2. Review: .project-management/input/backlog.md
        3. Edit if needed (clarify requirements)
        4. Initialize project: /init-project
```

---

## ⚠️ Common Issues

| Issue                         | Solution                                  | Reference                                    |
| ----------------------------- | ----------------------------------------- | -------------------------------------------- |
| "No documents found"          | Add files to `client-input/` folder       | `.project-management/client-input/README.md` |
| Document format not supported | Convert to PDF or text first              | Supported formats list above                 |
| Incomplete extraction         | Edit generated files manually, fill gaps  | Input files are editable                     |
| Wrong language in output      | Report bug - should always output English | Language enforcement is mandatory            |

---

## 🎯 After Processing

**Review and refine:**

1. Read generated `input/` files
2. Fill any missing details
3. Clarify ambiguous requirements
4. Adjust priorities if needed

**Then initialize:**

```bash
/init-project
```

**Or add more requirements:**

```bash
/add-scope add story [phase] [epic]
```

---

## 📚 Privacy & Security

**Client documents:**

- Stored locally only
- Not committed to git (`.gitignore` included)
- Can be deleted after processing
- No data sent externally (processed locally by Claude)

**Generated files:**

- Committed to git (part of project)
- Shareable with team
- Can be regenerated anytime

---

## 📚 Full Documentation

**This is a quick guide (120 lines).**

For complete details, see: [`.claude/commands/process-client-docs.md`](../process-client-docs.md) (233 lines)

Includes:

- OCR extraction details
- Content mapping algorithms
- Multi-language handling
- Module reference for document reading
