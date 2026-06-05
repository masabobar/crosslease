export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "jira-ticket-required": ({ subject }) => {
          const jiraTicketPattern = /#[A-Z0-9]+-\d+/
          const noTicketPattern = /#no-ticket/
          const isValid =
            jiraTicketPattern.test(subject) || noTicketPattern.test(subject)

          return [
            isValid,
            "Commit message must include a Jira ticket (e.g., #PRD1006-28) or #no-ticket. Example-> feat: add login page #PRD1006-24",
          ]
        },
      },
    },
  ],
  rules: {
    "jira-ticket-required": [2, "always"],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "ci",
        "build",
        "revert",
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 150],
  },
}
