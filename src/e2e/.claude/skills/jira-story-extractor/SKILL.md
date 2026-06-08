---
name: jira-story-extractor
description: "Use this skill to extract and validate Jira user stories for QA processing. Invoke when the qa-lead pipeline reaches Stage 1 and needs structured story objects from Jira. Accepts a project nanme, sprint name, one or more story IDs (e.g. PRD1042-39), or a JQL filter string. Fetches title, description, acceptance criteria, status, labels, attachments, comments and any linked Figma URLs. Runs Definition of Ready checks on every story — flags stories missing ACs or in Backlog/Draft status as DoR failures. Returns structured story objects with dor_status PASS or FAIL and a list of dor_failures for each story."
allowed-tools: mcp__jira__get_issue, mcp__jira__search_issues, mcp__jira__get_epic_children, mcp__jira__get_projects, mcp__jira__get_field_options, mcp__jira__get_users, mcp__jira__get_transitions, mcp__jira__get_current_mcp_version, TaskCreate, TaskUpdate, Read, Bash
model: sonnet
---

# jira-story-extractor

Extract and validate Jira user stories for QA processing. This is Stage 1 of the qa-lead pipeline.

## Credentials

All API calls use Basic Auth. Read credentials from `.mcp.json` in the project root, or use these directly:

- **Jira base URL:** `https://holycode.atlassian.net`
- **Confluence base URL:** `https://holycode-team.atlassian.net`
- **Username:** `dejan.nikolic@holycode.com`
- **API token:** read from `.mcp.json` → `mcpServers.jira.env.JIRA_API_TOKEN`

## Invocation

Called by the qa-lead agent with a project name, sprint name, story IDs, or JQL filter. Use `mcp__jira__get_issue` for individual stories and `mcp__jira__search_issues` for sprint/JQL queries.

## Extraction steps

1. Fetch story fields: title, description, acceptance criteria, story type, epic, status, labels, attachments, comments
2. Run DoR checks (see below)
3. Emit a structured story object regardless of DoR outcome

## From every user story, extract and organize:

### 1. User Story

The "As a... I want... So that..." statement.

### 2. Acceptance Criteria

Every numbered AC item with its completion status (complete / incomplete).

### 3. Functional Requirements

Grouped by category (form display, validation, submission, error handling, etc.). List each requirement as a bullet.

### 4. Error Scenarios

All error conditions and their expected messages/behaviors.

### 5. Edge Cases

Boundary conditions and non-obvious behaviors from the story.

## DoR checks

| Check               | Fail condition   |
| ------------------- | ---------------- |
| Title               | Empty or missing |
| Acceptance criteria | Zero ACs found   |

On failure: set `dor_status: "FAIL"`, populate `dor_failures`, log:

```
[DoR FAIL] Story <ID>: <reason>
```

## Output format

Always structure your response as:

1. **Story summary** — title + one-line description
2. **User story** — verbatim
3. **Acceptance criteria** — table with number, description, status
4. **Functional requirements** — grouped bullets
5. **Error scenarios** — table: condition → expected message/behavior
6. **Suggested test cases** — grouped by category, with AC coverage

Never omit a key — use `null` for unavailable fields. Never silently drop a story.
