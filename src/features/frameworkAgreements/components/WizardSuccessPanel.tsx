import type { ReactNode } from "react"
import { Check } from "lucide-react"

// The terminal screen both framework-agreement wizards land on once their save succeeds.
// Create and edit word it differently and offer different actions, so the copy and the
// buttons are passed in; only the frame is shared.
export function WizardSuccessPanel({
  title,
  subtitle,
  actions,
  "data-testid": dataTestId,
}: {
  title: string
  subtitle: string
  actions: ReactNode
  "data-testid": string
}) {
  return (
    <div className="flex flex-col h-full items-center justify-center bg-slate-50">
      <div
        className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6 items-center"
        data-testid={dataTestId}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="bg-success/10 p-3 rounded-[14px]">
            <Check size={24} className="text-success" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-3 text-center w-full">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex w-full gap-2.5">{actions}</div>
      </div>
    </div>
  )
}
