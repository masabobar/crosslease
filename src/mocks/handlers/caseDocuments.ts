/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The case Documents tab.
 *
 * It exists because the tab was **stuck on its loading skeleton forever**: the requirements panel
 * resolves its catalogue through `GET /tenants/{id}/document-requirement-catalogs`, that call hit
 * the 501 fallback, React Query retried, and the promise never settled — so the tab rendered
 * nothing at all. Type-check, lint and the unit suite were all green with that in place. It was
 * visible only by opening the tab.
 *
 * Output is parsed through the **real** schemas, so a fixture that drifts throws here rather than
 * reaching the screen.
 */
import { http } from "msw"
import {
  DocumentRequirementCatalogListResponseSchema,
  RuntimeRequirementSurfaceResponseSchema,
} from "@/features/documentRequirements/api/schema"
import {
  CombinedDocumentListResponseSchema,
  CombinedDocumentResponseSchema,
  GeneratedDocumentListResponseSchema,
} from "@/features/cases/api/schema"
import { envelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"
import { mockUuid } from "@/mocks/uuid"

const CATALOG_ID = mockUuid("dc01")
const ACTOR = mockUuid("5")

// Session-scoped: which document kinds have been generated. Starts with the cover sheet only, so
// both states — produced and missing — are reachable on first open.
const generatedByCaseId: Record<string, string[]> = {}

function generated(caseId: string): string[] {
  generatedByCaseId[caseId] ??= ["cover_sheet"]
  return generatedByCaseId[caseId]
}

const FILE_NAMES: Record<string, string> = {
  cover_sheet: "Deckblatt_RR-2026-104.pdf",
  loan_offer: "Loan_offer_RR-2026-104.pdf",
  bank_settlement: "Bankabrechnung_RR-2026-104.pdf",
  payment_plan: "Zahlungsplan_RR-2026-104.pdf",
  financing_commitment: "Finanzierungszusage_RR-2026-104.pdf",
}

// Built through `mockUuid`, which refuses a non-hex tag — a readable tag like "med1" is exactly
// what previously made this response fail Zod parsing and 500 the whole tab.
function mediaId(code: string): string {
  const index = Object.keys(FILE_NAMES).indexOf(code) + 1
  return mockUuid(`ed${index.toString(16)}`)
}

function generatedList(caseId: string) {
  return GeneratedDocumentListResponseSchema.parse({
    case_id: caseId,
    documents: generated(caseId).map(code => ({
      document_type_code: code,
      media_id: mediaId(code),
      file_name: FILE_NAMES[code] ?? `${code}.pdf`,
      produced_by: ACTOR,
      produced_at_utc: "2026-09-08T07:12:00Z",
      produced_at_local: "2026-09-08T09:12:00+02:00",
    })),
  })
}

const buildsByCaseId: Record<string, unknown[]> = {}

export const caseDocumentHandlers = [
  // The catalogue the requirements panel resolves. One catalogue per bank, so a single item is the
  // real shape rather than a convenience.
  http.get(`${API}/tenants/:tenantId/document-requirement-catalogs`, () =>
    envelope(
      DocumentRequirementCatalogListResponseSchema.parse({
        items: [
          {
            id: CATALOG_ID,
            catalog_name: "Refinancing document set",
            valid_from: "2026-01-01",
            valid_to: null,
            created_at: "2026-01-01T09:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        per_page: 25,
        total_pages: 1,
      })
    )
  ),

  http.get(
    `${API}/document-requirement-catalogs/:catalogId/objects/:objectId/requirements`,
    ({ params, request }) => {
      const caseType = new URL(request.url).searchParams.get("case_type")
      return envelope(
        RuntimeRequirementSurfaceResponseSchema.parse({
          catalog_id: params.catalogId as string,
          business_object_id: params.objectId as string,
          case_type: caseType,
          completeness_summary: "2 of 5 documents present",
          requirements: [
            {
              requirement_definition_id: mockUuid("d1"),
              requirement_code: "ZB2",
              document_type_name: "Z B II vehicle registration",
              classification: "mandatory",
              stage_categorization: "Stage 1 review",
              fulfilment_status: "outstanding",
              is_blocking: true,
              document_origin: "uploaded",
              applicable_case_types: ["refinancing_request"],
              linked_document_id: null,
            },
            {
              requirement_definition_id: mockUuid("d2"),
              requirement_code: "LOAN_SIGNED",
              document_type_name: "Signed loan offer",
              classification: "mandatory",
              stage_categorization: "Stage 2 review",
              fulfilment_status: "uploaded_pending_review",
              is_blocking: true,
              document_origin: "uploaded",
              applicable_case_types: ["refinancing_request"],
              linked_document_id: mockUuid("df1"),
            },
            {
              requirement_definition_id: mockUuid("d3"),
              requirement_code: "MASTER_AGREEMENT",
              document_type_name: "RKV, buy back agreement",
              classification: "mandatory",
              stage_categorization: "Stage 1 review",
              fulfilment_status: "fulfilled",
              is_blocking: false,
              document_origin: "uploaded",
              applicable_case_types: ["refinancing_request"],
              linked_document_id: mockUuid("df2"),
            },
            {
              requirement_definition_id: mockUuid("d4"),
              requirement_code: "MISC",
              document_type_name: "Miscellaneous",
              classification: "optional",
              stage_categorization: null,
              fulfilment_status: "outstanding",
              is_blocking: false,
              document_origin: "uploaded",
              applicable_case_types: ["refinancing_request"],
              linked_document_id: null,
            },
          ],
        })
      )
    }
  ),

  http.get(`${API}/cases/:caseId/generated-documents`, ({ params }) =>
    envelope(generatedList(params.caseId as string))
  ),

  // All five generators answer with the refreshed list, which is why the panel replaces its list
  // from the response rather than inserting a row.
  http.post(`${API}/cases/:caseId/generated-documents/:kind`, ({ params }) => {
    const caseId = params.caseId as string
    const code = (params.kind as string).replace(/-/g, "_")
    const rows = generated(caseId)
    if (!rows.includes(code)) rows.push(code)
    return envelope(generatedList(caseId))
  }),

  http.get(`${API}/cases/:caseId/combined-document/history`, ({ params }) =>
    envelope(
      CombinedDocumentListResponseSchema.parse({
        case_id: params.caseId as string,
        builds: buildsByCaseId[params.caseId as string] ?? [],
      })
    )
  ),

  http.post(`${API}/cases/:caseId/combined-document`, ({ params }) => {
    const caseId = params.caseId as string
    const previous = (buildsByCaseId[caseId] ?? []) as {
      is_current: boolean
    }[]
    // Rebuilding supersedes rather than replaces: the earlier builds stay in the history and stop
    // being current. The panel reads `is_current`, so modelling this wrongly here would let it
    // offer a superseded build as the latest.
    const superseded = previous.map(build => ({ ...build, is_current: false }))
    const built = CombinedDocumentResponseSchema.parse({
      id: mockUuid(`cb${(previous.length + 1).toString(16)}`),
      case_id: caseId,
      media_id: mockUuid("cb01"),
      file_name: `Gesamtdokument_${new Date().toISOString().slice(0, 10)}.pdf`,
      is_current: true,
      build_kind: "full",
      document_count: generated(caseId).length + 2,
      built_by: ACTOR,
      built_at: new Date().toISOString(),
    })
    buildsByCaseId[caseId] = [built, ...superseded]
    return envelope(built)
  }),
]
