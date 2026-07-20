import { describe, it, expect, vi, beforeEach } from "vitest"

let currentParams = new URLSearchParams()
const mockSetParams = vi.fn()

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [currentParams, mockSetParams],
}))

import { useFrameworkAgreementListParams } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementListParams"

function setUrlParams(query: string) {
  currentParams = new URLSearchParams(query)
}

function latestUpdater() {
  const call = mockSetParams.mock.calls.at(-1)
  return call?.[0] as (prev: URLSearchParams) => URLSearchParams
}

beforeEach(() => {
  mockSetParams.mockReset()
  currentParams = new URLSearchParams()
})

describe("useFrameworkAgreementListParams", () => {
  describe("page", () => {
    it("defaults to 1 when absent", () => {
      expect(useFrameworkAgreementListParams().page).toBe(1)
    })

    it("parses a valid page number", () => {
      setUrlParams("page=3")
      expect(useFrameworkAgreementListParams().page).toBe(3)
    })

    it("clamps a non-numeric page to 1", () => {
      setUrlParams("page=abc")
      expect(useFrameworkAgreementListParams().page).toBe(1)
    })

    it("clamps a zero/negative page to 1", () => {
      setUrlParams("page=0")
      expect(useFrameworkAgreementListParams().page).toBe(1)
      setUrlParams("page=-5")
      expect(useFrameworkAgreementListParams().page).toBe(1)
    })
  })

  describe("perPage", () => {
    it("defaults to 25 when absent", () => {
      expect(useFrameworkAgreementListParams().perPage).toBe(25)
    })

    it("parses a supported per_page value", () => {
      setUrlParams("per_page=50")
      expect(useFrameworkAgreementListParams().perPage).toBe(50)
    })

    it("falls back to 25 for an unsupported per_page value", () => {
      setUrlParams("per_page=13")
      expect(useFrameworkAgreementListParams().perPage).toBe(25)
    })
  })

  describe("search", () => {
    it("defaults to an empty string when absent", () => {
      expect(useFrameworkAgreementListParams().search).toBe("")
    })

    it("reads the q param", () => {
      setUrlParams("q=acme")
      expect(useFrameworkAgreementListParams().search).toBe("acme")
    })
  })

  describe("statusFilter", () => {
    it("defaults to null when absent", () => {
      expect(useFrameworkAgreementListParams().statusFilter).toBeNull()
    })

    it("parses a valid status", () => {
      setUrlParams("status=active")
      expect(useFrameworkAgreementListParams().statusFilter).toBe("active")
    })

    it("returns null for an invalid status", () => {
      setUrlParams("status=bogus")
      expect(useFrameworkAgreementListParams().statusFilter).toBeNull()
    })
  })

  describe("bankEntityFilter", () => {
    it("defaults to null when absent", () => {
      expect(useFrameworkAgreementListParams().bankEntityFilter).toBeNull()
    })

    it("parses a valid bank entity", () => {
      setUrlParams("bank_entity=sparkasse")
      expect(useFrameworkAgreementListParams().bankEntityFilter).toBe(
        "sparkasse"
      )
    })

    it("returns null for an invalid bank entity", () => {
      setUrlParams("bank_entity=bogus")
      expect(useFrameworkAgreementListParams().bankEntityFilter).toBeNull()
    })
  })

  describe("lcPartnerId", () => {
    it("defaults to null when absent", () => {
      expect(useFrameworkAgreementListParams().lcPartnerId).toBeNull()
    })

    it("reads the lc_partner_id param", () => {
      setUrlParams("lc_partner_id=partner-1")
      expect(useFrameworkAgreementListParams().lcPartnerId).toBe("partner-1")
    })
  })

  describe("setters", () => {
    it("setPage writes the page param for page > 1", () => {
      useFrameworkAgreementListParams().setPage(3)
      const next = latestUpdater()(new URLSearchParams())
      expect(next.get("page")).toBe("3")
    })

    it("setPage(1) removes the page param instead of writing it", () => {
      useFrameworkAgreementListParams().setPage(1)
      const next = latestUpdater()(new URLSearchParams("page=3"))
      expect(next.get("page")).toBeNull()
    })

    it("setSearch writes q and resets page", () => {
      useFrameworkAgreementListParams().setSearch("acme")
      const next = latestUpdater()(new URLSearchParams("page=5"))
      expect(next.get("q")).toBe("acme")
      expect(next.get("page")).toBeNull()
    })

    it("setSearch('') removes the q param", () => {
      useFrameworkAgreementListParams().setSearch("")
      const next = latestUpdater()(new URLSearchParams("q=acme"))
      expect(next.get("q")).toBeNull()
    })

    it("setPerPage writes per_page and resets page for non-default sizes", () => {
      useFrameworkAgreementListParams().setPerPage(50)
      const next = latestUpdater()(new URLSearchParams("page=2"))
      expect(next.get("per_page")).toBe("50")
      expect(next.get("page")).toBeNull()
    })

    it("setPerPage(25) removes the per_page param (default size)", () => {
      useFrameworkAgreementListParams().setPerPage(25)
      const next = latestUpdater()(new URLSearchParams("per_page=50"))
      expect(next.get("per_page")).toBeNull()
    })

    it("setStatusFilter(null) removes the status param", () => {
      useFrameworkAgreementListParams().setStatusFilter(null)
      const next = latestUpdater()(new URLSearchParams("status=active"))
      expect(next.get("status")).toBeNull()
    })

    it("setBankEntityFilter writes the bank_entity param", () => {
      useFrameworkAgreementListParams().setBankEntityFilter("sparkasse")
      const next = latestUpdater()(new URLSearchParams())
      expect(next.get("bank_entity")).toBe("sparkasse")
    })

    it("setLcPartnerId(null) removes the lc_partner_id param", () => {
      useFrameworkAgreementListParams().setLcPartnerId(null)
      const next = latestUpdater()(new URLSearchParams("lc_partner_id=p-1"))
      expect(next.get("lc_partner_id")).toBeNull()
    })
  })
})
