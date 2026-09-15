/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The Workflow task catalog list screen.
 *
 * The screen was fully built and had no data: nothing answered `/workflow-task-catalogs`, so it hit
 * the 501 `MOCK_NOT_IMPLEMENTED` fallback, React Query retried, and the table sat on its loading
 * skeleton indefinitely. That is the failure mode the loud fallback exists to make findable, and it
 * is only findable by opening the page — every gate was green.
 *
 * The four filters and the search are honoured here rather than ignored. A filter the mock silently
 * drops looks exactly like a filter that does not work, which is worse for a review screen than no
 * filter at all.
 */
import { http } from "msw"
import { API } from "@/mocks/apiBase"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { mockUuid } from "@/mocks/uuid"
import {
  mockCatalogDetail,
  mockWorkflowTaskCatalogs,
} from "@/mocks/fixtures/workflowTaskCatalog"
import {
  CatalogCaseTypeItemSchema,
  CatalogDetailResponseSchema,
  CatalogListResponseSchema,
  CatalogResponseSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogListItem } from "@/features/workflowTaskCatalog/api/schema"

// Session-scoped, like every other write here: creating a catalogue then finding it in the list
// works, and a reload starts clean.
const catalogs: CatalogListItem[] = [...mockWorkflowTaskCatalogs]

function applyCatalogFilters(url: URL, rows: CatalogListItem[]) {
  let out = rows

  // The search box says "catalog, task code or name". Tasks live behind their own endpoint, so
  // only the catalogue's own name is matchable here — narrower than the placeholder promises, and
  // that is a fixture limit rather than a rule.
  const search = url.searchParams.get("search")
  if (search) {
    const wanted = search.trim().toLowerCase()
    out = out.filter(c => c.catalog_name.toLowerCase().includes(wanted))
  }

  const layer = url.searchParams.get("catalog_layer")
  if (layer) out = out.filter(c => c.catalog_layer === layer)

  const caseType = url.searchParams.get("case_type")
  if (caseType) out = out.filter(c => c.case_type === caseType)

  const state = url.searchParams.get("catalog_state")
  if (state) out = out.filter(c => c.catalog_state === state)

  // `entity_id` carries the product template UUID for a product-specific catalogue — the routes
  // pass `product_template_id` straight through to it.
  const template = url.searchParams.get("product_template_id")
  if (template) out = out.filter(c => c.entity_id === template)

  const entityType = url.searchParams.get("entity_type")
  if (entityType) out = out.filter(c => c.entity_type === entityType)

  return out
}

let createdCount = 0

export const workflowTaskCatalogHandlers = [
  // Declared before the parameterised detail route so the literal path is not shadowed.
  http.get(`${API}/workflow-task-catalogs/case-types`, () =>
    envelope(
      // Every case type the catalogue can be written for, with the entity the catalogue hangs off.
      [
        {
          case_type: "refinancing_request",
          entity_type: "refinancing_request",
        },
        { case_type: "package_redemption", entity_type: "redemption_request" },
        { case_type: "single_redemption", entity_type: "redemption_request" },
      ].map(item => CatalogCaseTypeItemSchema.parse(item))
    )
  ),

  http.get(`${API}/workflow-task-catalogs`, ({ request }) => {
    const url = new URL(request.url)
    const rows = applyCatalogFilters(url, catalogs)

    // This list pages with page/per_page, not the limit/offset the cases list uses.
    const perPage = Number(url.searchParams.get("per_page") ?? "25") || 25
    const page = Number(url.searchParams.get("page") ?? "1") || 1
    const start = (page - 1) * perPage

    return envelope(
      CatalogListResponseSchema.parse({
        items: rows.slice(start, start + perPage),
        total: rows.length,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(rows.length / perPage)),
      })
    )
  }),

  http.post(`${API}/workflow-task-catalogs`, async ({ request }) => {
    const body = (await request.json()) as {
      catalog_name?: string
      catalog_layer?: string
      case_type?: string
      entity_id?: string | null
      valid_from?: string | null
      valid_until?: string | null
    }

    // The backend allows one global default per case type, which is the rule the dialog's own hint
    // states. Enforced here so the dialog's error path is reachable without a real backend.
    if (
      body.catalog_layer === "global_default" &&
      catalogs.some(
        c =>
          c.catalog_layer === "global_default" && c.case_type === body.case_type
      )
    ) {
      return errorEnvelope(
        "WTC_GLOBAL_DEFAULT_EXISTS",
        "A global default already exists for this case type.",
        409
      )
    }

    createdCount += 1
    const created: CatalogListItem = {
      id: mockUuid(`e0b${createdCount.toString(16)}`),
      catalog_name: body.catalog_name ?? "Untitled catalog",
      catalog_layer:
        body.catalog_layer === "global_default"
          ? "global_default"
          : "product_specific",
      // Every catalogue starts as a draft — the dialog's hint says so, and no case resolves it
      // until it is activated.
      catalog_state: "draft",
      entity_type: "refinancing_request",
      entity_id: body.entity_id ?? null,
      case_type:
        (body.case_type as CatalogListItem["case_type"]) ??
        "refinancing_request",
      valid_from: body.valid_from ?? null,
      valid_until: body.valid_until ?? null,
      created_at: new Date().toISOString(),
    }
    catalogs.unshift(created)

    return envelope(
      CatalogResponseSchema.parse(mockCatalogDetail(created)),
      "CATALOG_CREATED"
    )
  }),

  ...(
    [
      ["activate", "active"],
      ["suspend", "suspended"],
      ["reactivate", "active"],
    ] as const
  ).map(([action, nextState]) =>
    http.post(
      `${API}/workflow-task-catalogs/:catalogId/${action}`,
      ({ params }) => {
        const found = catalogs.find(c => c.id === params.catalogId)
        if (!found) {
          return errorEnvelope("NOT_FOUND", "No such catalogue.", 404)
        }
        // Mutated in place so the row's state — and therefore which actions its menu offers —
        // reflects what just happened.
        found.catalog_state = nextState
        return envelope(
          CatalogResponseSchema.parse(mockCatalogDetail(found)),
          "CATALOG_UPDATED"
        )
      }
    )
  ),

  http.get(`${API}/workflow-task-catalogs/:catalogId`, ({ params }) => {
    const found = catalogs.find(c => c.id === params.catalogId)
    if (!found) return errorEnvelope("NOT_FOUND", "No such catalogue.", 404)
    return envelope(CatalogDetailResponseSchema.parse(mockCatalogDetail(found)))
  }),
]
