import type { Page } from "../fixtures/test"

export class UserProvisioningPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // POSTs a user-creation payload to /api/v1/users using the page's session cookies.
  // Used for AC-11 (unauthorized role rejection) and AC-12 (manipulated payload rejection).
  async postCreateUser(
    payload: Record<string, unknown>
  ): Promise<{ status: number; body: unknown }> {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const response = await this.page.request.post(`${apiBase}/api/v1/users`, {
      data: payload,
    })
    return { status: response.status(), body: await response.json() }
  }
}
