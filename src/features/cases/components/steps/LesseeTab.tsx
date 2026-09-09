import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PATHS } from "@/router/paths"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { useResolvedTenantId } from "@/hooks/useResolvedTenantId"
import { usePartnerList } from "@/features/partners/hooks/usePartnerList"
import { CreatePartnerDialog } from "@/features/partners/components/CreatePartnerDialog"
import { PartnerStatusSchema } from "@/features/partners/api/schema"
import {
  KIND_OF_OBLIGATION_OPTIONS,
  isPartnerUsableAsParty,
} from "@/features/cases/contractParties"
import {
  useAddGuarantor,
  useCaptureLessee,
  useContractGuarantors,
  useContractLessee,
  useRemoveGuarantor,
} from "@/features/cases/hooks/useContractParties"

// Below three characters the registry search matches most of the book — the same threshold the
// partner registry and the UBO dialog use.
const MIN_SEARCH_LENGTH = 3
const SEARCH_DEBOUNCE_MS = 300

type Props = {
  contractId: string | null
  onNeedContract: () => Promise<string | null>
  /**
   * Reported up so the manual-entry modal can conceal itself while Create partner is open.
   *
   * Two modals drawn at once is not a z-index problem — the parent pokes out around the child and
   * offers a second footer. The picker is three components down from the dialog that has to know,
   * hence the callback.
   */
  onNestedDialogOpenChange?: (isOpen: boolean) => void
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
  onNeedContract,
  onNestedDialogOpenChange,
}: Props) {
  const lessee = useContractLessee(contractId ?? undefined)

  return (
    <div className="flex flex-col gap-6" data-testid="lessee-tab">
      <LesseeSection
        contractId={contractId}
        onNeedContract={onNeedContract}
        linkedPartnerId={lessee.data?.lessee_partner_id ?? null}
        isNew={lessee.data?.is_new ?? false}
        onNestedDialogOpenChange={onNestedDialogOpenChange}
        partnerStatus={lessee.data?.partner_status ?? null}
        isLoading={lessee.isLoading}
      />
    </div>
  )
}

/**
 * **Guarantors / co-obligors** — its own tab, as the click dummy has it, rather than a block under
 * Lessee. They are a separate list against the contract (`/contracts/{id}/guarantors`), and the
 * design separates them because capturing a lessee and capturing sureties are different jobs.
 */
export function GuarantorsTab({
  contractId,
  onNeedContract,
  onNestedDialogOpenChange,
}: Props) {
  const guarantors = useContractGuarantors(contractId ?? undefined)

  return (
    <div className="flex flex-col gap-6" data-testid="guarantors-tab">
      <GuarantorSection
        contractId={contractId}
        onNeedContract={onNeedContract}
        guarantors={guarantors.data?.guarantors ?? []}
        onNestedDialogOpenChange={onNestedDialogOpenChange}
        isLoading={guarantors.isLoading}
        isError={guarantors.isError}
        error={guarantors.error}
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
  onNestedDialogOpenChange,
}: {
  contractId: string | null
  onNeedContract: () => Promise<string | null>
  linkedPartnerId: string | null
  isNew: boolean
  onNestedDialogOpenChange?: (isOpen: boolean) => void
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
  const [isReplacing, setReplacing] = useState(false)

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

      {!isLoading && linkedPartnerId !== null && !isReplacing ? (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm"
          data-testid="lessee-linked"
        >
          <div className="min-w-0">
            <p className="font-medium">
              {t("wizard.manual.parties.lesseeLinked")}
            </p>
            <p className="text-xs text-muted-foreground">{linkedPartnerId}</p>
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
            {/* The dummy's action is Remove, then search or create again. There is no unlink
                endpoint — `POST .../lessee` only ever sets one — so this reopens the picker and the
                next pick REPLACES the link. Labelled "Choose a different lessee" rather than
                "Remove" so it does not promise a deletion that cannot happen: leaving the modal
                without picking again keeps the current lessee. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="lessee-replace"
              onClick={() => setReplacing(true)}
            >
              {t("wizard.manual.parties.replaceLessee")}
            </Button>
          </div>
        </div>
      ) : (
        !isLoading && (
          <>
            {isReplacing && linkedPartnerId !== null && (
              <p
                className="mb-2 text-xs text-muted-foreground"
                data-testid="lessee-replace-notice"
              >
                {t("wizard.manual.parties.replaceNotice")}
              </p>
            )}
            <PartnerPicker
              testIdPrefix="lessee"
              isLinking={capture.isPending}
              onNestedDialogOpenChange={onNestedDialogOpenChange}
              onPick={partnerId => {
                setReplacing(false)
                link(partnerId)
              }}
            />
          </>
        )
      )}
    </section>
  )
}

function GuarantorSection({
  contractId,
  onNeedContract,
  guarantors,
  isLoading,
  isError,
  error,
  onNestedDialogOpenChange,
}: {
  contractId: string | null
  onNeedContract: () => Promise<string | null>
  onNestedDialogOpenChange?: (isOpen: boolean) => void
  guarantors: readonly {
    link_id: string
    guarantor_partner_id: string
    kind_of_obligation: string | null
    display_name: string
  }[]
  isLoading: boolean
  isError: boolean
  error: Error | null
}) {
  const { t } = useTranslation("cases")
  const add = useAddGuarantor()
  const remove = useRemoveGuarantor()
  const [isAdding, setAdding] = useState(false)
  const [kind, setKind] = useState<string>(KIND_OF_OBLIGATION_OPTIONS[0])

  async function link(partnerId: string) {
    const id = contractId ?? (await onNeedContract())
    if (id === null) return
    add.mutate(
      { contractId: id, partnerId, kindOfObligation: kind },
      {
        onSuccess: () => setAdding(false),
        onError: err => showApiError(err, t),
      }
    )
  }

  return (
    <section data-testid="guarantor-section">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t("wizard.manual.parties.guarantorHeading", {
            count: guarantors.length,
          })}
        </h3>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="guarantor-add-button"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} />
            {t("wizard.manual.parties.addGuarantor")}
          </Button>
        )}
      </div>

      {isLoading && <Skeleton className="h-16 w-full" />}

      {isError && (
        <p className="text-sm text-destructive" data-testid="guarantor-error">
          {resolveApiErrorMessage(error, t)}
        </p>
      )}

      {!isLoading && !isError && guarantors.length === 0 && !isAdding && (
        <p
          className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground"
          data-testid="guarantor-empty"
        >
          {t("wizard.manual.parties.guarantorEmpty")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {guarantors.map(g => (
          <div
            key={g.link_id}
            className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
            data-testid={`guarantor-row-${g.link_id}`}
          >
            <div>
              {/* This list carries a display name, unlike the financing Contracts tab (Q-015) —
                  so no per-row partner fetch is needed. */}
              <p className="font-medium">{g.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {g.kind_of_obligation ?? "—"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid={`guarantor-remove-${g.link_id}`}
              disabled={remove.isPending || contractId === null}
              onClick={() =>
                remove.mutate(
                  { contractId: contractId as string, linkId: g.link_id },
                  { onError: err => showApiError(err, t) }
                )
              }
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div
          className="mt-3 flex flex-col gap-3 rounded-lg border p-4"
          data-testid="guarantor-add-form"
        >
          <div>
            <Label htmlFor="kind-of-obligation" className="mb-1.5">
              {t("wizard.manual.parties.kindOfObligation")}
            </Label>
            <SelectField
              id="kind-of-obligation"
              data-testid="guarantor-kind-select"
              value={kind}
              onValueChange={setKind}
              options={KIND_OF_OBLIGATION_OPTIONS.map(value => ({
                value,
                label: t(
                  `wizard.manual.parties.obligations.${value}` as "wizard.manual.parties.obligations.guarantor"
                ),
              }))}
            />
          </div>

          <PartnerPicker
            testIdPrefix="guarantor"
            isLinking={add.isPending}
            onNestedDialogOpenChange={onNestedDialogOpenChange}
            onPick={link}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-end"
            data-testid="guarantor-add-cancel"
            onClick={() => setAdding(false)}
          >
            {t("wizard.actions.cancel")}
          </Button>
        </div>
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
function PartnerPicker({
  testIdPrefix,
  isLinking,
  onPick,
  onNestedDialogOpenChange,
}: {
  testIdPrefix: string
  isLinking: boolean
  onPick: (partnerId: string) => void
  onNestedDialogOpenChange?: (isOpen: boolean) => void
}) {
  const { t } = useTranslation("cases")
  const tenantId = useResolvedTenantId()
  const [search, setSearch] = useState("")
  const [isCreating, setCreating] = useState(false)

  // Kept in one place so the parent modal is told whichever way the child opens or closes.
  function setCreatingAndReport(next: boolean) {
    setCreating(next)
    onNestedDialogOpenChange?.(next)
  }
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
          onClick={() => setCreatingAndReport(true)}
        >
          <Plus size={16} />
          {t("wizard.manual.parties.createPartner")}
        </Button>
      )}

      {isCreating && tenantId !== undefined && tenantId !== null && (
        <CreatePartnerDialog
          tenantId={tenantId}
          onOpenChange={setCreatingAndReport}
          onCreated={onPick}
        />
      )}
    </div>
  )
}
