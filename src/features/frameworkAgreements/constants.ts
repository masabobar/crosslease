import type { FADisplayStatus } from "@/features/frameworkAgreements/utils"

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

// Shared document-upload constraints for FA document attach flows
// (AttachFrameworkAgreementDocumentDialog, DocumentDropzone).
export const FA_DOCUMENT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const FA_DOCUMENT_BYTES_PER_MB = 1024 * 1024
export const FA_DOCUMENT_ACCEPTED_MIME = "application/pdf"
