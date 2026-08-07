import { useRef, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { safeImageUrl } from "@/lib/utils"

type AvatarUploadMenuProps = {
  name: string
  initials: string
  profilePictureUrl: string | null | undefined
  isPending: boolean
  onFileSelected: (e: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

function AvatarUploadMenu({
  name,
  initials,
  profilePictureUrl,
  isPending,
  onFileSelected,
  onRemove,
}: AvatarUploadMenuProps) {
  const { t } = useTranslation("users")
  const fileInputRef = useRef<HTMLInputElement>(null)
  // The stored URL is user-influenced; anything but http(s) or an own-origin path is dropped
  // rather than handed to `src` (.claude/rules/security-and-auth.md §4).
  const pictureUrl = safeImageUrl(profilePictureUrl)

  return (
    <>
      {/* NOTE: raw <input type="file"> — hidden file input triggered programmatically; no shadcn equivalent */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileSelected}
        data-testid="avatar-file-input"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          data-testid="avatar-dropdown-trigger"
          disabled={isPending}
          className="size-14 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={name}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-xl font-normal text-muted-foreground">
              {initials}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            data-testid="avatar-replace-photo"
            onClick={() => fileInputRef.current?.click()}
          >
            {t("detail.page.selfProfile.avatar.replacePhoto")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid="avatar-remove-photo"
            disabled={!profilePictureUrl}
            onClick={onRemove}
          >
            {t("detail.page.selfProfile.avatar.removePhoto")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export { AvatarUploadMenu }
