import type { ReactNode } from "react"
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
  headerActions?: ReactNode
}

export function SectionCard({
  title,
  children,
  headerActions,
}: SectionCardProps) {
  return (
    <DetailSectionCard
      title={title}
      headerActions={headerActions}
      isTitleUppercase
    >
      {children}
    </DetailSectionCard>
  )
}
