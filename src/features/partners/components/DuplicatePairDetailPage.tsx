import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Check, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DuplicateConfidenceBadge } from "@/features/partners/components/DuplicateConfidenceBadge"
import { DuplicatePairStatusBadge } from "@/features/partners/components/DuplicatePairStatusBadge"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { PartnerTypeBadge } from "@/features/partners/components/PartnerTypeBadge"
import { PartnerIdentityFields } from "@/features/partners/components/PartnerIdentityFields"
import { SectionCard } from "@/features/partners/components/PartnerDetailPrimitives"
import { ResolveDuplicateDialog } from "@/features/partners/components/ResolveDuplicateDialog"
import { InitiateMergeDialog } from "@/features/partners/components/InitiateMergeDialog"
import { useDuplicatePairs } from "@/features/partners/hooks/useDuplicatePairs"
import { usePartnersByIds } from "@/features/partners/hooks/usePartnersByIds"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"
import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import {
  PARTNER_DUPLICATE_RESOLVE_ALLOWED_ROLES,
  PARTNER_MERGE_INITIATE_ALLOWED_ROLES,
} from "@/features/partners/types"
import { DUPLICATE_RESOLUTION_REASON_CODES } from "@/features/partners/constants"
import { PATHS, partnerDetail } from "@/router/paths"
import { formatDate } from "@/lib/formatters"
import { isUuidRouteParam } from "@/lib/routeParams"
import { DuplicateCandidatePairStatusSchema } from "@/features/partners/api/schema"
import type { PartnerDetailResponse } from "@/features/partners/api/schema"

type ConfirmedDuplicateSectionProps = {
  partnerA?: PartnerDetailResponse
  partnerB?: PartnerDetailResponse
  canInitiateMerge: boolean
  survivorId: string | null
  onSurvivorChange: (id: string) => void
  onInitiateMerge: () => void
}

function ConfirmedDuplicateSection({
  partnerA,
  partnerB,
  canInitiateMerge,
  survivorId,
  onSurvivorChange,
  onInitiateMerge,
}: ConfirmedDuplicateSectionProps) {
  const { t } = useTranslation("partners")
  const candidates = [partnerA, partnerB].filter(
    (p): p is PartnerDetailResponse => !!p
  )
  const survivor = candidates.find(p => p.partner_id === survivorId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("duplicates.detail.confirmedDuplicate.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("duplicates.detail.confirmedDuplicate.subtitle")}
          </p>
        </div>
        {canInitiateMerge && (
          <Button
            data-testid="duplicate-detail-initiate-merge"
            disabled={!survivorId}
            onClick={onInitiateMerge}
          >
            {t("duplicates.detail.initiateMergeButton")}
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        <RadioGroup
          value={survivorId ?? ""}
          onValueChange={onSurvivorChange}
          className="flex-1 gap-2"
        >
          {candidates.map(partner => (
            <label
              key={partner.partner_id}
              className="flex items-start gap-3 rounded-xl border border-border px-3 py-3 cursor-pointer has-data-checked:border-primary has-data-checked:bg-primary/5"
              data-testid={`duplicate-detail-survivor-${partner.partner_id}`}
            >
              <RadioGroupItem value={partner.partner_id} className="mt-1" />
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  {partner.display_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {partner.identity.country}
                </p>
                <div className="flex items-center gap-2">
                  <PartnerTypeBadge type={partner.partner_type} />
                  <PartnerStatusBadge status={partner.status} />
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>

        <div className="flex-1 min-w-0">
          {survivor ? (
            <SectionCard
              title={t("duplicates.detail.confirmedDuplicate.identity")}
            >
              <PartnerIdentityFields
                identity={survivor.identity}
                showAddress={false}
              />
            </SectionCard>
          ) : (
            <div className="h-full flex items-center justify-center rounded-[10px] border border-dashed border-border px-4 py-8">
              <p className="text-sm text-muted-foreground text-center">
                {t("duplicates.detail.confirmedDuplicate.selectSurvivorPrompt")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DuplicatePairDetailPage() {
  const { t } = useTranslation("partners")
  const navigate = useNavigate()
  const { pairId: pairIdParam } = useParams<{ pairId: string }>()
  const pairId = isUuidRouteParam(pairIdParam) ? pairIdParam : undefined
  const { data: currentUser } = useCurrentUser()
  const selectedTenantId = useTenantSelectionStore(s => s.selectedTenantId)
  const tenantId =
    currentUser?.tenant_id ??
    (currentUser?.role === SYSTEM_ADMIN_ROLE ? selectedTenantId : null)

  const canResolve =
    !!currentUser &&
    PARTNER_DUPLICATE_RESOLVE_ALLOWED_ROLES.includes(currentUser.role)
  const canInitiateMerge =
    !!currentUser &&
    PARTNER_MERGE_INITIATE_ALLOWED_ROLES.includes(currentUser.role)

  const [resolveOpen, setResolveOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [survivorId, setSurvivorId] = useState<string | null>(null)

  const { data, isLoading, isError } = useDuplicatePairs(tenantId)
  const pair = data?.items.find(p => p.pair_id === pairId)
  const { partnersById, isError: isPartnersError } = usePartnersByIds(
    pair ? [pair.partner_a_id, pair.partner_b_id] : []
  )
  const partnerA = pair ? partnersById.get(pair.partner_a_id) : undefined
  const partnerB = pair ? partnersById.get(pair.partner_b_id) : undefined
  const survivorPartner = survivorId ? partnersById.get(survivorId) : undefined
  const mergedSourcePartner = [partnerA, partnerB].find(
    p => p && p.partner_id !== survivorId
  )

  const isKnownReasonCode = (
    code: string | null
  ): code is (typeof DUPLICATE_RESOLUTION_REASON_CODES)[number] =>
    !!code &&
    (DUPLICATE_RESOLUTION_REASON_CODES as readonly string[]).includes(code)

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-28 bg-muted rounded-[10px] animate-pulse" />
        <div className="h-64 bg-muted rounded-[10px] animate-pulse" />
      </div>
    )
  }

  if (isError || !pair) {
    return (
      <p className="text-sm text-destructive p-8">
        {t("duplicates.detail.notFound")}
      </p>
    )
  }

  return (
    <div
      className="p-8 flex flex-col gap-6"
      data-testid="duplicate-pair-detail-page"
    >
      {pair.status ===
      DuplicateCandidatePairStatusSchema.enum.confirmed_duplicate ? (
        <ConfirmedDuplicateSection
          partnerA={partnerA}
          partnerB={partnerB}
          canInitiateMerge={canInitiateMerge}
          survivorId={survivorId}
          onSurvivorChange={setSurvivorId}
          onInitiateMerge={() => setMergeOpen(true)}
        />
      ) : (
        <>
          {/* Hero card */}
          <div className="flex flex-col border border-border rounded-[10px]">
            <div className="bg-card flex items-center gap-6 px-3 py-4 rounded-t-[10px]">
              {[partnerA, partnerB].map((partner, i) => (
                <div key={partner?.partner_id ?? i} className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {i === 0
                      ? t("duplicates.detail.partnerA")
                      : t("duplicates.detail.partnerB")}
                  </p>
                  <p className="text-xl font-semibold text-foreground truncate mt-1">
                    {partner?.display_name ??
                      (isPartnersError ? t("errors.generic") : "…")}
                  </p>
                  {partner && (
                    <div className="flex items-center gap-3 mt-2">
                      <PartnerStatusBadge status={partner.status} />
                      <Link
                        to={partnerDetail(partner.partner_id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                      >
                        <ExternalLink size={14} />
                        {t("duplicates.detail.viewPartner")}
                      </Link>
                    </div>
                  )}
                </div>
              ))}

              <div className="shrink-0">
                {canResolve &&
                  (pair.status ===
                    DuplicateCandidatePairStatusSchema.enum.pending ||
                    pair.status ===
                      DuplicateCandidatePairStatusSchema.enum.deferred) && (
                    <Button
                      data-testid="duplicate-detail-resolve"
                      onClick={() => setResolveOpen(true)}
                    >
                      {t("duplicates.detail.resolveButton")}
                    </Button>
                  )}
                {canResolve &&
                  pair.status ===
                    DuplicateCandidatePairStatusSchema.enum
                      .merge_in_progress && (
                    <Button
                      data-testid="duplicate-detail-review-merge"
                      onClick={() => navigate(PATHS.PENDING_APPROVALS)}
                    >
                      {t("duplicates.detail.reviewMergeButton")}
                    </Button>
                  )}
              </div>
            </div>

            <div className="bg-muted border-t border-border flex items-center gap-6 px-3 py-3 rounded-b-[10px] flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("duplicates.detail.fields.confidence")}
                </span>
                <DuplicateConfidenceBadge confidence={pair.confidence} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("duplicates.detail.fields.detectedOn")}
                </span>
                <span className="text-sm text-foreground">
                  {formatDate(pair.detected_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("duplicates.detail.fields.id")}
                </span>
                <span className="text-sm text-foreground">{pair.pair_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("duplicates.detail.fields.status")}
                </span>
                <DuplicatePairStatusBadge status={pair.status} />
              </div>
            </div>
          </div>

          {/* Resolution summary, if already resolved */}
          {pair.reason_code && (
            <div className="border border-border rounded-[10px] bg-card px-4 py-4 flex flex-col gap-1.5">
              <p className="text-sm font-semibold text-foreground">
                {t("duplicates.detail.resolutionSummary.title")}
              </p>
              <p className="text-sm text-foreground">
                {isKnownReasonCode(pair.reason_code)
                  ? t(
                      `duplicates.resolutionReasonCode.${pair.reason_code}` as "duplicates.resolutionReasonCode.data_entry_error"
                    )
                  : pair.reason_code}
              </p>
              {pair.resolution_note && (
                <p className="text-sm text-muted-foreground">
                  {pair.resolution_note}
                </p>
              )}
            </div>
          )}

          {/* Matching evidence */}
          <div className="border border-border rounded-[10px] bg-card px-4 py-4">
            <p className="text-sm font-semibold text-foreground">
              {t("duplicates.detail.matchingEvidence.title")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("duplicates.detail.matchingEvidence.subtitle")}
            </p>

            <div className="mt-4 flex flex-col">
              <div className="flex border-b border-border h-9 items-center">
                <div className="flex-1 text-xs font-medium text-muted-foreground px-2">
                  {t("duplicates.detail.matchingEvidence.columns.anchor")}
                </div>
                <div className="flex-1 text-xs font-medium text-muted-foreground px-2">
                  {t("duplicates.detail.matchingEvidence.columns.partnerA")}
                </div>
                <div className="flex-1 text-xs font-medium text-muted-foreground px-2">
                  {t("duplicates.detail.matchingEvidence.columns.partnerB")}
                </div>
                <div className="w-16 shrink-0 text-xs font-medium text-muted-foreground px-2">
                  {t("duplicates.detail.matchingEvidence.columns.match")}
                </div>
              </div>
              {pair.matching_evidence.map(item => (
                <div
                  key={item.anchor}
                  className="flex border-b border-border last:border-b-0 h-10 items-center"
                >
                  <div className="flex-1 px-2 text-sm text-foreground truncate">
                    {item.anchor}
                  </div>
                  <div className="flex-1 px-2 text-sm text-foreground truncate">
                    {String(item.a_value ?? "—")}
                  </div>
                  <div className="flex-1 px-2 text-sm text-foreground truncate">
                    {String(item.b_value ?? "—")}
                  </div>
                  <div className="w-16 shrink-0 px-2">
                    {item.match ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      {resolveOpen && (
        <ResolveDuplicateDialog
          open={resolveOpen}
          onOpenChange={setResolveOpen}
          pair={pair}
          tenantId={tenantId}
        />
      )}
      {mergeOpen && survivorPartner && mergedSourcePartner && (
        <InitiateMergeDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          pair={pair}
          survivorPartner={survivorPartner}
          mergedSourcePartner={mergedSourcePartner}
          tenantId={tenantId}
        />
      )}
    </div>
  )
}
