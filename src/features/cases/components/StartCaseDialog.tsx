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

// The case type is the only field the backend needs to start a case (StartCaseRequest). All seven
// types are offered — the backend accepts each identically, and offering all of them is what lets a
// tester see case-type-scoped requirements resolve differently per type. The guided refinancing
// wizard is a later, separate surface; this dialog is the lightweight entry point for every type.
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
}

function StartCaseDialog({ onOpenChange }: Props) {
  const { t } = useTranslation("cases")
  const navigate = useNavigate()
  const createCase = useCreateCase()

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
        navigate(caseDetail(created.id))
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
                  options={CASE_TYPE_OPTIONS.map(o => ({
                    value: o.value,
                    label: t(o.labelKey),
                  }))}
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
