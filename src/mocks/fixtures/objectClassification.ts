/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The object classification tree the manual-entry form picks from.
 *
 * Two vehicle groups and two non-vehicle ones, deliberately: `is_vehicle` is what reveals the
 * sub-group picker and the chassis / plate / ZLB II fields, so a fixture with vehicles only would
 * never exercise the branch where they are hidden. `Wohnmobil` and its `Hybrid` sub-group are the
 * design's own example (`MANUAL CONTRACT ENTRY - Step 2 modal.pdf`).
 */
import type { ObjectGroupItem } from "@/features/cases/api/schema"

export const mockObjectGroups: ObjectGroupItem[] = [
  {
    code: "WOHNMOBIL",
    name: "Wohnmobil",
    is_vehicle: true,
    provenance: "bank_catalogue",
    sub_groups: [
      { code: "HYBRID", name: "Hybrid" },
      { code: "DIESEL", name: "Diesel" },
      { code: "PETROL", name: "Petrol" },
    ],
  },
  {
    code: "TRACTOR_UNIT",
    name: "Tractor unit",
    is_vehicle: true,
    provenance: "bank_catalogue",
    sub_groups: [
      { code: "DIESEL", name: "Diesel" },
      { code: "ELECTRIC", name: "Electric" },
    ],
  },
  // No sub-groups AND not a vehicle — the branch where the whole registration block disappears.
  {
    code: "INDUSTRIAL",
    name: "Industrial equipment",
    is_vehicle: false,
    provenance: "bank_catalogue",
    sub_groups: [],
  },
  // Not a vehicle but does carry sub-groups, so the two conditions are proven independent: the
  // sub-group picker must stay hidden here even though sub-groups exist.
  {
    code: "MEDICAL",
    name: "Medical equipment",
    is_vehicle: false,
    provenance: "bank_catalogue",
    sub_groups: [{ code: "IMAGING", name: "Imaging" }],
  },
]
