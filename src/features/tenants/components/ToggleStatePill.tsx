import { StatusPill } from "@/features/tenants/components/StatusPill"

type ToggleStatePillProps = {
  isEnabled: boolean
  label: string
  className?: string
}

// On/off pill for boolean policy and integration flags. Shares StatusPill's
// no-dot shape so these stay visually identical to the other tenant badges.
export function ToggleStatePill({
  isEnabled,
  label,
  className,
}: ToggleStatePillProps) {
  return (
    <StatusPill
      colorClassName={
        isEnabled
          ? "bg-green-600/10 text-green-600"
          : "bg-slate-200 text-muted-foreground"
      }
      className={className}
    >
      {label}
    </StatusPill>
  )
}
