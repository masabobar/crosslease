import { describe, expect, it } from "vitest"
import {
  canConfirm,
  canEditTotal,
  canRedetermine,
  isApprovalBlockedByCollateral,
  isValidCollateralTotal,
  latestValue,
  nextAct,
} from "@/features/cases/collateralRecheck"
import type {
  CollateralRecheckState,
  CollateralResponse,
} from "@/features/cases/api/schema"

const FRONT = "00000000-0000-4000-8000-000000000005"
const BACK = "00000000-0000-4000-8000-000000000006"

function collateral(
  recheck_state: CollateralRecheckState,
  overrides: Partial<CollateralResponse> = {}
): CollateralResponse {
  return {
    id: "00000000-0000-4000-8000-00000000c01a",
    case_id: "00000000-0000-4000-8000-00000000c005",
    collateral_type: "chattel_mortgage",
    current_total_eur: "385000.00",
    evidence_document_id: null,
    recheck_state,
    redetermined_by: null,
    redetermined_at: null,
    confirmed_by: null,
    confirmed_at: null,
    value_history: [
      { total_eur: "385000.00", set_by: FRONT, set_at: "2026-06-19T09:00:00Z" },
    ],
    ...overrides,
  }
}

describe("isApprovalBlockedByCollateral", () => {
  it("blocks while a re-check is outstanding", () => {
    expect(isApprovalBlockedByCollateral(collateral("needs_recheck"))).toBe(
      true
    )
  })

  // Re-determining is not enough on its own — that is the whole point of the three-act rule.
  it("still blocks after the figure has been re-determined", () => {
    expect(isApprovalBlockedByCollateral(collateral("redetermined"))).toBe(true)
  })

  it("does not block once confirmed", () => {
    expect(isApprovalBlockedByCollateral(collateral("clear"))).toBe(false)
  })
})

describe("nextAct", () => {
  it("asks for a re-determination first, then a confirmation, then nothing", () => {
    expect(nextAct(collateral("needs_recheck"))).toBe("redetermine")
    expect(nextAct(collateral("redetermined"))).toBe("confirm")
    expect(nextAct(collateral("clear"))).toBeNull()
  })
})

describe("canRedetermine", () => {
  it("is the preparing role's act", () => {
    expect(canRedetermine(collateral("needs_recheck"), "front_office")).toBe(
      true
    )
  })

  it("refuses every other role", () => {
    for (const role of [
      "back_office",
      "bank_power_user",
      "auditor",
      "system_admin",
      "support_user",
      "leasing_company_user",
    ] as const) {
      expect(canRedetermine(collateral("needs_recheck"), role)).toBe(false)
    }
  })

  // A first re-determination that was itself wrong must be correctable before anyone confirms it.
  it("stays available while awaiting confirmation", () => {
    expect(canRedetermine(collateral("redetermined"), "front_office")).toBe(
      true
    )
  })

  it("is unavailable once the figure is confirmed", () => {
    expect(canRedetermine(collateral("clear"), "front_office")).toBe(false)
  })
})

describe("canConfirm", () => {
  const redetermined = collateral("redetermined", {
    redetermined_by: FRONT,
    redetermined_at: "2026-09-08T09:00:00Z",
  })

  it("lets a different back-office person confirm a re-determined figure", () => {
    expect(canConfirm(redetermined, "back_office", BACK)).toBe(true)
  })

  /**
   * The load-bearing test. Confirming while the state is `needs_recheck` would confirm the OLD
   * figure — exactly the failure the three-act rule exists to prevent, and one that would look
   * entirely reasonable on screen.
   */
  it("refuses to confirm before the figure has been re-determined", () => {
    expect(canConfirm(collateral("needs_recheck"), "back_office", BACK)).toBe(
      false
    )
  })

  // The same person must not supply both pairs of eyes.
  it("refuses the person who re-determined it", () => {
    expect(canConfirm(redetermined, "back_office", FRONT)).toBe(false)
  })

  it("refuses the preparing role even on a re-determined figure", () => {
    expect(canConfirm(redetermined, "front_office", BACK)).toBe(false)
  })

  it("refuses when the current user is unknown", () => {
    expect(canConfirm(redetermined, "back_office", undefined)).toBe(false)
  })

  it("refuses once already confirmed", () => {
    expect(canConfirm(collateral("clear"), "back_office", BACK)).toBe(false)
  })
})

describe("canEditTotal", () => {
  it("allows the preparing role to edit while nothing is outstanding", () => {
    expect(canEditTotal(collateral("clear"), "front_office")).toBe(true)
  })

  // Once a re-check is raised the figure moves only through re-determine, so the change is recorded
  // as a determination rather than as a quiet edit.
  it("refuses a plain edit while a re-check is outstanding", () => {
    expect(canEditTotal(collateral("needs_recheck"), "front_office")).toBe(
      false
    )
    expect(canEditTotal(collateral("redetermined"), "front_office")).toBe(false)
  })

  it("refuses the releasing role", () => {
    expect(canEditTotal(collateral("clear"), "back_office")).toBe(false)
  })
})

describe("isValidCollateralTotal", () => {
  it("accepts amounts with at most two decimals", () => {
    expect(isValidCollateralTotal("385000")).toBe(true)
    expect(isValidCollateralTotal("385000.5")).toBe(true)
    expect(isValidCollateralTotal("385000.50")).toBe(true)
    expect(isValidCollateralTotal("0")).toBe(true)
  })

  it("refuses a third decimal, a negative, or a non-number", () => {
    expect(isValidCollateralTotal("385000.505")).toBe(false)
    expect(isValidCollateralTotal("-1")).toBe(false)
    expect(isValidCollateralTotal("lots")).toBe(false)
    expect(isValidCollateralTotal("")).toBe(false)
  })
})

describe("latestValue", () => {
  it("returns the most recent figure in the trail", () => {
    const record = collateral("redetermined", {
      value_history: [
        {
          total_eur: "385000.00",
          set_by: FRONT,
          set_at: "2026-06-19T09:00:00Z",
        },
        {
          total_eur: "372000.00",
          set_by: FRONT,
          set_at: "2026-09-08T09:00:00Z",
        },
      ],
    })
    expect(latestValue(record)?.total_eur).toBe("372000.00")
  })

  it("returns null when the collateral has never carried a figure", () => {
    expect(
      latestValue(collateral("needs_recheck", { value_history: [] }))
    ).toBeNull()
  })
})
