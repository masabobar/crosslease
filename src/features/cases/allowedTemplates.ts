import type { SelectableTemplateItem } from "@/features/frameworkAgreements/api/schema"

/**
 * Narrows the bank's selectable product templates to those the framework agreement permits.
 *
 * The design's helper text on wizard step 1 is *"Only templates the framework agreement allows can
 * be picked"* (design-extract §6), and the agreement carries the permitted set as
 * `FADetailResponse.product_template_ids`. The selectable-templates endpoint is bank-wide, so the
 * two have to be intersected here — there is no endpoint that returns "templates allowed for this
 * case".
 *
 * Ordering follows the selectable list, not the agreement's array, so the picker's order matches
 * every other template picker in the app.
 */
export function filterTemplatesAllowedByAgreement(
  selectable: readonly SelectableTemplateItem[],
  allowedTemplateIds: readonly string[]
): SelectableTemplateItem[] {
  const allowed = new Set(allowedTemplateIds)
  return selectable.filter(template => allowed.has(template.template_id))
}

/**
 * The label the picker shows for a template.
 *
 * The design renders `Standard lease refinancing, v4` — name then version. `template_code` is not
 * shown, though it is searchable elsewhere; including it here would make a two-line label out of a
 * one-line design.
 */
export function templateOptionLabel(template: SelectableTemplateItem): string {
  return `${template.template_name}, v${template.version_number}`
}
