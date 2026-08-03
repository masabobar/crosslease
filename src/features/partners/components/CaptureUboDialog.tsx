import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxCollection,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCaptureUboOwnership } from "@/features/partners/hooks/useCaptureUboOwnership"
import { usePartnerList } from "@/features/partners/hooks/usePartnerList"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { PartnerTypeSchema } from "@/features/partners/api/schema"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { selectOnFocus } from "@/lib/utils"

const captureUboSchema = z.object({
  ubo_partner_id: z.string().min(1),
  ownership_percentage: z.number().gt(0).max(100),
  indirect_ownership_notes: z.string().optional(),
})
type CaptureUboForm = z.infer<typeof captureUboSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
}

function CaptureUboDialog({ open, onOpenChange, partnerId }: Props) {
  const { t } = useTranslation("partners")
  const mutation = useCaptureUboOwnership(partnerId)
  const { data: currentUser } = useCurrentUser()
  const [search, setSearch] = useState("")

  const { data: partnersData } = usePartnerList(
    currentUser?.tenant_id ?? null,
    {
      status: ["confirmed"],
      search: search || undefined,
    }
  )

  const partnerOptions = (partnersData?.items ?? [])
    .filter(
      p =>
        p.partner_type === PartnerTypeSchema.enum.natural_person &&
        p.partner_id !== partnerId
    )
    .map(p => ({ value: p.partner_id, label: p.display_name }))

  const {
    setError,
    getValues,
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<CaptureUboForm>({
    resolver: zodResolver(captureUboSchema),
  })

  function handleClose() {
    onOpenChange(false)
    reset()
    setSearch("")
  }

  function onSubmit(values: CaptureUboForm) {
    mutation.mutate(
      {
        ubo_partner_id: values.ubo_partner_id,
        ownership_percentage: values.ownership_percentage,
        ownership_type: "direct",
        indirect_ownership_notes: values.indirect_ownership_notes || null,
      },
      {
        onSuccess: () => {
          toast.success(t("captureUboDialog.success"))
          handleClose()
        },
        onError: err => {
          if (
            applyApiFieldErrors({
              error: err,
              fields: Object.keys(getValues()),
              setError,
            })
          )
            return

          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <DialogModal open={open} onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("captureUboDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ubo-partner-combobox">
              {t("detail.ubo.fields.uboPartner")}
            </Label>
            <Controller
              control={control}
              name="ubo_partner_id"
              render={({ field }) => {
                const selectedPartner =
                  partnerOptions.find(o => o.value === field.value) ?? null
                return (
                  <Combobox
                    items={partnerOptions}
                    filter={null}
                    value={selectedPartner}
                    onValueChange={option =>
                      field.onChange(option?.value ?? "")
                    }
                    inputValue={search}
                    onInputValueChange={setSearch}
                  >
                    <ComboboxInput
                      id="ubo-partner-combobox"
                      data-testid="capture-ubo-partner"
                      placeholder={t(
                        "captureUboDialog.fields.uboPartnerPlaceholder"
                      )}
                      showClear
                      aria-invalid={!!errors.ubo_partner_id}
                      onFocus={selectOnFocus}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxEmpty>
                          {t("captureUboDialog.fields.uboPartnerNoResults")}
                        </ComboboxEmpty>
                        <ComboboxCollection>
                          {(opt: { value: string; label: string }) => (
                            <ComboboxItem key={opt.value} value={opt}>
                              {opt.label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )
              }}
            />
            {errors.ubo_partner_id && (
              <p className="text-xs text-destructive">
                {t("captureUboDialog.errors.uboPartnerRequired")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownership-percentage">
              {t("detail.ubo.fields.ownershipPercentage")}
            </Label>
            <Input
              id="ownership-percentage"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              data-testid="capture-ubo-percentage"
              aria-invalid={!!errors.ownership_percentage}
              {...register("ownership_percentage", { valueAsNumber: true })}
            />
            {errors.ownership_percentage && (
              <p className="text-xs text-destructive">
                {t("captureUboDialog.errors.percentageInvalid")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="indirect-ownership-notes">
              {t("captureUboDialog.fields.indirectOwnershipNotes")}
            </Label>
            <Textarea
              id="indirect-ownership-notes"
              data-testid="capture-ubo-indirect-notes"
              rows={2}
              placeholder={t(
                "captureUboDialog.fields.indirectOwnershipNotesPlaceholder"
              )}
              {...register("indirect_ownership_notes")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-muted/40 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="capture-ubo-cancel"
          >
            {t("captureUboDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="capture-ubo-submit"
          >
            {mutation.isPending
              ? t("captureUboDialog.submitting")
              : t("captureUboDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { CaptureUboDialog }
