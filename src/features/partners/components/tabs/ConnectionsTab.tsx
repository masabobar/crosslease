import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableEmptyState } from "@/components/ui/empty"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { Link } from "react-router-dom"
import { caseDetail, partnerDetail } from "@/router/paths"
import { usePartnerConnections } from "@/features/partners/hooks/useAssessments"

/**
 * Partner detail → **Connections**.
 *
 * Every place this party appears across the book: which case, what it is attached to, and in what
 * role. Read-only — a connection is a consequence of the business record, not something authored
 * here, so there is nothing to add or remove on this screen.
 *
 * The case is a link because it is the only way to act on what a row describes, and the leasing
 * company is a link because a reader looking at a guarantor usually wants to know whose book it
 * is guaranteeing on.
 */
export function ConnectionsTab({ partnerId }: { partnerId: string }) {
  const { t } = useTranslation("partners")
  const connections = usePartnerConnections(partnerId)
  const items = connections.data?.items ?? []

  return (
    <section
      className="flex flex-col gap-4"
      data-testid="partner-connections-tab"
    >
      <div>
        <h3 className="text-sm font-semibold">{t("connections.heading")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("connections.subtitle")}
        </p>
      </div>

      {connections.isLoading && <Skeleton className="h-40 w-full" />}

      {connections.isError && (
        <p
          className="text-sm text-destructive"
          data-testid="partner-connections-error"
        >
          {resolveApiErrorMessage(connections.error, t)}
        </p>
      )}

      {!connections.isLoading && !connections.isError && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("connections.columns.object")}</TableHead>
                <TableHead>{t("connections.columns.role")}</TableHead>
                <TableHead>{t("connections.columns.leasingCompany")}</TableHead>
                <TableHead>{t("connections.columns.case")}</TableHead>
                <TableHead>{t("connections.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(row => (
                <TableRow
                  key={`${row.object_type}-${row.object_id}`}
                  data-testid={`partner-connection-${row.object_id}`}
                >
                  <TableCell>
                    <span className="block font-medium">{row.label}</span>
                    {/* Free text on the wire, so the label falls back to the raw value rather
                        than to a blank cell when a new object type appears. */}
                    <span className="block text-sm text-muted-foreground">
                      {t(
                        `connections.objectTypes.${row.object_type}` as "connections.objectTypes.contract",
                        { defaultValue: row.object_type }
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {t(
                      `connections.roles.${row.role}` as "connections.roles.lessee",
                      { defaultValue: row.role }
                    )}
                  </TableCell>
                  <TableCell>
                    {row.leasing_company_partner_id !== null &&
                    row.leasing_company_name !== null ? (
                      <Link
                        className="text-primary hover:underline"
                        to={partnerDetail(row.leasing_company_partner_id)}
                      >
                        {row.leasing_company_name}
                      </Link>
                    ) : (
                      (row.leasing_company_name ?? "—")
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      className="text-primary hover:underline"
                      to={caseDetail(row.case_id)}
                      data-testid={`partner-connection-case-${row.object_id}`}
                    >
                      {t("connections.openCase")}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {items.length === 0 && (
            <TableEmptyState
              title={t("connections.empty.title")}
              description={t("connections.empty.description")}
            />
          )}
        </div>
      )}
    </section>
  )
}
