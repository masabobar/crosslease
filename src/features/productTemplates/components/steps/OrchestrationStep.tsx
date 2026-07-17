import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SectionCard } from "@/features/productTemplates/components/SectionCard"
import {
  DOCUMENT_OPTIONS,
  VALIDATION_RULE_SET_OPTIONS,
  WORKFLOW_TASK_OPTIONS,
} from "@/features/productTemplates/constants"
import { resolveFieldErrorMessage } from "@/features/productTemplates/utils"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
}

function OrchestrationStep({ form }: Props) {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { control } = form
  const { errors } = useFormState({ control })

  const errorMessages = {
    atLeastOneWorkflowTask: t("errors.atLeastOneWorkflowTask"),
    atLeastOneDocument: t("errors.atLeastOneDocument"),
  }
  function resolveMsg(msg: string | undefined) {
    return resolveFieldErrorMessage(
      msg,
      tCommon("validation.required"),
      errorMessages
    )
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
