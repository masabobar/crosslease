import { StatusPill } from "@/features/tenants/components/StatusPill"

// Tonal badge palette shared by the tenant detail tabs. Governance History keys
// these by semantic meaning (a derived state change), Support Grants by grant
// status — both resolve to the same four tones, so the values live here once.
export type SoftBadgeTone =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "danger"

const TONE_CLASSES: Record<SoftBadgeTone, string> = {
  neutral: "bg-[rgba(244,244,245,0.6)] text-foreground",
  success: "bg-[rgba(22,163,74,0.1)] text-[#16a34a]",
  info: "bg-[rgba(2,132,199,0.1)] text-[#0284c7]",
  warning: "bg-[rgba(227,146,25,0.1)] text-[#d97706]",
  danger: "bg-[rgba(224,52,52,0.1)] text-[#e6000a]",
}

type SoftBadgeProps = {
  label: string
  tone: SoftBadgeTone
}

export function SoftBadge({ label, tone }: SoftBadgeProps) {
  return <StatusPill colorClassName={TONE_CLASSES[tone]}>{label}</StatusPill>
}
