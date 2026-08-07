import { useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { SquarePen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  TenantInfoCard,
  CARD_ACTION_BUTTON_CLASS,
} from "@/features/tenants/components/TenantInfoCard"
import { InfoRows } from "@/features/tenants/components/InfoRows"
import type { InfoRow } from "@/features/tenants/components/InfoRows"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { AccessPolicyCard } from "@/features/tenants/components/tabs/AccessPolicyCard"
import { useUpdateTenant } from "@/features/tenants/hooks/useUpdateTenant"
import { useTenantFormErrorHandler } from "@/features/tenants/hooks/useTenantFormErrorHandler"
import {
  isFullTenantResponse,
  createUpdateTenantFormSchema,
  TenantStatusSchema,
} from "@/features/tenants/api/schema"
import type {
  TenantDetail,
  UpdateTenantForm,
} from "@/features/tenants/api/schema"
import { formatDateTime } from "@/lib/formatters"
import { countryName } from "@/lib/countries"

type OverviewTabProps = {
  tenant: TenantDetail
  tenantId: string
  isAdmin: boolean
}

// Currency display name, not a monetary amount — distinct from
// formatCurrency() in @/lib/formatters, which formats figures.
function currencyLabel(code: string): string {
  const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code)
  return name ? `${name} (${code})` : code
}

export function OverviewTab({ tenant, tenantId, isAdmin }: OverviewTabProps) {
  const { t } = useTranslation("tenants")
  const fullTenant = isFullTenantResponse(tenant) ? tenant : null
  const isArchived = tenant.status === TenantStatusSchema.enum.archived
  const isDraft = tenant.status === TenantStatusSchema.enum.draft
  const [isEditingIdentity, setIsEditingIdentity] = useState(false)

  const updateTenantMutation = useUpdateTenant(tenantId)

  const {
    setError,
    getValues,
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTenantForm>({
    resolver: zodResolver(createUpdateTenantFormSchema(fullTenant?.name ?? "")),
    defaultValues: {
      name: fullTenant?.name ?? "",
      legal_entity_name: fullTenant?.legal_entity_name ?? "",
      description: fullTenant?.description ?? "",
      legal_hold_flag: fullTenant?.legal_hold_flag ?? false,
      justification: "",
    },
  })

  const handleError = useTenantFormErrorHandler({ getValues, setError })

  const watchedName = useWatch({ control, name: "name" })
  const hasNameChanged =
    (watchedName ?? "").trim() !== (fullTenant?.name ?? "").trim()

  function startIdentityEdit() {
    if (fullTenant) {
      reset({
        name: fullTenant.name,
        legal_entity_name: fullTenant.legal_entity_name,
        description: fullTenant.description ?? "",
        legal_hold_flag: fullTenant.legal_hold_flag,
        justification: "",
      })
    }
    setIsEditingIdentity(true)
  }

  function cancelEdit() {
    setIsEditingIdentity(false)
    reset()
  }

  async function onSubmit(data: UpdateTenantForm) {
    const isNameChanged = data.name.trim() !== (fullTenant?.name ?? "").trim()
    try {
      await updateTenantMutation.mutateAsync({
        ...(isNameChanged && { name: data.name }),
        legal_entity_name: data.legal_entity_name,
        description: data.description?.trim() || null,
        legal_hold_flag: data.legal_hold_flag,
        justification: isNameChanged
          ? data.justification?.trim() || undefined
          : undefined,
      })
      toast.success(t("detail.overview.editDialog.successToast"))
      setIsEditingIdentity(false)
    } catch (err) {
      handleError(err)
    }
  }

  // Both readouts key off the same condition today: only an active tenant may
  // take on new business and is operationally ready.
  const isActive = tenant.status === TenantStatusSchema.enum.active

  const identityCardActions = isEditingIdentity ? (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className={CARD_ACTION_BUTTON_CLASS}
        onClick={cancelEdit}
        disabled={isSubmitting}
        data-testid="btn-cancel-edit-identity"
      >
        {t("detail.overview.cancel")}
      </Button>
      <Button
        type="submit"
        form="identity-edit-form"
        className={CARD_ACTION_BUTTON_CLASS}
        disabled={isSubmitting}
        data-testid="btn-confirm-edit-identity"
      >
        {t("detail.overview.confirmChange")}
      </Button>
    </div>
  ) : fullTenant && isAdmin && !isArchived && !isDraft ? (
    <Button
      type="button"
      variant="outline"
      className={`gap-1 ${CARD_ACTION_BUTTON_CLASS}`}
      onClick={startIdentityEdit}
      data-testid="btn-edit-tenant-identity"
    >
      <SquarePen size={14} />
      {t("detail.overview.edit")}
    </Button>
  ) : undefined

  const identityRows: InfoRow[] = [
    {
      label: t("detail.overview.tenantIdentity.tenantId"),
      value: fullTenant ? fullTenant.tenant_id : "—",
    },
    {
      label: t("detail.overview.tenantIdentity.tenantName"),
      value: tenant.name,
    },
    {
      label: t("detail.overview.tenantIdentity.tenantCode"),
      value: tenant.code,
    },
    {
      label: t("detail.overview.tenantIdentity.tenantType"),
      value: t(`tenantTypes.${tenant.tenant_type}` as "tenantTypes.bank"),
    },
    ...(fullTenant
      ? [
          {
            label: t("detail.overview.tenantIdentity.legalEntityName"),
            value: fullTenant.legal_entity_name,
          },
        ]
      : []),
    {
      label: t("detail.overview.tenantIdentity.country"),
      value: countryName(tenant.country),
    },
    {
      label: t("detail.overview.tenantIdentity.defaultCurrency"),
      value: currencyLabel(tenant.default_currency),
    },
    // US 29.4 field spec: Tenant Description is "not visible to operational users", so
    // it stays System Admin-only. (Support User never reaches it either way — the API
    // omits it from their response shape.)
    ...(fullTenant && isAdmin
      ? [
          {
            label: t("detail.overview.tenantIdentity.description"),
            value: fullTenant.description ?? "—",
          },
        ]
      : []),
  ]

  const governanceRows: InfoRow[] = [
    ...(fullTenant
      ? [
          {
            label: t("detail.overview.governanceActors.creationRequestedBy"),
            value: fullTenant.created_by ?? "—",
          },
        ]
      : []),
    {
      label: t("detail.overview.governanceActors.provisionedAt"),
      value: formatDateTime(tenant.created_at),
    },
    ...(fullTenant
      ? [
          {
            label: t(
              "detail.overview.governanceActors.creationCountersignedBy"
            ),
            value: fullTenant.approved_by ?? "—",
          },
          {
            label: t("detail.overview.governanceActors.activatedAt"),
            value: formatDateTime(fullTenant.activated_at),
          },
        ]
      : [
          {
            label: t("detail.overview.governanceActors.activatedAt"),
            value: formatDateTime(tenant.activated_at),
          },
        ]),
  ]

  const lifecycleRows: InfoRow[] = [
    {
      label: t("detail.overview.lifecycleStatus.status"),
      value: <TenantStatusBadge status={tenant.status} />,
    },
    {
      label: t("detail.overview.lifecycleStatus.newBusinessAllowed"),
      value: isActive
        ? t("detail.overview.lifecycleStatus.yes")
        : t("detail.overview.lifecycleStatus.no"),
    },
    {
      label: t("detail.overview.lifecycleStatus.operationalReadiness"),
      value: isActive
        ? t("detail.overview.lifecycleStatus.ready")
        : t("detail.overview.lifecycleStatus.notReady"),
    },
    ...(fullTenant
      ? [
          {
            label: t("detail.overview.lifecycleStatus.legalHold"),
            value: fullTenant.legal_hold_flag
              ? t("detail.overview.lifecycleStatus.on")
              : t("detail.overview.lifecycleStatus.off"),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6" data-testid="tab-content-overview">
      <div className="flex gap-6">
        {/* Left column: identity + governance */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">
          <TenantInfoCard
            title={t("detail.overview.tenantIdentity.title")}
            editButton={identityCardActions}
          >
            {isEditingIdentity && fullTenant ? (
              <form
                id="identity-edit-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-sm">
                  {/* Tenant ID — read-only */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.tenantId")}
                  </span>
                  <Input
                    disabled
                    defaultValue={fullTenant.tenant_id}
                    data-testid="view-tenant-id"
                    className="h-8 text-sm"
                  />

                  {/* Tenant name — editable */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.tenantName")}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <Input
                      {...register("name")}
                      className="h-8 text-sm"
                      data-testid="edit-tenant-name"
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">
                        {t(
                          `detail.overview.editDialog.errors.${errors.name.message}` as "detail.overview.editDialog.errors.nameTooShort"
                        )}
                      </p>
                    )}
                  </div>

                  {/* Tenant code — read-only */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.tenantCode")}
                  </span>
                  <Input
                    disabled
                    defaultValue={fullTenant.code}
                    data-testid="view-tenant-code"
                    className="h-8 text-sm"
                  />

                  {/* Tenant type — read-only */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.tenantType")}
                  </span>
                  <Input
                    disabled
                    defaultValue={t(
                      `tenantTypes.${fullTenant.tenant_type}` as "tenantTypes.bank"
                    )}
                    data-testid="view-tenant-type"
                    className="h-8 text-sm"
                  />

                  {/* Legal entity name — editable */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.legalEntityName")}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <Input
                      {...register("legal_entity_name")}
                      className="h-8 text-sm"
                      data-testid="edit-legal-entity-name"
                      aria-invalid={!!errors.legal_entity_name}
                    />
                    {errors.legal_entity_name && (
                      <p className="text-xs text-destructive">
                        {t(
                          `detail.overview.editDialog.errors.${errors.legal_entity_name.message}` as "detail.overview.editDialog.errors.legalEntityNameRequired"
                        )}
                      </p>
                    )}
                  </div>

                  {/* Country — read-only */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.country")}
                  </span>
                  <Input
                    disabled
                    defaultValue={countryName(fullTenant.country)}
                    data-testid="view-country"
                    className="h-8 text-sm"
                  />

                  {/* Default currency — read-only */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.defaultCurrency")}
                  </span>
                  <Input
                    disabled
                    defaultValue={currencyLabel(fullTenant.default_currency)}
                    data-testid="view-default-currency"
                    className="h-8 text-sm"
                  />

                  {/* Description — editable textarea */}
                  <span className="flex items-start pt-1.5 text-muted-foreground">
                    {t("detail.overview.tenantIdentity.description")}
                  </span>
                  <Textarea
                    {...register("description")}
                    className="resize-none text-sm"
                    rows={2}
                    data-testid="edit-description"
                  />

                  {/* Justification for name change — required only when name is changed */}
                  <span className="flex items-start pt-1.5 text-muted-foreground">
                    {t("detail.overview.tenantIdentity.justification")}
                    {hasNameChanged && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <Textarea
                      {...register("justification")}
                      className="resize-none text-sm"
                      rows={2}
                      data-testid="edit-justification"
                      aria-invalid={!!errors.justification}
                      placeholder={t(
                        "detail.overview.editDialog.fields.justificationHint"
                      )}
                    />
                    {errors.justification && (
                      <p className="text-xs text-destructive">
                        {t(
                          "detail.overview.editDialog.errors.justificationRequired"
                        )}
                      </p>
                    )}
                  </div>

                  {/* Legal hold — switch */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.legalHold")}
                  </span>
                  <div className="flex h-8 items-center">
                    <Controller
                      control={control}
                      name="legal_hold_flag"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t(
                            "detail.overview.tenantIdentity.legalHold"
                          )}
                          data-testid="edit-legal-hold-flag"
                        />
                      )}
                    />
                  </div>
                </div>
              </form>
            ) : (
              <InfoRows rows={identityRows} />
            )}
          </TenantInfoCard>

          <TenantInfoCard title={t("detail.overview.governanceActors.title")}>
            <InfoRows rows={governanceRows} />
          </TenantInfoCard>
        </div>

        {/* Right column: lifecycle + access policy */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">
          <TenantInfoCard title={t("detail.overview.lifecycleStatus.title")}>
            <InfoRows rows={lifecycleRows} />
          </TenantInfoCard>

          {isAdmin && (
            <AccessPolicyCard
              tenantId={tenantId}
              isEditable={!isArchived && !isDraft}
            />
          )}
        </div>
      </div>
    </div>
  )
}
