import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SquarePen } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-2 py-0 text-sm leading-5">
      <span className="text-muted-foreground w-[180px] shrink-0">{label}</span>
      <span className="text-foreground min-w-0">{children}</span>
    </div>
  )
}

type SectionCardProps = {
  title: string
  children: ReactNode
  onEdit?: () => void
  headerActions?: ReactNode
  "data-testid"?: string
}

export function SectionCard({
  title,
  children,
  onEdit,
  headerActions,
  "data-testid": editTestId,
}: SectionCardProps) {
  const { t } = useTranslation("users")
  return (
    <div className="bg-muted border border-border rounded-[10px] flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between h-10 px-3">
        <span className="text-xs font-semibold text-foreground tracking-wide">
          {title}
        </span>
        {headerActions ??
          (onEdit ? (
            <Button
              variant="outline"
              data-testid={editTestId}
              onClick={onEdit}
              className="h-auto gap-1 rounded-[10px] px-[10px] py-[4px] text-sm"
            >
              <SquarePen size={14} />
              {t("detail.page.actions.edit")}
            </Button>
          ) : null)}
      </div>
      <div className="bg-card border border-border rounded-b-[10px] p-3 flex flex-col gap-3 flex-1">
        {children}
      </div>
    </div>
  )
}
