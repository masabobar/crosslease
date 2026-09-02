/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Framework agreements, product templates, and the utilisation projection — the three business-config
 * datasets that wizard step 1 reads (spec §5.2, §5.3) and that have their own screens today.
 *
 * Shaped from the spec's own rules where they are visible in the data:
 *  - one **active** agreement per leasing company (D-79), the rest deactivated/expired/draft
 *  - `bank_entity` limited to the values the schema declares; the spec records Sparkasse + Other as
 *    the assumption for November (OQ on bank entity values)
 *  - utilisation carries the spec's three figures, and `available: false` on one agreement so the
 *    "no volume maintained → the remaining-available line disappears" path is reachable
 */
import type {
  FAListItem,
  FALCPartnerItem,
  FAUtilizationResponse,
} from "@/features/frameworkAgreements/api/schema"
import type { TemplateListItem } from "@/features/productTemplates/api/schema"
import { LC_PARTNER_ID } from "@/mocks/fixtures/partners"

const LC_NORDIC = "00000000-0000-4000-8000-00000000a002"
const LC_BALTIC = "00000000-0000-4000-8000-00000000a003"

export const FA_ACTIVE_ID = "00000000-0000-4000-8000-00000000e001"

export const mockLcPartners: FALCPartnerItem[] = [
  { id: LC_PARTNER_ID, legal_name: "Premium Leasing GmbH" },
  { id: LC_NORDIC, legal_name: "Nordic Fleet Partners AB" },
  { id: LC_BALTIC, legal_name: "Baltic Machinery Leasing GmbH" },
]

export const mockFrameworkAgreements: FAListItem[] = [
  {
    id: FA_ACTIVE_ID,
    agreement_name: "FA-2025-002 Premium Leasing",
    lc_partner_id: LC_PARTNER_ID,
    lc_partner_name: "Premium Leasing GmbH",
    bank_entity: "sparkasse",
    status: "active",
    is_expired: false,
    agreement_lifecycle: "active",
    valid_from: "2025-01-01",
    valid_until: "2027-12-31",
    utilization_pct: 62,
    limit_breach: false,
  },
  {
    id: "00000000-0000-4000-8000-00000000e002",
    agreement_name: "FA-2024-018 Nordic Fleet, revolving",
    lc_partner_id: LC_NORDIC,
    lc_partner_name: "Nordic Fleet Partners AB",
    bank_entity: "sparkasse",
    status: "active",
    is_expired: false,
    agreement_lifecycle: "active",
    valid_from: "2024-06-01",
    valid_until: null,
    utilization_pct: 97,
    limit_breach: true,
  },
  // No volume maintained: the spec records that none of the seven leasing companies has one, so this
  // is the realistic default rather than the exception.
  {
    id: "00000000-0000-4000-8000-00000000e003",
    agreement_name: "FA-2025-011 Baltic Machinery",
    lc_partner_id: LC_BALTIC,
    lc_partner_name: "Baltic Machinery Leasing GmbH",
    bank_entity: "other",
    status: "active",
    is_expired: false,
    agreement_lifecycle: "active",
    valid_from: "2025-03-15",
    valid_until: "2026-03-14",
    utilization_pct: null,
    limit_breach: null,
  },
  {
    id: "00000000-0000-4000-8000-00000000e004",
    agreement_name: "FA-2023-004 Premium Leasing (superseded)",
    lc_partner_id: LC_PARTNER_ID,
    lc_partner_name: "Premium Leasing GmbH",
    bank_entity: "sparkasse",
    status: "deactivated",
    is_expired: true,
    agreement_lifecycle: "expired",
    valid_from: "2023-01-01",
    valid_until: "2024-12-31",
    utilization_pct: 0,
    limit_breach: false,
  },
  {
    id: "00000000-0000-4000-8000-00000000e005",
    agreement_name: "FA-2026-001 Nordic Fleet (draft)",
    lc_partner_id: LC_NORDIC,
    lc_partner_name: "Nordic Fleet Partners AB",
    bank_entity: "landesbank_1",
    status: "draft",
    is_expired: false,
    agreement_lifecycle: "draft",
    valid_from: "2026-10-01",
    valid_until: null,
    utilization_pct: null,
    limit_breach: null,
  },
]

// The three utilisation figures §5.2 shows for information: utilised (the outstanding balance, not the
// amount disbursed), committed, and remaining available.
export function mockUtilization(faId: string): FAUtilizationResponse {
  const maintained = faId !== "00000000-0000-4000-8000-00000000e003"
  if (!maintained) {
    return {
      max_volume_eur: 0,
      disbursed_volume_eur: null,
      redeemed_volume_eur: null,
      net_exposure_eur: null,
      available_volume_eur: null,
      utilization_pct: null,
      limit_available_flag: false,
      limit_breach_flag: null,
      last_refreshed_at: null,
      source: "prototype-mock",
      // The screen must make the remaining-available line disappear rather than read zero.
      available: false,
    }
  }
  return {
    max_volume_eur: 40_000_000,
    disbursed_volume_eur: 24_800_000,
    redeemed_volume_eur: 1_200_000,
    net_exposure_eur: 23_600_000,
    available_volume_eur: 16_400_000,
    utilization_pct: 62,
    limit_available_flag: true,
    limit_breach_flag: false,
    last_refreshed_at: "2026-09-02T06:00:00Z",
    source: "prototype-mock",
    available: true,
  }
}

export const mockProductTemplates: TemplateListItem[] = [
  {
    id: "00000000-0000-4000-8000-00000000f001",
    template_code: "STD-LEASE-REFI",
    template_name: "Standard lease refinancing",
    current_version: {
      version_id: "00000000-0000-4000-8000-00000000f101",
      version_number: "4",
      version_status: "effective",
      refinancing_form: "annuity",
      legal_structure: "loan_credit",
      payment_timing: "arrears",
      max_ltv_ratio: null,
      min_term_months: 12,
      max_term_months: 72,
      activated_by: null,
      activated_at: "2026-07-01T09:00:00Z",
    },
    created_at: "2025-02-10T10:00:00Z",
    product_status: "active",
  },
  {
    id: "00000000-0000-4000-8000-00000000f002",
    template_code: "FULL-REFI-STD",
    template_name: "Full refinancing standard",
    current_version: {
      version_id: "00000000-0000-4000-8000-00000000f102",
      version_number: "2",
      version_status: "effective",
      refinancing_form: "annuity",
      legal_structure: "loan_credit",
      payment_timing: "arrears",
      max_ltv_ratio: null,
      min_term_months: 24,
      max_term_months: 60,
      activated_by: null,
      activated_at: "2026-05-20T09:00:00Z",
    },
    created_at: "2025-04-02T10:00:00Z",
    product_status: "active",
  },
  {
    id: "00000000-0000-4000-8000-00000000f003",
    template_code: "BULLET-PORTFOLIO",
    template_name: "Bullet loan, portfolio",
    current_version: {
      version_id: "00000000-0000-4000-8000-00000000f103",
      version_number: "1",
      version_status: "scheduled",
      refinancing_form: "bullet",
      legal_structure: "loan_credit",
      payment_timing: "advance",
      max_ltv_ratio: null,
      min_term_months: 6,
      max_term_months: 36,
      activated_by: null,
      activated_at: null,
    },
    created_at: "2026-08-01T10:00:00Z",
    product_status: "active",
  },
  // No version yet, so the list falls back to template_code — the nullable-name path.
  {
    id: "00000000-0000-4000-8000-00000000f004",
    template_code: "STRAIGHT-LINE-01",
    template_name: null,
    current_version: null,
    created_at: "2026-09-01T10:00:00Z",
    product_status: "active",
  },
]
