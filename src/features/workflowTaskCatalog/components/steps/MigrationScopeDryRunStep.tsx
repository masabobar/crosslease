import { useState } from "react"
import { useForm, useFormState, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { ArrowLeft, ArrowRight, Check, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { SelectField } from "@/components/ui/select"
import { DialogModal, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WizardStepper } from "@/components/shared/WizardStepper"
import { MigrationDryRunReportTable } from "@/features/workflowTaskCatalog/components/MigrationDryRunReportTable"
import { MigrationSummaryStat } from "@/features/workflowTaskCatalog/components/MigrationSummaryStat"
import {
  JUSTIFICATION_MIN_LENGTH,
  MIGRATION_TO_VERSION_OPTIONS,
  PLACEHOLDER_MIGRATION_DEFAULT_SCOPE_IDS,
  PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY,
} from "@/features/workflowTaskCatalog/constants"

// Local, client-side-only form — no API exists yet for Epic 15, so this schema never
// crosses a network boundary. Message codes ("required" / "tooShort") are resolved to
// translated text at render time, matching the ReviewCommentFormSchema pattern in
// features/governed-actions/api/schema.ts.
const DefineScopeFormSchema = z.object({
  toVersion: z.string().min(1, { message: "required" }),
  scope: z.array(z.string()).min(1, { message: "required" }),
  justification: z
    .string()
    .refine(value => value.trim().length >= JUSTIFICATION_MIN_LENGTH, {
      message: "tooShort",
    }),
})
type DefineScopeForm = z.infer<typeof DefineScopeFormSchema>

type LocalSubStep = "defineScope" | "dryRunReport" | "review"

function ReviewRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">
        {value}
      </span>
    </div>
  )
}

type Props = {
  onCancel: () => void
  onSubmittedBackToCatalog: () => void
}

// Covers the top-level "dryRun" MigrationWizardStep, which per the Figma "SUBMIT
// MIGRATION" frame set spans three sub-screens (Define Scope, Dry Run Report, Review &
// Submit) sharing one 2-node mini-stepper ("Define scope" / "Dry run" — Review has no
// stepper node of its own in the design).
function MigrationScopeDryRunStep({
  onCancel,
  onSubmittedBackToCatalog,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const [subStep, setSubStep] = useState<LocalSubStep>("defineScope")
  const [isSubmittedDialogOpen, setIsSubmittedDialogOpen] = useState(false)
  const [scopeInputValue, setScopeInputValue] = useState("")

  const { control, register, setValue, handleSubmit } =
    useForm<DefineScopeForm>({
      resolver: zodResolver(DefineScopeFormSchema),
      defaultValues: {
        toVersion: MIGRATION_TO_VERSION_OPTIONS[0].value,
        scope: [...PLACEHOLDER_MIGRATION_DEFAULT_SCOPE_IDS],
        justification: "",
      },
    })
  const { errors } = useFormState({ control })
  const [toVersion, scope, justification] = useWatch({
    control,
    name: ["toVersion", "scope", "justification"],
  })

  function resolveErrorMessage(
    message: string | undefined
  ): string | undefined {
    if (!message) return undefined
    if (message === "tooShort") {
      return t("lifecycle.errors.tooShort", { count: JUSTIFICATION_MIN_LENGTH })
    }
    return tCommon("validation.required")
  }

  function handleAddScopeId() {
    const value = scopeInputValue.trim()
    if (!value) return
    if (!scope.includes(value)) {
      setValue("scope", [...scope, value], { shouldValidate: true })
    }
    setScopeInputValue("")
  }

  function handleRemoveScopeId(id: string) {
    setValue(
      "scope",
      scope.filter(existing => existing !== id),
      { shouldValidate: true }
    )
  }

  const handleDefineScopeNext = handleSubmit(() => {
    setSubStep("dryRunReport")
  })

  const toVersionOption = MIGRATION_TO_VERSION_OPTIONS.find(
    option => option.value === toVersion
  )

  return (
    <div
      className="flex flex-col h-full"
      data-testid="migration-scope-dry-run-step"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-[720px] mx-auto w-full flex flex-col gap-6">
          <WizardStepper
            testIdPrefix="migration-scope-"
            currentStepKey={
              subStep === "defineScope" ? "defineScope" : "dryRun"
            }
            steps={[
              {
                key: "defineScope",
                label: t("migration.defineScope.miniSteps.defineScope"),
              },
              {
                key: "dryRun",
                label: t("migration.defineScope.miniSteps.dryRun"),
              },
            ]}
          />

          {subStep === "defineScope" && (
            <div
              className="flex flex-col gap-6"
              data-testid="define-scope-panel"
            >
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("migration.defineScope.title")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("migration.defineScope.subtitle")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t("migration.defineScope.fields.fromVersion")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.fromVersion}
                    disabled
                    readOnly
                    className="w-24"
                    data-testid="define-scope-from-version"
                  />
                  <Badge variant="outline">
                    {t("catalogStates.deprecated")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("migration.defineScope.fields.fromVersionHint")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="to-version" error={!!errors.toVersion}>
                  {t("migration.defineScope.fields.toVersion")}
                </Label>
                <SelectField
                  id="to-version"
                  data-testid="define-scope-to-version"
                  value={toVersion}
                  onValueChange={value =>
                    setValue("toVersion", value, { shouldValidate: true })
                  }
                  options={[...MIGRATION_TO_VERSION_OPTIONS]}
                  placeholder={t(
                    "migration.defineScope.fields.toVersionPlaceholder"
                  )}
                  error={!!errors.toVersion}
                />
                {errors.toVersion && (
                  <p className="text-sm text-destructive">
                    {resolveErrorMessage(errors.toVersion.message)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label error={!!errors.scope}>
                  {t("migration.defineScope.fields.scope")}
                </Label>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input p-2">
                  {scope.map(id => (
                    <Badge key={id} variant="outline" className="gap-1">
                      {id}
                      <button
                        type="button"
                        data-testid={`define-scope-remove-${id}`}
                        aria-label={t(
                          "migration.defineScope.fields.scopeRemoveLabel",
                          { id }
                        )}
                        onClick={() => handleRemoveScopeId(id)}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                  <input
                    data-testid="define-scope-id-input"
                    className="flex-1 min-w-[140px] outline-none text-sm bg-transparent"
                    placeholder={t(
                      "migration.defineScope.fields.scopeInputPlaceholder"
                    )}
                    value={scopeInputValue}
                    onChange={event => setScopeInputValue(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleAddScopeId()
                      }
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("migration.defineScope.fields.scopeHint")}
                </p>
                {errors.scope && (
                  <p className="text-sm text-destructive">
                    {resolveErrorMessage(errors.scope.message)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="migration-justification"
                  error={!!errors.justification}
                >
                  {t("migration.defineScope.fields.justification")}
                </Label>
                <Textarea
                  id="migration-justification"
                  data-testid="define-scope-justification"
                  rows={3}
                  placeholder={t(
                    "migration.defineScope.fields.justificationPlaceholder"
                  )}
                  aria-invalid={!!errors.justification || undefined}
                  {...register("justification")}
                />
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("migration.defineScope.fields.justificationHint")}
                </p>
                {errors.justification && (
                  <p className="text-sm text-destructive">
                    {resolveErrorMessage(errors.justification.message)}
                  </p>
                )}
              </div>
            </div>
          )}

          {subStep === "dryRunReport" && (
            <div
              className="flex flex-col gap-6"
              data-testid="dry-run-report-panel"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("migration.dryRunReport.title")}
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  data-testid="dry-run-download-button"
                >
                  <Download size={16} />
                  {t("migration.dryRunReport.downloadButton")}
                </Button>
              </div>
              <MigrationDryRunReportTable />
            </div>
          )}

          {subStep === "review" && (
            <div className="flex flex-col gap-6" data-testid="review-panel">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("migration.review.title")}
              </h2>

              <div className="border border-border rounded-xl bg-background overflow-hidden">
                <div className="bg-muted px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {t("migration.review.sections.migrationRequest")}
                  </p>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <ReviewRow
                    label={t("migration.review.fields.fromVersion")}
                    value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.fromVersion}
                  />
                  <ReviewRow
                    label={t("migration.review.fields.toVersion")}
                    value={toVersionOption?.label ?? toVersion}
                  />
                  <ReviewRow
                    label={t("migration.review.fields.businessObjectsInScope")}
                    value={
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {scope.map(id => (
                          <Badge key={id} variant="outline">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                  <ReviewRow
                    label={t("migration.review.fields.justification")}
                    value={justification}
                  />
                </div>
              </div>

              <div className="border border-border rounded-xl bg-background overflow-hidden">
                <div className="bg-muted px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {t("migration.review.sections.dryRunReport")}
                  </p>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <ReviewRow
                    label={t("migration.dryRunReport.report")}
                    value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.reportId}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <MigrationSummaryStat
                      label={t("migration.dryRunReport.summary.added")}
                      value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.added}
                    />
                    <MigrationSummaryStat
                      label={t("migration.dryRunReport.summary.modified")}
                      value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.modified}
                    />
                    <MigrationSummaryStat
                      label={t("migration.dryRunReport.summary.deactivated")}
                      value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.deactivated}
                    />
                  </div>
                </div>
              </div>

              <Alert data-testid="migration-review-approval-notice">
                <AlertDescription>
                  {t("migration.review.approvalNotice")}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-6 py-[14px] flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          data-testid="migration-scope-cancel-button"
          onClick={onCancel}
        >
          {t("migration.defineScope.actions.cancel")}
        </Button>

        <div className="flex items-center gap-2.5">
          {subStep !== "defineScope" && (
            <Button
              type="button"
              variant="outline"
              data-testid="migration-scope-back-button"
              onClick={() =>
                setSubStep(
                  subStep === "review" ? "dryRunReport" : "defineScope"
                )
              }
            >
              <ArrowLeft size={16} />
              {t("migration.dryRunReport.actions.back")}
            </Button>
          )}
          {subStep === "defineScope" && (
            <Button
              type="button"
              data-testid="migration-scope-next-button"
              onClick={handleDefineScopeNext}
            >
              {t("migration.defineScope.actions.next")}
              <ArrowRight size={16} />
            </Button>
          )}
          {subStep === "dryRunReport" && (
            <Button
              type="button"
              data-testid="migration-scope-report-next-button"
              onClick={() => setSubStep("review")}
            >
              {t("migration.dryRunReport.actions.next")}
              <ArrowRight size={16} />
            </Button>
          )}
          {subStep === "review" && (
            <Button
              type="button"
              data-testid="migration-scope-submit-button"
              onClick={() => setIsSubmittedDialogOpen(true)}
            >
              {t("migration.review.actions.submit")}
            </Button>
          )}
        </div>
      </div>

      <DialogModal open={isSubmittedDialogOpen} onOpenChange={() => {}}>
        <div
          className="p-6 flex flex-col gap-6"
          data-testid="migration-submitted-dialog"
        >
          <div className="flex flex-col gap-3">
            <div className="bg-success/10 p-3 rounded-[14px] w-fit">
              <Check size={24} className="text-success" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-3">
              <DialogTitle>{t("migration.submitted.title")}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {t("migration.submitted.description")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            data-testid="migration-submitted-back-button"
            onClick={onSubmittedBackToCatalog}
          >
            <ArrowLeft size={16} />
            {t("migration.submitted.backButton")}
          </Button>
        </div>
      </DialogModal>
    </div>
  )
}

export { MigrationScopeDryRunStep }
