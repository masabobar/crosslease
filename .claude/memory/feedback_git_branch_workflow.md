---
name: git-branch-workflow
description: Before any code or doc changes, always sync develop and branch from it in refinext-app, and pull develop in refinext-api
metadata:
  type: feedback
---

Before starting ANY work (code changes, document edits, etc.):

1. In `refinext-app`: checkout `develop`, run `git pull origin develop`, then create a new branch with a proper conventional name (e.g. `feat/some-feature`, `fix/some-bug`).
2. In `../refinext-api`: run `git pull origin develop` to have the latest BE work available locally.

**Why:** Ensures all work starts from the latest develop state and is isolated on its own branch, avoiding conflicts and keeping history clean.

**How to apply:** First two commands of every session that involves code or doc work. Never start working directly on `develop`.
