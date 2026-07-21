import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/formatters"
import { PLACEHOLDER_AUDIT_TRAIL } from "@/features/workflowTaskCatalog/constants"

function AuditTrailTab() {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <div
      className="border border-border rounded-xl overflow-hidden"
      data-testid="audit-trail-tab"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("detail.auditTrail.columns.timestamp")}</TableHead>
            <TableHead>{t("detail.auditTrail.columns.actor")}</TableHead>
            <TableHead>{t("detail.auditTrail.columns.action")}</TableHead>
            <TableHead>{t("detail.auditTrail.columns.fieldDelta")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PLACEHOLDER_AUDIT_TRAIL.map(entry => (
            <TableRow
              key={entry.id}
              data-testid={`audit-trail-row-${entry.id}`}
            >
              <TableCell className="text-muted-foreground">
                {formatDateTime(entry.timestamp)}
              </TableCell>
              <TableCell>
                <p className="font-medium text-foreground">{entry.actorName}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`detail.auditTrail.actorTypes.${entry.actorType}`)}
                </p>
              </TableCell>
              <TableCell>{entry.action}</TableCell>
              <TableCell className="max-w-lg">{entry.fieldDelta}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { AuditTrailTab }
