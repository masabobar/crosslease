import { cn } from "@/lib/utils"

type UserInitialsAvatarProps = {
  initials: string
  size?: "sm" | "md"
}

// Initials circle for grantee/grantor rows. `sm` is the in-list/trigger size,
// `md` the grant-row size.
export function UserInitialsAvatar({
  initials,
  size = "sm",
}: UserInitialsAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-muted border border-border flex items-center justify-center shrink-0",
        size === "sm" ? "size-8" : "size-10"
      )}
    >
      <span
        className={cn(
          "text-muted-foreground",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {initials}
      </span>
    </div>
  )
}
