import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Link, SquarePen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  TenantInfoCard,
  CARD_ACTION_BUTTON_CLASS,
} from "@/features/tenants/components/TenantInfoCard"
import { InfoRows } from "@/features/tenants/components/InfoRows"
import type { InfoRow } from "@/features/tenants/components/InfoRows"
import { ToggleStatePill } from "@/features/tenants/components/ToggleStatePill"
import { useTenantIntegrationBinding } from "@/features/tenants/hooks/useTenantIntegrationBinding"
import { useUpsertIntegrationBinding } from "@/features/tenants/hooks/useUpsertIntegrationBinding"
import { UpsertIntegrationBindingFormSchema } from "@/features/tenants/api/schema"
import type {
  UpsertIntegrationBindingForm,
  IntegrationBindingResponse,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"
import { useTenantFormErrorHandler } from "@/features/tenants/hooks/useTenantFormErrorHandler"
import { formatDateTime } from "@/lib/formatters"

type SectionProps = {
  tenantId: string
  tenantName: string
  isAdmin: boolean
  isArchived: boolean
  dialogOpen: boolean
  onDialogOpenChange: (open: boolean) => void
}

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
  existing: IntegrationBindingResponse | null
}

function ConfigureBindingDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  existing,
}: DialogProps) {
  const { t } = useTranslation("tenants")
  const mutation = useUpsertIntegrationBinding(tenantId)
  const hasBinding = !!existing?.id

  const {
    setError,
    getValues,
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertIntegrationBindingForm>({
    resolver: zodResolver(UpsertIntegrationBindingFormSchema),
    defaultValues: {
      endpoint_url: existing?.endpoint_url ?? "",
      credential_scope_identifier: existing?.credential_scope_identifier ?? "",
      integration_active: existing?.integration_active ?? false,
      disbursement_execution_boundary_note:
        existing?.disbursement_execution_boundary_note ?? "",
      justification: "",
    },
  })

  const handleError = useTenantFormErrorHandler({ getValues, setError })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      reset({
        endpoint_url: existing?.endpoint_url ?? "",
        credential_scope_identifier:
          existing?.credential_scope_identifier ?? "",
        integration_active: existing?.integration_active ?? false,
        disbursement_execution_boundary_note:
          existing?.disbursement_execution_boundary_note ?? "",
        justification: "",
      })
    }
    onOpenChange(nextOpen)
  }

  function onSubmit(values: UpsertIntegrationBindingForm) {
    mutation.mutate(
      {
        endpoint_url: values.endpoint_url,
        credential_scope_identifier: values.credential_scope_identifier,
        integration_active: values.integration_active,
        disbursement_execution_boundary_note:
          values.disbursement_execution_boundary_note?.trim() || null,
        justification: values.justification,
      },
      {
        onSuccess: () => {
          toast.success(
            t("detail.overview.integrationBinding.successToast.title"),
            {
              description: t(
                "detail.overview.integrationBinding.successToast.description",
                { tenantName }
              ),
            }
          )
          handleClose()
        },
        onError: handleError,
      }
    )
  }

  const endpointUrlError = errors.endpoint_url?.message
  const endpointUrlErrorKey =
    endpointUrlError === "invalidUrl"
      ? "detail.overview.integrationBinding.errors.invalidUrl"
      : endpointUrlError === "mustBeHttps"
        ? "detail.overview.integrationBinding.errors.mustBeHttps"
        : "detail.overview.integrationBinding.errors.required"

  return (
    <DialogModal open={open} onOpenChange={handleOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>
              {t(
                hasBinding
                  ? "detail.overview.integrationBinding.editDialogTitle"
                  : "detail.overview.integrationBinding.dialogTitle"
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-6 px-4 py-4">
          {/* Core banking endpoint URL */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ib-endpoint-url" className="text-sm font-medium">
              {t("detail.overview.integrationBinding.fields.endpointUrl")}
            </Label>
            <div className="relative">
              <Link
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                id="ib-endpoint-url"
                {...register("endpoint_url")}
                className="pl-8"
                placeholder="https://"
                data-testid="ib-endpoint-url"
                aria-invalid={!!errors.endpoint_url}
              />
            </div>
            {errors.endpoint_url && (
              <p className="text-xs text-destructive" role="alert">
                {t(endpointUrlErrorKey)}
              </p>
            )}
          </div>

          {/* Credential scope identifier */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="ib-credential-scope"
              className="text-sm font-medium"
            >
              {t("detail.overview.integrationBinding.fields.credentialScope")}
            </Label>
            <Input
              id="ib-credential-scope"
              {...register("credential_scope_identifier")}
              data-testid="ib-credential-scope"
              aria-invalid={!!errors.credential_scope_identifier}
            />
            {errors.credential_scope_identifier && (
              <p className="text-xs text-destructive" role="alert">
                {t("detail.overview.integrationBinding.errors.required")}
              </p>
            )}
          </div>

          {/* Integration active flag */}
          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="ib-integration-active"
              className="text-sm font-medium"
            >
              {t("detail.overview.integrationBinding.fields.integrationActive")}
            </Label>
            <Controller
              control={control}
              name="integration_active"
              render={({ field }) => (
                <Switch
                  id="ib-integration-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="ib-integration-active"
                />
              )}
            />
          </div>

          {/* Disbursement execution boundary note (optional) */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="ib-disbursement-note"
              className="text-sm font-medium"
            >
              {t("detail.overview.integrationBinding.fields.disbursementNote")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("detail.overview.integrationBinding.fields.optional")}
              </span>
            </Label>
            <Textarea
              id="ib-disbursement-note"
              {...register("disbursement_execution_boundary_note")}
              className="resize-none"
              rows={3}
              data-testid="ib-disbursement-note"
            />
          </div>

          {/* Governance justification */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ib-justification" className="text-sm font-medium">
                {t("detail.overview.integrationBinding.fields.justification")}
              </Label>
              <span className="text-sm text-muted-foreground/80">
                {t(
                  "detail.overview.integrationBinding.fields.justificationMinChars"
                )}
              </span>
            </div>
            <Textarea
              id="ib-justification"
              {...register("justification")}
              className="resize-none"
              rows={3}
              data-testid="ib-justification"
              aria-invalid={!!errors.justification}
            />
            {errors.justification ? (
              <p className="text-xs text-destructive" role="alert">
                {t(
                  "detail.overview.integrationBinding.errors.justificationTooShort"
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {t(
                  "detail.overview.integrationBinding.fields.justificationHint"
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending || isSubmitting}
            data-testid="ib-cancel"
          >
            {t("detail.overview.integrationBinding.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || isSubmitting}
            data-testid="ib-submit"
          >
            {mutation.isPending
              ? t("detail.overview.integrationBinding.submitting")
              : t("detail.overview.integrationBinding.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

// Rows are built as data so each optional field's condition is written once —
// the label and value columns are rendered from the same array and cannot drift
// out of alignment.
function useBindingRows() {
  const { t } = useTranslation("tenants")
  return function bindingRows(binding: IntegrationBindingResponse): InfoRow[] {
    const label = (key: string) =>
      t(
        `detail.overview.integrationBinding.view.${key}` as "detail.overview.integrationBinding.view.endpointUrl"
      )
    const masked = t("detail.overview.integrationBinding.view.masked")

    const rows: InfoRow[] = [
      {
        label: label("integrationActive"),
        value: (
          <ToggleStatePill
            isEnabled={!!binding.integration_active}
            label={
              binding.integration_active ? label("active") : label("inactive")
            }
          />
        ),
      },
      {
        label: label("endpointUrl"),
        value: (
          <span className="truncate">{binding.endpoint_url ?? masked}</span>
        ),
      },
      {
        label: label("credentialScope"),
        value: (
          <span className="truncate">
            {binding.credential_scope_identifier ?? masked}
          </span>
        ),
      },
    ]

    if (binding.disbursement_execution_boundary_note !== null) {
      rows.push({
        label: label("disbursementNote"),
        value: binding.disbursement_execution_boundary_note || "—",
      })
    }

    rows.push({
      label: label("createdAt"),
      value: formatDateTime(binding.created_at),
    })

    if (binding.updated_at && binding.updated_at !== binding.created_at) {
      rows.push({
        label: label("lastModifiedAt"),
        value: formatDateTime(binding.updated_at),
      })
    }

    if (binding.decommission_timestamp) {
      rows.push({
        label: label("decommissionedAt"),
        value: formatDateTime(binding.decommission_timestamp),
      })
    }

    return rows
  }
}

export function IntegrationBindingSection({
  tenantId,
  tenantName,
  isAdmin,
  isArchived,
  dialogOpen,
  onDialogOpenChange,
}: SectionProps) {
  const { t } = useTranslation("tenants")
  const bindingRows = useBindingRows()
  const {
    data: binding,
    isLoading,
    isError,
    error,
  } = useTenantIntegrationBinding(tenantId)

  const hasBinding = !!binding?.id

  // Only ever rendered via `hasBinding ? editButton : undefined` below, so
  // this is always the "edit" (not "configure") state.
  const editButton =
    isAdmin && !isArchived ? (
      <Button
        type="button"
        variant="outline"
        className={`gap-1 ${CARD_ACTION_BUTTON_CLASS}`}
        onClick={() => onDialogOpenChange(true)}
        data-testid="btn-edit-integration-binding"
      >
        <SquarePen size={14} />
        {t("detail.overview.integrationBinding.editButton")}
      </Button>
    ) : undefined

  return (
    <>
      {isAdmin && binding && (
        <ConfigureBindingDialog
          open={dialogOpen}
          onOpenChange={onDialogOpenChange}
          tenantId={tenantId}
          tenantName={tenantName}
          existing={hasBinding ? binding : null}
        />
      )}

      <TenantInfoCard
        title={t("detail.overview.integrationBinding.title")}
        editButton={hasBinding ? editButton : undefined}
      >
        {isLoading ? (
          <div className="h-20 animate-pulse bg-muted rounded-md" />
        ) : isError ? (
          <p
            className="text-sm text-muted-foreground py-4 text-center"
            data-testid="integration-binding-error"
          >
            {error instanceof ApiError
              ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic")}
          </p>
        ) : !hasBinding ? (
          <div className="flex flex-col items-center gap-3 py-8 px-2">
            <p className="text-sm text-muted-foreground text-center">
              {t("detail.overview.integrationBinding.emptyState")}
            </p>
            {isAdmin && !isArchived && (
              <Button
                type="button"
                variant="outline"
                className={CARD_ACTION_BUTTON_CLASS}
                onClick={() => onDialogOpenChange(true)}
                data-testid="btn-configure-integration-binding"
              >
                {t("detail.overview.integrationBinding.configureButton")}
              </Button>
            )}
          </div>
        ) : (
          <InfoRows rows={bindingRows(binding)} />
        )}
      </TenantInfoCard>
    </>
  )
}
