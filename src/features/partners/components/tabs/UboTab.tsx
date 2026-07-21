import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Plus, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchPartnerUbo,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { UBO_STATUS_DOT_COLOR } from "@/features/partners/constants"
import { CaptureUboDialog } from "@/features/partners/components/CaptureUboDialog"
import { initialsFromName } from "@/features/partners/utils"
import { formatDateTime } from "@/lib/formatters"

const COL_PARTNER = "flex-1 min-w-[220px]"
const COL_OWNERSHIP = "w-[140px] shrink-0"
const COL_TYPE = "w-[140px] shrink-0"
const COL_CAPTURED_BY = "flex-1 min-w-[220px]"
const COL_CAPTURED_ON = "w-[160px] shrink-0"

type UboTabProps = {
  partnerId: string
  canCaptureUbo: boolean
}

function UboTab({ partnerId, canCaptureUbo }: UboTabProps) {
  const { t } = useTranslation("partners")
  const [captureOpen, setCaptureOpen] = useState(false)
  const { data, isLoading, isError } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.ubo(partnerId),
    queryFn: () => fetchPartnerUbo(partnerId),
  })

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-muted animate-pulse mb-2"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        {t("errors.generic")}
      </p>
    )
  }

  const records = data?.records ?? []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">
            {t("detail.ubo.title")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("detail.ubo.subtitle")}
          </p>
        </div>
        {data && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
            <span
              className={`inline-block size-2 rounded-full ${UBO_STATUS_DOT_COLOR[data.ubo_completeness_status]}`}
            />
            {t(
              `uboStatus.${data.ubo_completeness_status}` as "uboStatus.missing"
            )}
          </span>
        )}
        {canCaptureUbo && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCaptureOpen(true)}
            data-testid="capture-ubo-button"
            className="gap-1.5 shrink-0"
          >
            <Plus size={14} />
            {t("detail.ubo.captureButton")}
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("detail.ubo.empty")}</p>
      ) : (
        <div className="w-full border border-border rounded-[10px] overflow-hidden bg-background">
          <div className="flex border-b border-border h-10 items-center">
            <div
              className={`${COL_PARTNER} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.ubo.fields.uboPartner")}
            </div>
            <div
              className={`${COL_OWNERSHIP} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.ubo.fields.ownershipPercentage")}
            </div>
            <div
              className={`${COL_TYPE} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.ubo.fields.ownershipType")}
            </div>
            <div
              className={`${COL_CAPTURED_BY} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.ubo.fields.capturedBy")}
            </div>
            <div
              className={`${COL_CAPTURED_ON} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.ubo.fields.capturedAt")}
            </div>
          </div>
          {records.map(record => (
            <div
              key={record.id}
              className="flex border-b border-border last:border-0 h-16 items-center"
            >
              <div className={`${COL_PARTNER} px-2`}>
                <p className="text-sm font-medium text-primary truncate">
                  {record.ubo_display_name}
                </p>
              </div>
              <div className={`${COL_OWNERSHIP} px-2 text-sm text-foreground`}>
                {record.ownership_percentage}%
              </div>
              <div
                className={`${COL_TYPE} px-2 text-sm text-muted-foreground capitalize`}
              >
                {record.ownership_type}
              </div>
              <div
                className={`${COL_CAPTURED_BY} px-2 flex items-center gap-2`}
              >
                <div className="size-8 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    {initialsFromName(record.captured_by.display_name)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {record.captured_by.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {record.captured_by.email}
                  </p>
                </div>
              </div>
              <div
                className={`${COL_CAPTURED_ON} px-2 text-sm text-muted-foreground`}
              >
                {formatDateTime(record.captured_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <CircleAlert
          size={16}
          className="text-muted-foreground shrink-0 mt-0.5"
        />
        <p className="text-sm text-muted-foreground">
          {t("detail.ubo.helperText")}
        </p>
      </div>

      {canCaptureUbo && (
        <CaptureUboDialog
          open={captureOpen}
          onOpenChange={setCaptureOpen}
          partnerId={partnerId}
        />
      )}
    </div>
  )
}

export { UboTab }
