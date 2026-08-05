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
import { useFrameworkAgreementVersionDiff } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementVersionDiff"
import type { FieldDiffItem } from "@/features/frameworkAgreements/api/schema"

type Props = {
  frameworkAgreementId: string
  fromVersion: string
  toVersion: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// One flat field list (_VERSION_DIFF_FIELDS in refinext-api services.py) — no sections,
// unlike the Bank Product Template diff this mirrors, which has no orchestration
// linkage to compare. effective_rate/vfe_rate are historical-only (CR-FA-01/02 retired
// them as user input) but the BE still diffs them, so they're rendered like any other
// field rather than special-cased.
const FIELD_LABEL_KEYS: Record<string, string> = {
  agreement_name: "fields.agreementName",
  bank_entity: "fields.bankEntity",
  currency: "fields.currency",
  max_volume_eur: "fields.maxVolumeEur",
  effective_rate: "versionHistory.compare.fields.effectiveRate",
  vfe_rate: "versionHistory.compare.fields.vfeRate",
  valid_from: "fields.validFrom",
  valid_until: "fields.validUntil",
  special_conditions: "detail.sections.specialConditions",
}

const DECIMAL_FIELDS = new Set(["max_volume_eur"])
const PERCENT_FIELDS = new Set(["effective_rate", "vfe_rate"])

function fieldLabel(
  t: TFunction<"frameworkAgreements">,
  field: string
): string {
  const key = FIELD_LABEL_KEYS[field]
  return key ? t(key as "fields.agreementName") : field
}

function valuesDiffer(a: unknown, b: unknown): boolean {
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

function renderFieldValue(
  t: TFunction<"frameworkAgreements">,
  field: string,
  value: unknown,
  side: "old" | "new",
  changed: boolean
): React.ReactNode {
  let text: React.ReactNode = "—"
  if (field === "bank_entity") {
    text =
      typeof value === "string"
        ? t(`bankEntities.${value}` as "bankEntities.sparkasse")
        : "—"
  } else if (DECIMAL_FIELDS.has(field)) {
    text =
      typeof value === "string" ? `€ ${Number(value).toLocaleString()}` : "—"
  } else if (PERCENT_FIELDS.has(field)) {
    text = typeof value === "string" ? `${value}%` : "—"
  } else if (typeof value === "string" || typeof value === "number") {
    text = String(value)
  }

  return changed ? <DiffPill side={side}>{text}</DiffPill> : text
}

function DiffTableRow({
  t,
  item,
}: {
  t: TFunction<"frameworkAgreements">
  item: FieldDiffItem
}) {
  const changed = valuesDiffer(item.old_value, item.new_value)
  return (
    <TableRow data-testid={`fa-diff-row-${item.field}`}>
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

function CompareFrameworkAgreementVersionsModal({
  frameworkAgreementId,
  fromVersion,
  toVersion,
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")

  const { data, isLoading, isError } = useFrameworkAgreementVersionDiff(
    frameworkAgreementId,
    fromVersion,
    toVersion,
    open
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto"
        data-testid="fa-compare-versions-modal"
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
            data-testid="fa-compare-versions-error"
            className="text-sm text-destructive"
          >
            {t("errors.generic")}
          </p>
        )}

        {data && (
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
              {data.diffs.map(item => (
                <DiffTableRow key={item.field} t={t} item={item} />
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { CompareFrameworkAgreementVersionsModal }
