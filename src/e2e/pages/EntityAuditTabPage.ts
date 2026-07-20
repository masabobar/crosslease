import type { Locator, Page } from "../fixtures/test"

// Entity types that expose an "Audit History" tab in their operational cockpit.
export type EntityType = "Contract" | "Financing" | "Partner" | "Document"

// Map entity type to the cockpit URL pattern used by the operational surface.
// Cockpit route conventions follow the RefiNext operational-cockpit layout.
const COCKPIT_PATH_BY_ENTITY: Record<EntityType, string> = {
  Contract: "/contracts",
  Financing: "/financings",
  Partner: "/partners",
  Document: "/documents",
}

// Page Object for the entity-scoped audit-history tab embedded in operational
// cockpits (US 26.11). One POM serves all four cockpit types; the tab surface,
// records list, and mutation-affordance invariants are identical across them.
export class EntityAuditTabPage {
  readonly page: Page
  readonly auditHistoryTab: Locator
  readonly auditHistoryTabPanel: Locator
  readonly auditRecordRows: Locator
  readonly editControl: Locator
  readonly deleteControl: Locator
  readonly createControl: Locator
  readonly saveControl: Locator
  readonly unmaskControl: Locator

  constructor(page: Page) {
    this.page = page
    this.auditHistoryTab = page.getByRole("tab", { name: /audit history/i })
    this.auditHistoryTabPanel = page.getByRole("tabpanel", {
      name: /audit history/i,
    })
    this.auditRecordRows = this.auditHistoryTabPanel.getByRole("row")
    // Mutation-affordance locators are scoped to the audit tab panel so that
    // any Edit / Delete / Create / Save / Unmask control elsewhere on the
    // cockpit surface does not produce false positives for AC-07.
    this.editControl = this.auditHistoryTabPanel.getByRole("button", {
      name: /^edit$/i,
    })
    this.deleteControl = this.auditHistoryTabPanel.getByRole("button", {
      name: /^delete$/i,
    })
    this.createControl = this.auditHistoryTabPanel.getByRole("button", {
      name: /^create$/i,
    })
    this.saveControl = this.auditHistoryTabPanel.getByRole("button", {
      name: /^save$/i,
    })
    this.unmaskControl = this.auditHistoryTabPanel.getByRole("button", {
      name: /unmask|reveal/i,
    })
  }

  cockpitUrl(entityType: EntityType, entityId: string): string {
    return `${COCKPIT_PATH_BY_ENTITY[entityType]}/${entityId}`
  }

  async goto(entityType: EntityType, entityId: string): Promise<void> {
    await this.page.goto(this.cockpitUrl(entityType, entityId))
    await this.page.waitForLoadState("networkidle")
  }

  async openAuditTab(): Promise<void> {
    await this.auditHistoryTab.click()
    await this.page.waitForLoadState("networkidle")
  }
}
