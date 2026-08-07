import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// Muted-header + white-body card that groups rows on a detail page. Named
// DetailSectionCard rather than SectionCard on purpose: components/shared/SectionCard.tsx
// is a different component (gray banner, wizard steps) and the two sharing one name across
// features was a standing source of wrong-import confusion.
//
// The partners and users detail pages each carried their own copy of this markup; both now
// delegate here through a thin feature-local wrapper, so their call sites are untouched.
type Props = {
  title: string
  children: ReactNode
  headerActions?: ReactNode
  // Partners uppercases its section titles, users does not. Kept as a flag rather than
  // normalised so neither surface changes appearance.
  isTitleUppercase?: boolean
}

function DetailSectionCard({
  title,
  children,
  headerActions,
  isTitleUppercase = false,
}: Props) {
  return (
    <div className="bg-muted border border-border rounded-[10px] flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between h-10 px-3">
        <span
          className={cn(
            "text-xs font-semibold text-foreground tracking-wide",
            isTitleUppercase && "uppercase"
          )}
        >
          {title}
        </span>
        {headerActions}
      </div>
      <div className="bg-card border border-border rounded-b-[10px] p-3 flex flex-col gap-3 flex-1">
        {children}
      </div>
    </div>
  )
}

export { DetailSectionCard }
