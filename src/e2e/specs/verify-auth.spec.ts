import { expect, test } from "../fixtures/test"

test("auth setup produces a valid session and dashboard shows Refinext heading", async ({
  authenticatedPage,
}) => {
  await authenticatedPage.goto("/")
  await expect(
    authenticatedPage.getByRole("heading", { name: "Refinext" })
  ).toBeVisible()
})
