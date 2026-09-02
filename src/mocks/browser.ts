/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Composition root for the mock layer. The per-domain handler arrays are spread here rather than
 * re-exported through an index file, so this stays a composition point and not a barrel.
 *
 * Everything not listed below is deliberately unmocked: `onUnhandledRequest: "warn"` (set in
 * main.tsx) then names each unmocked call in the console, which is how you find out what a screen
 * actually needs. A catch-all returning empty arrays would make every screen look finished and empty.
 */
import { setupWorker } from "msw/browser"
import { authHandlers } from "@/mocks/handlers/auth"
import { caseHandlers } from "@/mocks/handlers/cases"
import { checklistHandlers } from "@/mocks/handlers/checklist"
import { businessConfigHandlers } from "@/mocks/handlers/businessConfig"
import { userHandlers } from "@/mocks/handlers/users"
import { fallbackHandlers } from "@/mocks/handlers/fallback"

// Order matters where paths overlap: authHandlers claims `/users/me` and `/users/me/permissions`
// before userHandlers' `/users/:id` can swallow them, and checklistHandlers' literal
// `/cases/:id/checklist*` paths are registered before caseHandlers' `/cases/:caseId` catch-all.
//
// `fallbackHandlers` MUST stay last — it matches every API path, so anything after it would be dead.
export const worker = setupWorker(
  ...authHandlers,
  ...checklistHandlers,
  ...caseHandlers,
  ...businessConfigHandlers,
  ...userHandlers,
  ...fallbackHandlers
)
