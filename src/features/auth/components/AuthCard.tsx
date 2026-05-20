import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

function AuthCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[480px] bg-card rounded-xl shadow-sm border border-border overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  )
}

function AuthCardHeader({ children }: { children: ReactNode }) {
  return <div className="px-6 pt-6 pb-5">{children}</div>
}

function AuthCardBody({ children }: { children: ReactNode }) {
  return <div className="px-6 pb-5">{children}</div>
}

function AuthCardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
      {children}
    </div>
  )
}

export { AuthCard, AuthCardHeader, AuthCardBody, AuthCardFooter }
