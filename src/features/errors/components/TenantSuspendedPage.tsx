import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { useLogout } from "@/features/auth/hooks/useLogout"

export function TenantSuspendedPage() {
  const { t } = useTranslation("common")
  const { mutate: logout, isPending } = useLogout()

  function handleLogout() {
    logout(undefined, {
      onError: err => {
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
      },
    })
  }

  return (
    <div
      data-testid="tenant-suspended-page"
      className="flex min-h-screen flex-col items-center justify-center gap-3"
    >
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("tenantSuspended.title")}
      </h1>
      <p className="max-w-sm text-center text-gray-500">
        {t("tenantSuspended.message")}
      </p>
      <Button
        variant="outline"
        className="mt-2"
        onClick={handleLogout}
        disabled={isPending}
        data-testid="tenant-suspended-logout-button"
      >
        {t("nav.logout")}
      </Button>
    </div>
  )
}
