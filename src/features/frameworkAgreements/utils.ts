import { useTranslation } from "react-i18next"
import { ApiError } from "@/lib/api"
import { resolveFormMessage } from "@/lib/formMessages"
import {
  FAAgreementLifecycleSchema,
  FALifecycleStatusSchema,
  VFE_AMOUNT_MIN,
} from "@/features/frameworkAgreements/api/schema"
import type {
  FAAgreementLifecycle,
  FALifecycleStatus,
  SelectableTemplateItem,
} from "@/features/frameworkAgreements/api/schema"

export function isFrameworkAgreementNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "FA_NOT_FOUND"
}

/**
 * LC-portal-only fallback for the agreement's displayable lifecycle.
 *
 * The bank-side list and detail responses carry `agreement_lifecycle` from the server
 * (CR-FA-07 on PRD1042-1799, revised 6/8/2026) and those screens read it directly — this
 * used to be `getFrameworkAgreementDisplayStatus`, applied on both sides, re-deriving a
 * rule the backend owns.
 *
 * `LCPortalFAListItem` is the one FA response carrying neither `agreement_lifecycle` nor
 * `is_expired`, so the portal still has to fold expiry in itself or the same agreement
 * would read "Active" to the leasing company and "Expired" to the bank. Deliberately named
 * for its one caller: it is a gap-filler, not a general helper. Delete it, and the
 * date-comparison helper below, once the BE adds the field to that response — see Q-033.
 *
 * Returns the same `FAAgreementLifecycle` the server sends, so both sides feed one badge
 * map and one set of i18n keys.
 */
export function getLcPortalAgreementLifecycle(
  status: FALifecycleStatus,
  isExpired: boolean
): FAAgreementLifecycle {
  if (status === FALifecycleStatusSchema.enum.active && isExpired) {
    return FAAgreementLifecycleSchema.enum.expired
  }
  return status
}

// `valid_until` is a date-only wire value (`format: date`), so expiry must be a
// calendar-date comparison — an agreement is valid through the whole of that day.
// Mirrors is_fa_expired() in refinext-api (`valid_until < date.today()`).
//
// Only the LC portal needs this: LCPortalFAListItem is the one FA response the BE
// does not carry `is_expired` on, and the LC card must not disagree with the
// bank-side list and detail views. Delete once the BE adds the flag — see Q-033.
export function isFrameworkAgreementExpiredByDate(
  validUntil: string | null,
  today: Date = new Date()
): boolean {
  if (validUntil === null) return false
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-")
  return validUntil < localToday
}

// Narrows the allowed-templates picker by a free-text query, matching template name or
// template code case-insensitively, client-side, because GET /product-templates/selectable
// returns every option in one unpaginated response.
//
// Per CR PRD1042-1799 CR-FA-05 the picker used to keep the full published list with no
// filtering derived from earlier wizard steps — search was the only narrowing. The Create
// wizard now also narrows by valid_from (see filterTemplatesEffectiveBy below); this
// supersedes CR-FA-05 for Create only. The Edit wizard's picker (EditValidityTemplatesStep)
// never touches valid_from and stays unfiltered, so it keeps the original CR-FA-05 behavior.
// GET /product-templates/selectable is version-scoped — it returns one row per selectable
// version (ACTIVE *and* in-window SUPERSEDED, see get_selectable_versions in
// ../refinext-api/), so a template with an active v2 and a superseded v1 arrives twice under
// one template_id. Consumers bind the *template* (an FA's product_template_ids are
// ProductTemplate.id; the BE resolves the version at binding time), so those rows must be
// collapsed. Applied once in useSelectableProductTemplates' select — that hook's comment
// records which surfaces broke and how.
//
// The surviving row keeps the highest version_number: the response carries no version_status,
// so "latest" is the only available stand-in for "the one that will actually be bound".
export function dedupeSelectableTemplates(
  options: readonly SelectableTemplateItem[]
): readonly SelectableTemplateItem[] {
  return options
}

// Create-wizard-only eligibility filter: a template must already be in effect by the
// agreement's own valid_from to be selectable — an agreement cannot bind a product that
// isn't valid yet on the day it starts. Both sides are wire date-only strings (yyyy-MM-dd),
// parsed to Date for the comparison rather than compared lexicographically.
// Inclusive: a template whose own valid_from equals the agreement's is already in effect
// that day. A template with no valid_from set has no lower bound and is never excluded.
// No agreementValidFrom (the field is still empty) means no filtering at all — the picker
// shows the full default list, same as before this filter existed.
export function filterTemplatesEffectiveBy(
  options: readonly SelectableTemplateItem[],
  agreementValidFrom: string
): readonly SelectableTemplateItem[] {
  if (!agreementValidFrom) return options
  const agreementTime = new Date(agreementValidFrom).getTime()
  return options.filter(
    option =>
      !option.valid_from ||
      new Date(option.valid_from).getTime() <= agreementTime
  )
}

// A template_id can now appear once per selectable version (dedupeSelectableTemplates above
// is a no-op). Any version's row is selectable, and ProductTemplateMultiSelect remembers
// exactly which one the user picked — but `product_template_ids` only ever stores the
// template_id, so a template that arrives in `value` with no remembered version yet (the
// initial render, or an Edit-wizard `value` populated from an existing agreement) needs a
// deterministic default. This supplies that default: the highest version_number, same
// tie-break dedupeSelectableTemplates used before it was disabled ("the one that will
// actually be bound").
export function canonicalVersionByTemplate(
  options: readonly SelectableTemplateItem[]
): ReadonlyMap<string, string> {
  const canonical = new Map<string, string>()
  for (const option of options) {
    const current = canonical.get(option.template_id)
    if (!current || Number(option.version_number) > Number(current)) {
      canonical.set(option.template_id, option.version_number)
    }
  }
  return canonical
}

// Groups every version-row of the same template_id together, in first-seen order, rather
// than leaving them interleaved with other templates once duplicate version rows exist.
// Returns one array per distinct template_id (not a flattened list) so the picker can render
// each template's versions stacked one beneath another instead of side by side with
// unrelated templates. Preserves the relative order of distinct templates and of each
// template's own rows.
export function groupByTemplateId(
  options: readonly SelectableTemplateItem[]
): readonly (readonly SelectableTemplateItem[])[] {
  const groups = new Map<string, SelectableTemplateItem[]>()
  for (const option of options) {
    const group = groups.get(option.template_id)
    if (group) {
      group.push(option)
    } else {
      groups.set(option.template_id, [option])
    }
  }
  return [...groups.values()]
}

// Distributes groupByTemplateId's groups across two columns for the picker's 2-column
// layout. A group (all versions of one template) is never split across the boundary — each
// whole group goes to whichever column currently holds fewer rows so far (ties favor the
// left column). This keeps versions of the same template stacked together while still
// landing close to an equal row count per column; plain CSS grid auto-flow (row-major
// left/right alternation by group *count*, not row count) can leave one column much taller
// than the other once group sizes vary.
export function splitGroupsIntoColumns(
  groups: readonly (readonly SelectableTemplateItem[])[]
): readonly [
  readonly (readonly SelectableTemplateItem[])[],
  readonly (readonly SelectableTemplateItem[])[],
] {
  const left: (readonly SelectableTemplateItem[])[] = []
  const right: (readonly SelectableTemplateItem[])[] = []
  let leftCount = 0
  let rightCount = 0
  for (const group of groups) {
    if (leftCount <= rightCount) {
      left.push(group)
      leftCount += group.length
    } else {
      right.push(group)
      rightCount += group.length
    }
  }
  return [left, right]
}

export function filterSelectableTemplates(
  options: readonly SelectableTemplateItem[],
  query: string
): readonly SelectableTemplateItem[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return options
  return options.filter(
    option =>
      option.template_name.toLowerCase().includes(needle) ||
      option.template_code.toLowerCase().includes(needle)
  )
}

// Zod message-code → i18n resolver for every FA form surface: the create and edit wizard
// steps, plus the activate / terminate / attach-document panels. Delegates to the shared
// resolveFormMessage, which takes shared codes ("required", "mustBePositive", "tooShort",
// "tooLong") from common:validation.*, feature codes ("validUntilBeforeFrom",
// "atLeastOneTemplate") from frameworkAgreements:errors.*, and passes an already-translated
// server message through untouched.
//
// "vfeAmountMin" stays here because it is the one code that interpolates: the bound comes
// from the schema constant so the message can never drift from what the BE enforces.
export function useResolveFrameworkAgreementFieldError(): (
  msg: string | undefined
) => string | undefined {
  const { t } = useTranslation("frameworkAgreements")

  return function resolveFrameworkAgreementFieldError(
    msg: string | undefined
  ): string | undefined {
    if (msg === "vfeAmountMin") {
      return t("errors.vfeAmountMin", { min: VFE_AMOUNT_MIN })
    }
    return resolveFormMessage(msg, t, "errors")
  }
}
