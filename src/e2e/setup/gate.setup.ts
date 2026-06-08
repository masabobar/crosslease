import { test as setup } from "../fixtures/test"

const GATE_STATE = ".auth/gate.json"

setup("authenticate through staging password gate", async ({ page }) => {
  await page.goto("/")
  await page
    .locator('input[type="password"]')
    .fill(process.env.HTTP_PASSWORD || "")
  await page.keyboard.press("Enter")
  await page.waitForLoadState("networkidle")
  await page.context().storageState({ path: GATE_STATE })
})
