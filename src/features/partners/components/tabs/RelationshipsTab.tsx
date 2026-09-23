import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
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
import { partnerDetail } from "@/router/paths"
import { usePartnerRelationships } from "@/features/partners/hooks/useAssessments"

/**
 * Partner detail → **Relationships**.
 *
 * The edges of the borrower unit: who owns this party, who it owns, who directs it.
 *
 * The prototype writes each edge out as a sentence — "Müller Immobilien GbR is the parent of this
 * party" — and that is the column that makes the table readable: a type and a direction on their
 * own leave the reader working out which end they are standing at. `direction` is what turns the
 * same pair into "is the parent of" or "is a subsidiary of".
 */
export function RelationshipsTab({ partnerId }: { partnerId: string }) {
  const { t } = useTranslation("partners")
  const relationships = usePartnerRelationships(partnerId)
  const items = relationships.data?.items ?? []

  return (
    <section
      className="flex flex-col gap-4"
      data-testid="partner-relationships-tab"
    >
      <div>
        <h3 className="text-sm font-semibold">{t("relationships.heading")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("relationships.subtitle")}
        </p>
      </div>

      {relationships.isLoading && <Skeleton className="h-40 w-full" />}

      {relationships.isError && (
        <p
          className="text-sm text-destructive"
          data-testid="partner-relationships-error"
        >
          {resolveApiErrorMessage(relationships.error, t)}
        </p>
      )}

      {!relationships.isLoading && !relationships.isError && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("relationships.columns.party")}</TableHead>
                <TableHead>{t("relationships.columns.type")}</TableHead>
                <TableHead>{t("relationships.columns.edge")}</TableHead>
                <TableHead>{t("relationships.columns.share")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(row => (
                <TableRow
                  key={row.id}
                  data-testid={`partner-relationship-${row.id}`}
                >
                  <TableCell className="font-medium">
                    {row.other_display_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {t(
                        `relationships.types.${row.relationship_type}` as "relationships.types.parent",
                        { defaultValue: row.relationship_type }
                      )}
                    </Badge>
                  </TableCell>
                  {/* The edge in words, from this party's end. */}
                  <TableCell className="text-muted-foreground">
                    {t(
                      `relationships.edges.${row.direction}` as "relationships.edges.parent_of",
                      {
                        defaultValue: row.direction,
                        other: row.other_display_name,
                      }
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.share_percentage === null
                      ? "—"
                      : `${row.share_percentage} %`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className="text-primary hover:underline"
                      to={partnerDetail(row.other_partner_id)}
                      data-testid={`partner-relationship-open-${row.id}`}
                    >
                      {t("relationships.open")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {items.length === 0 && (
            <TableEmptyState
              title={t("relationships.empty.title")}
              description={t("relationships.empty.description")}
            />
          )}
        </div>
      )}
    </section>
  )
}
