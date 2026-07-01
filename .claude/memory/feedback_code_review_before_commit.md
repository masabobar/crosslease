---
name: feedback_code_review_before_commit
description: Always run /code-review on the diff before committing or pushing changes in refinext-app
metadata:
  type: feedback
---

Before creating any git commit or running git push in the refinext-app project, always run `/code-review` on the current diff first.

**Why:** The user explicitly requested this workflow to catch TypeScript, React 19, state management, i18n, and RBAC violations before they enter git history. A pre-commit hook (`pre-commit-code-review.sh`) is also configured to fire as a reminder, but the review itself must be done proactively — do not wait for the hook to prompt.

**How to apply:**

1. After all code changes are made, before staging or committing: run `/code-review` on the diff.
2. Apply any Critical or High findings before staging.
3. Then stage, commit, and push.
4. Use `/review-codebase` for a full audit when touching multiple features or doing a larger refactor.

[[feedback_no_ai_credits_in_commits]]
