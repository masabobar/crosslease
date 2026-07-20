import { useTranslation } from "react-i18next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useNotificationConfig } from "@/features/notifications/hooks/useNotificationConfig"
import { getEventTypeDisplay } from "@/features/notifications/constants"
import { ApiError } from "@/lib/api"

export default function NotificationConfigPage() {
  const { t } = useTranslation("notifications")
  const { data, isLoading, isError, error } = useNotificationConfig()

  return (
    <div className="p-8" data-testid="notification-config-page">
      <h1 className="text-2xl font-semibold text-foreground">
        {t("page.title")}
      </h1>

      <Alert className="mt-4">
        <AlertTitle>{t("page.bannerTitle")}</AlertTitle>
        <AlertDescription>{t("page.bannerDescription")}</AlertDescription>
      </Alert>

      {isError && (
        <p
          className="mt-6 py-12 text-center text-sm text-muted-foreground"
          data-testid="notification-config-load-error"
        >
          {error instanceof ApiError
            ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")}
        </p>
      )}

      {!isError && (
        <Table className="mt-6" data-testid="notification-config-table">
          <TableHeader>
            <TableRow>
              <TableHead>{t("page.column.notificationType")}</TableHead>
              <TableHead>{t("page.column.inPlatform")}</TableHead>
              <TableHead>{t("page.column.email")}</TableHead>
              <TableHead>{t("page.column.template")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              data?.event_types.map(eventType => {
                const display = getEventTypeDisplay(eventType)
                return (
                  <TableRow
                    key={eventType}
                    data-testid={`notification-config-row-${eventType}`}
                  >
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {display.titleKey
                          ? t(display.titleKey, {
                              defaultValue: display.fallback,
                            })
                          : display.fallback}
                      </div>
                      {display.groupKey && (
                        <div className="text-sm text-muted-foreground">
                          {t(display.groupKey, { defaultValue: "" })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        disabled
                        aria-label={t("page.column.inPlatform")}
                        data-testid={`notification-config-in-platform-${eventType}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        disabled
                        aria-label={t("page.column.email")}
                        data-testid={`notification-config-email-${eventType}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        data-testid={`notification-config-assign-template-${eventType}`}
                      >
                        {t("page.assignTemplate")}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
