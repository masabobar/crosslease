import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useProposeIdentityChange } from "@/features/partners/hooks/useProposeIdentityChange"
import { ANCHOR_FIELDS } from "@/features/partners/constants"
import { ApiError } from "@/lib/api"
import { COUNTRIES } from "@/lib/countries"
import type { PartnerIdentityDetail } from "@/features/partners/api/schema"

const COUNTRY_OPTIONS = COUNTRIES.map(c => ({ value: c.code, label: c.name }))

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
  const [values, setValues] = useState<Record<string, string>>({})
  const [reason, setReason] = useState("")

  const anchors = ANCHOR_FIELDS[identity.partner_type]
  const selectedKeys = Object.keys(values)
  const canSubmit = selectedKeys.length > 0 && reason.trim().length > 0

  function toggleAnchor(key: string, checked: boolean) {
    setValues(prev => {
      const next = { ...prev }
      if (checked) {
        const current = (identity as Record<string, unknown>)[key]
        next[key] = typeof current === "string" ? current : ""
      } else {
        delete next[key]
      }
      return next
    })
  }

  function handleClose() {
    onOpenChange(false)
    setValues({})
    setReason("")
  }

  function handleSubmit() {
    mutation.mutate(
      {
        target_anchors: selectedKeys,
        proposed_values: values,
        change_reason: reason,
      },
      {
        onSuccess: result => {
          toast[result.status === "committed" ? "success" : "info"](
            t(
              result.status === "committed"
                ? "proposeIdentityChangeDialog.successCommitted"
                : "proposeIdentityChangeDialog.successPendingApproval"
            )
          )
          handleClose()
        },
        onError: err => {
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
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>{t("proposeIdentityChangeDialog.title")}</DialogTitle>
        </DialogHeader>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-2">
          <Label>{t("proposeIdentityChangeDialog.fields.targetAnchors")}</Label>
          {anchors.map(anchor => (
            <div key={anchor.key} className="flex flex-col gap-1.5">
              <Label className="cursor-pointer font-normal">
                <Checkbox
                  data-testid={`propose-anchor-${anchor.key}`}
                  checked={anchor.key in values}
                  onCheckedChange={c => toggleAnchor(anchor.key, !!c)}
                />
                <span className="text-sm text-foreground">
                  {t(anchor.labelKey as "submit.identityStep.fields.legalName")}
                </span>
              </Label>
              {anchor.key in values && (
                <div className="ml-6">
                  {anchor.key === "country" ? (
                    <Combobox
                      items={COUNTRY_OPTIONS}
                      value={values[anchor.key]}
                      onValueChange={value =>
                        setValues(prev => ({
                          ...prev,
                          [anchor.key]: (value as string) ?? "",
                        }))
                      }
                    >
                      <ComboboxInput
                        data-testid={`propose-value-${anchor.key}`}
                        placeholder={t("list.filters.countrySearchPlaceholder")}
                        showClear
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxEmpty>
                            {t("list.filters.noCountriesFound")}
                          </ComboboxEmpty>
                          <ComboboxCollection>
                            {(opt: { value: string; label: string }) => (
                              <ComboboxItem value={opt.value}>
                                {opt.label}
                              </ComboboxItem>
                            )}
                          </ComboboxCollection>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  ) : (
                    <Input
                      data-testid={`propose-value-${anchor.key}`}
                      value={values[anchor.key]}
                      onChange={e =>
                        setValues(prev => ({
                          ...prev,
                          [anchor.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="propose-reason">
            {t("proposeIdentityChangeDialog.fields.reason")}
          </Label>
          <Textarea
            id="propose-reason"
            data-testid="propose-reason"
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-amber-500/10">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-600">
            {t("proposeIdentityChangeDialog.riskNote")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
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
          onClick={handleSubmit}
          disabled={mutation.isPending || !canSubmit}
          data-testid="propose-submit"
        >
          {mutation.isPending
            ? t("proposeIdentityChangeDialog.submitting")
            : t("proposeIdentityChangeDialog.submit")}
        </Button>
      </div>
    </DialogModal>
  )
}

export { ProposeIdentityChangeDialog }
