import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PATHS } from "@/router/paths"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { useResolvedTenantId } from "@/hooks/useResolvedTenantId"
import { usePartnerList } from "@/features/partners/hooks/usePartnerList"
import { usePartnerDetail } from "@/features/partners/hooks/usePartnerDetail"
import { CreatePartnerDialog } from "@/features/partners/components/CreatePartnerDialog"
import { PartnerStatusSchema } from "@/features/partners/api/schema"
import type { PartnerDetailResponse } from "@/features/partners/api/schema"
import type { TFunction } from "i18next"
import { isPartnerUsableAsParty } from "@/features/cases/contractParties"
import {
  useCaptureLessee,
  useContractLessee,
  useRemoveLessee,
} from "@/features/cases/hooks/useContractParties"

// Below three characters the registry search matches most of the book — the same threshold the
// partner registry and the UBO dialog use.
const MIN_SEARCH_LENGTH = 3
const SEARCH_DEBOUNCE_MS = 300

/**
 * The one-line description under a linked party's name — city, kind of party, register number.
 *
 * Built from whatever the registry actually returned rather than from a fixed template: a sole
 * trader has no commercial register number and a foreign partner may have no address, and a line
 * reading "— · — · —" is worse than a shorter one.
 */
function describePartner(
  partner: PartnerDetailResponse | undefined,
  t: TFunction<"cases">
): string {
  if (!partner) return ""
  const identity = partner.identity
  const city =
    "registered_address" in identity
      ? (identity.registered_address?.city ?? null)
      : null
  const register =
    "commercial_register_no" in identity
      ? identity.commercial_register_no
      : null

  return [
    city,
    t(
      `wizard.manual.parties.partnerTypes.${partner.partner_type}` as "wizard.manual.parties.partnerTypes.legal_entity"
    ),
    register,
  ]
    .filter(Boolean)
    .join(" · ")
}

type Props = {
  contractId: string | null
  onNeedContract: () => Promise<string | null>
}

/**
 * Manual contract entry → **Lessee** tab. US 1.6 (the lessee) and US 1.7 (guarantors and
 * co-obligors), which share this surface because both are parties linked to the same contract.
 *
 * ── BOTH PATHS: PICK AN EXISTING PARTNER, OR CREATE ONE HERE ────────────────────────────────────
 * `LesseeCaptureRequest` and `GuarantorAddRequest` each accept **`existing_partner_id` OR
 * `identity`**. This tab uses the id branch for both: search the bank's registry and pick, or —
 * when nothing matches — create the partner through `CreatePartnerDialog` and link the id it
 * returns.
 *
 * Create-in-context used to be a notice saying it was not built, pointing at the partner registry.
 * That meant abandoning a half-entered contract to go and add a party. The design's own flow
 * (`CREATE PARTNER modal.pdf`) is search → "No matches found. Create new partner" → the create
 * modal → the party linked, and that is now what happens.
 *
 * The created partner is **not confirmed** — `submitPartner` creates it pending confirmation — and
 * the link response's `is_new` is what says so on screen, as the badge below already did.
 *
 * ── ONLY CONFIRMED PARTNERS ARE OFFERED ────────────────────────────────────────────────────────
 * The search is filtered to `confirmed`. A draft or pending-confirmation partner can be linked by
 * the API, but the case would then stall later on a party that is not yet a real counterparty —
 * so offering it would move a failure from here to somewhere harder to explain. `is_new` on the
 * response exists for exactly that reason and is surfaced when it comes back true.
 */
export function LesseeTab({ contractId, onNeedContract }: Props) {
  const lessee = useContractLessee(contractId ?? undefined)

  return (
    <div className="flex flex-col gap-6" data-testid="lessee-tab">
      <LesseeSection
        contractId={contractId}
        onNeedContract={onNeedContract}
        linkedPartnerId={lessee.data?.lessee_partner_id ?? null}
        isNew={lessee.data?.is_new ?? false}
        partnerStatus={lessee.data?.partner_status ?? null}
        isLoading={lessee.isLoading}
      />
    </div>
  )
}

function LesseeSection({
  contractId,
  onNeedContract,
  linkedPartnerId,
  isNew,
  partnerStatus,
  isLoading,
}: {
  contractId: string | null
  onNeedContract: () => Promise<string | null>
  linkedPartnerId: string | null
  isNew: boolean
  /**
   * The linked partner's registry status, unconstrained on the wire.
   *
   * Shown when it is anything but `confirmed`, which is the state a party created in context
   * arrives in. `is_new` does not cover this: it is true only when the link itself created the
   * partner (the `identity` branch), so creating through the registry and linking by id reports
   * `is_new: false` on a party that is nonetheless not yet a counterparty.
   */
  partnerStatus: string | null
  isLoading: boolean
}) {
  const { t } = useTranslation("cases")
  const capture = useCaptureLessee()
  const removeLessee = useRemoveLessee()
  const partner = usePartnerDetail(linkedPartnerId)

  async function link(partnerId: string) {
    const id = contractId ?? (await onNeedContract())
    if (id === null) return
    capture.mutate(
      { contractId: id, partnerId },
      { onError: err => showApiError(err, t) }
    )
  }

  return (
    <section data-testid="lessee-section">
      <h3 className="mb-3 text-sm font-semibold">
        {t("wizard.manual.parties.lesseeHeading")}
      </h3>

      {isLoading && <Skeleton className="h-16 w-full" />}

      {!isLoading && linkedPartnerId !== null ? (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm"
          data-testid="lessee-linked"
        >
          <div className="min-w-0">
            {/* The dummy names the party and describes it — a raw UUID told the reader nothing
                and was the only thing on the card that identified the lessee. The subtitle is the
                registry's own detail: where it sits, what kind of party it is, and the register
                number a bank reader would check it against. */}
            <p className="font-medium">
              {partner.data?.display_name ??
                t("wizard.manual.parties.lesseeLinked")}
            </p>
            <p className="text-xs text-muted-foreground">
              {describePartner(partner.data, t) || linkedPartnerId}
            </p>
            {/* The click dummy's link, opening in a new tab: the party is inspected in the partner
                register, not edited from inside this modal. */}
            <a
              className="mt-1 inline-block text-xs underline underline-offset-2"
              href={PATHS.PARTNER_DETAIL.replace(":id", linkedPartnerId)}
              target="_blank"
              rel="noreferrer"
              data-testid="lessee-view-partner"
            >
              {t("wizard.manual.parties.viewPartner")}
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isNew && (
              <Badge variant="secondary" data-testid="lessee-is-new">
                {t("wizard.manual.parties.newPartner")}
              </Badge>
            )}
            {partnerStatus !== null &&
              partnerStatus !== PartnerStatusSchema.enum.confirmed && (
                <Badge
                  variant="secondary"
                  data-testid="lessee-not-confirmed"
                  title={t("wizard.manual.parties.notConfirmedHint")}
                >
                  {t("wizard.manual.parties.notConfirmed")}
                </Badge>
              )}
            {/* The dummy's `Remove`, and it now means what it says: `POST .../lessee/remove`
                unlinks the party and the picker reopens on the empty state. It had been labelled
                "Choose a different lessee" precisely because that route did not exist and the only
                way out was to pick a replacement. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="lessee-remove"
              disabled={removeLessee.isPending || contractId === null}
              onClick={() =>
                contractId !== null &&
                removeLessee.mutate(contractId, {
                  onError: err => showApiError(err, t),
                })
              }
            >
              {t("wizard.manual.parties.removeLessee")}
            </Button>
          </div>
        </div>
      ) : (
        !isLoading && (
          <>
            {/* Reached when no lessee is linked — none captured yet, or Remove just unlinked
                one. Both are the same state and get the same picker. */}
            <PartnerPicker
              testIdPrefix="lessee"
              isLinking={capture.isPending}
              onPick={partnerId => link(partnerId)}
            />
          </>
        )
      )}
    </section>
  )
}

/**
 * Searches the bank's partner registry and links one.
 *
 * Debounced so typing a name costs one request after the pause rather than one per character, and
 * filtered to confirmed partners for the reason given on the tab. Same shape as
 * `CaptureUboDialog`, which solves the identical problem for UBOs.
 */
export function PartnerPicker({
  testIdPrefix,
  isLinking,
  onPick,
}: {
  testIdPrefix: string
  isLinking: boolean
  onPick: (partnerId: string) => void
}) {
  const { t } = useTranslation("cases")
  const tenantId = useResolvedTenantId()
  const [search, setSearch] = useState("")
  const [isCreating, setCreating] = useState(false)
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const partners = usePartnerList(tenantId, {
    status: [PartnerStatusSchema.enum.confirmed],
    search: debounced.length >= MIN_SEARCH_LENGTH ? debounced : undefined,
  })

  const matches = (partners.data?.items ?? []).filter(isPartnerUsableAsParty)

  return (
    <div className="flex flex-col gap-2">
      <Input
        data-testid={`${testIdPrefix}-search-input`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t("wizard.manual.parties.searchPlaceholder")}
      />

      {partners.isError && (
        <p
          className="text-sm text-destructive"
          data-testid={`${testIdPrefix}-search-error`}
        >
          {resolveApiErrorMessage(partners.error, t)}
        </p>
      )}

      {/* The design puts the create route exactly here — "No matches found. Create new partner" —
          because not finding the company by name is the moment you need it. It is also offered
          below the results, so a user who knows the party is new does not have to type a name that
          will not match first. */}
      {debounced.length >= MIN_SEARCH_LENGTH &&
        !partners.isLoading &&
        matches.length === 0 && (
          <p
            className="text-sm text-muted-foreground"
            data-testid={`${testIdPrefix}-no-matches`}
          >
            {t("wizard.manual.parties.noMatches")}
          </p>
        )}

      {matches.map(partner => (
        <button
          key={partner.partner_id}
          type="button"
          disabled={isLinking}
          data-testid={`${testIdPrefix}-result-${partner.partner_id}`}
          onClick={() => onPick(partner.partner_id)}
          className="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm hover:bg-accent disabled:opacity-50"
        >
          {/* NOTE: raw <button> — a selectable result row, not an action button; shadcn Button
              centres its content and fixes a height, both wrong for a full-width row. */}
          <span className="font-medium">{partner.display_name}</span>
          <span className="text-xs text-muted-foreground">
            {partner.country}
          </span>
        </button>
      ))}

      {/* Tenant-scoped: `POST /tenants/{id}/partners` needs one, and a System Admin has no single
          tenant. Rather than embed the page's tenant-selection gate inside a modal, the route is
          simply not offered without a resolved tenant — the search above still works. */}
      {tenantId !== undefined && tenantId !== null && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          data-testid={`${testIdPrefix}-create-partner`}
          onClick={() => setCreating(true)}
        >
          <Plus size={16} />
          {t("wizard.manual.parties.createPartner")}
        </Button>
      )}

      {isCreating && tenantId !== undefined && tenantId !== null && (
        <CreatePartnerDialog
          tenantId={tenantId}
          onOpenChange={setCreating}
          onCreated={onPick}
        />
      )}
    </div>
  )
}
