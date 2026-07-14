import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SectionCard } from "@/features/productTemplates/components/SectionCard"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

// Static options — no Workflow Task Catalog (E15), Document Requirement Catalog (E16), or
// Validation & Gating Engine (E18) list endpoint exists on the BE at all (only the save
// endpoint itself exists, and its own reference check is a stub that accepts any UUID).
// Mirrors the same precedent already used for NPV Formula Reference in BehavioralSettingsStep.
const WORKFLOW_TASK_OPTIONS = [
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e01",
    code: "WT-CREDIT-CHECK",
    version: "v4",
    labelKey: "workflowTasks.creditAssessment",
  },
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e02",
    code: "WT-COLLATERAL-VAL",
    version: "v2",
    labelKey: "workflowTasks.collateralValuation",
  },
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e03",
    code: "WT-AML-SCREEN",
    version: "v3",
    labelKey: "workflowTasks.amlScreening",
  },
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e04",
    code: "WT-DISBURSEMENT-APPR",
    version: "v1",
    labelKey: "workflowTasks.disbursementApproval",
  },
] as const

const DOCUMENT_OPTIONS = [
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f01",
    code: "DOC-ASSET-INVOICE",
    version: "v2",
    labelKey: "documentRequirements.assetInvoice",
  },
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f02",
    code: "DOC-LEASE-AGREEMENT",
    version: "v2",
    labelKey: "documentRequirements.leaseAgreement",
  },
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f03",
    code: "DOC-FINANCIALS",
    version: "v1",
    labelKey: "documentRequirements.financialStatements",
  },
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f04",
    code: "DOC-INSURANCE",
    version: "v2",
    labelKey: "documentRequirements.insuranceCertificate",
  },
] as const

const VALIDATION_RULE_SET_OPTIONS = [
  {
    id: "d5f3c4a6-ab8c-4e33-9f4d-3c4d5e6f7a01",
    code: "VRS-STANDARD",
    version: "v5",
    labelKey: "validationRuleSets.standardGating",
  },
  {
    id: "d5f3c4a6-ab8c-4e33-9f4d-3c4d5e6f7a02",
    code: "VRS-REAL-ESTATE",
    version: "v3",
    labelKey: "validationRuleSets.realEstateGating",
  },
  {
    id: "d5f3c4a6-ab8c-4e33-9f4d-3c4d5e6f7a03",
    code: "VRS-PORTFOLIO",
    version: "v3",
    labelKey: "validationRuleSets.portfolioGating",
  },
] as const

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
}

function OrchestrationStep({ form }: Props) {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { control } = form
  const { errors } = useFormState({ control })

  function resolveMsg(msg: string | undefined) {
    if (!msg) return undefined
    if (msg === "required") return tCommon("validation.required")
    if (msg === "atLeastOneWorkflowTask")
      return t("errors.atLeastOneWorkflowTask")
    if (msg === "atLeastOneDocument") return t("errors.atLeastOneDocument")
    return msg
  }

  function renderCheckboxGrid(
    name:
      | "required_workflow_tasks"
      | "required_documents"
      | "optional_documents",
    options: readonly {
      id: string
      code: string
      version: string
      labelKey: string
    }[],
    testIdPrefix: string
  ) {
    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-3">
            {options.map(option => {
              const checked = (field.value ?? []).includes(option.id)
              return (
                <label
                  key={option.id}
                  htmlFor={`${testIdPrefix}-${option.id}`}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer has-data-checked:border-primary has-data-checked:bg-primary/5"
                >
                  <Checkbox
                    id={`${testIdPrefix}-${option.id}`}
                    data-testid={`${testIdPrefix}-${option.id}-checkbox`}
                    checked={checked}
                    onCheckedChange={value => {
                      const current = field.value ?? []
                      field.onChange(
                        value
                          ? [...current, option.id]
                          : current.filter(id => id !== option.id)
                      )
                    }}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {t(option.labelKey as "fields.optional")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.code} · {option.version}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="orchestration-step">
      <SectionCard
        title={t("sections.requiredWorkflowTasks")}
        subtitle={t("fields.requiredWorkflowTasksHint")}
      >
        {renderCheckboxGrid(
          "required_workflow_tasks",
          WORKFLOW_TASK_OPTIONS,
          "workflow-task"
        )}
        {errors.required_workflow_tasks && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.required_workflow_tasks.message)}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={t("sections.requiredDocuments")}
        subtitle={t("fields.requiredDocumentsHint")}
      >
        {renderCheckboxGrid(
          "required_documents",
          DOCUMENT_OPTIONS,
          "required-document"
        )}
        {errors.required_documents && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.required_documents.message)}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={t("sections.optionalDocuments")}
        subtitle={t("fields.optionalDocumentsHint")}
      >
        {renderCheckboxGrid(
          "optional_documents",
          DOCUMENT_OPTIONS,
          "optional-document"
        )}
      </SectionCard>

      <SectionCard
        title={t("sections.validationRuleSet")}
        subtitle={t("fields.validationRuleSetHint")}
      >
        <Controller
          control={control}
          name="validation_rule_set_id"
          render={({ field }) => (
            <RadioGroup
              data-testid="validation-rule-set-radio-group"
              value={field.value}
              onValueChange={field.onChange}
              className="gap-3"
            >
              {VALIDATION_RULE_SET_OPTIONS.map(option => (
                <label
                  key={option.id}
                  htmlFor={`validation-rule-set-${option.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer has-data-checked:border-primary has-data-checked:bg-primary/5"
                >
                  <RadioGroupItem
                    id={`validation-rule-set-${option.id}`}
                    value={option.id}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {t(option.labelKey as "fields.optional")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.code} · {option.version}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {errors.validation_rule_set_id && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.validation_rule_set_id.message)}
          </p>
        )}
      </SectionCard>
    </div>
  )
}

export { OrchestrationStep }
