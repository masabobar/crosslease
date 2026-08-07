import { useTranslation } from "react-i18next"
import { ApiError } from "@/lib/api"
import { resolveFormMessage } from "@/lib/formMessages"
import {
  FALifecycleStatusSchema,
  VFE_AMOUNT_MIN,
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
// GET /product-templates/selectable is version-scoped — it returns one row per selectable
// version (ACTIVE *and* in-window SUPERSEDED, see get_selectable_versions in
// ../refinext-api/), so a template with an active v2 and a superseded v1 arrives twice under
// one template_id. Consumers bind the *template* (an FA's product_template_ids are
// ProductTemplate.id; the BE resolves the version at binding time), so those rows must be
// collapsed. Applied once in useSelectableProductTemplates' select — that hook's comment
// records which surfaces broke and how.
//
// The surviving row keeps the highest version_number: the response carries no version_status,
// so "latest" is the only available stand-in for "the one that will actually be bound".
export function dedupeSelectableTemplates(
  options: readonly SelectableTemplateItem[]
): readonly SelectableTemplateItem[] {
  const byTemplate = new Map<string, SelectableTemplateItem>()
  for (const option of options) {
    const current = byTemplate.get(option.template_id)
    if (
      !current ||
      Number(option.version_number) > Number(current.version_number)
    ) {
      byTemplate.set(option.template_id, option)
    }
  }
  return [...byTemplate.values()]
}

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

// Zod message-code → i18n resolver for every FA form surface: the create and edit wizard
// steps, plus the activate / terminate / attach-document panels. Delegates to the shared
// resolveFormMessage, which takes shared codes ("required", "mustBePositive", "tooShort",
// "tooLong") from common:validation.*, feature codes ("validUntilBeforeFrom",
// "atLeastOneTemplate") from frameworkAgreements:errors.*, and passes an already-translated
// server message through untouched.
//
// "vfeAmountMin" stays here because it is the one code that interpolates: the bound comes
// from the schema constant so the message can never drift from what the BE enforces.
export function useResolveFrameworkAgreementFieldError(): (
  msg: string | undefined
) => string | undefined {
  const { t } = useTranslation("frameworkAgreements")

  return function resolveFrameworkAgreementFieldError(
    msg: string | undefined
  ): string | undefined {
    if (msg === "vfeAmountMin") {
      return t("errors.vfeAmountMin", { min: VFE_AMOUNT_MIN })
    }
    return resolveFormMessage(msg, t, "errors")
  }
}
