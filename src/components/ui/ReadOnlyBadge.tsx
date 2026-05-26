import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

type ReadOnlyBadgeProps = {
  className?: string
}

export function ReadOnlyBadge({ className }: ReadOnlyBadgeProps) {
  const { t } = useTranslation("common")

  return (
    <span
      role="img"
      aria-label={t("support.readOnlyDescription")}
      className={cn(
        "inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap",
        className
      )}
      data-testid="read-only-badge"
    >
      {t("support.readOnly")}
    </span>
  )
}
