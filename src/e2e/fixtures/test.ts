import { test as base, expect } from "@playwright/test"

type CustomFixtures = Record<string, never>

export const test = base.extend<CustomFixtures>({})

export { expect }
