import type { ReactNode } from "react"
import { SectionCard as SharedSectionCard } from "@/components/SectionCard"

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

function SectionCard({ title, subtitle, children }: Props) {
  return (
    <SharedSectionCard title={title} subtitle={subtitle} testIdPrefix="fa-">
      {children}
    </SharedSectionCard>
  )
}

export { SectionCard }
