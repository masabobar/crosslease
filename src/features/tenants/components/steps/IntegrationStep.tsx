import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateTenantForm } from "@/features/tenants/api/schema"

type Props = {
  form: UseFormReturn<CreateTenantForm>
}

function IntegrationStep({ form }: Props) {
  const { t } = useTranslation("tenants")
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div
      className="border border-border bg-background rounded-[10px] p-4 flex flex-col gap-[14px]"
      data-testid="integration-step"
    >
      {/* Core banking reference input */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="core_banking_integration_ref"
          error={!!errors.core_banking_integration_ref}
        >
          {t("fields.coreBankingRef")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("fields.descriptionOptional")}
          </span>
        </Label>
        <Input
          id="core_banking_integration_ref"
          data-testid="core-banking-ref-input"
          error={!!errors.core_banking_integration_ref}
          {...register("core_banking_integration_ref")}
        />
        <p className="text-sm text-muted-foreground/80">
          {t("fields.coreBankingRefHint")}
        </p>
        {errors.core_banking_integration_ref && (
          <p className="text-sm text-destructive">
            {errors.core_banking_integration_ref.message}
          </p>
        )}
      </div>

      {/* Optional info alert */}
      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-600 rounded-xl px-2.5 py-2">
        <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-600/80">
          {t("wizard.integration.optionalAlert")}
        </p>
      </div>
    </div>
  )
}

export { IntegrationStep }
