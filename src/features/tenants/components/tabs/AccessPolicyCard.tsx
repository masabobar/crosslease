import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { SquarePen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/formatters"
import {
  TenantInfoCard,
  CARD_ACTION_BUTTON_CLASS,
} from "@/features/tenants/components/TenantInfoCard"
import { ToggleStatePill } from "@/features/tenants/components/ToggleStatePill"
import { useTenantAccessPolicy } from "@/features/tenants/hooks/useTenantAccessPolicy"
import { useUpdateAccessPolicy } from "@/features/tenants/hooks/useUpdateAccessPolicy"
import { useTenantFormErrorHandler } from "@/features/tenants/hooks/useTenantFormErrorHandler"
import { UpdateAccessPolicyFormSchema } from "@/features/tenants/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import type {
  AccessPolicyFlagRecord,
  UpdateAccessPolicyForm,
} from "@/features/tenants/api/schema"

type AccessPolicyCardProps = {
  tenantId: string
  isEditable: boolean
}

// One row per policy flag. The form field name and the display label travel
// together so the read view and the edit view cannot drift apart.
const POLICY_FLAGS = [
  {
    field: "support_read_only_access_allowed",
    labelKey: "detail.overview.accessPolicy.supportReadOnlyAccess",
    record: "support_read_only_access",
  },
  {
    field: "auditor_access_allowed",
    labelKey: "detail.overview.accessPolicy.auditorAccess",
    record: "auditor_access",
  },
  {
    field: "lc_portal_enabled",
    labelKey: "detail.overview.accessPolicy.lcPortal",
    record: "lc_portal",
  },
] as const satisfies readonly {
  field: keyof UpdateAccessPolicyForm
  labelKey: string
  record: string
}[]

export function AccessPolicyCard({
  tenantId,
  isEditable,
}: AccessPolicyCardProps) {
  const { t } = useTranslation("tenants")
  const { data: accessPolicy, isError, error } = useTenantAccessPolicy(tenantId)
  const mutation = useUpdateAccessPolicy(tenantId)
  const [isEditing, setIsEditing] = useState(false)

  const {
    setError,
    getValues,
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAccessPolicyForm>({
    resolver: zodResolver(UpdateAccessPolicyFormSchema),
    defaultValues: {
      support_read_only_access_allowed:
        accessPolicy?.support_read_only_access.enabled ?? false,
      auditor_access_allowed: accessPolicy?.auditor_access.enabled ?? false,
      lc_portal_enabled: accessPolicy?.lc_portal.enabled ?? false,
      reason: "",
    },
  })

  const handleError = useTenantFormErrorHandler({ getValues, setError })

  // The form is built before the policy query resolves, so its `defaultValues` are all
  // false. Both entering and leaving edit mode reset from the loaded policy instead —
  // a bare `reset()` would restore those pre-load falses.
  function policyFormValues() {
    return {
      support_read_only_access_allowed:
        accessPolicy?.support_read_only_access.enabled ?? false,
      auditor_access_allowed: accessPolicy?.auditor_access.enabled ?? false,
      lc_portal_enabled: accessPolicy?.lc_portal.enabled ?? false,
      reason: "",
    }
  }

  function startEdit() {
    reset(policyFormValues())
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
    reset(policyFormValues())
  }

  // mutateAsync rather than mutate so `isSubmitting` stays true for the whole
  // round-trip and keeps the footer buttons disabled.
  async function onSubmit(data: UpdateAccessPolicyForm) {
    try {
      await mutation.mutateAsync(data)
      toast.success(t("detail.overview.accessPolicy.successToast"))
      setIsEditing(false)
    } catch (err) {
      handleError(err)
    }
  }

  function flagRecord(name: string): AccessPolicyFlagRecord | undefined {
    return accessPolicy?.[name as keyof typeof accessPolicy]
  }

  function modifiedLine(flag: AccessPolicyFlagRecord | undefined) {
    if (!flag || (flag.modified_by === null && flag.modified_at === null)) {
      return null
    }
    return t("detail.overview.accessPolicy.modifiedBy", {
      name: flag.modified_by ?? "",
      date: formatDate(flag.modified_at),
    })
  }

  const cardActions = isEditing ? (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className={CARD_ACTION_BUTTON_CLASS}
        onClick={cancelEdit}
        disabled={isSubmitting}
        data-testid="btn-cancel-edit-access-policy"
      >
        {t("detail.overview.cancel")}
      </Button>
      <Button
        type="submit"
        form="access-policy-edit-form"
        className={CARD_ACTION_BUTTON_CLASS}
        disabled={isSubmitting}
        data-testid="btn-confirm-edit-access-policy"
      >
        {t("detail.overview.confirmChange")}
      </Button>
    </div>
  ) : isEditable ? (
    <Button
      type="button"
      variant="outline"
      className={`gap-1 ${CARD_ACTION_BUTTON_CLASS}`}
      onClick={startEdit}
      data-testid="btn-edit-access-policy"
    >
      <SquarePen size={14} />
      {t("detail.overview.edit")}
    </Button>
  ) : undefined

  return (
    <TenantInfoCard
      title={t("detail.overview.accessPolicy.title")}
      editButton={cardActions}
    >
      {isError ? (
        <p
          data-testid="access-policy-error"
          className="text-sm text-destructive"
        >
          {resolveApiErrorMessage(error, t)}
        </p>
      ) : isEditing ? (
        <form
          id="access-policy-edit-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="flex flex-col gap-3 text-sm">
            {POLICY_FLAGS.map(({ field, labelKey, record }) => {
              const label = t(
                labelKey as "detail.overview.accessPolicy.lcPortal"
              )
              const modified = modifiedLine(flagRecord(record))
              return (
                <div
                  key={field}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground leading-5">
                      {label}
                    </span>
                    {modified && (
                      <span className="text-xs text-muted-foreground">
                        {modified}
                      </span>
                    )}
                  </div>
                  <Controller
                    control={control}
                    name={field}
                    render={({ field: controlled }) => (
                      <Switch
                        checked={controlled.value}
                        onCheckedChange={controlled.onChange}
                        aria-label={label}
                        data-testid={`edit-access-policy-${field}`}
                      />
                    )}
                  />
                </div>
              )
            })}

            <div className="flex flex-col gap-1 pt-1">
              <span className="text-muted-foreground">
                {t("detail.overview.accessPolicy.governanceJustification")}
                <span className="text-destructive ml-0.5">*</span>
              </span>
              <Textarea
                {...register("reason")}
                className="resize-none text-sm"
                rows={2}
                data-testid="edit-access-policy-reason"
                aria-invalid={!!errors.reason}
              />
              {errors.reason && (
                <p className="text-xs text-destructive">
                  {t("detail.overview.accessPolicy.errors.reasonRequired")}
                </p>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="flex gap-16 text-sm">
          <div className="flex flex-col gap-3 text-muted-foreground shrink-0">
            {POLICY_FLAGS.map(({ field, labelKey }) => (
              <span
                key={field}
                className="min-h-[38px] flex items-start leading-5"
              >
                {t(labelKey as "detail.overview.accessPolicy.lcPortal")}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {POLICY_FLAGS.map(({ field, record }) => {
              const flag = flagRecord(record)
              const modified = modifiedLine(flag)
              return (
                <div key={field} className="flex flex-col gap-1 min-h-[38px]">
                  {flag ? (
                    <>
                      <ToggleStatePill
                        isEnabled={flag.enabled}
                        className="self-start"
                        label={
                          flag.enabled
                            ? t("detail.overview.accessPolicy.enabled")
                            : t("detail.overview.accessPolicy.disabled")
                        }
                      />
                      {modified && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {modified}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground leading-5">—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </TenantInfoCard>
  )
}
