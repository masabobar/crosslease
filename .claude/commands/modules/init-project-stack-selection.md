# Init Project — Stack Selection Module

**Referenced by:** `init-project.md` STEP 0

---

> **NOT APPLICABLE — stack is fixed for this project.**

This module originally presented a multi-option stack selection wizard (Default HolyEstate Stack / AI Recommendation / Custom Setup). For the RefiNext Frontend project the stack is fixed and does not need to be selected.

---

## Fixed Stack (RefiNext Frontend)

**Source of truth:** `.project-management/rules/project-rules.md`

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| UI framework     | React 19                                    |
| Language         | TypeScript (latest)                         |
| Build tool       | Vite                                        |
| Styling          | Tailwind CSS v4                             |
| i18n             | i18next + react-i18next (en + de)           |
| Unit testing     | Vitest (developers only)                    |
| E2E testing      | Playwright (QA-owned — do not add specs)    |
| API client       | Axios + Zod (auto-generated from OpenAPI)   |
| State management | Zustand                                     |
| Backend API      | `refinext-api` (pre-existing, out of scope) |

## Action

Write `technologies.md` with the fixed stack above. No user question needed.

```
✅ Stack confirmed — using fixed RefiNext Frontend stack
   See .project-management/rules/project-rules.md for full detail.
```

---

**Version:** 3.1.0 (FE adaptation — selection removed)
**Updated:** 2026-06-02
**Parent:** `init-project.md`
