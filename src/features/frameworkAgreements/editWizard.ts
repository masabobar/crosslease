import { FALifecycleStatusSchema } from "@/features/frameworkAgreements/api/schema"
import type {
  EditFrameworkAgreementFormValues,
  FADetailResponse,
  UpdateFARequest,
} from "@/features/frameworkAgreements/api/schema"

// Snapshot of the fetched agreement, taken once when the edit wizard mounts. It seeds
// `defaultValues` rather than RHF's `values` prop deliberately: `values` re-syncs on every
// detail refetch, which would both overwrite in-progress input and silently bump
// expected_version — defeating the FA_VERSION_CONFLICT check that field exists to trigger.
export function toEditFormDefaults(
  frameworkAgreement: FADetailResponse
): EditFrameworkAgreementFormValues {
  return {
    agreement_name: frameworkAgreement.agreement_name,
    max_volume_eur: frameworkAgreement.max_volume_eur,
    // Null for roles the BE hides pricing from; those roles cannot reach this screen
    // (edit is bank_power_user-only), so 0 is only ever a type-level fallback.
    effective_rate: frameworkAgreement.effective_rate ?? 0,
    vfe_rate: frameworkAgreement.vfe_rate ?? undefined,
    valid_from: frameworkAgreement.valid_from,
    valid_until: frameworkAgreement.valid_until ?? "",
    special_conditions: frameworkAgreement.special_conditions ?? "",
    product_template_ids: frameworkAgreement.product_template_ids,
    justification: "",
    expected_version: frameworkAgreement.edit_version_counter,
  }
}

export function isFrameworkAgreementDraft(
  frameworkAgreement: FADetailResponse
): boolean {
  return frameworkAgreement.status === FALifecycleStatusSchema.enum.draft
}

// PATCH /framework-agreements/{id} dispatches on the current status: update_draft()
// accepts agreement_name/valid_from, edit_governed() rejects them as FA_IMMUTABLE_FIELDS.
// Nothing is diffed against the original — every editable field is sent and the BE's
// FA_NO_CHANGES check covers an unchanged save.
export function buildUpdateFAPayload(
  values: EditFrameworkAgreementFormValues,
  isDraft: boolean
): UpdateFARequest {
  const {
    justification,
    expected_version,
    agreement_name,
    valid_from,
    ...rest
  } = values

  return {
    ...rest,
    valid_until: values.valid_until || undefined,
    justification,
    expected_version,
    ...(isDraft ? { agreement_name, valid_from } : {}),
  }
}
