import { useTranslation } from "react-i18next"
import {
  useAuditorExpiry,
  formatCountdown,
} from "@/features/users/hooks/useAuditorExpiry"
import { DATE_LOCALE } from "@/lib/formatters"

function formatBannerDate(date: Date): string {
  return date.toLocaleDateString(DATE_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatBannerTime(date: Date): string {
  return date.toLocaleTimeString(DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function AuditorExpiryBanner() {
  const { t } = useTranslation("common")
  const expiry = useAuditorExpiry()

  if (expiry.level === "none") return null

  if (expiry.level === "warning") {
    return (
      <div
        role="status"
        className="w-full px-[10px] py-2 bg-warning/10 border-b border-warning text-warning text-sm font-medium text-center"
        data-testid="auditor-expiry-banner"
      >
        {t("auditorExpiry.warningMessage", {
          date: formatBannerDate(expiry.expiresAt),
          time: formatBannerTime(expiry.expiresAt),
        })}
      </div>
    )
  }

  return (
    <div
      role="status"
      className="w-full px-[10px] py-2 bg-destructive/10 border-b border-destructive text-destructive text-sm font-medium text-center"
      data-testid="auditor-expiry-banner"
    >
      {t("auditorExpiry.dangerMessage", {
        time: formatBannerTime(expiry.expiresAt),
        countdown: formatCountdown(expiry.secondsRemaining),
      })}
    </div>
  )
}
