# Screen Map - Quick Guide

**Use when:** You have a web CMS / mobile / web-with-admin project and want a consolidated screen-by-screen view with the APIs each screen uses
**Command:** `/screen-map`
**Time:** ~30 seconds
**Output:** Refreshed `input/screens/screen-map.md`

**All documentation is in English only.**

---

## 🎯 What It Does

Reads every **frontend story** in your backlog (per `.claude/rules/screen-driven-backlog.md`) and refreshes the consolidated screen map at `.project-management/input/screens/screen-map.md`:

- ✅ Re-derives the **API Endpoints Used** column for each screen from its linked stories
- ✅ Re-aggregates **Status** for each screen from the linked story statuses
- ✅ Preserves your hand-curated **navigation hierarchy** (ASCII tree) and **screen metadata** (Name, Type, Path, Auth, Description)
- ✅ Reports **drift** — stories pointing to screens that don't exist in the map, orphan entries, malformed stories

---

## 📋 Command Format

```bash
/screen-map
```

No arguments. Detects the project automatically.

---

## 🛠️ When to Run It

- **After `/add-scope`** added a frontend story → refresh so the new endpoints appear
- **After `/process-client-docs`** regenerated stories → align the map with the new backlog
- **Before sprint planning / review** → so the screen view is current
- **Before `/execute-work` on a frontend phase** → confirms which screens are touched and which APIs are needed

---

## ⚠️ When It Does NOT Apply

- Backend-only / API-only projects (no UI surface)
- CLI tools, libraries, infrastructure-only repos
- Simple SPAs with ≤ 5 screens (overhead exceeds value)

Per `.claude/rules/screen-inventory.md` §1. The command will exit with a friendly message if it detects one of these cases.

---

## 📊 What You Get

The refreshed `screen-map.md` has three sections (per the rule):

1. **§1 Navigation Hierarchy** — ASCII tree of routes/screens with auth gates (`public` / `requireAuth` / `requireRole=ADMIN`). Hand-curated; the command does NOT touch this.
2. **§2 Screen Registry** — one entry per screen with metadata + the regenerated API table:

   ```
   ### SCREEN-001 — Product Detail

   | Type | Web/Mobile  | Path | /products/:id  | Auth | Public |
   | Stories | US-042, US-043 | Status | In Progress (1/2) |

   Description: Customer-facing product detail page with gallery and add-to-cart.

   API Endpoints Used: (generated)
   | Method | Path | Purpose | Source story |
   |--------|------|---------|--------------|
   | GET    | /api/v1/products/:id | Load product detail | US-042 |
   | POST   | /api/v1/cart/items   | Add to cart         | US-043 |
   ```

3. **§4 Drift Report** — auto-generated at the bottom; lists any inconsistencies to resolve.

---

## 🚦 Reading the Drift Report

The command emits a summary to the console AND writes the same items into §4 of the file. Resolve before the next sprint review:

- **Stories referencing screens not in this map** → add the screen entry to §2 (or fix the story's `**Screen:**` field if it's a typo)
- **Orphan screens (no backing story)** → either add a story via `/add-scope`, or move the entry to §3 Removed Screens
- **Malformed frontend stories** (Type: Frontend but missing `**Screen:**` or `**API Endpoints Used:**`) → fix the story
- **Navigation ↔ registry mismatches** → align the names in §1 and §2

---

## 🆕 First-Time Setup

If `input/screens/screen-map.md` doesn't exist yet:

- `/init-project` auto-scaffolds it for project types `[2] Backend + Mobile`, `[3] Full Monorepo`, and `[4] Web Only`
- Or run `/screen-map` and answer `Yes` when it offers to scaffold from the template

---

## 💡 Tips

- **API column is generated** — if it's wrong, edit the **story**, not the map. Then re-run `/screen-map`.
- **Hand-edit §1 (nav hierarchy) and §2 metadata freely** — those are yours; the command preserves them.
- **Large projects** (> 40 screens or file > 300 lines): split per domain — `input/screens/admin.md`, `input/screens/customer.md`, etc. Per `.claude/rules/screen-inventory.md` §2.
- **Removed screens go to §3**, not deleted — preserves history for change discussions.

---

## 🔗 Related Commands

- `/add-scope` — add a frontend story; run `/screen-map` after
- `/process-client-docs` — generates initial stories; run `/screen-map` after
- `/project-status` — overall project health (screens are part of the bigger picture)
- `/execute-work` — implement a phase/epic/story; check the map first to confirm screen coverage

---

## 📚 Rule Source

[`.claude/rules/screen-inventory.md`](../../rules/screen-inventory.md) — full definition of when it applies, source-of-truth split, drift detection, and lifecycle.
