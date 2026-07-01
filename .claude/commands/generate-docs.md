---
name: generate-docs
description: Generate or update project documentation (PRD, technical spec, architecture docs) from input files
---

# Generate Documentation

**📖 Quick Start:** See [how-to-use/generate-docs.md](./how-to-use/generate-docs.md) for quick guide (~100 lines)

You are generating or updating project documentation based on current input files.

**🌍 CRITICAL: Generate ALL documentation in English only. No exceptions.**

---

## YOUR TASK — MANDATORY WORKFLOW

**🔧 DOCUMENTATION RULES:**
All generated documentation must follow:

- **`CLAUDE.md`** - All documentation in English only
- **`.claude/rules/git.md`** - If committing documentation (NO AI credits, conventional commits: `docs:`)

---

### STEP 0: ENTER PLAN MODE (MANDATORY)

**🎯 MANDATORY: Always enter plan mode before generating/updating documentation**

**Claude must:**

1. **Read all input files:**
   - `.project-management/input/scope.md`
   - `.project-management/input/backlog.md`
   - `.project-management/input/technologies.md`
   - `.project-management/input/constraints.md`

2. **Read existing documentation (if any):**
   - `.project-management/output/docs/prd.md`
   - `.project-management/output/docs/technical-spec.md`
   - `.project-management/output/docs/architecture.md`
   - `.project-management/output/docs/api-spec.md`

3. **Analyze what changed:**
   - Compare input files with last generation
   - Identify new features, changed requirements
   - Determine which docs need updates

4. **Create generation plan:**
   - Which docs will be created/updated
   - What content will change
   - Estimated size of each doc
   - New sections to add

5. **Present plan and wait for approval:**

   ```
   DOCUMENTATION GENERATION PLAN

   INPUT CHANGES DETECTED:
   - scope.md: Last modified 2 days ago
   - backlog.md: Last modified 1 hour ago (5 stories added)

   GENERATION PLAN:
   1. Update PRD - add 5 new features
   2. Update Technical Spec - add implementation details
   3. Skip Architecture - no architectural changes

   ESTIMATED OUTPUT:
   - PRD: ~200 lines (+30 lines)
   - Technical Spec: ~350 lines (+60 lines)

   Proceed? [Yes / No / Revise]
   ```

6. **Only proceed to STEP 1 after user approves**

---

### STEP 1: READ INPUT FILES

1. **Read ALL input files** from `.project-management/input/`:
   - `scope.md` - Project scope
   - `backlog.md` - Features backlog
   - `technologies.md` - Tech stack
   - `constraints.md` - Constraints

2. **Check existing documentation** in `.project-management/output/docs/`:
   - See what already exists
   - Identify what needs to be updated vs created

3. **Generate or update documentation** (ALL in English):
   - `prd.md` - Product Requirements Document
   - `technical-spec.md` - Technical Specification
   - `architecture.md` - Architecture Document
   - `api-spec.md` - API Specification (if needed)

4. **Use templates** from `.project-management/templates/` and replace placeholders with actual content

## When to Use This Command

- After modifying input files (scope, backlog, technologies, constraints)
- When documentation is out of sync with current requirements
- To regenerate specific documents
- After major project changes

## Documentation to Generate

### Product Requirements Document (PRD)

**Source Data:**

- Vision: scope.md → Vision section
- Features: backlog.md → All user stories and epics
- Success Metrics: scope.md → Success Criteria
- Timeline: constraints.md → Timeline Constraints

**What to Include:**

- Executive summary
- Product overview and vision
- User personas (infer from target audience)
- Complete feature list organized by priority
- User stories with acceptance criteria
- Non-functional requirements
- Assumptions and risks
- Timeline and phases

### Technical Specification

**Source Data:**

- Tech Stack: technologies.md + `.project-management/rules/project-rules.md`
- Features: backlog → Technical requirements
- Constraints: constraints.md → Technical constraints

**What to Include (FE-specific):**

- Technology stack breakdown (React 19, Vite, TypeScript, Tailwind v4, Zustand, i18next)
- Feature-based folder structure (`src/features/<name>/{components,api,store,hooks}`)
- Component architecture patterns (compound components, composition)
- State management (Zustand stores per feature — `src/features/<name>/store/`)
- Routing structure (React Router routes, lazy loading, auth guards)
- API integration layer (Zod schemas in `features/<name>/api/schema.ts`, Axios query functions, `generate:api` script from OpenAPI)
- i18n structure (namespaces per feature, `src/i18n/locales/{en,de}/<feature>.json`)
- Role-based UI gating (six roles from `project-rules.md`, guard patterns)
- Error handling (Axios 401 interceptor, session timeout redirect, error boundaries)
- Testing strategy (Vitest unit tests in `src/__tests__/`, mirroring source tree)
- Build and deployment approach
- **Do NOT include:** database schema, backend API design, server infrastructure

### Architecture Document

**Source Data:**

- Technologies: `project-rules.md` + `technologies.md`
- Requirements: backlog + scope.md → Functional requirements
- Constraints: constraints.md → Performance needs

**What to Include (FE-specific):**

- Frontend architecture diagram (component hierarchy)
- Data flow: API response → Zod parse → Zustand store → React component
- Routing and navigation structure (route tree, auth guards per role)
- API integration architecture (auto-generated Zod client from OpenAPI, query functions)
- i18n architecture (namespace registry, lazy loading of German)
- Error boundary placement and 401 redirect flow
- Build and bundle architecture (Vite, code splitting, lazy routes)
- Technology rationale

## Guidelines

### Anonymize Personal Information (Mandatory)

- Personal names from input files MUST NOT appear in generated PRD / technical spec / architecture / progress files.
- Replace with role labels (`the PM`, `the tech lead`, `the designer`, `the client`, `the stakeholder`) and source-context phrases (`per our call`, `agreed in the planning meeting`, `per stakeholder feedback`).
- Full rule: `.claude/rules/anonymization.md` — includes role-mapping table, before/after examples, and edge cases.

### Be Comprehensive

- Don't leave placeholders or TODOs
- Fill in all sections completely
- Use actual data from input files

### Be Consistent

- Ensure all documents align with each other
- Use same terminology across documents
- Reference same features/components

### Be Realistic

- Consider constraints when designing
- Align with team capacity
- Account for technical limitations

### Be Actionable

- Provide concrete specifications
- Include measurable success criteria
- Give clear implementation guidance

## Quality Checklist

Before completing, verify:

- [ ] All input files were read and analyzed
- [ ] All templates were used correctly
- [ ] All placeholders ({{VARIABLES}}) are replaced
- [ ] Documentation is internally consistent
- [ ] Technical decisions are justified
- [ ] Constraints are respected
- [ ] Security requirements (role-based gating, token handling) are addressed
- [ ] i18n structure described (en + de namespaces)
- [ ] No backend/database content included — this is FE only
- [ ] API integration layer described (Zod schemas, query functions, OpenAPI source)

## Output to User

After generating documentation, provide:

```
Documentation Generated Successfully! 📚

Updated Documents:
✅ Product Requirements Document
   - 18 features documented
   - 5 user personas defined
   - Success metrics specified

✅ Technical Specification
   - Complete tech stack defined
   - 15 API endpoints specified
   - Database schema with 8 tables
   - Security implementation detailed

✅ Architecture Document
   - System architecture designed
   - Component breakdown complete
   - Infrastructure plan defined
   - Technology choices justified

Key Decisions:
- Using PostgreSQL for relational data needs
- React Router v6 for frontend routing
- JWT-based authentication
- Microservices considered but monolith chosen for MVP

Next Steps:
1. Review generated docs in .project-management/output/docs/
2. Start development with /execute-work phase 1
3. Follow technical spec for implementation
```

## Special Instructions

- If a document already exists, UPDATE it rather than overwrite completely
- Preserve any manual additions or notes
- Add a "Last Updated" timestamp
- Increment version number if applicable
- Log changes in revision history

Remember: Documentation quality directly impacts development success. Take time to create thorough, accurate, and useful documentation.
