/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Partners, framework agreements and product templates — the three configuration surfaces that have
 * screens today, plus the two lookups wizard step 1 reads (`lc-partners`, `product-templates/selectable`).
 *
 * Every response is parsed through its real schema on the way out, so a fixture that drifts from the
 * contract fails here rather than as a broken screen.
 */
import { http } from "msw"
import {
  AssessmentCatalogueResponseSchema,
  AssessmentListResponseSchema,
  AssessmentSchema,
  PartnerAddressListResponseSchema,
  PartnerConnectionsResponseSchema,
  PartnerDocumentsResponseSchema,
  PartnerRelationshipsResponseSchema,
} from "@/features/partners/api/assessmentSchema"
import type { Assessment } from "@/features/partners/api/assessmentSchema"
import {
  BankAccountListResponseSchema,
  DuplicatePairListResponseSchema,
  PartnerRolesResponseSchema,
  PartnerDetailResponseSchema,
  PartnerListResponseSchema,
} from "@/features/partners/api/schema"
import {
  FAListResponseSchema,
  FALCPartnersResponseSchema,
  FADetailResponseSchema,
  FAUtilizationResponseSchema,
  SelectableTemplatesResponseSchema,
} from "@/features/frameworkAgreements/api/schema"
import {
  TemplateListResponseSchema,
  TemplateStatusSchema,
} from "@/features/productTemplates/api/schema"
import {
  mockDuplicatePairs,
  mockLesseePartners,
  mockPartners,
} from "@/mocks/fixtures/partners"
import { mockUuid } from "@/mocks/uuid"
import {
  PartnerMatchResponseSchema,
  PartnerSubmitResponseSchema,
} from "@/features/partners/api/schema"
import type { PartnerListItem } from "@/features/partners/api/schema"
import {
  mockFrameworkAgreements,
  mockLcPartners,
  mockProductTemplates,
  mockUtilization,
} from "@/mocks/fixtures/businessConfig"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

/** Free-text search over one displayed field — enough for the search box to visibly work. */
function search<T>(url: URL, rows: T[], field: (row: T) => string): T[] {
  const q = url.searchParams.get("search")?.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(r => field(r).toLowerCase().includes(q))
}

function paginate<T>(url: URL, rows: T[], perPageDefault = 20) {
  const page = Number(url.searchParams.get("page") ?? "1") || 1
  const perPage =
    Number(url.searchParams.get("per_page") ?? String(perPageDefault)) ||
    perPageDefault
  const start = (page - 1) * perPage
  return {
    items: rows.slice(start, start + perPage),
    total: rows.length,
    page,
    per_page: perPage,
    total_pages: Math.max(1, Math.ceil(rows.length / perPage)),
  }
}

/**
 * Partners created in the session, so a party created inside the manual-entry modal is findable by
 * the picker's search afterwards. Not persisted, like every other write here.
 */
let createdPartnerCount = 0

// Session-scoped assessments, seeded on first read so the tab opens on a record rather than on an
// empty state — the shapes that matter are one with values and one already cancelled.
const assessmentsByPartnerId: Record<string, Assessment[]> = {}

function seedAssessments(partnerId: string): Assessment[] {
  const seeded = [
    AssessmentSchema.parse({
      id: mockUuid("a5e1"),
      partner_id: partnerId,
      source_type_id: mockUuid("a5c1"),
      source_type_code: "CREFO",
      source_type_name: "Creditreform",
      report_date: "2026-08-12",
      source_reference: "PRT-DE-0044120",
      case_id: null,
      contract_id: null,
      role: null,
      context_note: "Pulled for the refinancing request of August.",
      cancelled_at: null,
      cancel_reason: null,
      created_by: "00000000-0000-4000-8000-000000000003",
      created_at: "2026-08-12T08:40:00Z",
      values: [
        {
          attribute_id: mockUuid("a5a1"),
          attribute_code: "SOLVENCY_INDEX",
          attribute_name: "Solvency index",
          value_number: "212",
          value_text: null,
          no_value_supplied: false,
        },
        {
          attribute_id: mockUuid("a5a2"),
          attribute_code: "CREDIT_LIMIT",
          attribute_name: "Recommended credit limit",
          value_number: "250000.00",
          value_text: null,
          no_value_supplied: false,
        },
        {
          // The agency returned nothing for this one — a different fact from nobody filling it in.
          attribute_id: mockUuid("a5a3"),
          attribute_code: "PAYMENT_BEHAVIOUR",
          attribute_name: "Payment behaviour",
          value_number: null,
          value_text: null,
          no_value_supplied: true,
        },
      ],
    }),
    AssessmentSchema.parse({
      id: mockUuid("a5e2"),
      partner_id: partnerId,
      source_type_id: mockUuid("a5c2"),
      source_type_code: "SCHUFA",
      source_type_name: "Schufa",
      report_date: "2026-05-03",
      source_reference: null,
      case_id: null,
      contract_id: null,
      role: null,
      context_note: null,
      cancelled_at: "2026-06-01T10:15:00Z",
      cancel_reason: "Superseded by the August Creditreform report.",
      created_by: "00000000-0000-4000-8000-000000000003",
      created_at: "2026-05-03T09:00:00Z",
      values: [
        {
          attribute_id: mockUuid("a5a4"),
          attribute_code: "SCORE",
          attribute_name: "Score",
          value_number: "94",
          value_text: null,
          no_value_supplied: false,
        },
      ],
    }),
  ]
  assessmentsByPartnerId[partnerId] = seeded
  return seeded
}

// The catalogue is the only place attribute names live, so a created record reads them back from
// it — echoing the request alone would produce a row the list cannot label.
const ASSESSMENT_ATTRIBUTE_NAMES: Record<
  string,
  { code: string; name: string }
> = {
  [mockUuid("a5a1")]: { code: "SOLVENCY_INDEX", name: "Solvency index" },
  [mockUuid("a5a2")]: {
    code: "CREDIT_LIMIT",
    name: "Recommended credit limit",
  },
  [mockUuid("a5a3")]: { code: "PAYMENT_BEHAVIOUR", name: "Payment behaviour" },
  [mockUuid("a5a4")]: { code: "SCORE", name: "Score" },
}

const ASSESSMENT_SOURCE_NAMES: Record<string, { code: string; name: string }> =
  {
    [mockUuid("a5c1")]: { code: "CREFO", name: "Creditreform" },
    [mockUuid("a5c2")]: { code: "SCHUFA", name: "Schufa" },
    [mockUuid("a5c3")]: { code: "INTERNAL", name: "Internal assessment" },
  }

function buildAssessment(
  partnerId: string,
  body: Record<string, unknown>,
  index: number
): Assessment {
  const sourceTypeId = body.source_type_id as string
  const source = ASSESSMENT_SOURCE_NAMES[sourceTypeId] ?? {
    code: "UNKNOWN",
    name: "Assessment",
  }
  const values = (body.values ?? []) as Record<string, unknown>[]

  return AssessmentSchema.parse({
    id: mockUuid(`a5f${index.toString(16)}`),
    partner_id: partnerId,
    source_type_id: sourceTypeId,
    source_type_code: source.code,
    source_type_name: source.name,
    report_date: body.report_date as string,
    source_reference: (body.source_reference as string) ?? null,
    case_id: null,
    contract_id: null,
    role: null,
    context_note: (body.context_note as string) ?? null,
    cancelled_at: null,
    cancel_reason: null,
    created_by: "00000000-0000-4000-8000-000000000003",
    created_at: new Date().toISOString(),
    values: values.map(value => {
      const attribute = ASSESSMENT_ATTRIBUTE_NAMES[
        value.attribute_id as string
      ] ?? { code: "UNKNOWN", name: "Value" }
      return {
        attribute_id: value.attribute_id as string,
        attribute_code: attribute.code,
        attribute_name: attribute.name,
        value_number: (value.value_number as string) ?? null,
        value_text: (value.value_text as string) ?? null,
        no_value_supplied: value.no_value_supplied === true,
      }
    }),
  })
}

export const businessConfigHandlers = [
  // ── Partners ──────────────────────────────────────────────────────────────
  // The duplicate check that gates creation. Answers `no_match` on a name nothing resembles and
  // `ambiguous` on one that shares a stem with a partner already on file, so both halves of
  // MatchingReview are reachable — a review that only ever says "nothing found" would never show
  // the candidate list it exists for.
  http.post(`${API}/tenants/:tenantId/partners/match`, async ({ request }) => {
    const body = (await request.json()) as {
      identity?: { display_name?: unknown }
    }
    const name =
      typeof body?.identity?.display_name === "string"
        ? body.identity.display_name.trim().toLowerCase()
        : ""

    const stem = name.slice(0, 4)
    const candidates =
      stem.length >= 3
        ? mockPartners.filter(p => p.display_name.toLowerCase().includes(stem))
        : []

    return envelope(
      PartnerMatchResponseSchema.parse({
        classification: candidates.length > 0 ? "ambiguous" : "no_match",
        confidence: candidates.length > 0 ? "0.62" : null,
        matched_partner_id: null,
        candidate_summaries: candidates.slice(0, 3).map(p => ({
          partner_id: p.partner_id,
          display_name: p.display_name,
          partner_type: p.partner_type,
          status: p.status,
          matched_anchors: ["display_name"],
          confidence: "0.62",
        })),
        inputs_hash: `mock-${stem || "empty"}`,
      })
    )
  }),

  // Creates the partner. `status` is `pending_confirmation`, not `confirmed`: a partner created
  // in context still has to be confirmed, and `is_new` is what the party link surfaces on the case.
  http.post(`${API}/tenants/:tenantId/partners`, async ({ request }) => {
    const body = (await request.json()) as {
      identity?: {
        display_name?: unknown
        partner_type?: unknown
        country?: unknown
      }
    }
    const identity = body?.identity ?? {}
    createdPartnerCount += 1
    const created = {
      partner_id: mockUuid(
        `bf${createdPartnerCount.toString(16).padStart(2, "0")}`
      ),
      display_name:
        typeof identity.display_name === "string" &&
        identity.display_name !== ""
          ? identity.display_name
          : "New partner",
      partner_type:
        typeof identity.partner_type === "string"
          ? identity.partner_type
          : "legal_entity",
      status: "pending_confirmation",
      is_new: true,
      governed_action_id: null,
      country: typeof identity.country === "string" ? identity.country : "DE",
    }

    // Added to the registry list so the picker's search finds it next time, and the Partner
    // registry screen shows it too — a created partner that vanished would be a lie.
    mockPartners.unshift({
      partner_id: created.partner_id,
      display_name: created.display_name,
      partner_type: created.partner_type as PartnerListItem["partner_type"],
      status: "pending_confirmation",
      country: created.country,
      ubo_completeness_status: "missing",
      roles: ["lessee"],
    })

    return envelope(PartnerSubmitResponseSchema.parse(created))
  }),

  /**
   * One partner, by id.
   *
   * Reached from the wizard's contract table, which resolves each row's `lessee_partner_id` into a
   * name — `ContractRead` carries only the id. Unmocked it hit the 501 fallback and every row fell
   * back to printing the leasing company's own contract number, which is the identifier a bank
   * reader can do least with.
   */
  /**
   * The assessment catalogue — the source types a tenant records reports from, each with its own
   * attributes. It is what builds the create form, so the two shapes here are the ones that matter:
   * a structured source with a numeric scale, and a free-text-only one with no attributes at all.
   */
  http.get(`${API}/partners/assessment-catalogue`, () =>
    envelope(
      AssessmentCatalogueResponseSchema.parse({
        source_types: [
          {
            id: mockUuid("a5c1"),
            code: "CREFO",
            name: "Creditreform",
            free_text_only: false,
            attributes: [
              {
                id: mockUuid("a5a1"),
                code: "SOLVENCY_INDEX",
                name: "Solvency index",
                value_type: "number",
                value_range: "100–600",
                scale_hint: "lower is better",
              },
              {
                id: mockUuid("a5a2"),
                code: "CREDIT_LIMIT",
                name: "Recommended credit limit",
                value_type: "number",
                value_range: null,
                scale_hint: "EUR",
              },
              {
                id: mockUuid("a5a3"),
                code: "PAYMENT_BEHAVIOUR",
                name: "Payment behaviour",
                value_type: "text",
                value_range: null,
                scale_hint: null,
              },
            ],
          },
          {
            id: mockUuid("a5c2"),
            code: "SCHUFA",
            name: "Schufa",
            free_text_only: false,
            attributes: [
              {
                id: mockUuid("a5a4"),
                code: "SCORE",
                name: "Score",
                value_type: "number",
                value_range: "0–100",
                scale_hint: "higher is better",
              },
            ],
          },
          {
            id: mockUuid("a5c3"),
            code: "INTERNAL",
            name: "Internal assessment",
            free_text_only: true,
            attributes: [],
          },
        ],
      })
    )
  ),

  /**
   * The party's roles and its bank accounts — the two tabs the partner detail opened on a 501.
   *
   * Both are real endpoints; only the mock was missing, which made two working screens read as
   * broken ones. The role list is where a party's risk-sensitive assignments are reviewed, so one
   * seeded row carries that flag rather than every row being the easy case.
   */
  http.get(`${API}/partners/:partnerId/roles`, ({ params }) =>
    envelope(
      PartnerRolesResponseSchema.parse({
        partner_id: params.partnerId as string,
        roles: [
          {
            role_assignment_id: mockUuid("a6c1"),
            role: "lessee",
            status: "active",
            is_risk_sensitive: false,
            assigned_by: {
              user_id: "00000000-0000-4000-8000-000000000003",
              display_name: "Power User",
              email: "bank_power_user@prototype.example.com",
            },
            assigned_at: "2026-02-04T09:10:00Z",
            note: null,
            governed_action_id: null,
          },
          {
            role_assignment_id: mockUuid("a6c2"),
            role: "guarantor",
            status: "active",
            // Risk-sensitive: a guarantor assignment is what a reviewer is looking for here.
            is_risk_sensitive: true,
            assigned_by: {
              user_id: "00000000-0000-4000-8000-000000000003",
              display_name: "Power User",
              email: "bank_power_user@prototype.example.com",
            },
            assigned_at: "2026-07-18T11:30:00Z",
            note: "Guarantee recorded on PL-2025-00213.",
            governed_action_id: null,
          },
        ],
        history: [],
      })
    )
  ),

  http.get(`${API}/partners/:partnerId/bank-accounts`, ({ params }) =>
    envelope(
      BankAccountListResponseSchema.parse({
        partner_id: params.partnerId as string,
        items: [
          {
            id: mockUuid("a6b1"),
            partner_id: params.partnerId as string,
            iban: "DE89370400440532013000",
            account_number: "0532013000",
            holder_name: "Premium Leasing GmbH",
            bank_name: "Commerzbank",
            bic: "COBADEFFXXX",
            status: "active",
            created_at: "2026-02-04T09:10:00Z",
            closed_at: null,
          },
          {
            // A closed account — the list has to keep showing it, which is why `closed_at` is a
            // field rather than a reason to drop the row.
            id: mockUuid("a6b2"),
            partner_id: params.partnerId as string,
            iban: "DE02120300000000202051",
            account_number: null,
            holder_name: "Premium Leasing GmbH",
            bank_name: "Deutsche Kreditbank",
            bic: "BYLADEM1001",
            status: "closed",
            created_at: "2025-05-12T08:00:00Z",
            closed_at: "2026-06-30T00:00:00Z",
          },
        ],
      })
    )
  ),

  http.get(`${API}/partners/:partnerId/relationships`, ({ params }) =>
    envelope(
      PartnerRelationshipsResponseSchema.parse({
        partner_id: params.partnerId as string,
        items: [
          {
            id: mockUuid("a7c1"),
            relationship_type: "parent",
            direction: "parent_of",
            other_partner_id: "00000000-0000-4000-8000-00000000a002",
            other_display_name: "Müller Immobilien GbR",
            share_percentage: "74.90",
            valid_from: "2019-04-01",
            valid_to: null,
            is_editable: true,
          },
          {
            id: mockUuid("a7c2"),
            relationship_type: "managing_director",
            direction: "managing_director_of",
            other_partner_id: "00000000-0000-4000-8000-00000000a005",
            other_display_name: "Josef Müller",
            // A directorship carries no share — the column has to survive that.
            share_percentage: null,
            valid_from: "2019-04-01",
            valid_to: null,
            is_editable: true,
          },
          {
            id: mockUuid("a7c3"),
            relationship_type: "subsidiary",
            direction: "subsidiary_of",
            other_partner_id: "00000000-0000-4000-8000-00000000a003",
            other_display_name: "Müller Logistik UG",
            share_percentage: "100.00",
            valid_from: "2021-01-01",
            valid_to: null,
            // Derived by the registry rather than recorded by hand.
            is_editable: false,
          },
        ],
      })
    )
  ),

  http.get(`${API}/partners/:partnerId/documents`, ({ params }) =>
    envelope(
      PartnerDocumentsResponseSchema.parse({
        partner_id: params.partnerId as string,
        items: [
          {
            id: mockUuid("a7d1"),
            media_object_id: mockUuid("a7e1"),
            file_name: "BWA_2025.pdf",
            document_type_code: "MANAGEMENT_ACCOUNTS",
            document_type_name: "Management accounts",
            document_date: "2025-12-31",
            label: "Management accounts 2025",
            uploaded_at: "2026-02-02T09:14:00Z",
            uploaded_by_name: "A. Berger",
          },
          {
            id: mockUuid("a7d2"),
            media_object_id: mockUuid("a7e2"),
            file_name: "Handelsregisterauszug.pdf",
            document_type_code: "COMMERCIAL_REGISTER",
            document_type_name: "Commercial register extract",
            document_date: null,
            // No label — the file name has to carry the row on its own.
            label: null,
            uploaded_at: "2026-07-14T10:58:00Z",
            uploaded_by_name: "M. Renkl",
          },
        ],
      })
    )
  ),

  http.get(`${API}/partners/:partnerId/addresses`, () =>
    envelope(
      PartnerAddressListResponseSchema.parse({
        items: [
          {
            id: mockUuid("a7a1"),
            label: "Registered office",
            street: "Landsberger Straße",
            house_number: "212",
            address_line_2: null,
            postal_code: "80687",
            city: "München",
            state_region: null,
            country: "DE",
            is_default: true,
            status: "active",
            created_at: "2019-04-01T08:00:00Z",
          },
          {
            id: mockUuid("a7a2"),
            label: "Invoice address",
            street: null,
            house_number: null,
            address_line_2: "Postfach 44 07 12",
            postal_code: "80687",
            city: "München",
            state_region: null,
            country: "DE",
            is_default: false,
            status: "active",
            created_at: "2020-06-15T08:00:00Z",
          },
          {
            // Retired, and still listed: a contract was written to it.
            id: mockUuid("a7a3"),
            label: "Workshop Munich East",
            street: "Gewerbering",
            house_number: "8",
            address_line_2: null,
            postal_code: "85652",
            city: "Pliening",
            state_region: null,
            country: "DE",
            is_default: false,
            status: "retired",
            created_at: "2021-03-02T08:00:00Z",
          },
        ],
      })
    )
  ),

  http.get(`${API}/partners/:partnerId/connections`, ({ params }) =>
    envelope(
      PartnerConnectionsResponseSchema.parse({
        partner_id: params.partnerId as string,
        items: [
          {
            object_type: "contract",
            object_id: "00000000-0000-4000-8000-0000000acc01",
            label: "PL-2025-00211 · Volvo FH 460",
            role: "lessee",
            case_id: "00000000-0000-4000-8000-00000000c005",
            leasing_company_partner_id: "00000000-0000-4000-8000-00000000a001",
            leasing_company_name: "Premium Leasing GmbH",
            status: "active",
          },
          {
            object_type: "contract",
            object_id: "00000000-0000-4000-8000-0000000acd01",
            label: "PL-2025-00213 · Knaus Van TI Plus",
            role: "guarantor",
            case_id: "00000000-0000-4000-8000-00000000c001",
            leasing_company_partner_id: "00000000-0000-4000-8000-00000000a001",
            leasing_company_name: "Premium Leasing GmbH",
            status: "active",
          },
          {
            // A connection with no leasing company behind it — the column has to survive that.
            object_type: "case",
            object_id: "00000000-0000-4000-8000-00000000c001",
            label: "RR-2026-104",
            role: "lessee",
            case_id: "00000000-0000-4000-8000-00000000c001",
            leasing_company_partner_id: null,
            leasing_company_name: null,
            status: "open",
          },
        ],
      })
    )
  ),

  http.get(`${API}/partners/:partnerId/assessments`, ({ params }) => {
    const partnerId = params.partnerId as string
    return envelope(
      AssessmentListResponseSchema.parse({
        partner_id: partnerId,
        items: assessmentsByPartnerId[partnerId] ?? seedAssessments(partnerId),
      })
    )
  }),

  http.post(
    `${API}/partners/:partnerId/assessments`,
    async ({ params, request }) => {
      const partnerId = params.partnerId as string
      const body = (await request.json()) as Record<string, unknown>
      const existing =
        assessmentsByPartnerId[partnerId] ?? seedAssessments(partnerId)
      const created = buildAssessment(partnerId, body, existing.length)
      assessmentsByPartnerId[partnerId] = [created, ...existing]
      return envelope(created, "ASSESSMENT_CREATED")
    }
  ),

  http.post(
    `${API}/partners/:partnerId/assessments/:assessmentId/cancel`,
    async ({ params, request }) => {
      const partnerId = params.partnerId as string
      const body = (await request.json()) as { reason: string }
      const rows =
        assessmentsByPartnerId[partnerId] ?? seedAssessments(partnerId)
      const index = rows.findIndex(row => row.id === params.assessmentId)
      if (index === -1) {
        return errorEnvelope("NOT_FOUND", "No such assessment", 404)
      }
      const cancelled = AssessmentSchema.parse({
        ...rows[index],
        cancelled_at: new Date().toISOString(),
        cancel_reason: body.reason,
      })
      assessmentsByPartnerId[partnerId] = rows.with(index, cancelled)
      return envelope(cancelled, "ASSESSMENT_CANCELLED")
    }
  ),

  http.get(`${API}/partners/:partnerId`, ({ params }) => {
    const id = params.partnerId as string
    const lessee = mockLesseePartners[id]
    const listed = mockPartners.find(partner => partner.partner_id === id)
    const name = lessee?.name ?? listed?.display_name
    if (!name) return errorEnvelope("NOT_FOUND", "Partner not found", 404)

    return envelope(
      PartnerDetailResponseSchema.parse({
        partner_id: id,
        display_name: name,
        partner_type: "legal_entity",
        status: "confirmed",
        ubo_completeness_status: "complete",
        identity: {
          partner_type: "legal_entity",
          legal_name: name,
          legal_form: "GmbH",
          country: listed?.country ?? "DE",
          tax_id_vat: null,
          lei: null,
          // Every listed partner gets a register number and an address, not just the two seeded
          // lessees: the manual-entry card shows city · type · register, and a party resolved from
          // the registry rendered as a name over a single word looked like a half-loaded card.
          commercial_register_no: lessee
            ? "Creditreform PRT-DE-0044120"
            : `Creditreform PRT-${listed?.country ?? "DE"}-00${id.slice(-5, -1)}`,
          registered_address: {
            street: "Hafenstraße 12",
            postal_code: "20095",
            city: lessee?.city ?? "Hamburg",
            country: listed?.country ?? "DE",
          },
          foreign_identifier: null,
        },
        created_at: "2026-02-04T09:00:00Z",
        updated_at: "2026-07-18T11:30:00Z",
      })
    )
  }),

  http.get(`${API}/tenants/:tenantId/partners/duplicates`, () =>
    envelope(
      DuplicatePairListResponseSchema.parse({
        items: mockDuplicatePairs,
        total: mockDuplicatePairs.length,
      })
    )
  ),

  http.get(`${API}/tenants/:tenantId/partners`, ({ request }) => {
    const url = new URL(request.url)
    let rows = search(url, mockPartners, p => p.display_name)

    const status = url.searchParams.get("status")
    if (status) rows = rows.filter(p => p.status === status)
    const type = url.searchParams.get("partner_type")
    if (type) rows = rows.filter(p => p.partner_type === type)

    // This list uses limit/offset rather than page/per_page.
    const limit = Number(url.searchParams.get("limit") ?? "20") || 20
    const offset = Number(url.searchParams.get("offset") ?? "0") || 0
    return envelope(
      PartnerListResponseSchema.parse({
        items: rows.slice(offset, offset + limit),
        total: rows.length,
        limit,
        offset,
      })
    )
  }),

  // ── Framework agreements ──────────────────────────────────────────────────
  // Declared before /framework-agreements so the literal path is not shadowed.
  http.get(`${API}/framework-agreements/lc-partners`, () =>
    envelope(FALCPartnersResponseSchema.parse({ items: mockLcPartners }))
  ),

  http.get(`${API}/framework-agreements/:id/utilization`, ({ params }) =>
    envelope(
      FAUtilizationResponseSchema.parse(mockUtilization(String(params.id)))
    )
  ),

  http.get(`${API}/framework-agreements`, ({ request }) => {
    const url = new URL(request.url)
    let rows = search(url, mockFrameworkAgreements, fa => fa.agreement_name)

    const status = url.searchParams.get("status")
    if (status) rows = rows.filter(fa => fa.status === status)
    const lc = url.searchParams.get("lc_partner_id")
    if (lc) rows = rows.filter(fa => fa.lc_partner_id === lc)

    return envelope(FAListResponseSchema.parse(paginate(url, rows)))
  }),

  http.get(`${API}/framework-agreements/:id`, ({ params }) => {
    const found = mockFrameworkAgreements.find(fa => fa.id === params.id)
    if (!found) {
      return errorEnvelope("NOT_FOUND", "Framework agreement not found", 404)
    }

    // Parsed through the real detail schema, which this handler previously did NOT do — and it was
    // returning the *list* row, which is a dozen fields short of `FADetailResponse`. The fetcher
    // parses, so every read of this endpoint threw, React Query retried, and any consumer sat on a
    // loading state forever. That is what kept the wizard's product-template picker from ever
    // rendering (found by driving the browser, not by any automated gate).
    //
    // The list row supplies what it can; the rest are the detail-only fields, mostly null because
    // this fixture's agreement was activated and nothing else has happened to it.
    return envelope(
      FADetailResponseSchema.parse({
        ...found,
        currency: "EUR",
        // The list row carries no volume, and the spec records that none is maintained for any of
        // the seven leasing companies — but this field is non-nullable on the detail response, so a
        // figure has to be sent. The utilisation projection is where the empty case is exercised.
        max_volume_eur: 2000000,
        edit_version_counter: 1,
        // Every effective template except the last, so the intersection in
        // filterTemplatesAllowedByAgreement is observable rather than a no-op.
        product_template_ids: mockProductTemplates
          .filter(
            t =>
              t.current_version?.version_status ===
              TemplateStatusSchema.enum.effective
          )
          .slice(0, -1)
          .map(t => t.id),
        document_count: 2,
        linked_financings_count: 1,
        limit_available: null,
        vfe_amount_eur: 850,
        special_conditions: null,
        effective_from: found.valid_from,
        activated_at: "2025-01-02T09:00:00Z",
        activated_by: null,
        activated_by_name: "Bank Power User",
        deactivated_at: null,
        deactivated_by: null,
        reactivated_at: null,
        reactivated_by: null,
        terminated_at: null,
        terminated_by: null,
        created_by: null,
        created_by_name: "Bank Power User",
        created_at: "2025-01-01T08:00:00Z",
      })
    )
  }),

  // ── Product templates ─────────────────────────────────────────────────────
  // The templates an agreement allows. Wizard step 1 reads this; nothing outside the list may be used.
  //
  // Parsed through the real schema, which this handler previously did not do — and it had drifted:
  // it emitted `id` where `SelectableTemplateItem` declares `template_id`, and a nullable
  // `template_name` / `version_number` where both are required. Any consumer that parses (the
  // fetcher does) would have thrown. Rows the fixture cannot satisfy are dropped rather than
  // coerced: a template with no effective version genuinely is not selectable.
  http.get(`${API}/product-templates/selectable`, () =>
    envelope(
      SelectableTemplatesResponseSchema.parse({
        items: mockProductTemplates
          .filter(
            t =>
              t.current_version?.version_status ===
                TemplateStatusSchema.enum.effective &&
              t.template_name !== null &&
              t.current_version?.version_number !== undefined
          )
          .map(t => ({
            template_id: t.id,
            template_code: t.template_code,
            template_name: t.template_name,
            version_number: t.current_version?.version_number,
            // Nullable on the wire, and the FE's version summary does not carry it, so it is left
            // null rather than invented. Only the FA create wizard's eligibility filter reads it.
            valid_from: null,
          })),
      })
    )
  ),

  http.get(`${API}/tenants/:tenantId/product-templates`, ({ request }) => {
    const url = new URL(request.url)
    const rows = search(
      url,
      mockProductTemplates,
      t => t.template_name ?? t.template_code
    )
    return envelope(TemplateListResponseSchema.parse(paginate(url, rows)))
  }),
]
