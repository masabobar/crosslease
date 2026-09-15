/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Workflow task catalogues for the list screen.
 *
 * The screen itself was already built — title, both create buttons, the search, the four filters
 * and all eight columns. What it had was no data: `/workflow-task-catalogs` was never mocked, so it
 * hit the 501 `MOCK_NOT_IMPLEMENTED` fallback, React Query retried three times, and the table sat
 * on its loading skeleton for good. A screen that renders its whole shell and then never resolves
 * reads as a screen that is broken rather than one that is unmocked, which is exactly the failure
 * `prototype-mode.md` keeps the 501 fallback loud for.
 *
 * The rows are the ones on the client's own screenshot, so what is on screen here matches what she
 * is looking at: four product-specific drafts against one product template, and one active global
 * default. That spread is deliberate — it exercises both layers, both states the list can act on,
 * and the em-dashes a global default leaves in the Product template column.
 */
import { mockUuid } from "@/mocks/uuid"
import type {
  CatalogDetailResponse,
  CatalogListItem,
} from "@/features/workflowTaskCatalog/api/schema"

// A template that actually exists in `fixtures/businessConfig.ts`. The table resolves the name
// client-side from `entity_id` and falls back to printing the raw UUID when it cannot — which is
// what a made-up id produced here, and what the column looked like before this was corrected.
const TEST_1_TEMPLATE = "00000000-0000-4000-8000-00000000f001"

export const mockWorkflowTaskCatalogs: CatalogListItem[] = [
  {
    id: mockUuid("e0a1"),
    catalog_name: "Financing of test 1",
    catalog_layer: "product_specific",
    catalog_state: "draft",
    entity_type: "refinancing_request",
    entity_id: TEST_1_TEMPLATE,
    case_type: "refinancing_request",
    valid_from: "2026-08-21",
    valid_until: null,
    created_at: "2026-08-21T12:59:00Z",
  },
  {
    id: mockUuid("e0a2"),
    catalog_name: "Financing of test 2",
    catalog_layer: "product_specific",
    catalog_state: "draft",
    entity_type: "refinancing_request",
    entity_id: TEST_1_TEMPLATE,
    case_type: "refinancing_request",
    valid_from: "2026-08-21",
    valid_until: null,
    created_at: "2026-08-21T12:59:00Z",
  },
  {
    id: mockUuid("e0a3"),
    catalog_name: "Financing of XXX",
    catalog_layer: "product_specific",
    catalog_state: "draft",
    entity_type: "refinancing_request",
    entity_id: TEST_1_TEMPLATE,
    case_type: "refinancing_request",
    valid_from: "2026-08-21",
    valid_until: null,
    created_at: "2026-08-21T12:58:00Z",
  },
  {
    id: mockUuid("e0a4"),
    catalog_name: "RR of this",
    catalog_layer: "product_specific",
    catalog_state: "draft",
    entity_type: "refinancing_request",
    entity_id: TEST_1_TEMPLATE,
    case_type: "refinancing_request",
    valid_from: "2026-08-21",
    valid_until: null,
    created_at: "2026-08-21T13:00:00Z",
  },
  {
    // A global default carries no product template at all, which is what leaves the em-dashes in
    // that column — the one row on the screenshot that proves the column can be empty.
    id: mockUuid("e0a5"),
    catalog_name: "Vesna Test",
    catalog_layer: "global_default",
    catalog_state: "active",
    entity_type: "refinancing_request",
    entity_id: null,
    case_type: "refinancing_request",
    valid_from: null,
    valid_until: null,
    created_at: "2026-09-01T15:27:00Z",
  },
]

/**
 * The detail a row click opens.
 *
 * Built from the list row rather than kept as a second fixture: the two would otherwise drift, and
 * the one thing a detail page must agree with is the row that led to it.
 */
export function mockCatalogDetail(row: CatalogListItem): CatalogDetailResponse {
  return {
    id: row.id,
    catalog_name: row.catalog_name,
    catalog_layer: row.catalog_layer,
    catalog_state: row.catalog_state,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    case_type: row.case_type,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    description: null,
    created_at: row.created_at,
    created_by: "00000000-0000-4000-8000-000000000003",
    updated_at: row.created_at,
    tenant_id: "00000000-0000-4000-8000-0000000000ff",
    current_version_id: null,
    // The detail page's own tabs load tasks and phases from their own endpoints; the catalogue
    // itself carries none inline.
    tasks: [],
  }
}
