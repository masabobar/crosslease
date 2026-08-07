import type { FADisplayStatus } from "@/features/frameworkAgreements/utils"
import type { FAVersionStatus } from "@/features/frameworkAgreements/api/schema"

// Wire value for the platform module key, per `../refinext-api/src/app/core/platform/modules.py`.
export const FRAMEWORK_AGREEMENT_MODULE_KEY = "framework_agreement"

export const FA_STATUS_BADGE_VARIANT: Record<
  FADisplayStatus,
  "default" | "secondary" | "outline"
> = {
  draft: "outline",
  active: "default",
  terminated: "outline",
  expired: "secondary",
}

// Per-version status (CR-FA-04) — a distinct enum from the agreement-level status above.
// `discarded` is never rendered (see FAVersionStatusSchema) but the Record must still cover
// it for type completeness.
export const FA_VERSION_STATUS_BADGE_VARIANT: Record<
  FAVersionStatus,
  "default" | "secondary" | "outline"
> = {
  draft: "outline",
  active: "default",
  superseded: "secondary",
  discarded: "outline",
}

// Shared document-upload constraints for FA document attach flows
// (AttachFrameworkAgreementDocumentDialog, DocumentDropzone, TemplatesAndDocumentsTab).
export const FA_DOCUMENT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const FA_DOCUMENT_BYTES_PER_MB = 1024 * 1024
export const FA_DOCUMENT_ACCEPTED_MIME = "application/pdf"
// Per-agreement document cap enforced by the BE — the wizard dropzone truncates to it and
// the detail tab disables Attach at it, so both must read the same number.
export const FA_DOCUMENT_MAX_COUNT = 10
