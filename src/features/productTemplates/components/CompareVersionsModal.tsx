import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatCurrency } from "@/lib/formatters"
import { NPV_FORMULA_OPTIONS } from "@/features/productTemplates/constants"
import { useTemplateVersionDiff } from "@/features/productTemplates/hooks/useTemplateVersionDiff"
import type { FieldDiffItem } from "@/features/productTemplates/api/schema"

type Props = {
  templateId: string
  fromVersion: string
  toVersion: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Row label per field, reusing the same i18n keys as ProductTemplateDetailDrawer's
// DetailBody and the wizard's ReviewStep so labels stay identical across all three
// surfaces. New keys (versionHistory.compare.fields.*) cover orchestration-linkage
// fields that only exist on this diff response.
const FIELD_LABEL_KEYS: Record<string, string> = {
  financing_type: "fields.financingType",
  legal_structure: "fields.legalStructure",
  payment_timing: "fields.paymentTiming",
  rate_basis: "fields.rateBasis",
  calculation_model: "fields.calculationModel",
  rate_type: "fields.rateType",
  first_installment_rule: "fields.firstInstallmentRule",
  disbursement_derivation_rule: "fields.disbursementDerivationRule",
  npv_formula_ref: "sections.npvFormulaReference",
  allowed_asset_categories: "sections.allowedAssetCategories",
  min_term_months: "fields.minTermMonths",
  max_term_months: "fields.maxTermMonths",
  max_ltv_ratio: "fields.maxLtvRatio",
  min_volume_eur: "fields.minVolumeEur",
  max_volume_eur: "fields.maxVolumeEur",
  required_workflow_tasks:
    "versionHistory.compare.fields.requiredWorkflowTasks",
  required_documents: "versionHistory.compare.fields.requiredDocuments",
  optional_documents: "versionHistory.compare.fields.optionalDocuments",
  validation_rule_set_id: "versionHistory.compare.fields.validationRuleSet",
}

const ENUM_FIELD_NAMESPACES: Record<string, string> = {
  financing_type: "financingTypes",
  legal_structure: "legalStructures",
  payment_timing: "paymentTimings",
  rate_basis: "rateBases",
  calculation_model: "calculationModels",
  rate_type: "rateTypes",
  first_installment_rule: "firstInstallmentRules",
  disbursement_derivation_rule: "disbursementDerivationRules",
}

const COUNT_FIELDS = new Set([
  "required_workflow_tasks",
  "required_documents",
  "optional_documents",
])

function fieldLabel(t: TFunction<"productTemplates">, field: string): string {
  const key = FIELD_LABEL_KEYS[field]
  return key ? t(key as "sections.identity") : field
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

// Decimal-backed fields (max_ltv_ratio, min/max_volume_eur) arrive as numeric strings
// on the wire, same as TemplateVersionDetailSchema's z.coerce.number() fields — this
// response can't apply that coercion per-field since old_value/new_value are z.unknown()
// across all fields, so the coercion happens here instead.
function asDecimalNumber(value: unknown): number | null {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

// Deep-ish equality for the two shapes this response actually carries: scalars
// (string | number | boolean | null) and string arrays (order-insensitive — the
// BE sorts required_workflow_tasks but doesn't guarantee order for other lists).
function valuesDiffer(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) !== JSON.stringify([...b].sort())
  }
  return a !== b
}

function diffPillClasses(side: "old" | "new"): string {
  return side === "old"
    ? "bg-red-600/10 text-red-600"
    : "bg-green-600/10 text-green-600"
}

function DiffPill({
  side,
  children,
}: {
  side: "old" | "new"
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        diffPillClasses(side)
      )}
    >
      {children}
    </span>
  )
}

// Renders one side (old or new) of a field's value. `changed` (computed once per row)
// decides whether this side gets the red/old or green/new highlight pill, matching the
// Figma compare modal — unchanged rows render as plain text, exactly like every other
// read-only surface in this feature (ProductTemplateDetailDrawer, ReviewStep).
function renderFieldValue(
  t: TFunction<"productTemplates">,
  field: string,
  value: unknown,
  side: "old" | "new",
  changed: boolean
): React.ReactNode {
  // No BE support for resolving this to a rule-set name yet (raw catalog UUID only —
  // see Q-028/Q-029 in open-questions.md), so we show whether it changed rather than
  // a fabricated label. Deliberately not colored: "Changed"/"No change" isn't a value
  // that belongs to one side more than the other.
  if (field === "validation_rule_set_id") {
    return t(
      changed
        ? "versionHistory.compare.ruleSetChanged"
        : "versionHistory.compare.ruleSetUnchanged"
    )
  }

  if (field === "allowed_asset_categories") {
    const categories = asStringArray(value)
    if (categories.length === 0) return "—"
    return (
      <span className="flex flex-wrap justify-end gap-1.5">
        {categories.map(category => (
          <span
            key={category}
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
              changed ? diffPillClasses(side) : "border-border text-foreground"
            )}
          >
            {t(`assetCategories.${category}` as "assetCategories.machinery")}
          </span>
        ))}
      </span>
    )
  }

  if (COUNT_FIELDS.has(field)) {
    const count = Array.isArray(value) ? value.length : 0
    const text = t(
      field === "required_workflow_tasks"
        ? "versionHistory.compare.taskCount"
        : "versionHistory.compare.documentCount",
      { count }
    )
    return changed ? <DiffPill side={side}>{text}</DiffPill> : text
  }

  let text: React.ReactNode = "—"
  if (field === "npv_formula_ref") {
    const npvFormula = NPV_FORMULA_OPTIONS.find(o => o.ref === value)
    text = npvFormula
      ? `${t(npvFormula.labelKey)} · ${npvFormula.code} ${npvFormula.version}`
      : ((value as string | null) ?? "—")
  } else if (field === "max_ltv_ratio") {
    const ltv = asDecimalNumber(value)
    text = ltv !== null ? `${ltv}%` : "—"
  } else if (field === "min_volume_eur" || field === "max_volume_eur") {
    const volume = asDecimalNumber(value)
    text = volume !== null ? formatCurrency(volume, EUR_CURRENCY_CODE) : "—"
  } else if (field === "min_term_months" || field === "max_term_months") {
    text = typeof value === "number" ? value : "—"
  } else if (ENUM_FIELD_NAMESPACES[field]) {
    text =
      typeof value === "string"
        ? t(`${ENUM_FIELD_NAMESPACES[field]}.${value}` as "rateTypes.fixed")
        : "—"
  } else if (typeof value === "string" || typeof value === "number") {
    text = String(value)
  }

  return changed ? <DiffPill side={side}>{text}</DiffPill> : text
}

function DiffTableRow({
  t,
  item,
}: {
  t: TFunction<"productTemplates">
  item: FieldDiffItem
}) {
  const changed = valuesDiffer(item.old_value, item.new_value)
  return (
    <TableRow data-testid={`diff-row-${item.field}`}>
      <TableCell className="w-2/5 whitespace-normal text-muted-foreground">
        {fieldLabel(t, item.field)}
      </TableCell>
      <TableCell className="w-[30%] whitespace-normal">
        {renderFieldValue(t, item.field, item.old_value, "old", changed)}
      </TableCell>
      <TableCell className="w-[30%] whitespace-normal">
        {renderFieldValue(t, item.field, item.new_value, "new", changed)}
      </TableCell>
    </TableRow>
  )
}

function DiffSection({
  t,
  title,
  items,
  fromVersion,
  toVersion,
}: {
  t: TFunction<"productTemplates">
  title: string
  items: FieldDiffItem[]
  fromVersion: string
  toVersion: string
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">
              {t("versionHistory.compare.fieldColumn")}
            </TableHead>
            <TableHead className="w-[30%]">v{fromVersion}</TableHead>
            <TableHead className="w-[30%]">v{toVersion}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <DiffTableRow key={item.field} t={t} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CompareVersionsModal({
  templateId,
  fromVersion,
  toVersion,
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")

  const { data, isLoading, isError } = useTemplateVersionDiff(
    templateId,
    open ? fromVersion : null,
    open ? toVersion : null
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto"
        data-testid="compare-versions-modal"
      >
        <DialogHeader>
          <DialogTitle>
            {t("versionHistory.compare.modalTitle", {
              from: `v${fromVersion}`,
              to: `v${toVersion}`,
            })}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
        )}

        {isError && !isLoading && (
          <p
            data-testid="compare-versions-error"
            className="text-sm text-destructive"
          >
            {t("errors.generic")}
          </p>
        )}

        {data && (
          <div className="flex flex-col gap-6">
            <DiffSection
              t={t}
              title={t("sections.behavioralSettings")}
              items={data.behavioral_settings}
              fromVersion={fromVersion}
              toVersion={toVersion}
            />
            <DiffSection
              t={t}
              title={t("sections.eligibility")}
              items={data.eligibility}
              fromVersion={fromVersion}
              toVersion={toVersion}
            />
            <DiffSection
              t={t}
              title={t("sections.orchestrationLinkage")}
              items={data.orchestration_linkage}
              fromVersion={fromVersion}
              toVersion={toVersion}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { CompareVersionsModal }
