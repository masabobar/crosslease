import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { showApiError } from "@/lib/apiErrorMessage"

export function TenantSuspendedPage() {
  const { t } = useTranslation("common")
  const { mutate: logout, isPending } = useLogout()

  function handleLogout() {
    logout(undefined, {
      onError: err => {
        showApiError(err, t)
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
