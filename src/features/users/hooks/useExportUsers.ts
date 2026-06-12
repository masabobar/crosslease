import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useToastStore } from "@/store/toastStore"
import { handleApiError } from "@/lib/handleApiError"
import {
  downloadExportFile,
  getExportJobStatus,
  initiateExport,
} from "@/features/users/api/usersApi"
import type { ExportFormat, ExportParams } from "@/features/users/api/schema"

type ExportState = "idle" | "initiating" | "polling" | "downloading"

const POLL_INTERVAL_MS = 2000

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

  async function pollAndDownload(jobId: string, format: ExportFormat) {
    try {
      const { status } = await getExportJobStatus(jobId)

      if (status === "ready") {
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

      if (status === "failed") {
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
        () => void pollAndDownload(jobId, format),
        POLL_INTERVAL_MS
      )
    } catch (err) {
      handleApiError(err, showToast, t, t("export.errorTitle"), {
        fallbackKey: "export.errorMessage",
        variant: "error",
      })
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
      handleApiError(err, showToast, t, t("export.errorTitle"), {
        fallbackKey: "export.errorMessage",
        variant: "error",
      })
      setState("idle")
    }
  }

  return { startExport, isExporting: state !== "idle" }
}
