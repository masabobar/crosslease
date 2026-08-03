import { useTranslation } from "react-i18next"
import { ApiError } from "@/lib/api"
import {
  EFFECTIVE_RATE_MAX,
  EFFECTIVE_RATE_MIN,
  FALifecycleStatusSchema,
  VFE_RATE_MAX,
  VFE_RATE_MIN,
} from "@/features/frameworkAgreements/api/schema"
import type {
  FALifecycleStatus,
  SelectableTemplateItem,
} from "@/features/frameworkAgreements/api/schema"

export function isFrameworkAgreementNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "FA_NOT_FOUND"
}

// Display-only status: an Active agreement the BE reports as expired reads as
// "expired" in the UI. Per CR PRD1042-1552 B2, this is presentation only —
// FALifecycleStatus stays at 3 wire values; no new lifecycle state is added.
export type FADisplayStatus = FALifecycleStatus | "expired"

export function getFrameworkAgreementDisplayStatus(
  status: FALifecycleStatus,
  isExpired: boolean
): FADisplayStatus {
  if (status === FALifecycleStatusSchema.enum.active && isExpired) {
    return "expired"
  }
  return status
}

// `valid_until` is a date-only wire value (`format: date`), so expiry must be a
// calendar-date comparison — an agreement is valid through the whole of that day.
// Mirrors is_fa_expired() in refinext-api (`valid_until < date.today()`).
//
// Only the LC portal needs this: LCPortalFAListItem is the one FA response the BE
// does not carry `is_expired` on, and the LC card must not disagree with the
// bank-side list and detail views. Delete once the BE adds the flag — see Q-033.
export function isFrameworkAgreementExpiredByDate(
  validUntil: string | null,
  today: Date = new Date()
): boolean {
  if (validUntil === null) return false
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-")
  return validUntil < localToday
}

// Narrows the allowed-templates picker by a free-text query, matching template name or
// template code case-insensitively. Per CR PRD1042-1799 CR-FA-05 the picker keeps the full
// published list — no filtering derived from earlier wizard steps and no "smart" version
// pre-selection — so search is the only narrowing, and it happens client-side because
// GET /product-templates/selectable returns every option in one unpaginated response.
export function filterSelectableTemplates(
  options: readonly SelectableTemplateItem[],
  query: string
): readonly SelectableTemplateItem[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return options
  return options.filter(
    option =>
      option.template_name.toLowerCase().includes(needle) ||
      option.template_code.toLowerCase().includes(needle)
  )
}

// Shared Zod refine-error-code → i18n message resolver for the wizard/edit form
// steps (IdentityStep, EnvelopePricingStep, ValidityTemplatesStep,
// the edit wizard's steps). Handles every custom refine code used across those
// forms' Zod schemas (see api/schema.ts): "required", "validUntilBeforeFrom",
// "atLeastOneTemplate", "effectiveRateRange", "vfeRateRange". Unrecognized messages
// are returned as-is.
export function useResolveFrameworkAgreementFieldError() {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")

  return function resolveFrameworkAgreementFieldError(
    msg: string | undefined
  ): string | undefined {
    if (!msg) return undefined
    if (msg === "required") return tCommon("validation.required")
    if (msg === "validUntilBeforeFrom") return t("errors.validUntilBeforeFrom")
    if (msg === "atLeastOneTemplate") return t("errors.atLeastOneTemplate")
    // Bounds come from the schema constants so the message can never drift from the
    // range the BE actually enforces.
    if (msg === "effectiveRateRange") {
      return t("errors.rateRange", {
        min: EFFECTIVE_RATE_MIN,
        max: EFFECTIVE_RATE_MAX,
      })
    }
    if (msg === "vfeRateRange") {
      return t("errors.rateRange", { min: VFE_RATE_MIN, max: VFE_RATE_MAX })
    }
    return msg
  }
}
