# Client Docs Extraction - Quality & Output

**Purpose:** Quality checks and output file generation for extracted requirements.

**Parent:** `process-client-docs-extraction.md`

---

## Quality Checks During Extraction

**Ensure:**

- [ ] All features from documents captured
- [ ] Organized into logical epics
- [ ] User stories follow template (As a... I want... So that...)
- [ ] Acceptance criteria are specific and testable
- [ ] Priorities assigned based on client emphasis
- [ ] Story points estimated
- [ ] Dependencies identified
- [ ] Ambiguities flagged for clarification
- [ ] Non-functional requirements included
- [ ] All output in English (translated if needed)

---

## Output File Generation

### Generate scope.md

**Source:** Extracted vision, goals, objectives

**Template:**

```markdown
# Project Scope

## Project Vision

[Extracted from executive summary]

## Core Objectives

1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

## Target Audience

[Extracted from user personas/descriptions]

## Success Criteria

[Extracted KPIs and metrics]

## Out of Scope

[Explicitly mentioned or implied exclusions]

## Phases

- Phase 1: Foundation
- Phase 2: Core Features
- Phase 3: Advanced Features
- Phase 4: Polish & Launch
```

---

### Generate backlog.md

**Source:** Extracted epics and stories

**Template:**

```markdown
# Product Backlog

## EPIC-1: [Epic Name] ([Total Points] points)

**Goal:** [Epic objective]

### US-001: [Story Title]

**As a** [user type]
**I want** [feature]
**So that** [benefit]

**Acceptance Criteria:**

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Priority:** P0
**Story Points:** 5
**Dependencies:** None

---

### US-002: [Next Story]

[Continue pattern...]

---

## EPIC-2: [Next Epic]

[Continue pattern...]
```

---

### Generate technologies.md

**Source:** Extracted tech stack and constraints

**Template:**

```markdown
# Technology Stack

## Frontend

- **Framework:** [React/Vue/etc] ([Reason])
- **State Management:** [Zustand/Redux/etc]
- **UI Library:** [shadcn/MUI/etc]
- **Build Tool:** [Vite/Webpack]

## Backend

- **Runtime:** [Node.js/Python/etc]
- **Framework:** [Express/FastAPI/etc]
- **Database:** [PostgreSQL/MongoDB/etc] ([Reason])
- **ORM:** [Prisma/TypeORM/etc]

## Testing

- **Unit Tests:** [Vitest/Jest/etc]
- **E2E Tests:** [Playwright/Cypress/etc]
- **Coverage Goal:** 80%+

## Third-Party Services

- **Payment:** [Stripe/PayPal] (Required)
- **Email:** [SendGrid/etc]
- **Storage:** [S3/Cloudinary]

## DevOps

- **Hosting:** [Railway/Vercel/AWS]
- **CI/CD:** [GitHub Actions]
- **Monitoring:** [Sentry/etc]

## Requirements

- Browser support: Chrome, Firefox, Safari (latest 2 versions)
- Mobile responsive design
- Performance: Page load < 2s
```

---

### Generate constraints.md

**Source:** Extracted timeline, budget, compliance

**Template:**

```markdown
# Project Constraints

## Timeline

- **Project Start:** [Date]
- **Target Launch:** [Date]
- **Duration:** [X months]
- **Milestones:**
  - Phase 1 (Foundation): [End date]
  - Phase 2 (Core Features): [End date]
  - Phase 3 (Advanced Features): [End date]
  - Phase 4 (Polish & Launch): [End date]

## Budget

- **Total Budget:** $[Amount]
- **Development:** [Team composition]
- **Infrastructure:** $[Amount/month]
- **Third-Party Services:** $[Amount/month]

## Team

- **Size:** [N developers]
- **Availability:** [Full-time/Part-time]
- **Skills:** [Required skills]
- **Timezone:** [Working hours]

## Technical Constraints

- **Infrastructure:** [Limitations]
- **Technology Restrictions:** [Must use / Cannot use]
- **Performance Requirements:** [Specific metrics]
- **Browser/Device Support:** [Minimum requirements]

## Compliance

- **GDPR:** [Required/Not required]
- **PCI DSS:** [Required for payments]
- **Accessibility:** [WCAG 2.1 AA]
- **Security:** [Specific requirements]

## Scope Constraints

- **Must Have (P0):** [Critical features]
- **Should Have (P1):** [Important features]
- **Could Have (P2):** [Nice to have]
- **Won't Have (for now):** [Out of scope]
```

---

## Post-Extraction Review

### Present Summary to User

**After extraction, present:**

````markdown
# Extraction Summary

## Documents Processed

- brief.pdf (5 pages)
- requirements.docx (12 pages)
- wireframes.png (3 images)

## Extracted Content

### Epics: 5

1. User Authentication & Management (20 points)
2. Product Catalog (15 points)
3. Shopping Experience (25 points)
4. Admin Dashboard (18 points)
5. Analytics & Reporting (12 points)

### Stories: 32

- P0 (Must Have): 18 stories
- P1 (Should Have): 10 stories
- P2 (Nice to Have): 4 stories

### Total Story Points: 90

### Estimated Timeline

- Phase 1: 20 points (1.5 months)
- Phase 2: 35 points (2.5 months)
- Phase 3: 25 points (2 months)
- Phase 4: 10 points (1 month)

## Clarification Questions (structured — drives interactive Q&A)

Emitted in schema defined by `extraction-by-section.md` § "Handling Ambiguities". Sorted by priority for the interactive loop in STEP 5.

```yaml
- id: Q-001
  category: payments
  priority: P0
  question: "Payment gateway — Stripe or alternative?"
  default: "Stripe"
  impact: "Affects Phase 2 (US-012, US-013)"
  options:
    - { label: "Stripe", description: "Industry standard. Drop-in REST API." }
    - {
        label: "Other gateway",
        description: "Client to specify (Adyen, Braintree, …).",
      }
  applies_to: [input/technologies.md, input/backlog/phase-2-core.md]

- id: Q-002
  category: admin-scope
  priority: P1
  question: "Admin capabilities — basic CRUD or full audit/roles?"
  default: "basic product/user management"
  impact: "Affects Phase 3 (US-022, US-023, US-024); changes RBAC story estimates"
  options:
    - { label: "Basic", description: "Product + user CRUD. Minimal RBAC." }
    - {
        label: "Full audit + roles",
        description: "Granular permissions, audit log, role admin UI.",
      }
  applies_to: [input/backlog/phase-3-advanced.md]

- id: Q-003
  category: platform
  priority: P1
  question: "Native mobile app required, or responsive web sufficient?"
  default: "responsive web"
  impact: "Affects Phase 4 (mobile build stories) — adds ~3 weeks if native"
  options:
    - {
        label: "Responsive web",
        description: "Single codebase, faster to ship.",
      }
    - {
        label: "Native mobile",
        description: "iOS + Android. Adds dedicated phase.",
      }
  applies_to: [input/scope.md, input/constraints.md]
```
````

## Next Steps

1. Review generated files in `.project-management/input/`
2. Run the interactive clarification gate (STEP 5 of `/process-client-docs` — fires automatically)
3. Skipped questions land in `input/open-questions.md` — resolve later with `/resolve-questions`
4. Make any necessary manual edits
5. Run `/init-project` when ready

```

---

## Validation Checklist

**Before presenting to user:**

### Completeness
- [ ] All document sections reviewed
- [ ] All features extracted
- [ ] Vision and goals captured
- [ ] Tech stack identified
- [ ] Timeline and constraints documented

### Quality
- [ ] User stories follow format
- [ ] Acceptance criteria are testable
- [ ] Priorities make sense
- [ ] Story points reasonable
- [ ] Dependencies identified

### Clarity
- [ ] No ambiguous language
- [ ] Assumptions documented
- [ ] Questions listed
- [ ] Sources referenced

### Format
- [ ] English only
- [ ] Markdown formatting correct
- [ ] Files structured properly
- [ ] No placeholders/TODOs

---

[← Back to process-client-docs-extraction.md](process-client-docs-extraction.md)
```
