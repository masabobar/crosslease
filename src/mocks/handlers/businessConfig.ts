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
  FAUtilizationResponseSchema,
} from "@/features/frameworkAgreements/api/schema"
import { TemplateListResponseSchema } from "@/features/productTemplates/api/schema"
import { mockDuplicatePairs, mockPartners } from "@/mocks/fixtures/partners"
import {
  mockFrameworkAgreements,
  mockLcPartners,
  mockProductTemplates,
  mockUtilization,
} from "@/mocks/fixtures/businessConfig"
import { envelope, errorEnvelope } from "@/mocks/envelope"

const API = "*/api/v1"

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

export const businessConfigHandlers = [
  // ── Partners ──────────────────────────────────────────────────────────────
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
    // The detail response is a wider shape than the list item, and it is role-scoped four different
    // ways on the backend. Rather than invent that, the list row is returned as-is: the detail screen
    // will report the fields it is missing in the console, which is the honest signal.
    return found
      ? envelope(found)
      : errorEnvelope("NOT_FOUND", "Framework agreement not found", 404)
  }),

  // ── Product templates ─────────────────────────────────────────────────────
  // The templates an agreement allows. Wizard step 1 reads this; nothing outside the list may be used.
  http.get(`${API}/product-templates/selectable`, () =>
    envelope({
      items: mockProductTemplates
        .filter(t => t.current_version?.version_status === "effective")
        .map(t => ({
          id: t.id,
          template_code: t.template_code,
          template_name: t.template_name,
          version_number: t.current_version?.version_number ?? null,
        })),
    })
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
