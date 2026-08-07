import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { TableEmptyState } from "@/components/ui/empty"
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

const SKELETON_ROWS = 6
const COLUMN_COUNT = 4

export default function NotificationConfigPage() {
  const { t } = useTranslation("notifications")
  const { data, isLoading, isError, error } = useNotificationConfig()
  const eventTypes = data?.event_types ?? []

  return (
    <div className="p-8" data-testid="notification-config-page">
      <h1 className="text-2xl font-semibold text-foreground">
        {t("page.title")}
      </h1>

      <Alert className="mt-4">
        <AlertTitle>{t("page.bannerTitle")}</AlertTitle>
        <AlertDescription>{t("page.bannerDescription")}</AlertDescription>
      </Alert>

      {isError && !isLoading && (
        <p
          className="mt-6 py-12 text-center text-sm text-destructive"
          data-testid="notification-config-load-error"
        >
          {error instanceof ApiError
            ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")}
        </p>
      )}

      {!isError && (
        <>
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
              {isLoading &&
                Array.from({ length: SKELETON_ROWS }, (_, row) => (
                  <TableRow key={row} data-testid="notification-config-loading">
                    {Array.from({ length: COLUMN_COUNT }, (_, col) => (
                      <TableCell key={col}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {!isLoading &&
                eventTypes.map(eventType => {
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
                          <FileText data-icon="inline-start" />
                          {t("page.assignTemplate")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>

          {/* Outside <Table> rather than in a colSpan cell — TableEmptyState renders a
              <div>, which is not valid inside <tbody>. Same placement as AuditTrailTab. */}
          {!isLoading && eventTypes.length === 0 && (
            <TableEmptyState
              title={t("page.emptyState.title")}
              description={t("page.emptyState.description")}
            />
          )}
        </>
      )}
    </div>
  )
}
