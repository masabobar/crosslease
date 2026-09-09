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
  DuplicatePairListResponseSchema,
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
import { mockDuplicatePairs, mockPartners } from "@/mocks/fixtures/partners"
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
