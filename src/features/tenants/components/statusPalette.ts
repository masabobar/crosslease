// Dot-indicator badge palette shared by TenantStatusBadge and ModuleStatusBadge.
// Both map their own enum onto the same six tones, so the class triples are
// declared once here rather than repeated per badge.
export type StatusConfig = {
  container: string
  dot: string
  text: string
}

export const STATUS_TONES = {
  green: {
    container: "bg-[#d0fae5]",
    dot: "bg-[#22c55e]",
    text: "text-[#166534]",
  },
  blue: {
    container: "bg-[#dbeafe]",
    dot: "bg-[#3b82f6]",
    text: "text-[#1d4ed8]",
  },
  orange: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
  red: {
    container: "bg-[#fee2e2]",
    dot: "bg-[#ef4444]",
    text: "text-[#991b1b]",
  },
  slate: {
    container: "bg-[#f1f5f9]",
    dot: "bg-[#94a3b8]",
    text: "text-[#374151]",
  },
  purple: {
    container: "bg-[#f3e8ff]",
    dot: "bg-[#a855f7]",
    text: "text-[#6b21a8]",
  },
} as const satisfies Record<string, StatusConfig>
