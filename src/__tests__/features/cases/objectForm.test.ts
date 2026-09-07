import { describe, expect, it } from "vitest"
import {
  EMPTY_OBJECT_FORM,
  isVehicleGroup,
  objectFormSchema,
  subGroupsFor,
  toObjectFormValues,
  toObjectPayload,
} from "@/features/cases/objectForm"
import type { ObjectGroupItem } from "@/features/cases/api/schema"

const GROUPS: ObjectGroupItem[] = [
  {
    code: "WOHNMOBIL",
    name: "Wohnmobil",
    is_vehicle: true,
    provenance: "bank_catalogue",
    sub_groups: [{ code: "HYBRID", name: "Hybrid" }],
  },
  {
    code: "MEDICAL",
    name: "Medical equipment",
    is_vehicle: false,
    provenance: "bank_catalogue",
    sub_groups: [{ code: "IMAGING", name: "Imaging" }],
  },
]

describe("isVehicleGroup", () => {
  // This flag is what the design's indentation encodes — the sub-group and the registration fields
  // belong to a vehicle group only.
  it("reads the classification's own flag", () => {
    expect(isVehicleGroup(GROUPS, "WOHNMOBIL")).toBe(true)
    expect(isVehicleGroup(GROUPS, "MEDICAL")).toBe(false)
  })

  it("treats an unknown or unselected group as not a vehicle", () => {
    expect(isVehicleGroup(GROUPS, "SOMETHING_NEW")).toBe(false)
    expect(isVehicleGroup(GROUPS, "")).toBe(false)
  })
})

describe("subGroupsFor", () => {
  it("returns the group's sub-groups", () => {
    expect(subGroupsFor(GROUPS, "WOHNMOBIL")).toEqual([
      { code: "HYBRID", name: "Hybrid" },
    ])
  })

  it("returns nothing for an unknown group", () => {
    expect(subGroupsFor(GROUPS, "NOPE")).toEqual([])
  })
})

describe("objectFormSchema", () => {
  // R2 dropped field-level business validation from the wizard and LeaseObjectCreate requires
  // nothing, so a blank object must validate — it is completed over several sittings.
  it("accepts an entirely empty object", () => {
    expect(objectFormSchema.parse(EMPTY_OBJECT_FORM)).toEqual(EMPTY_OBJECT_FORM)
  })

  it("accepts a four-digit year", () => {
    expect(
      objectFormSchema.parse({
        ...EMPTY_OBJECT_FORM,
        year_of_manufacture: "2024",
      }).year_of_manufacture
    ).toBe("2024")
  })

  // Shape, not plausibility: a two-digit year is a typo the user should see, whereas an unusual
  // but well-formed year is theirs to enter.
  it("rejects a malformed year but not an unusual one", () => {
    expect(() =>
      objectFormSchema.parse({
        ...EMPTY_OBJECT_FORM,
        year_of_manufacture: "24",
      })
    ).toThrow()
    expect(() =>
      objectFormSchema.parse({
        ...EMPTY_OBJECT_FORM,
        year_of_manufacture: "1899",
      })
    ).not.toThrow()
  })
})

describe("toObjectPayload", () => {
  it("sends null for a blank field rather than an empty string", () => {
    const payload = toObjectPayload(EMPTY_OBJECT_FORM, false)
    expect(payload.object_group).toBeNull()
    expect(payload.manufacturer).toBeNull()
    expect(payload.acquisition_cost).toBeNull()
    expect(payload.year_of_manufacture).toBeNull()
    expect(payload.new_or_used).toBeNull()
  })

  it("converts money to a number", () => {
    const payload = toObjectPayload(
      { ...EMPTY_OBJECT_FORM, acquisition_cost: "96400.00" },
      false
    )
    expect(payload.acquisition_cost).toBe(96400)
  })

  // A comma decimal is what a German keyboard produces, and the backend should not be asked to
  // guess the separator.
  it("accepts a comma decimal separator", () => {
    expect(
      toObjectPayload({ ...EMPTY_OBJECT_FORM, market_value: "1234,56" }, false)
        .market_value
    ).toBe(1234.56)
  })

  it("sends null rather than NaN for unparseable money", () => {
    expect(
      toObjectPayload({ ...EMPTY_OBJECT_FORM, market_value: "abc" }, false)
        .market_value
    ).toBeNull()
  })

  it("trims text", () => {
    expect(
      toObjectPayload({ ...EMPTY_OBJECT_FORM, brand: "  Volvo  " }, false).brand
    ).toBe("Volvo")
  })

  // The point of passing `isVehicle` explicitly. Changing a group from a car to machinery has to
  // CLEAR the plate it used to carry — an omitted key would leave the stale value on a PATCH.
  it("nulls the vehicle-only fields for a non-vehicle group", () => {
    const filled = {
      ...EMPTY_OBJECT_FORM,
      object_sub_group: "HYBRID",
      chassis_or_serial_number: "WDB123",
      registration_plate: "HH-AB-123",
      vehicle_registration_document_number: "ZLB-9",
    }

    const payload = toObjectPayload(filled, false)
    expect(payload.object_sub_group).toBeNull()
    expect(payload.chassis_or_serial_number).toBeNull()
    expect(payload.registration_plate).toBeNull()
    expect(payload.vehicle_registration_document_number).toBeNull()
  })

  it("keeps the vehicle-only fields for a vehicle group", () => {
    const payload = toObjectPayload(
      { ...EMPTY_OBJECT_FORM, registration_plate: "HH-AB-123" },
      true
    )
    expect(payload.registration_plate).toBe("HH-AB-123")
  })
})

describe("toObjectFormValues", () => {
  // Money arrives as `number | string` on this resource, unlike the decimal-string case and
  // financing responses, so both have to round-trip into the form.
  it("round-trips a saved object, whichever way money arrived", () => {
    const values = toObjectFormValues({
      id: "00000000-0000-4000-8000-0000000000e1",
      contract_id: "00000000-0000-4000-8000-0000000000c1",
      object_number: 1,
      object_group: "WOHNMOBIL",
      object_sub_group: "HYBRID",
      object_description: "Camper van",
      manufacturer: "Knaus",
      brand: "Boxstar",
      year_of_manufacture: 2024,
      chassis_or_serial_number: "WDB123",
      registration_plate: "HH-AB-123",
      vehicle_registration_document_number: "ZLB-9",
      new_or_used: "new",
      acquisition_cost: 96400,
      residual_value: null,
      special_payment: "1200.00",
      market_value: null,
      appraised_value: 91000,
      value_as_at: null,
      dat_evidence_status: "uploaded",
      dat_evidence_document_id: "doc-1",
      removed_at: null,
    })

    expect(values).toMatchObject({
      object_group: "WOHNMOBIL",
      object_sub_group: "HYBRID",
      year_of_manufacture: "2024",
      new_or_used: "new",
      acquisition_cost: "96400",
      special_payment: "1200.00",
      market_value: "",
      appraised_value: "91000",
    })
  })
})
