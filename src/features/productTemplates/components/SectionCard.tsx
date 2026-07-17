import type { ReactNode } from "react"
import { SectionCard as SharedSectionCard } from "@/components/SectionCard"

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

// Gray-banner-header + white-body card used to group fields within a wizard step,
// matching the Figma design's "Info" component (SETTINGS / NPV FORMULA REFERENCE /
// ALLOWED ASSET CATEGORIES / DETAILS sections).
function SectionCard({ title, subtitle, children }: Props) {
  return (
    <SharedSectionCard title={title} subtitle={subtitle}>
      {children}
    </SharedSectionCard>
  )
}

export { SectionCard }
