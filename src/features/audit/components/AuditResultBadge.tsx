import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { AuditResultSchema } from "@/features/audit/api/schema"
import type { AuditResult } from "@/features/audit/api/schema"

type AuditResultBadgeProps = {
  result: AuditResult
  className?: string
}

export function AuditResultBadge({ result, className }: AuditResultBadgeProps) {
  const { t } = useTranslation("audit")

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap",
        result === AuditResultSchema.enum.Success
          ? "border-success text-success"
          : "border-destructive text-destructive",
        className
      )}
    >
      {result === AuditResultSchema.enum.Success
        ? t("result.success")
        : t("result.failed")}
    </span>
  )
}
