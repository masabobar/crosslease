import type { Locator, Page } from "../fixtures/test"

// Design source: Figma file PQVvNvRcoFac0zdHGaLWCg — canvas 1:110
// (E13 · Partner Management), section "ADD NEW PARTNER" (4:11386) —
// specifically the Partner list toolbar surrounding the "Add new partner" CTA.
//
// Locators reflect the current implementation on /partners (source of truth):
//   - Heading: "Partner management"
//   - Subtitle: "Search and manage counterparty identities across the tenant."
//   - Toolbar CTA: "Add new partner"
//   - Filter bar (4 buttons): Status, Role, Country, UBO status
//   - Search input with placeholder "Search by name…"
//   - Column headers rendered as a single flat text node
//     "Partner Role Country Status UBO status" (a11y gap — no <th>/columnheader role)
//   - Pagination: "Rows per page" text + rows-per-page combobox + "Previous",
//     numbered page buttons, "Next"
//
// Feature gaps vs. Figma canvas 1:110 (removed from locators — the current
// build is the source of truth for these tests):
//   - "Import partners" CTA — not shipped
//   - "KYC outcome" filter + column — not shipped (backend also does not expose
//     the kyc_outcome query param per openapi.json)
//   - "Confirmation Status" filter (per Gherkin AC-08) — not shipped

export class PartnerRegistryPage {
  readonly page: Page
  readonly pageTitle: Locator
  readonly subtitle: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly roleFilter: Locator
  readonly countryFilter: Locator
  readonly uboStatusFilter: Locator
  readonly addNewPartnerButton: Locator
  readonly rowsPerPageLabel: Locator
  readonly previousPageButton: Locator
  readonly nextPageButton: Locator

  constructor(page: Page) {
    this.page = page
    this.pageTitle = page.getByRole("heading", { name: /partner management/i })
    this.subtitle = page.getByText(
      /search and manage counterparty identities across the tenant/i
    )
    // Search box — prefer HTML5 semantic role, fall back to labelled textbox
    this.searchInput = page
      .getByRole("searchbox")
      .or(page.getByRole("textbox", { name: /search/i }))
    // Filter bar — Outline Buttons; anchor at start with word boundary so a
    // trailing chevron/counter doesn't break the match.
    this.statusFilter = page.getByRole("button", { name: /^status\b/i })
    this.roleFilter = page.getByRole("button", { name: /^role\b/i })
    this.countryFilter = page.getByRole("button", { name: /^country\b/i })
    this.uboStatusFilter = page.getByRole("button", { name: /^ubo status\b/i })
    this.addNewPartnerButton = page.getByRole("button", {
      name: /add new partner/i,
    })
    // Pagination — the "Rows per page" text is a sibling of the select, not a
    // bound <label>, so getByLabel doesn't find it. Assert the label text is
    // visible instead; the rows-per-page combobox exists next to it.
    this.rowsPerPageLabel = page.getByText(/rows per page/i)
    this.previousPageButton = page.getByRole("button", { name: /previous/i })
    this.nextPageButton = page.getByRole("button", { name: /^next\b/i })
    // Column headers are rendered as unlabelled sibling text nodes (no <th>
    // / columnheader role) — flagged as an a11y gap. Not asserted here until
    // the registry table is upgraded to semantic HTML.
  }

  async goto() {
    await this.page.goto("/partners")
    await this.page.waitForLoadState("networkidle")
  }
}
