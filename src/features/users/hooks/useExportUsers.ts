import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useToastStore } from "@/store/toastStore"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import {
  downloadExportFile,
  getExportJobStatus,
  initiateExport,
} from "@/features/users/api/usersApi"
import { ExportJobStatusValueSchema } from "@/features/users/api/schema"
import type { ExportFormat, ExportParams } from "@/features/users/api/schema"

type ExportState = "idle" | "initiating" | "polling" | "downloading"

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 150 // ~5 minutes at POLL_INTERVAL_MS intervals

export function useExportUsers() {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const [state, setState] = useState<ExportState>("idle")
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    },
    []
  )

  function triggerBrowserDownload(blob: Blob, format: ExportFormat) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users_export.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function pollAndDownload(
    jobId: string,
    format: ExportFormat,
    attempt = 0
  ) {
    if (attempt >= MAX_POLL_ATTEMPTS) {
      showToast({
        variant: "error",
        title: t("export.timeoutTitle"),
        message: t("export.timeoutMessage"),
      })
      setState("idle")
      return
    }

    try {
      const { status } = await getExportJobStatus(jobId)

      if (status === ExportJobStatusValueSchema.enum.ready) {
        setState("downloading")
        const blob = await downloadExportFile(jobId)

        // 202 re-generating case: blob contains JSON, not a file
        if (blob.type.includes("application/json")) {
          showToast({
            variant: "warning",
            title: t("export.expiredTitle"),
            message: t("export.expiredMessage"),
          })
          setState("idle")
          return
        }

        triggerBrowserDownload(blob, format)
        showToast({
          variant: "success",
          title: t("export.successTitle"),
          message: t("export.successMessage"),
        })
        setState("idle")
        return
      }

      if (status === ExportJobStatusValueSchema.enum.failed) {
        showToast({
          variant: "error",
          title: t("export.errorTitle"),
          message: t("export.errorMessage"),
        })
        setState("idle")
        return
      }

      // still processing — poll again
      pollTimeoutRef.current = setTimeout(
        () => void pollAndDownload(jobId, format, attempt + 1),
        POLL_INTERVAL_MS
      )
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("export.errorMessage") })
          : t("export.errorMessage")
      )
      setState("idle")
    }
  }

  async function startExport(params: ExportParams) {
    if (state !== "idle") return

    setState("initiating")
    try {
      const job = await initiateExport(params)
      setState("polling")
      void pollAndDownload(job.job_id, params.format)
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("export.errorMessage") })
          : t("export.errorMessage")
      )
      setState("idle")
    }
  }

  return { startExport, isExporting: state !== "idle" }
}
