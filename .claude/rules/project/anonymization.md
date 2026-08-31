# Anonymization of Personal Information in Generated Documentation

**Version:** 1.0
**Last Updated:** 2026-05-10
**Status:** Active

**MANDATORY: Personal names and personally identifiable information (PII) from input documents MUST NOT appear in any generated project documentation. Replace with role labels or source-context references.**

This rule applies to every Claude Code command that _writes_ project artifacts (PRD, backlog, technical spec, user stories, technical tasks, bug reports, sprint plans, status reports, README files, architecture docs, ADRs). It does NOT change what Claude is allowed to _read_ — input docs may contain names; output docs must not.

---

## 1. Why

- **Privacy & GDPR alignment:** Project artifacts are committed to git, copied into wikis, shipped to clients, and retained for years. Names embedded in them propagate beyond the original consent context.
- **Document longevity:** People change roles or leave the company. "Marko said we need X" decays into noise the moment Marko is no longer involved.
- **Authority neutrality:** Naming individuals turns requirements into political artifacts ("This was Ana's idea"). Role-based attribution keeps requirements about _the work_.
- **Searchability:** "PM" and "tech lead" are stable across staff changes; names are not.

---

## 2. The Rule

When generating any output documentation, scan extracted content for:

- First names, last names, nicknames (Marko, Ana, Sara, "Mike", etc.)
- Email addresses tied to people (`marko@company.com`)
- Phone numbers, physical addresses
- Personal Slack handles, GitHub usernames, Jira accounts when they encode a real name (`@marko-ilic`, `john.doe`)
- Specific company-internal identifiers that resolve to a person

Replace each with a **role label** or a **source-context phrase** (see §3 and §4).

**What MAY stay** in generated documentation:

- The client _company_ name (it's the project's identity)
- Generic role titles already in use ("PM", "tech lead", "designer")
- Product, service, vendor, and tool names (Slack, Jira, Stripe, AWS — the products, not personal handles inside them)
- Public-facing brand spokespeople if and only if their public role is intrinsic to a requirement (rare)

**When in doubt: generalize.** It is always safe to drop a name; it is never safe to leak one by mistake.

---

## 3. Role-Label Substitution Table

| Original (input)                             | Replace with (output)                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Marko, Ana, Sara, Mike (any first/last name) | `the PM` / `the team lead` / `the tech lead` / `the client` (pick by context) |
| "Marko from the client side"                 | `the client PM` or `the client stakeholder`                                   |
| "Ana (designer)"                             | `the designer` or `the UX lead`                                               |
| "Sara from accounting"                       | `the finance stakeholder`                                                     |
| "John, the developer"                        | `the developer` or `the tech lead`                                            |
| "Mike (QA)"                                  | `the QA lead`                                                                 |
| "DevOps guy / girl"                          | `DevOps` or `the infrastructure lead`                                         |
| End user named in a quote                    | `the end user` or `a user`                                                    |
| Personal email `name@company.com`            | `the stakeholder` (drop the address entirely; do not paraphrase the email)    |

**Common role inventory** to draw from (pick the closest match, do not invent):
`PM`, `product owner`, `tech lead`, `tech director`, `team lead`, `engineering lead`, `designer`, `UX lead`, `QA lead`, `DevOps`, `infrastructure lead`, `client`, `client PM`, `stakeholder`, `finance stakeholder`, `marketing stakeholder`, `legal`, `end user`, `the team`.

If the input does not make the role clear, prefer the generic `the stakeholder` over guessing.

---

## 4. Source-Context Substitution (for attributions and quotes)

When the input attributes a statement to a person, replace the attribution with the _source channel_ rather than a role+name. This preserves provenance without leaking identity.

| Original (input)                       | Replace with (output)                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| "Marko said we need X"                 | `Per our planning call, X is required`                                                                           |
| "Ana mentioned in the meeting that..." | `Agreed in the planning meeting: …`                                                                              |
| "John emailed about the deadline"      | `Per stakeholder email, the deadline is …`                                                                       |
| "Sara called and asked us to..."       | `Per client call on YYYY-MM-DD, the request is …`                                                                |
| "Mike wrote in Slack..."               | `Per Slack discussion, …`                                                                                        |
| Direct quote with name                 | Either drop the quote and state the requirement directly, OR keep quote and attribute to `the PM` / `the client` |

**Recommended phrases (drop-in replacements):**

- "Per our call, …"
- "Agreed in the planning meeting: …"
- "Per stakeholder feedback, …"
- "Per the kickoff discussion, …"
- "The client confirmed: …"
- "The PM clarified that …"
- "Decided on the call: …"

---

## 5. Before / After Examples

### Example 1 — Requirement extracted from a meeting note

❌ **Before (leaks identity):**

> Marko said the login should support Google OAuth because most of his team already uses Gmail.

✅ **After:**

> Per our planning call, login must support Google OAuth — the client team already uses Gmail.

### Example 2 — User story acceptance criterion

❌ **Before:**

> Ana wants the dashboard to show last-login time in the user list.

✅ **After:**

> The dashboard shows last-login time in the user list. _(Source: agreed in the planning meeting)_

### Example 3 — Constraint extracted from email

❌ **Before:**

> John emailed on March 3rd: "The deadline is hard-locked at June 30 because of the trade show."

✅ **After:**

> Hard deadline: June 30 (trade show). _(Source: stakeholder email, 2026-03-03)_

### Example 4 — Risk register entry

❌ **Before:**

> Risk: Mike from QA may be out for two weeks in May.

✅ **After:**

> Risk: QA capacity reduced for ~2 weeks in May.

### Example 5 — Architecture decision record

❌ **Before:**

> Decision driver: Sara prefers PostgreSQL over MongoDB.

✅ **After:**

> Decision driver: the team lead (DB owner) prefers PostgreSQL over MongoDB; rationale recorded below.

---

## 6. Edge Cases

- **Author of an input document:** the author field of the _input_ is metadata about the source — do NOT copy that field into the output.
- **Names in technical content** (e.g., a sample customer in seed data, a username in an example API response): replace with neutral placeholders (`user@example.com`, `Jane Doe` _as a placeholder_, `customer_123`). Distinguish _placeholder names in examples_ (allowed if clearly placeholder) from _real names referenced as project actors_ (always anonymize).
- **Names in client company name:** if the client is `Marko's Restaurant LLC`, that's the project's identity — keep as-is. The rule targets _individuals_ working on or affected by the project.
- **Existing project docs already containing names:** when updating an existing artifact, anonymize new content but do not silently rewrite old content unless explicitly asked. Flag the legacy names in the summary report so the user can decide.
- **Direct quotes that lose meaning when anonymized:** if a quote is genuinely load-bearing (rare), keep it and replace the attribution with the role (`the PM said: "we ship by June 30 or we cancel"`). Never invent a quote to fit anonymization.

---

## 7. How This Rule Is Enforced

Output-generating commands should apply this rule at the **boundary between extraction and writing**:

1. Read input (names may be present).
2. Extract requirements / structure / decisions (internal model may still mention names).
3. **Anonymize pass** — substitute names per §3 and attributions per §4.
4. Write output artifacts.
5. **Self-check** before declaring step complete: grep generated files for common first-name patterns and any input-document names. If a name leaked, fix it before completing the step.

Commands that already enforce this gate:

- `.project-management/` artifacts derived from Jira tickets (stakeholder names appear in ticket text)

---

## Related

- `.claude/rules/project/documentation.md` — core writing rules (language, style, file size, quality checklist)
- `.claude/rules/project/documentation-templates.md` — where artifacts live; §4 covers anonymizing `open-questions.md` entries
- `.claude/rules/project/error-handling-and-logging.md` — logs MUST NOT contain personal info (same anonymization principle applied to runtime logs)

---

**Status:** ✅ Active
