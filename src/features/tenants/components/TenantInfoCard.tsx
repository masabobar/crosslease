import type { ReactNode } from "react"

export function TenantInfoCard({
  title,
  editButton,
  children,
}: {
  title: string
  editButton?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-slate-100 border border-border rounded-[10px]">
      <div className="flex items-center justify-between px-2 h-10">
        <span className="text-xs font-semibold uppercase text-foreground">
          {title}
        </span>
        {editButton}
      </div>
      <div className="bg-background border border-border rounded-b-[10px] p-2">
        {children}
      </div>
    </div>
  )
}
