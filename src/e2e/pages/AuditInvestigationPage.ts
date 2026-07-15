import type { Locator, Page } from "../fixtures/test"

// ---------------------------------------------------------------------------
// AuditInvestigationPage — POM for the read-only audit investigation surface
// Story: PRD1042-787 (US 26.10)
// URL:   /audit/investigation
//
// The surface is a tenant-scoped, read-only investigation table. Per grooming
// decision (2026-06-16), the MVP renders a basic-table layout with the filter
// set: entityType, entityId, actionType, actor, dateRange. Pre-built views,
// bookmarks, and advanced filters are DEFERRED.
//
// This POM only owns locators + navigation/interaction helpers.
// Assertions live in the spec.
// ---------------------------------------------------------------------------

export type BasicFilterField =
  | "entityType"
  | "entityId"
  | "actionType"
  | "actor"
  | "dateRange"

export class AuditInvestigationPage {
  readonly page: Page
  readonly heading: Locator
  readonly resultsGrid: Locator
  readonly resultRows: Locator
  readonly pagination: Locator
  readonly editButton: Locator
  readonly deleteButton: Locator
  readonly exportButton: Locator
  readonly bulkSelectColumn: Locator
  readonly rowContextMenu: Locator
  readonly entityTypeFilter: Locator
  readonly entityIdFilter: Locator
  readonly actionTypeFilter: Locator
  readonly actorFilter: Locator
  readonly dateRangeFilter: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole("heading", {
      name: /audit.*investigation|investigation surface/i,
    })
    this.resultsGrid = page.getByRole("table")
    this.resultRows = this.resultsGrid.getByRole("row")
    this.pagination = page.getByRole("navigation", { name: /pagination/i })
    this.editButton = page.getByRole("button", { name: /^edit$/i })
    this.deleteButton = page.getByRole("button", { name: /^delete$/i })
    this.exportButton = page.getByRole("button", { name: /^export$/i })
    this.bulkSelectColumn = page.getByRole("columnheader", {
      name: /select all/i,
    })
    this.rowContextMenu = page.getByRole("menu", { name: /row actions/i })
    this.entityTypeFilter = page.getByLabel(/entity type/i)
    this.entityIdFilter = page.getByLabel(/entity id/i)
    this.actionTypeFilter = page.getByLabel(/action type/i)
    this.actorFilter = page.getByLabel(/actor/i)
    this.dateRangeFilter = page.getByLabel(/date range/i)
  }

  async goto() {
    await this.page.goto("/audit/investigation")
    await this.page.waitForLoadState("networkidle")
  }

  filterLocatorFor(field: BasicFilterField): Locator {
    switch (field) {
      case "entityType":
        return this.entityTypeFilter
      case "entityId":
        return this.entityIdFilter
      case "actionType":
        return this.actionTypeFilter
      case "actor":
        return this.actorFilter
      case "dateRange":
        return this.dateRangeFilter
    }
  }

  async applyFilter(field: BasicFilterField, value: string) {
    const locator = this.filterLocatorFor(field)
    await locator.fill(value)
    await locator.press("Enter")
    await this.page.waitForLoadState("networkidle")
  }
}
