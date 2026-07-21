type Props = {
  label: string
  value: React.ReactNode
}

// Small label/value stat tile shared by the Dry Run Report table, the Review sub-screen,
// and the Approval decision modal — all three render the same Added/Modified/Deactivated
// style summary numbers.
function MigrationSummaryStat({ label, value }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

export { MigrationSummaryStat }
