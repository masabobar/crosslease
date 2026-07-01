# Init Project — Structure Setup Module

**Referenced by:** `init-project.md` STEP 0

---

> **NOT APPLICABLE — structure already exists for this project.**

This module originally offered a monorepo/single-app selection wizard. For the RefiNext Frontend project the structure is already determined: a single frontend application.

---

## Fixed Structure (RefiNext Frontend)

```
crosslease/
├── refinext-app/          ← The frontend app (React 19 + Vite)
│   ├── src/
│   │   ├── features/      ← Feature-based modules
│   │   ├── i18n/          ← Translations (locales/{en,de}/<feature>.json)
│   │   ├── __tests__/     ← Unit tests (mirrors source tree)
│   │   └── e2e/           ← Playwright specs (QA-owned, do not modify)
│   ├── package.json
│   └── vite.config.ts
└── .project-management/   ← PM system (this directory)
```

**No monorepo.** No `apps/`, `packages/`, or `turbo.json` needed.

## Action

No directory scaffolding needed. Emit:

```
✅ Structure confirmed — single FE app (refinext-app/)
```

---

**Version:** 3.1.0 (FE adaptation — monorepo options removed)
**Updated:** 2026-06-02
**Parent:** `init-project.md`
