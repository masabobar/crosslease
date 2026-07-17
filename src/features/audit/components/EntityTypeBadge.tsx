import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { formatActionType } from "@/lib/formatters"

const ENTITY_TYPE_STYLES: Record<string, string> = {
  user: "border-sky-500 text-sky-700",
  contract: "border-teal-500 text-teal-700",
  financing: "border-amber-500 text-amber-700",
  request: "border-violet-500 text-violet-700",
  document: "border-slate-400 text-slate-600",
  partner: "border-rose-500 text-rose-700",
  system: "border-zinc-400 text-zinc-600",
}

export function EntityTypeBadge({ entityType }: { entityType: string }) {
  const { t } = useTranslation("audit")
  const style =
    ENTITY_TYPE_STYLES[entityType] ?? "border-border text-muted-foreground"
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap",
        style
      )}
    >
      {t(`entityType.${entityType}`, {
        defaultValue: formatActionType(entityType),
      })}
    </span>
  )
}
