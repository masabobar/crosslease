import type { ReactNode } from "react"

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
  headerActions?: ReactNode
}

export function SectionCard({
  title,
  children,
  headerActions,
}: SectionCardProps) {
  return (
    <div className="bg-muted border border-border rounded-[10px] flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between h-10 px-3">
        <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
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
