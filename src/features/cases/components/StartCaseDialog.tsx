import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { showApiError } from "@/lib/apiErrorMessage"
import { resolveFormMessage } from "@/lib/formMessages"
import { caseDetail } from "@/router/paths"
import { CaseTypeSchema } from "@/features/cases/api/schema"
import { useCreateCase } from "@/features/cases/hooks/useCreateCase"
import { useStartableCaseTypes } from "@/features/cases/hooks/useStartableCaseTypes"

// The case type is the only field the backend needs to start a case (StartCaseRequest). Only the
// refinancing request has any built behaviour yet (its document-driven status, and the eventual
// guided wizard); the other six are shown but DISABLED so the roadmap is visible without letting a
// tester create a dead-end case of a type nothing yet acts on. Re-enable each as its process lands.
const ENABLED_CASE_TYPE = CaseTypeSchema.enum.refinancing_request

const startCaseSchema = z.object({
  caseType: z.string().min(1, "required"),
})

type StartCaseFormValues = z.infer<typeof startCaseSchema>

const CASE_TYPE_OPTIONS = CaseTypeSchema.options.map(value => ({
  value,
  labelKey: `caseTypes.${value}` as const,
}))

type Props = {
  onOpenChange: (open: boolean) => void
  // Where to go after the case is created. The bank flow lands on the case detail page; the
  // leasing-company flow lands on its own documents surface (the bank detail route is closed to LC).
  // Defaults to the case detail page so the bank call sites need no change.
  redirectTo?: (createdId: string) => string
}

function StartCaseDialog({ onOpenChange, redirectTo }: Props) {
  const { t } = useTranslation("cases")
  const navigate = useNavigate()
  const createCase = useCreateCase()
  // The bank must have at least one requirement configured for a case type, or the backend refuses
  // to start it (PRD1042-1794). Disable those types up front so the user never hits the dead end.
  const { data: startableCaseTypes } = useStartableCaseTypes()

  // A type is offered only when it has built behaviour AND the bank has requirements for it. While
  // the startable set is loading, fall back to the built-type gate alone (the submit still surfaces
  // any 422). A type with no requirements is disabled with its own reason, distinct from "coming
  // soon".
  function disabledReason(
    value: string
  ): "coming_soon" | "no_requirements" | null {
    if (value !== ENABLED_CASE_TYPE) return "coming_soon"
    if (startableCaseTypes && !startableCaseTypes.includes(value))
      return "no_requirements"
    return null
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StartCaseFormValues>({
    resolver: zodResolver(startCaseSchema),
    defaultValues: { caseType: CaseTypeSchema.enum.refinancing_request },
  })

  function resolveMessage(message: string | undefined): string | undefined {
    return resolveFormMessage(message, t, "start.errors")
  }

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: StartCaseFormValues) {
    createCase.mutate(CaseTypeSchema.parse(values.caseType), {
      onSuccess: created => {
        toast.success(t("start.success"))
        handleClose()
        navigate(redirectTo ? redirectTo(created.id) : caseDetail(created.id))
      },
      onError: err => showApiError(err, t),
    })
  }

  return (
    <DialogModal open onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("start.title")}</DialogTitle>
            <DialogDescription>{t("start.subtitle")}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div>
            <Label
              htmlFor="start-case-type"
              error={!!errors.caseType}
              className="mb-2"
            >
              {t("start.fields.caseType")}
            </Label>
            <Controller
              control={control}
              name="caseType"
              render={({ field }) => (
                <SelectField
                  id="start-case-type"
                  data-testid="start-case-type-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={CASE_TYPE_OPTIONS.map(o => {
                    const reason = disabledReason(o.value)
                    const label =
                      reason === "coming_soon"
                        ? t("start.caseTypeComingSoon", { type: t(o.labelKey) })
                        : reason === "no_requirements"
                          ? t("start.caseTypeNoRequirements", {
                              type: t(o.labelKey),
                            })
                          : t(o.labelKey)
                    return { value: o.value, label, disabled: reason !== null }
                  })}
                  error={!!errors.caseType}
                />
              )}
            />
            {errors.caseType && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.caseType.message)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            data-testid="start-case-cancel"
            onClick={handleClose}
          >
            {t("start.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="start-case-submit"
            disabled={createCase.isPending}
          >
            {t("start.actions.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { StartCaseDialog }
