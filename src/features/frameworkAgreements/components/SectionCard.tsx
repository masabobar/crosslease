type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

function SectionCard({ title, subtitle, children }: Props) {
  return (
    <div
      className="border border-border rounded-xl bg-background overflow-hidden"
      data-testid={`fa-section-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="bg-muted px-4 py-2 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="p-4 flex flex-col gap-6">{children}</div>
    </div>
  )
}

export { SectionCard }
