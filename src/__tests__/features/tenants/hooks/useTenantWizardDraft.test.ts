import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import {
  clearWizardDraft,
  loadWizardDraft,
  saveWizardDraft,
} from "@/features/tenants/hooks/useTenantWizardDraft"
import type { CreateTenantForm } from "@/features/tenants/api/schema"

// The suite runs on the default node environment, which has no localStorage — and the
// draft helpers swallow storage errors by design, so without a stub every assertion
// would pass vacuously against a no-op.
const store = new Map<string, string>()
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
})

const USER_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
const DRAFT_KEY = `tenant_wizard_draft_${USER_ID}`

const formValues = {
  name: "Acme Bank",
  code: "ACME",
  tenant_type: "bank",
  default_currency: "EUR",
  legal_entity_name: "Acme Bank AG",
  country: "DE",
  modules: [],
  seed_package: "minimal",
} as unknown as CreateTenantForm

function writeRaw(value: unknown): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(value))
}

describe("useTenantWizardDraft", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("reports no draft when nothing is stored", () => {
    expect(loadWizardDraft(USER_ID)).toEqual({ status: "none" })
  })

  it("round-trips a saved draft", () => {
    saveWizardDraft(USER_ID, "modules", formValues)
    const result = loadWizardDraft(USER_ID)
    expect(result.status).toBe("loaded")
    if (result.status !== "loaded") return
    expect(result.draft.step).toBe("modules")
    expect(result.draft.formValues.name).toBe("Acme Bank")
  })

  it("keeps a half-filled draft — min-length rules must not reject work in progress", () => {
    saveWizardDraft(USER_ID, "identity", {
      ...formValues,
      name: "",
      code: "",
    })
    const result = loadWizardDraft(USER_ID)
    expect(result.status === "loaded" && result.draft.formValues.name).toBe("")
  })

  // The distinction matters: `unreadable` is what the wizard tells the user about, while an
  // absent or expired draft is silent because neither is a surprise.
  it("reports an unknown step as unreadable and clears it", () => {
    // An earlier deploy's step name would otherwise reach ORDERED_STEPS.indexOf()
    // and silently yield -1.
    writeRaw({
      step: "legacyBillingStep",
      formValues,
      savedAt: new Date().toISOString(),
    })
    expect(loadWizardDraft(USER_ID)).toEqual({ status: "unreadable" })
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it("reports a missing step as unreadable", () => {
    writeRaw({ formValues, savedAt: new Date().toISOString() })
    expect(loadWizardDraft(USER_ID)).toEqual({ status: "unreadable" })
  })

  it("reports a non-ISO savedAt as unreadable", () => {
    writeRaw({ step: "identity", formValues, savedAt: "last tuesday" })
    expect(loadWizardDraft(USER_ID)).toEqual({ status: "unreadable" })
  })

  it("reports malformed JSON as unreadable", () => {
    localStorage.setItem(DRAFT_KEY, "{not json")
    expect(loadWizardDraft(USER_ID)).toEqual({ status: "unreadable" })
  })

  it("treats a draft older than the 7-day TTL as absent, not unreadable", () => {
    writeRaw({
      step: "identity",
      formValues,
      savedAt: new Date("2026-07-01T00:00:00.000Z").toISOString(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-20T00:00:00.000Z"))
    expect(loadWizardDraft(USER_ID)).toEqual({ status: "none" })
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it("keeps a draft inside the TTL", () => {
    writeRaw({
      step: "review",
      formValues,
      savedAt: new Date("2026-07-18T00:00:00.000Z").toISOString(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-20T00:00:00.000Z"))
    const result = loadWizardDraft(USER_ID)
    expect(result.status === "loaded" && result.draft.step).toBe("review")
  })

  it("scopes drafts per user", () => {
    saveWizardDraft(USER_ID, "identity", formValues)
    expect(loadWizardDraft("someone-else")).toEqual({ status: "none" })
  })

  it("clearWizardDraft removes the stored draft", () => {
    saveWizardDraft(USER_ID, "identity", formValues)
    clearWizardDraft(USER_ID)
    expect(loadWizardDraft(USER_ID)).toEqual({ status: "none" })
  })
})
