import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SquarePen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DetailRow as SharedDetailRow } from "@/components/shared/DetailRow"
import { DetailSectionCard } from "@/components/shared/DetailSectionCard"

export function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <SharedDetailRow label={label} variant="fixedLabel">
      {children}
    </SharedDetailRow>
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
    <DetailSectionCard
      title={title}
      headerActions={
        headerActions ??
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
        ) : null)
      }
    >
      {children}
    </DetailSectionCard>
  )
}
