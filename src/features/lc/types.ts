import type { LucideIcon } from "lucide-react"

// One tile in the LC workspace landing grid. `comingSoon` marks a section whose
// screen is not built yet — its route currently resolves back to the workspace.
export type WorkspaceSection = {
  key: string
  label: string
  path: string
  icon: LucideIcon
  comingSoon?: boolean
}
