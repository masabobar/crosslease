import type { ReactNode } from "react"
import { DetailRow as SharedDetailRow } from "@/components/shared/DetailRow"

// Label/value readout shared by the detail drawer and the full detail page, so the two surfaces
// cannot drift apart. Lifted out of ProductTemplateDetailDrawer, where it was a local `DrawerRow`,
// when CR-BPT-06 split the drawer into a slim panel plus a page.
//
// The repo-wide consolidation this comment previously deferred has since happened: the markup now
// lives in components/shared/DetailRow.tsx and this stays as a thin wrapper so the feature's
// `value`-prop call sites are untouched.

export function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <SharedDetailRow label={label} variant="spaceBetween">
      {value}
    </SharedDetailRow>
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
