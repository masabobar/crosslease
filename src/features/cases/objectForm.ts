import { z } from "zod"
import { NewOrUsedSchema } from "@/features/cases/api/schema"
import type {
  LeaseObjectRead,
  ObjectGroupItem,
} from "@/features/cases/api/schema"

/**
 * The manual-entry modal's Object form (US 1.8).
 *
 * ── EVERYTHING IS OPTIONAL, ON PURPOSE ─────────────────────────────────────────────────────────
 * `LeaseObjectCreate` requires no field, and R2 dropped field-level business validation from the
 * request wizard (the open half of that decision is Q-006). So this schema validates *shape* —
 * a year is a year, money is a number — and not completeness. Refusing to save a half-entered
 * object would fight both the contract and the spec: an object is completed over several sittings.
 *
 * Money is typed as a string in the form and converted on submit. A number input bound to a number
 * makes "1.2" unreachable while typing, and `valueAsNumber` yields NaN for an empty field — which
 * would then post NaN rather than null.
 */
export const objectFormSchema = z.object({
  object_group: z.string(),
  object_sub_group: z.string(),
  object_description: z.string(),
  manufacturer: z.string(),
  brand: z.string(),
  year_of_manufacture: z
    .string()
    .refine(value => value === "" || /^[0-9]{4}$/.test(value), {
      message: "yearFormat",
    }),
  chassis_or_serial_number: z.string(),
  registration_plate: z.string(),
  vehicle_registration_document_number: z.string(),
  new_or_used: z.union([NewOrUsedSchema, z.literal("")]),
  acquisition_cost: z.string(),
  market_value: z.string(),
  appraised_value: z.string(),
  special_payment: z.string(),
})

export type ObjectFormValues = z.infer<typeof objectFormSchema>

export const EMPTY_OBJECT_FORM: ObjectFormValues = {
  object_group: "",
  object_sub_group: "",
  object_description: "",
  manufacturer: "",
  brand: "",
  year_of_manufacture: "",
  chassis_or_serial_number: "",
  registration_plate: "",
  vehicle_registration_document_number: "",
  new_or_used: "",
  acquisition_cost: "",
  market_value: "",
  appraised_value: "",
  special_payment: "",
}

/**
 * Whether the selected group is a vehicle.
 *
 * This is what the design's indentation encodes: `Fuel type` (the sub-group) sits nested under
 * `Object group`, and the chassis / licence-plate / ZLB II fields only make sense for a vehicle.
 * Read from the classification's own `is_vehicle` flag rather than a hard-coded group list, so a
 * group the bank adds behaves correctly without a code change.
 */
export function isVehicleGroup(
  groups: readonly ObjectGroupItem[],
  groupCode: string
): boolean {
  return groups.find(group => group.code === groupCode)?.is_vehicle === true
}

export function subGroupsFor(
  groups: readonly ObjectGroupItem[],
  groupCode: string
): readonly { code: string; name: string }[] {
  return groups.find(group => group.code === groupCode)?.sub_groups ?? []
}

/** A blank string becomes `null`, not `""` — the wire's "not recorded" is null. */
function textOrNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim()
}

/**
 * A money field becomes a number, or null when blank.
 *
 * `LeaseObjectCreate` accepts `number | string | null` for money, so either would be taken. A
 * number is sent because it is unambiguous — a locale-formatted string ("1.234,56") would be at
 * the backend's mercy to parse.
 */
function moneyOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Form values → `LeaseObjectCreate` / `LeaseObjectEdit` body.
 *
 * The vehicle-only fields are sent as `null` when the group is not a vehicle, rather than being
 * omitted: a group changed from a car to machinery must *clear* the plate it used to carry, and an
 * omitted key would leave the old value in place on a PATCH.
 */
export function toObjectPayload(
  values: ObjectFormValues,
  isVehicle: boolean
): Record<string, unknown> {
  return {
    object_group: textOrNull(values.object_group),
    object_sub_group: isVehicle ? textOrNull(values.object_sub_group) : null,
    object_description: textOrNull(values.object_description),
    manufacturer: textOrNull(values.manufacturer),
    brand: textOrNull(values.brand),
    year_of_manufacture:
      values.year_of_manufacture.trim() === ""
        ? null
        : Number(values.year_of_manufacture),
    chassis_or_serial_number: isVehicle
      ? textOrNull(values.chassis_or_serial_number)
      : null,
    registration_plate: isVehicle
      ? textOrNull(values.registration_plate)
      : null,
    vehicle_registration_document_number: isVehicle
      ? textOrNull(values.vehicle_registration_document_number)
      : null,
    new_or_used: values.new_or_used === "" ? null : values.new_or_used,
    acquisition_cost: moneyOrNull(values.acquisition_cost),
    market_value: moneyOrNull(values.market_value),
    appraised_value: moneyOrNull(values.appraised_value),
    special_payment: moneyOrNull(values.special_payment),
  }
}

/** An existing object → form values, for the edit path. */
export function toObjectFormValues(object: LeaseObjectRead): ObjectFormValues {
  const money = (value: number | string | null): string =>
    value === null ? "" : String(value)

  return {
    object_group: object.object_group ?? "",
    object_sub_group: object.object_sub_group ?? "",
    object_description: object.object_description ?? "",
    manufacturer: object.manufacturer ?? "",
    brand: object.brand ?? "",
    year_of_manufacture:
      object.year_of_manufacture === null
        ? ""
        : String(object.year_of_manufacture),
    chassis_or_serial_number: object.chassis_or_serial_number ?? "",
    registration_plate: object.registration_plate ?? "",
    vehicle_registration_document_number:
      object.vehicle_registration_document_number ?? "",
    new_or_used: object.new_or_used ?? "",
    acquisition_cost: money(object.acquisition_cost),
    market_value: money(object.market_value),
    appraised_value: money(object.appraised_value),
    special_payment: money(object.special_payment),
  }
}
