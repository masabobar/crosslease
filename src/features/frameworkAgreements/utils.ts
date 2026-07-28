import { useTranslation } from "react-i18next"
import { ApiError } from "@/lib/api"
import { FALifecycleStatusSchema } from "@/features/frameworkAgreements/api/schema"
import type { FALifecycleStatus } from "@/features/frameworkAgreements/api/schema"

export function isFrameworkAgreementNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "FA_NOT_FOUND"
}

// Display-only status: an Active agreement past its `valid_until` reads as
// "expired" in the UI. Per CR PRD1042-1552 B2, this is presentation only —
// FALifecycleStatus stays at 4 wire values; no new lifecycle state is added.
export type FADisplayStatus = FALifecycleStatus | "expired"

export function getFrameworkAgreementDisplayStatus(
  status: FALifecycleStatus,
  validUntil: string | null,
  now: Date = new Date()
): FADisplayStatus {
  const isPastValidUntil = validUntil !== null && new Date(validUntil) < now
  if (status === FALifecycleStatusSchema.enum.active && isPastValidUntil) {
    return "expired"
  }
  return status
}

// Shared Zod refine-error-code → i18n message resolver for the wizard/edit form
// steps (IdentityStep, EnvelopePricingStep, ValidityTemplatesStep,
// EditFrameworkAgreementFields). Handles every custom refine code used across those
// forms' Zod schemas (see api/schema.ts): "required", "validUntilBeforeFrom",
// "atLeastOneTemplate". Unrecognized messages are returned as-is.
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
    return msg
  }
}
