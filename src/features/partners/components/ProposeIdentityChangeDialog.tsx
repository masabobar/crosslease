import { Controller, useForm, useWatch } from "react-hook-form"
import type { Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { IdentityChangeStatusSchema } from "@/features/partners/api/schema"
import { useProposeIdentityChange } from "@/features/partners/hooks/useProposeIdentityChange"
import { ANCHOR_FIELDS } from "@/features/partners/constants"
import {
  isCommercialRegisterApplicable,
  isNotFutureDate,
} from "@/features/partners/utils"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { COUNTRIES } from "@/lib/countries"
import { selectOnFocus } from "@/lib/utils"
import type { PartnerIdentityDetail } from "@/features/partners/api/schema"

const COUNTRY_OPTIONS = COUNTRIES.map(c => ({ value: c.code, label: c.name }))

// Anchors whose proposed value is a date, not free text — these render a
// DatePicker and carry the same not-in-the-future rule the submit form applies
// (.claude/rules/date-inputs.md §1: the calendar bound alone is not enough).
const DATE_ANCHOR_KEYS = new Set(["date_of_birth"])

// Target anchors + proposed values are a dynamic keyed map (the available
// anchors depend on identity.partner_type — see ANCHOR_FIELDS): at least one
// anchor must be selected, and the change reason must not be blank, mirroring
// the BE contract for POST /partners/:id/identity-changes.
const proposeIdentityChangeSchema = z
  .object({
    values: z.record(z.string(), z.string()),
    reason: z.string(),
  })
  .refine(data => Object.keys(data.values).length > 0, {
    message: "targetAnchorRequired",
    path: ["values"],
  })
  .refine(data => data.reason.trim().length > 0, {
    message: "reasonRequired",
    path: ["reason"],
  })
  .refine(
    data =>
      Object.entries(data.values).every(
        ([key, value]) => !DATE_ANCHOR_KEYS.has(key) || isNotFutureDate(value)
      ),
    { message: "dateInvalid", path: ["values"] }
  )
type ProposeIdentityChangeForm = z.infer<typeof proposeIdentityChangeSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  identity: PartnerIdentityDetail
}

function ProposeIdentityChangeDialog({
  open,
  onOpenChange,
  partnerId,
  identity,
}: Props) {
  const { t } = useTranslation("partners")
  const mutation = useProposeIdentityChange(partnerId)

  const {
    setError,
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<ProposeIdentityChangeForm>({
    resolver: zodResolver(proposeIdentityChangeSchema),
    mode: "onChange",
    defaultValues: { values: {}, reason: "" },
  })

  const anchors = ANCHOR_FIELDS[identity.partner_type]
  const values = useWatch({ control, name: "values" }) ?? {}

  // Country anchor isn't required to be proposed — fall back to the
  // partner's current country so the HRB gate reflects reality even when
  // only commercial_register_no is being changed.
  const effectiveCountry =
    "country" in values ? values.country : identity.country
  const isCommercialRegisterFieldEditable = isCommercialRegisterApplicable(
    identity.partner_type,
    effectiveCountry
  )

  function toggleAnchor(key: string, checked: boolean) {
    const next = { ...getValues("values") }
    if (checked) {
      const current = (identity as Record<string, unknown>)[key]
      next[key] = typeof current === "string" ? current : ""
    } else {
      delete next[key]
    }
    setValue("values", next, { shouldValidate: true })
  }

  // A commercial register number only makes sense for DE — if the proposed
  // country moves away from DE, drop any pending HRB anchor rather than let
  // a country/HRB mismatch reach the API (US 13.1).
  function dropCommercialRegisterIfIneligible(newCountry: string) {
    const currentValues = getValues("values")
    if (
      "commercial_register_no" in currentValues &&
      !isCommercialRegisterApplicable(identity.partner_type, newCountry)
    ) {
      const next = { ...currentValues }
      delete next.commercial_register_no
      setValue("values", next, { shouldValidate: true })
    }
  }

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(data: ProposeIdentityChangeForm) {
    mutation.mutate(
      {
        target_anchors: Object.keys(data.values),
        proposed_values: data.values,
        change_reason: data.reason,
      },
      {
        onSuccess: result => {
          const isCommitted =
            result.status === IdentityChangeStatusSchema.enum.committed
          toast[isCommitted ? "success" : "info"](
            t(
              isCommitted
                ? "proposeIdentityChangeDialog.successCommitted"
                : "proposeIdentityChangeDialog.successPendingApproval"
            )
          )
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
            <DialogTitle>{t("proposeIdentityChangeDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>
              {t("proposeIdentityChangeDialog.fields.targetAnchors")}
            </Label>
            {anchors.map(anchor => (
              <div key={anchor.key} className="flex flex-col gap-1.5">
                <Label className="cursor-pointer font-normal">
                  <Checkbox
                    data-testid={`propose-anchor-${anchor.key}`}
                    checked={anchor.key in values}
                    disabled={
                      anchor.key === "commercial_register_no" &&
                      !isCommercialRegisterFieldEditable
                    }
                    onCheckedChange={c => toggleAnchor(anchor.key, !!c)}
                  />
                  <span className="text-sm text-foreground">
                    {t(
                      anchor.labelKey as "submit.identityStep.fields.legalName"
                    )}
                  </span>
                </Label>
                {anchor.key === "commercial_register_no" &&
                  !isCommercialRegisterFieldEditable && (
                    <p className="ml-6 text-sm text-muted-foreground opacity-80">
                      {t("submit.form.hints.hrbMandatoryDe")}
                    </p>
                  )}
                {anchor.key in values && (
                  <div className="ml-6">
                    {anchor.key === "country" ? (
                      <Controller
                        control={control}
                        name={
                          `values.${anchor.key}` as Path<ProposeIdentityChangeForm>
                        }
                        render={({ field }) => {
                          const selectedCountry =
                            COUNTRY_OPTIONS.find(
                              o => o.value === field.value
                            ) ?? null
                          return (
                            <Combobox
                              items={COUNTRY_OPTIONS}
                              value={selectedCountry}
                              onValueChange={option => {
                                const newCountry = option?.value ?? ""
                                field.onChange(newCountry)
                                dropCommercialRegisterIfIneligible(newCountry)
                              }}
                            >
                              <ComboboxInput
                                data-testid={`propose-value-${anchor.key}`}
                                placeholder={t(
                                  "list.filters.countrySearchPlaceholder"
                                )}
                                showClear
                                onFocus={selectOnFocus}
                              />
                              <ComboboxContent>
                                <ComboboxList>
                                  <ComboboxEmpty>
                                    {t("list.filters.noCountriesFound")}
                                  </ComboboxEmpty>
                                  <ComboboxCollection>
                                    {(opt: {
                                      value: string
                                      label: string
                                    }) => (
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
                    ) : DATE_ANCHOR_KEYS.has(anchor.key) ? (
                      <Controller
                        control={control}
                        name={
                          `values.${anchor.key}` as Path<ProposeIdentityChangeForm>
                        }
                        render={({ field }) => (
                          <DatePicker
                            data-testid={`propose-value-${anchor.key}`}
                            value={field.value as string}
                            onChange={field.onChange}
                            maxDate={new Date()}
                            captionLayout="dropdown"
                          />
                        )}
                      />
                    ) : (
                      <Controller
                        control={control}
                        name={
                          `values.${anchor.key}` as Path<ProposeIdentityChangeForm>
                        }
                        render={({ field }) => (
                          <Input
                            data-testid={`propose-value-${anchor.key}`}
                            value={field.value as string}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
            {errors.values?.message && (
              <p
                className="text-xs text-destructive"
                data-testid="propose-values-error"
              >
                {t(
                  `proposeIdentityChangeDialog.errors.${errors.values.message}` as "proposeIdentityChangeDialog.errors.targetAnchorRequired"
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="propose-reason">
              {t("proposeIdentityChangeDialog.fields.reason")}
            </Label>
            <Textarea
              id="propose-reason"
              data-testid="propose-reason"
              rows={3}
              aria-invalid={!!errors.reason}
              {...register("reason")}
            />
            {errors.reason?.message && (
              <p
                className="text-xs text-destructive"
                data-testid="propose-reason-error"
              >
                {t(
                  `proposeIdentityChangeDialog.errors.${errors.reason.message}` as "proposeIdentityChangeDialog.errors.reasonRequired"
                )}
              </p>
            )}
          </div>

          <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-warning/10">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              {t("proposeIdentityChangeDialog.riskNote")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-muted/40 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="propose-cancel"
          >
            {t("proposeIdentityChangeDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !isValid}
            data-testid="propose-submit"
          >
            {mutation.isPending
              ? t("proposeIdentityChangeDialog.submitting")
              : t("proposeIdentityChangeDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { ProposeIdentityChangeDialog }
