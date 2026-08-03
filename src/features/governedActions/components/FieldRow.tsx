export function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-foreground shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
