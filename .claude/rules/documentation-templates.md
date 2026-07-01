# Documentation Templates

**Version:** 1.0
**Last Updated:** 2026-05-10
**Status:** Active

Templates for specific documentation artifacts (user stories, technical tasks, bug reports, API endpoints). Companion to `.claude/rules/documentation.md` (core writing rules) and `.claude/rules/documentation-extras.md` (code comments, diagrams, tooling).

---

## 1. Specific Document Types

### 1.1 User Stories (US-XXX)

**Format:**

```markdown
### US-001: Short Descriptive Title

**Priority:** P0 | P1 | P2
**Story:** As a [user type], I want to [action] so that [benefit].

**Acceptance Criteria:**

- [ ] Criterion 1 (testable)
- [ ] Criterion 2 (testable)
- [ ] Criterion 3 (testable)

**Estimate:** X story points
**Dependencies:** US-XXX, T-XXX
**Status:** Todo | In Progress | Completed | Blocked
```

**Rules:**

- Title: Max 50 characters
- Story: Single sentence, clear user value
- Acceptance criteria: 3-7 testable items
- Each criterion starts with a verb
- Use present tense

> Frontend stories extend this format — see `.claude/rules/screen-driven-backlog.md` §3 for the additional mandatory fields (Type, Screen, API Endpoints Used, API contract status).

### 1.2 Technical Tasks (T-XXX)

**Format:**

```markdown
### T-001: Short Task Title

**Priority:** P0 | P1 | P2
**Description:** Brief explanation of what needs to be done.

**Tasks:**

- [ ] Subtask 1
- [ ] Subtask 2
- [ ] Subtask 3

**Estimate:** X story points
**Dependencies:** T-XXX, US-XXX
**Status:** Todo | In Progress | Completed
```

### 1.3 Bug Reports (BUG-XXX)

**Format:**

```markdown
### BUG-001: Short Bug Description

**Priority:** P0 (Critical) | P1 (High) | P2 (Medium)
**Reported:** YYYY-MM-DD
**Reporter:** Name or user ID

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected Result:** What should happen
**Actual Result:** What actually happens
**Environment:** OS, browser, version

**Status:** Open | In Progress | Fixed | Cannot Reproduce
**Fix ETA:** YYYY-MM-DD
```

### 1.4 Commit Messages

See `.claude/rules/git.md` for the canonical commit message format, multi-line HEREDOC pattern, and the full list of conventional commit types.

> **Important:** Per `.claude/rules/git.md`, AI attribution lines (`Generated with Claude Code`, `Co-Authored-By: Claude`) MUST NOT be included in commit messages.

---

## 2. API Documentation

### 2.1 Endpoint Documentation

**Every public API endpoint MUST document:**

````markdown
### POST /api/v1/users/signup

**Description:** Create a new user account.

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```
````

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input (email format, weak password)
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

**Rate Limiting:** 5 requests per 15 minutes per IP

```

**Required fields recap:** method + path, description, authentication, request body example, success response example, error responses (matrix from `.claude/rules/testing.md`), rate limiting note when applicable.

> Internal / admin-only endpoints have a reduced documentation requirement — see `.claude/rules/api-documentation.md` §3 (SOFT tier).

---

## Related

- `.claude/rules/documentation.md` — language, style, file-size, quality checklist (core rules)
- `.claude/rules/documentation-extras.md` — code comments, diagrams, tools, good/bad examples
- `.claude/rules/api-documentation.md` — when these templates are mandatory (strict vs internal tier)
- `.claude/rules/testing.md` — HTTP status-code matrix that endpoint docs must cover
- `.claude/rules/screen-driven-backlog.md` — frontend story format extending §1.1
- `.claude/rules/git.md` — canonical commit message format

---

**Status:** ✅ Active
```
