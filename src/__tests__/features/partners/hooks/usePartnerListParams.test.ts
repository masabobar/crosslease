import { describe, it, expect, vi, beforeEach } from "vitest"

let currentParams = new URLSearchParams()
const mockSetParams = vi.fn()

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [currentParams, mockSetParams],
}))

import { usePartnerListParams } from "@/features/partners/hooks/usePartnerListParams"

function setUrlParams(query: string) {
  currentParams = new URLSearchParams(query)
}

// The hook writes through the updater form of setSearchParams, so assertions on
// what it wrote have to run that updater against the current params.
function applyLatestUpdate(): URLSearchParams {
  const call = mockSetParams.mock.calls.at(-1)
  const updater = call?.[0] as (prev: URLSearchParams) => URLSearchParams
  return updater(currentParams)
}

beforeEach(() => {
  mockSetParams.mockReset()
  currentParams = new URLSearchParams()
})

describe("usePartnerListParams", () => {
  describe("page", () => {
    it("defaults to 1 when absent", () => {
      expect(usePartnerListParams().page).toBe(1)
    })

    it("parses a valid page number", () => {
      setUrlParams("page=4")
      expect(usePartnerListParams().page).toBe(4)
    })

    it("clamps a non-numeric page to 1", () => {
      setUrlParams("page=abc")
      expect(usePartnerListParams().page).toBe(1)
    })

    it("clamps zero and negative pages to 1", () => {
      setUrlParams("page=0")
      expect(usePartnerListParams().page).toBe(1)
      setUrlParams("page=-3")
      expect(usePartnerListParams().page).toBe(1)
    })
  })

  describe("perPage", () => {
    it("defaults to 10 when absent", () => {
      expect(usePartnerListParams().perPage).toBe(10)
    })

    it.each([10, 25, 50, 100])("parses page size %i", size => {
      setUrlParams(`per_page=${size}`)
      expect(usePartnerListParams().perPage).toBe(size)
    })

    it("falls back to 10 for an unsupported page size", () => {
      setUrlParams("per_page=13")
      expect(usePartnerListParams().perPage).toBe(10)
    })
  })

  describe("filter parsing drops values not in the wire enum", () => {
    it("keeps valid statuses and discards unknown ones", () => {
      setUrlParams("status=confirmed&status=banana&status=draft")
      expect(usePartnerListParams().statusFilters).toEqual([
        "confirmed",
        "draft",
      ])
    })

    it("keeps valid roles and discards unknown ones", () => {
      // leasing_company was removed from PartnerRoleSchema (PRD1042-1453), so a
      // stale bookmarked URL carrying it must not reach the API as a filter.
      setUrlParams("role=lessee&role=leasing_company")
      expect(usePartnerListParams().roleFilters).toEqual(["lessee"])
    })

    it("keeps valid ubo statuses and discards unknown ones", () => {
      setUrlParams("ubo_status=complete&ubo_status=nonsense")
      expect(usePartnerListParams().uboFilters).toEqual(["complete"])
    })

    it("returns empty arrays when no filters are present", () => {
      const params = usePartnerListParams()
      expect(params.statusFilters).toEqual([])
      expect(params.roleFilters).toEqual([])
      expect(params.uboFilters).toEqual([])
      expect(params.countryFilter).toBeNull()
    })
  })

  describe("writes", () => {
    it("omits page=1 from the URL rather than writing the default", () => {
      usePartnerListParams().setPage(1)
      expect(applyLatestUpdate().has("page")).toBe(false)
    })

    it("writes a non-default page", () => {
      usePartnerListParams().setPage(5)
      expect(applyLatestUpdate().get("page")).toBe("5")
    })

    it("omits the default page size and resets pagination", () => {
      setUrlParams("page=3")
      usePartnerListParams().setPerPage(10)
      const next = applyLatestUpdate()
      expect(next.has("per_page")).toBe(false)
      expect(next.has("page")).toBe(false)
    })

    it("appends one entry per selected status", () => {
      usePartnerListParams().setStatusFilters(["draft", "confirmed"])
      expect(applyLatestUpdate().getAll("status")).toEqual([
        "draft",
        "confirmed",
      ])
    })

    it("resets to page 1 when a filter changes", () => {
      setUrlParams("page=6")
      usePartnerListParams().setStatusFilters(["draft"])
      expect(applyLatestUpdate().has("page")).toBe(false)
    })

    it("drops an emptied search rather than writing q=", () => {
      setUrlParams("q=acme")
      usePartnerListParams().setSearch("")
      expect(applyLatestUpdate().has("q")).toBe(false)
    })

    it("clears every filter and the page at once", () => {
      setUrlParams(
        "q=acme&status=draft&role=lessee&country=DE&ubo_status=complete&page=4"
      )
      usePartnerListParams().clearAllFilters()
      const next = applyLatestUpdate()
      for (const key of [
        "q",
        "status",
        "role",
        "country",
        "ubo_status",
        "page",
      ]) {
        expect(next.has(key)).toBe(false)
      }
    })
  })
})
