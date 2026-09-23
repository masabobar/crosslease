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
import { cn } from "@/lib/utils"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { usePartnerAddresses } from "@/features/partners/hooks/useAssessments"
import type { PartnerAddress } from "@/features/partners/api/assessmentSchema"

// Anything else the backend sends is treated as live — a status the UI does not recognise must
// not silently grey out a row the reader needs.
const RETIRED_STATUS = "retired"

/**
 * The party's addresses, beside its identity on the Party tab.
 *
 * A party has several and they are labelled — a registered office, an invoice address, a
 * workshop — with one marked default. Retired ones stay in the table rather than disappearing:
 * an address a contract was written to has to remain readable, which is why the endpoint retires
 * rather than deletes.
 */
export function PartnerAddressesPanel({ partnerId }: { partnerId: string }) {
  const { t } = useTranslation("partners")
  const addresses = usePartnerAddresses(partnerId)
  const items = addresses.data?.items ?? []

  return (
    <section
      className="overflow-hidden rounded-lg border"
      data-testid="partner-addresses-panel"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("addresses.heading", { count: items.length })}
        </h3>
      </div>

      {addresses.isLoading && <Skeleton className="m-4 h-24" />}

      {addresses.isError && (
        <p
          className="px-4 py-3 text-sm text-destructive"
          data-testid="partner-addresses-error"
        >
          {resolveApiErrorMessage(addresses.error, t)}
        </p>
      )}

      {!addresses.isLoading && !addresses.isError && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("addresses.columns.label")}</TableHead>
                <TableHead>{t("addresses.columns.address")}</TableHead>
                <TableHead>{t("addresses.columns.country")}</TableHead>
                <TableHead>{t("addresses.columns.default")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(address => (
                <TableRow
                  key={address.id}
                  className={cn(
                    address.status === RETIRED_STATUS && "opacity-60"
                  )}
                  data-testid={`partner-address-${address.id}`}
                >
                  <TableCell className="font-medium">{address.label}</TableCell>
                  <TableCell>{formatAddress(address)}</TableCell>
                  <TableCell>{address.country ?? "—"}</TableCell>
                  <TableCell>
                    {address.is_default && (
                      <Badge variant="secondary" className="font-normal">
                        {t("addresses.default")}
                      </Badge>
                    )}
                    {address.status === RETIRED_STATUS && (
                      <Badge variant="outline" className="font-normal">
                        {t("addresses.retired")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {items.length === 0 && (
            <TableEmptyState
              title={t("addresses.empty.title")}
              description={t("addresses.empty.description")}
            />
          )}
        </>
      )}
    </section>
  )
}

/**
 * Street and town on one line, in the order an address is written.
 *
 * Every part is nullable, so this joins what is there rather than laying out a fixed template —
 * a partial address reads as a short line, never as a line of separators.
 */
function formatAddress(address: PartnerAddress): string {
  const street = [address.street, address.house_number]
    .filter(Boolean)
    .join(" ")
  const town = [address.postal_code, address.city].filter(Boolean).join(" ")
  const parts = [street, address.address_line_2, town].filter(
    part => part !== null && part !== ""
  )
  return parts.length > 0 ? parts.join(" · ") : "—"
}
