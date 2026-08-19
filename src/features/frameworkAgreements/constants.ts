import type { FAAgreementLifecycle } from "@/features/frameworkAgreements/api/schema"

// Wire value for the platform module key, per `../refinext-api/src/app/core/platform/modules.py`.
export const FRAMEWORK_AGREEMENT_MODULE_KEY = "framework_agreement"

// Keyed by the wire lifecycle (CR-FA-07) rather than the old client-derived FADisplayStatus,
// so a state the backend adds fails type-check here instead of rendering an undefined variant.
export const FA_STATUS_BADGE_VARIANT: Record<
  FAAgreementLifecycle,
  "default" | "secondary" | "outline"
> = {
  draft: "outline",
  active: "default",
  deactivated: "outline",
  terminated: "outline",
  expired: "secondary",
}

// FA_VERSION_STATUS_BADGE_VARIANT was removed with CR-FA-04's withdrawal (6/8/2026) —
// the agreement is not versioned, so there is no per-version badge to style.

// Shared document-upload constraints for FA document attach flows
// (AttachFrameworkAgreementDocumentDialog, DocumentDropzone, TemplatesAndDocumentsTab).
export const FA_DOCUMENT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const FA_DOCUMENT_BYTES_PER_MB = 1024 * 1024
export const FA_DOCUMENT_ACCEPTED_MIME = "application/pdf"
// Per-agreement document cap enforced by the BE — the wizard dropzone truncates to it and
// the detail tab disables Attach at it, so both must read the same number.
export const FA_DOCUMENT_MAX_COUNT = 10
