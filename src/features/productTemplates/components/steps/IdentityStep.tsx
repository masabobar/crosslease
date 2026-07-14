import type { UseFormReturn } from "react-hook-form"
import { useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
  hideTemplateCode?: boolean
}

function IdentityStep({ form, hideTemplateCode = false }: Props) {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { register, control } = form
  const { errors } = useFormState({ control })

  function resolveMsg(msg: string | undefined) {
    if (!msg) return undefined
    if (msg === "required") return tCommon("validation.required")
    if (msg === "codeInvalidChars") return t("errors.codeInvalidChars")
    return msg
  }

  return (
    <div
      className="border border-border rounded-xl bg-background p-4 flex flex-col gap-6"
      data-testid="identity-step"
    >
      <div>
        <Label
          htmlFor="template_name"
          error={!!errors.template_name}
          className="mb-2"
        >
          {t("fields.templateName")}
        </Label>
        <Input
          id="template_name"
          data-testid="template-name-input"
          error={!!errors.template_name}
          {...register("template_name")}
        />
        {errors.template_name && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.template_name.message)}
          </p>
        )}
      </div>

      {!hideTemplateCode && (
        <div>
          <Label
            htmlFor="template_code"
            error={!!errors.template_code}
            className="mb-2"
          >
            {t("fields.templateCode")}
          </Label>
          <Input
            id="template_code"
            data-testid="template-code-input"
            error={!!errors.template_code}
            {...register("template_code")}
          />
          <p className="mt-2 text-sm text-muted-foreground opacity-80">
            {t("fields.templateCodeHint")}
          </p>
          {errors.template_code && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.template_code.message)}
            </p>
          )}
        </div>
      )}

      <div>
        <Label
          htmlFor="template_description"
          error={!!errors.template_description}
          className="mb-2"
        >
          {t("fields.templateDescription")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("fields.optional")}
          </span>
        </Label>
        <Textarea
          id="template_description"
          data-testid="template-description-textarea"
          className="min-h-[64px] resize-none"
          rows={2}
          {...register("template_description")}
        />
        <p className="mt-2 text-sm text-muted-foreground opacity-80">
          {t("fields.templateDescriptionHint")}
        </p>
        {errors.template_description && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.template_description.message)}
          </p>
        )}
      </div>
    </div>
  )
}

export { IdentityStep }
