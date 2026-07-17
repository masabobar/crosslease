import { useTranslation } from "react-i18next"
import { ApiError } from "@/lib/api"

export function isFrameworkAgreementNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "FA_NOT_FOUND"
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
