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
import { usePartnersByIds } from "@/features/partners/hooks/usePartnersByIds"
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

// Two, as the prototype's picker uses: below that the search matches most of the book. The
// partner registry screen and the UBO dialog use three; this one is a narrower list read inside a
// modal, where getting to a hit in fewer keystrokes matters more.
const MIN_SEARCH_LENGTH = 2
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
  /**
   * Carried over from the last contract entered on this request, for a NEW contract only.
   *
   * Shown as the chosen party before the contract exists, so the tab opens on an answer rather
   * than on an empty search. The link itself is written when the contract is created — see the
   * dialog's `ensureContract`.
   */
  inheritedPartnerId?: string
  /** Drops the carried-over party, for when it is not the one this contract is with. */
  onClearInherited: () => void
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
export function LesseeTab({
  contractId,
  inheritedPartnerId,
  onClearInherited,
  onNeedContract,
}: Props) {
  const lessee = useContractLessee(contractId ?? undefined)

  // Before the contract exists there is nothing to read a link from, so the inherited party stands
  // in. Once it exists the contract's own answer is the only one that counts — including when that
  // answer is "none", which is what Remove leaves behind.
  const linkedPartnerId =
    contractId === null
      ? (inheritedPartnerId ?? null)
      : (lessee.data?.lessee_partner_id ?? null)

  return (
    <div className="flex flex-col gap-6" data-testid="lessee-tab">
      <LesseeSection
        contractId={contractId}
        onNeedContract={onNeedContract}
        linkedPartnerId={linkedPartnerId}
        onClearInherited={onClearInherited}
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
  onClearInherited,
  linkedPartnerId,
  isNew,
  partnerStatus,
  isLoading,
}: {
  contractId: string | null
  onNeedContract: () => Promise<string | null>
  onClearInherited: () => void
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
              disabled={removeLessee.isPending}
              onClick={() => {
                // Before the contract exists there is nothing to unlink — the party on screen is
                // the one carried over, so Remove drops that instead. Same button, same meaning.
                if (contractId === null) {
                  onClearInherited()
                  return
                }
                removeLessee.mutate(contractId, {
                  onError: err => showApiError(err, t),
                })
              }}
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
 * ── SEARCH FIRST, NOT A LIST ───────────────────────────────────────────────────────────────────
 * The prototype's `partnerPicker` shows **"No partner selected"** beside a search box and an
 * `Add partner` button, and renders nothing else until two characters have been typed. Listing the
 * whole registry up front, as this did, is a different screen: it reads as "pick one of these
 * five" on a bank whose register runs to thousands, and it buries the search that is the actual
 * way in.
 *
 * ── A HIT IS ONE LINE ──────────────────────────────────────────────────────────────────────────
 * `Name · City · CREFO <number>` with `Select` on the right, exactly as the prototype's `.pdrop-r`
 * has it. The bare country code the rows used to carry on the right is not enough to tell two
 * companies of similar name apart, which is the whole job of this list.
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

  const isSearching = debounced.length >= MIN_SEARCH_LENGTH
  const partners = usePartnerList(tenantId, {
    status: [PartnerStatusSchema.enum.confirmed],
    search: isSearching ? debounced : undefined,
  })

  const matches = isSearching
    ? (partners.data?.items ?? []).filter(isPartnerUsableAsParty)
    : []

  // `PartnerListItem` carries a country and nothing else, so the city and register number the
  // prototype's rows show have to come from the detail. Bounded by what is on screen — a search
  // returns a handful of hits, not the register — and React Query dedupes them against the same
  // details the linked-party card already reads.
  const { partnersById } = usePartnersByIds(
    matches.map(partner => partner.partner_id)
  )

  const canCreate = tenantId !== undefined && tenantId !== null

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {t("wizard.manual.parties.noneSelected")}
        </span>
        <div className="flex items-center gap-2">
          <Input
            className="w-64 max-w-full"
            data-testid={`${testIdPrefix}-search-input`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("wizard.manual.parties.searchPlaceholder")}
          />
          {/* Tenant-scoped: `POST /tenants/{id}/partners` needs one, and a System Admin has no
              single tenant. Rather than embed the page's tenant-selection gate inside a modal, the
              route is simply not offered without a resolved tenant — the search still works.

              Always visible, never only after a search comes back empty: the prototype's own note
              says so, and a user who knows the party is new should not have to type a name that
              will not match first. */}
          {canCreate && (
            <Button
              type="button"
              variant="outline"
              data-testid={`${testIdPrefix}-create-partner`}
              onClick={() => setCreating(true)}
            >
              <Plus size={15} />
              {t("wizard.manual.parties.addPartner")}
            </Button>
          )}
        </div>
      </div>

      {partners.isError && (
        <p
          className="mt-2 text-sm text-destructive"
          data-testid={`${testIdPrefix}-search-error`}
        >
          {resolveApiErrorMessage(partners.error, t)}
        </p>
      )}

      {isSearching && !partners.isError && (
        <div className="-mt-px overflow-hidden rounded-b-lg border">
          {matches.map(partner => (
            <button
              key={partner.partner_id}
              type="button"
              disabled={isLinking}
              data-testid={`${testIdPrefix}-result-${partner.partner_id}`}
              onClick={() => onPick(partner.partner_id)}
              className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-accent disabled:opacity-50"
            >
              {/* NOTE: raw <button> — a selectable result row, not an action button; shadcn Button
                  centres its content and fixes a height, both wrong for a full-width row. */}
              {/* Two lines: the name, and the address under it. The register number rides on the
                  second line because it identifies the same thing the address does — which of two
                  similarly-named companies this row is. The country code that used to sit alone on
                  the right could never answer that. */}
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {partner.display_name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {partnerResultMeta(
                    partnersById.get(partner.partner_id),
                    partner.country
                  )}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {t("wizard.manual.parties.select")}
              </span>
            </button>
          ))}

          {!partners.isLoading && matches.length === 0 && (
            <div
              className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-muted-foreground"
              data-testid={`${testIdPrefix}-no-matches`}
            >
              {t("wizard.manual.parties.noMatches")}
              {canCreate && (
                <button
                  type="button"
                  className="text-primary underline underline-offset-2"
                  data-testid={`${testIdPrefix}-create-partner-inline`}
                  onClick={() => setCreating(true)}
                >
                  {/* NOTE: raw <button> — the prototype renders this as a link inside a sentence,
                      which a shadcn Button's padding and height would break. */}
                  {t("wizard.manual.parties.createPartner")}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isCreating && canCreate && (
        <CreatePartnerDialog
          tenantId={tenantId}
          onOpenChange={setCreating}
          onCreated={onPick}
        />
      )}
    </div>
  )
}

/**
 * The line under a hit's name — the partner's address and register number.
 *
 * Falls back to the country the list itself gives when the detail has not arrived or holds neither:
 * a country alone is the least useful of the three for telling two similarly-named companies apart,
 * which is why it is the fallback rather than the default.
 */
function partnerResultMeta(
  detail: PartnerDetailResponse | undefined,
  country: string | null
): string {
  const identity = detail?.identity
  const address =
    identity && "registered_address" in identity
      ? identity.registered_address
      : null

  const parts = [
    // The street and the town, in the order an address is written.
    [
      address?.street,
      [address?.postal_code, address?.city].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", "),
    identity && "commercial_register_no" in identity
      ? identity.commercial_register_no
      : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(" · ") : (country ?? "")
}
