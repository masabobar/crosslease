import type { ReactNode } from "react"

export type InfoRow = { label: string; value: ReactNode }

// Two-column label/value readout used by the tenant detail cards. Labels and
// values render as two independent columns so the value column can shrink, which
// is why rows are passed as data rather than as JSX — the two columns must stay
// index-aligned, and building them from one array is what guarantees it.
export function InfoRows({ rows }: { rows: InfoRow[] }) {
  return (
    <div className="flex gap-16 text-sm">
      <div className="flex flex-col gap-3 text-muted-foreground shrink-0">
        {rows.map(row => (
          <div key={row.label} className="leading-5">
            {row.label}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 text-foreground min-w-0">
        {rows.map(row => (
          <div key={row.label} className="leading-5">
            {row.value ?? "—"}
          </div>
        ))}
      </div>
    </div>
  )
}
