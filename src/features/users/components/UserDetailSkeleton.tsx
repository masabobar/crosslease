/** Loading placeholder for the user detail page and the self-service profile page. */
export function UserDetailSkeleton({ testId }: { testId?: string }) {
  return (
    <div className="space-y-6" data-testid={testId}>
      <div className="h-28 bg-muted rounded-[10px] animate-pulse" />
      <div className="flex gap-6">
        <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
        <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
      </div>
      <div className="h-48 bg-muted rounded-[10px] animate-pulse" />
    </div>
  )
}
