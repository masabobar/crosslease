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
  catalogVersionId,
  mockCatalogDetail,
  mockWorkflowTaskCatalogs,
} from "@/mocks/fixtures/workflowTaskCatalog"
import {
  AuditTrailResponseSchema,
  CataloguePhaseListSchema,
  CataloguePhaseSchema,
  CatalogCaseTypeItemSchema,
  FieldRegistryListSchema,
  TaskResponseWithWarningsSchema,
  CatalogDetailResponseSchema,
  CatalogListResponseSchema,
  CatalogResponseSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type {
  CataloguePhase,
  CatalogListItem,
  TaskResponseWithWarnings,
} from "@/features/workflowTaskCatalog/api/schema"

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
let phaseCount = 0
let taskCount = 0

// Session-scoped, keyed by the catalogue version the panels address.
const phasesByVersion: Record<string, CataloguePhase[]> = {}
const tasksByVersion: Record<string, TaskResponseWithWarnings[]> = {}

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

  // ── Stages and tasks ───────────────────────────────────────────────────────
  // Both hang off the catalogue's current version — there is no versions endpoint, so the version
  // is derived from the catalogue id and every handler below addresses the same one.
  http.get(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/phases`,
    ({ params }) =>
      envelope(
        CataloguePhaseListSchema.parse(
          phasesByVersion[params.versionId as string] ?? []
        )
      )
  ),

  http.post(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/phases`,
    async ({ params, request }) => {
      const versionId = params.versionId as string
      const body = (await request.json()) as {
        name?: string
        position?: number
      }
      const existing = phasesByVersion[versionId] ?? []
      phaseCount += 1
      const created: CataloguePhase = {
        id: mockUuid(`e1a${phaseCount.toString(16)}`),
        catalog_version_id: versionId,
        name: body.name ?? "Untitled stage",
        // The backend appends at max+1 when no position is sent, which is what the panel relies
        // on rather than computing one itself.
        position: body.position ?? existing.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      phasesByVersion[versionId] = [...existing, created]
      return envelope(CataloguePhaseSchema.parse(created), "PHASE_ADDED")
    }
  ),

  http.patch(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/phases/:phaseId`,
    async ({ params, request }) => {
      const rows = phasesByVersion[params.versionId as string] ?? []
      const found = rows.find(p => p.id === params.phaseId)
      if (!found) return errorEnvelope("NOT_FOUND", "No such stage.", 404)
      const body = (await request.json()) as { name?: string }
      if (body.name !== undefined) found.name = body.name
      found.updated_at = new Date().toISOString()
      return envelope(CataloguePhaseSchema.parse(found), "PHASE_UPDATED")
    }
  ),

  http.post(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/phases/reorder`,
    async ({ params, request }) => {
      const versionId = params.versionId as string
      const body = (await request.json()) as { phase_ids?: string[] }
      const rows = phasesByVersion[versionId] ?? []
      const order = body.phase_ids ?? []
      phasesByVersion[versionId] = [...rows]
        .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
        .map((phase, index) => ({ ...phase, position: index + 1 }))
      return envelope(
        CataloguePhaseListSchema.parse(phasesByVersion[versionId]),
        "PHASES_REORDERED"
      )
    }
  ),

  http.delete(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/phases/:phaseId`,
    ({ params }) => {
      const versionId = params.versionId as string
      phasesByVersion[versionId] = (phasesByVersion[versionId] ?? []).filter(
        p => p.id !== params.phaseId
      )
      return envelope(null, "PHASE_DELETED")
    }
  ),

  http.post(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/tasks`,
    async ({ params, request }) => {
      const versionId = params.versionId as string
      const body = (await request.json()) as Record<string, unknown>
      const existing = tasksByVersion[versionId] ?? []
      taskCount += 1
      const created = TaskResponseWithWarningsSchema.parse({
        id: mockUuid(`e2a${taskCount.toString(16)}`),
        catalog_version_id: versionId,
        layer_action: body.layer_action ?? "supplement",
        // Server-assigned and stable within a catalogue — it is the number the bank says out loud
        // ("step 4 rejects"), which is why the sheet does not offer it.
        task_number: existing.length + 1,
        task_code: body.task_code ?? null,
        task_name: body.task_name ?? null,
        task_description: body.task_description ?? null,
        category: body.category ?? null,
        responsible_role: null,
        responsible_roles: body.responsible_roles ?? null,
        is_mandatory: body.is_mandatory ?? null,
        weight: body.weight ?? null,
        display_order: body.display_order ?? existing.length + 1,
        stage_categorization: body.stage_categorization ?? null,
        applicable_process_contexts: body.applicable_process_contexts ?? null,
        is_active: body.is_active ?? true,
        parent_task_id: null,
        phase_id: body.phase_id ?? null,
        generated_document_ref: null,
        trigger_event: null,
        permitted_outcomes: null,
        lifecycle_entity: null,
        capture_section_name: null,
        doc_requirement_ref: body.doc_requirement_ref ?? null,
        doc_requirement_pin_mode: null,
        conditional_trigger: body.conditional_trigger ?? null,
        task_type: body.task_type ?? null,
        applicability: body.applicability ?? null,
        four_eyes_sign_off: body.four_eyes_sign_off ?? false,
        four_eyes_exclusion_wide: body.four_eyes_exclusion_wide ?? false,
        exclusion_task_ids: body.exclusion_task_ids ?? [],
        warnings: [],
      })
      tasksByVersion[versionId] = [...existing, created]
      return envelope(created, "TASK_ADDED")
    }
  ),

  http.patch(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/tasks/:taskId`,
    async ({ params, request }) => {
      const rows = tasksByVersion[params.versionId as string] ?? []
      const found = rows.find(t => t.id === params.taskId)
      if (!found) return errorEnvelope("NOT_FOUND", "No such task.", 404)
      Object.assign(found, (await request.json()) as object)
      return envelope(
        TaskResponseWithWarningsSchema.parse(found),
        "TASK_UPDATED"
      )
    }
  ),

  http.delete(
    `${API}/workflow-task-catalogs/:catalogId/versions/:versionId/tasks/:taskId`,
    ({ params }) => {
      const versionId = params.versionId as string
      tasksByVersion[versionId] = (tasksByVersion[versionId] ?? []).filter(
        t => t.id !== params.taskId
      )
      return envelope(null, "TASK_DELETED")
    }
  ),

  // The catalogue is edited in place, so this log IS the change history — the page says as much.
  http.get(
    `${API}/workflow-task-catalogs/:catalogId/audit-trail`,
    ({ params }) => {
      const found = catalogs.find(c => c.id === params.catalogId)
      const actor = "00000000-0000-4000-8000-000000000003"
      const events = [
        {
          id: mockUuid("e3a1"),
          event_type: "catalog.created",
          action_type: "create",
          actor_id: actor,
          actor_role_at_time: "bank_power_user",
          actor_display: "Power User",
          recorded_at: found?.created_at ?? new Date().toISOString(),
          entity_display: "Catalog created",
          old_data: null,
          new_data: null,
          changed_fields: null,
        },
      ]
      return envelope(
        AuditTrailResponseSchema.parse({ events, next_cursor: null })
      )
    }
  ),

  // Read-only: this app has no authoring surface for the registry itself, so it exists to resolve
  // a `field_registry_id` to a human label on an applicability condition.
  http.get(`${API}/workflow-task-catalogs/field-registry`, () =>
    envelope(
      FieldRegistryListSchema.parse([
        {
          id: mockUuid("e4a1"),
          field_key: "financing_amount",
          field_type: "decimal",
          label: "Financing amount",
          data_available: true,
        },
        {
          id: mockUuid("e4a2"),
          field_key: "contract_count",
          field_type: "integer",
          label: "Number of contracts",
          data_available: true,
        },
        {
          id: mockUuid("e4a3"),
          field_key: "lc_partner_id",
          field_type: "uuid",
          label: "Leasing company",
          data_available: false,
        },
      ])
    )
  ),

  http.get(`${API}/workflow-task-catalogs/:catalogId`, ({ params }) => {
    const found = catalogs.find(c => c.id === params.catalogId)
    if (!found) return errorEnvelope("NOT_FOUND", "No such catalogue.", 404)
    return envelope(
      CatalogDetailResponseSchema.parse({
        ...mockCatalogDetail(found),
        // The detail response carries the version's tasks inline; the phases have their own
        // endpoint. Read from the same store the task mutations write to, so adding one shows up
        // without a second source of truth.
        tasks: tasksByVersion[catalogVersionId(found.id)] ?? [],
      })
    )
  }),
]
