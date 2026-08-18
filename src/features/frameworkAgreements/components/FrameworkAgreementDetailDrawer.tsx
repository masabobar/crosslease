import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { DetailRow } from "@/components/shared/DetailRow"
import type { FAListItem } from "@/features/frameworkAgreements/api/schema"
import { FA_STATUS_BADGE_VARIANT } from "@/features/frameworkAgreements/constants"
import { frameworkAgreementDetail } from "@/router/paths"

type Props = {
  agreement: FAListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Row-click preview, mirroring ProductTemplateDetailDrawer's pattern on the product template
// list. For now this renders only the fields already on FAListItem — the same ones the table
// row shows — rather than fetching FADetailResponse; a fuller preview can follow later.
export function FrameworkAgreementDetailDrawer({
  agreement,
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
        data-testid="framework-agreement-detail-drawer"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>
            {agreement?.agreement_name ?? t("list.title")}
          </SheetTitle>
          <SheetDescription>
            {agreement && t(`statuses.${agreement.agreement_lifecycle}`)}
          </SheetDescription>
          {agreement && (
            <Link
              to={frameworkAgreementDetail(agreement.id)}
              data-testid="drawer-view-full-detail"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("detail.viewFullDetail")}
              <ExternalLink size={14} />
            </Link>
          )}
        </SheetHeader>

        {agreement && (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            <DetailRow label={t("fields.agreementName")} variant="spaceBetween">
              {agreement.agreement_name}
            </DetailRow>
            <DetailRow
              label={t("fields.leasingCompany")}
              variant="spaceBetween"
            >
              {agreement.lc_partner_name ?? "—"}
            </DetailRow>
            <DetailRow
              label={t("list.table.columns.status")}
              variant="spaceBetween"
            >
              <Badge
                variant={FA_STATUS_BADGE_VARIANT[agreement.agreement_lifecycle]}
              >
                {t(`statuses.${agreement.agreement_lifecycle}`)}
              </Badge>
            </DetailRow>
            <DetailRow label={t("fields.validFrom")} variant="spaceBetween">
              {agreement.valid_from}
            </DetailRow>
            <DetailRow label={t("fields.validUntil")} variant="spaceBetween">
              {agreement.valid_until ?? t("fields.openEnded")}
            </DetailRow>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
