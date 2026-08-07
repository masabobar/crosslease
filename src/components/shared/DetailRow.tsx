import type { ReactNode } from "react"

// Single implementation of the label/value readout used by every detail surface.
// Four features had grown their own copy of this markup (two of them byte-identical),
// which is what this consolidates. Each feature keeps its own thin wrapper so its
// call sites and prop names are untouched — see e.g. features/users/components/
// UserDetailPrimitives.tsx.
//
// The variants are not stylistic preference: they are the three genuinely different
// layout contracts the detail surfaces use. Class strings are reproduced exactly from
// the originals so rendering is unchanged.
type DetailRowVariant =
  // Fixed 180px label column, top-aligned. Used where labels must line up across
  // rows in a card (partners, users).
  | "fixedLabel"
  // Label left, value right-aligned and top-aligned. Used where values are long
  // enough to wrap (product templates).
  | "spaceBetween"
  // Label left, value right and emphasized, vertically centred. Used for short
  // scalar readouts (workflow task catalog).
  | "emphasized"

const VARIANT_CLASSES: Record<
  DetailRowVariant,
  { row: string; label: string; value: string }
> = {
  fixedLabel: {
    row: "flex items-start gap-2 py-0 text-sm leading-5",
    label: "text-muted-foreground w-[180px] shrink-0",
    value: "text-foreground min-w-0",
  },
  spaceBetween: {
    row: "flex items-start justify-between gap-4",
    label: "text-sm text-muted-foreground",
    value: "text-sm text-foreground text-right",
  },
  emphasized: {
    row: "flex items-center justify-between",
    label: "text-sm text-muted-foreground",
    value: "text-sm font-medium text-foreground",
  },
}

type Props = {
  label: string
  variant: DetailRowVariant
  children: ReactNode
}

function DetailRow({ label, variant, children }: Props) {
  const classes = VARIANT_CLASSES[variant]
  return (
    <div className={classes.row}>
      <span className={classes.label}>{label}</span>
      <span className={classes.value}>{children}</span>
    </div>
  )
}

export { DetailRow }
export type { DetailRowVariant }
