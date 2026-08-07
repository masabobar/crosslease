import { useTranslation } from "react-i18next"
import { ArrowRight, Info } from "lucide-react"
import { usePartnerMergeHistory } from "@/features/partners/hooks/usePartnerMergeHistory"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { usePartnerDetail } from "@/features/partners/hooks/usePartnerDetail"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { formatDateTime } from "@/lib/formatters"
import { MERGE_REASON_CODES } from "@/features/partners/constants"
import type { MergeLineageRecordResponse } from "@/features/partners/api/schema"

function MergeReasonLabel({ code }: { code: string }) {
  const { t } = useTranslation("partners")
  const isKnown = (MERGE_REASON_CODES as readonly string[]).includes(code)
  return (
    <span className="text-sm font-medium text-foreground">
      {isKnown
        ? t(`mergeReasonCode.${code}` as "mergeReasonCode.data_entry_error")
        : code}
    </span>
  )
}

function ReferenceManifestNote({
  manifest,
}: {
  manifest: Record<string, unknown>
}) {
  const { t } = useTranslation("partners")
  // The note carries the re-pointing detail when the BE has produced it. The condition used
  // to be inverted, so a record that *had* a note was labelled "not yet available" and one
  // without it showed nothing at all.
  const note = typeof manifest.note === "string" ? manifest.note : null
  return (
    <div className="flex items-center gap-2 px-3 py-3 bg-muted text-xs text-muted-foreground">
      <Info size={14} className="shrink-0" />
      {note ?? t("detail.mergeHistory.referenceManifestUnavailable")}
    </div>
  )
}

function MergeHistoryRecord({
  record,
}: {
  record: MergeLineageRecordResponse
}) {
  const { t } = useTranslation("partners")
  const { data: source } = usePartnerDetail(record.source_partner_id)
  const { data: target } = usePartnerDetail(record.target_partner_id)
  const { data: approver } = useUserDetail(record.executed_by)

  return (
    <div className="rounded-[10px] border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {t("detail.mergeHistory.fields.mergeId")}
          </p>
          <p className="text-sm font-medium text-foreground">
            {record.record_id}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(record.executed_at)}
          </p>
        </div>
      </div>

      <div className="border-t border-border flex items-start gap-10 px-3 py-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            {t("detail.mergeHistory.fields.mergedSource")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {source?.display_name ?? "—"}
          </p>
          {source && <PartnerStatusBadge status={source.status} />}
        </div>
        <div className="flex flex-col items-center justify-center pt-7">
          <ArrowRight size={16} className="text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            {t("detail.mergeHistory.fields.survivingPartner")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {target?.display_name ?? "—"}
          </p>
          {target && <PartnerStatusBadge status={target.status} />}
        </div>
      </div>

      <div className="border-t border-border flex divide-x divide-border">
        <div className="flex-1 px-3 py-4">
          <p className="text-xs text-muted-foreground">
            {t("detail.mergeHistory.fields.reasonCode")}
          </p>
          <MergeReasonLabel code={record.merge_reason_code} />
        </div>
        <div className="flex-1 px-3 py-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {t("detail.mergeHistory.fields.counterConfirmedBy")}
          </p>
          <p className="text-sm font-medium text-foreground">
            {approver ? `${approver.first_name} ${approver.last_name}` : "—"}
          </p>
          {approver && <RoleBadge role={approver.role} />}
        </div>
      </div>

      <ReferenceManifestNote manifest={record.reference_manifest} />
    </div>
  )
}

type MergeHistoryTabProps = {
  partnerId: string
}

function MergeHistoryTab({ partnerId }: MergeHistoryTabProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError } = usePartnerMergeHistory(partnerId)

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            key={i}
            className="h-40 rounded-xl bg-muted animate-pulse mb-2"
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

  const items = data?.items ?? []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <p className="text-base font-semibold text-foreground">
          {t("detail.mergeHistory.title")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("detail.mergeHistory.subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.mergeHistory.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {items.map(record => (
            <MergeHistoryRecord key={record.record_id} record={record} />
          ))}
        </div>
      )}
    </div>
  )
}

export { MergeHistoryTab }
