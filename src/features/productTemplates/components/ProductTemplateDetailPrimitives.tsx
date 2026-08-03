import type { ReactNode } from "react"

// Label/value readout shared by the detail drawer and the full detail page, so the two surfaces
// cannot drift apart. Lifted out of ProductTemplateDetailDrawer, where it was a local `DrawerRow`,
// when CR-BPT-06 split the drawer into a slim panel plus a page.
//
// Feature-local on purpose, mirroring users/components/UserDetailPrimitives.tsx. This repo already
// carries four label/value implementations — components/shared/SectionCard.tsx,
// UserDetailPrimitives.tsx (which exports its own colliding `SectionCard`),
// tenants/components/InfoRows.tsx, and the drawer's former local pair. Adding a fifth global variant
// would be worse than reusing this within the one feature; consolidating those four is a repo-wide
// refactor and deliberately out of scope for PRD1042-1804.

export function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  )
}

// Groups rows inside the drawer, where the flat bordered list reads better in a 500px column than
// the boxed card the page uses. The page reuses components/shared/SectionCard.tsx instead.
export function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2 border-t border-border py-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}
