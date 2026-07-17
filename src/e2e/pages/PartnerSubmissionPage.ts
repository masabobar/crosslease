import type { Locator, Page } from "../fixtures/test"

// Design source: Figma file PQVvNvRcoFac0zdHGaLWCg — canvas 1:110
// (E13 · Partner Management), sections "ADD NEW PARTNER" (4:11386) and
// "Entity type - Natural person -> dynamic fields" (263:20538).
//
// Design-verified elements:
//   - Page heading: "Add new partner"
//   - Subtitle: "Submit a new counterparty into the partner registry"
//   - Form sections: BASIC IDENTITY, REGISTRY IDENTIFIERS, ADDRESS, CLASSIFICATION
//   - CLASSIFICATION helper: "Select all roles that apply. At least one is required."
//   - Primary CTA: "Submit for matching"
//   - Secondary CTA: "Cancel"
//   - Partner Type variants covered: Legal entity, Natural person
//
// Design gap: individual field labels inside Input Group instances are the
// component's placeholder text ("Label"), not concrete labels — so field-level
// locators must rely on the data-testid convention (form-error-{slug}) rather
// than getByLabel until the design is filled in.

export class PartnerSubmissionPage {
  readonly page: Page
  readonly pageTitle: Locator
  readonly subtitle: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly classificationHelperText: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    this.page = page
    // Design-verified copy — see file header for source
    this.pageTitle = page.getByRole("heading", { name: /add new partner/i })
    this.subtitle = page.getByText(
      /submit a new counterparty into the partner registry/i
    )
    this.submitButton = page.getByRole("button", {
      name: /submit for matching/i,
    })
    this.cancelButton = page.getByRole("button", { name: /^cancel$/i })
    this.classificationHelperText = page.getByText(
      /select all roles that apply.*at least one is required/i
    )
    this.successMessage = page
      .getByRole("status")
      .filter({ hasText: /partner.*created|saved successfully/i })
  }

  async goto() {
    await this.page.goto("/partners/new")
    await this.page.waitForLoadState("networkidle")
  }

  async selectPartnerType(partnerType: string) {
    // Entity type selector — click to open, then pick the option by visible text.
    // Product uses the label "Entity type" (Gherkin wording "Partner Type" is stale).
    // Design confirms three variants: "Legal entity", "Natural person", "Sole proprietor".
    await this.page.getByLabel(/entity type/i).click()
    await this.page.getByRole("option", { name: partnerType }).click()
    // Wait for the conditional anchor-field set to render for the chosen type
    await this.page.waitForLoadState("networkidle")
  }

  async submitForm() {
    await this.submitButton.click()
    await this.page.waitForLoadState("networkidle")
  }

  // Returns the visible FormMessage error text for a named field.
  //
  // Semantic strategy: locate the field's labeled input, walk up to its
  // FormItem wrapper (shadcn/RHF pattern: <label>+<input>+<FormMessage/>
  // share the same parent element), then look for the error text.
  //
  // Not using data-testid because the FE hasn't standardised
  // data-testid="form-error-{slug}" on FormMessage nodes yet. Falls back to
  // text-content matching, which couples the test to the validation copy —
  // acceptable trade-off until test IDs land.
  fieldError(fieldName: string): Locator {
    // Field control may be either a plain textbox or a button trigger
    // (date-picker fields like "Date of birth" render as button role).
    const namePattern = new RegExp(fieldName, "i")
    const control = this.page
      .getByRole("textbox", { name: namePattern })
      .or(this.page.getByRole("button", { name: namePattern }))
    return control
      .locator("..")
      .getByText(/required|must be|invalid|please|cannot be empty/i)
  }
}
