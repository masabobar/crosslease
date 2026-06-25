import { useEffect, useState, type ReactNode } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { SquarePen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useTenantAccessPolicy } from "@/features/tenants/hooks/useTenantAccessPolicy"
import { useUpdateTenant } from "@/features/tenants/hooks/useUpdateTenant"
import { useUpdateAccessPolicy } from "@/features/tenants/hooks/useUpdateAccessPolicy"
import {
  isFullTenantResponse,
  createUpdateTenantFormSchema,
  UpdateAccessPolicyFormSchema,
} from "@/features/tenants/api/schema"
import type {
  TenantDetail,
  UpdateTenantForm,
  UpdateAccessPolicyForm,
} from "@/features/tenants/api/schema"
import { cn } from "@/lib/utils"

type OverviewTabProps = {
  tenant: TenantDetail
  tenantId: string
  isAdmin: boolean
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(code: string): string {
  const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code)
  return name ? `${name} (${code})` : code
}

function formatCountry(code: string): string {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
}

type InfoRow = { label: string; value: ReactNode }

function InfoRows({ rows }: { rows: InfoRow[] }) {
  return (
    <div className="flex gap-16 text-sm">
      <div className="flex flex-col gap-3 text-muted-foreground shrink-0">
        {rows.map(row => (
          <div key={row.label} className="leading-5">
            {row.label}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 text-foreground min-w-0">
        {rows.map(row => (
          <div key={row.label} className="leading-5">
            {row.value ?? "—"}
          </div>
        ))}
      </div>
    </div>
  )
}

export function OverviewTab({ tenant, tenantId, isAdmin }: OverviewTabProps) {
  const { t } = useTranslation("tenants")
  const { data: accessPolicy } = useTenantAccessPolicy(
    isAdmin ? tenantId : null
  )
  const fullTenant = isFullTenantResponse(tenant) ? tenant : null
  const isArchived = tenant.status === "archived"
  const [isEditingIdentity, setIsEditingIdentity] = useState(false)

  const updateTenantMutation = useUpdateTenant(tenant.id)
  const updateAccessPolicyMutation = useUpdateAccessPolicy(tenantId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
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

  const watchedName = useWatch({ control, name: "name" })
  const nameChanged =
    (watchedName ?? "").trim() !== (fullTenant?.name ?? "").trim()

  useEffect(() => {
    if (isEditingIdentity && fullTenant) {
      reset({
        name: fullTenant.name,
        legal_entity_name: fullTenant.legal_entity_name,
        description: fullTenant.description ?? "",
        legal_hold_flag: fullTenant.legal_hold_flag,
        justification: "",
      })
    }
  }, [isEditingIdentity]) // eslint-disable-line react-hooks/exhaustive-deps

  const [isEditingAccessPolicy, setIsEditingAccessPolicy] = useState(false)

  const {
    register: apRegister,
    control: apControl,
    handleSubmit: apHandleSubmit,
    reset: apReset,
    formState: { errors: apErrors, isSubmitting: apIsSubmitting },
  } = useForm<UpdateAccessPolicyForm>({
    resolver: zodResolver(UpdateAccessPolicyFormSchema),
    defaultValues: {
      support_read_only_access_allowed:
        accessPolicy?.support_read_only_access?.enabled ?? false,
      auditor_access_allowed: accessPolicy?.auditor_access?.enabled ?? false,
      lc_portal_enabled: accessPolicy?.lc_portal?.enabled ?? false,
      reason: "",
    },
  })

  useEffect(() => {
    if (isEditingAccessPolicy && accessPolicy) {
      apReset({
        support_read_only_access_allowed:
          accessPolicy.support_read_only_access.enabled,
        auditor_access_allowed: accessPolicy.auditor_access.enabled,
        lc_portal_enabled: accessPolicy.lc_portal.enabled,
        reason: "",
      })
    }
  }, [isEditingAccessPolicy]) // eslint-disable-line react-hooks/exhaustive-deps

  function cancelEdit() {
    setIsEditingIdentity(false)
    reset()
  }

  function cancelAccessPolicyEdit() {
    setIsEditingAccessPolicy(false)
    apReset()
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
      if (err instanceof ApiError) {
        switch (err.code) {
          case "TENANT_ALREADY_EXISTS":
            setError("name", {
              type: "server",
              message: t(
                "detail.overview.editDialog.errors.TENANT_ALREADY_EXISTS"
              ),
            })
            return
          default:
            toast.error(t("detail.overview.editDialog.errors.generic"))
            return
        }
      }
      toast.error(t("detail.overview.editDialog.errors.generic"))
    }
  }

  async function onSubmitAccessPolicy(data: UpdateAccessPolicyForm) {
    try {
      await updateAccessPolicyMutation.mutateAsync({
        support_read_only_access_allowed: data.support_read_only_access_allowed,
        auditor_access_allowed: data.auditor_access_allowed,
        lc_portal_enabled: data.lc_portal_enabled,
        reason: data.reason,
      })
      toast.success(t("detail.overview.accessPolicy.successToast"))
      setIsEditingAccessPolicy(false)
    } catch {
      toast.error(t("detail.overview.accessPolicy.errors.generic"))
    }
  }

  const newBusinessAllowed = tenant.status === "active"
  const operationalReady = tenant.status === "active"

  const identityCardActions = isEditingIdentity ? (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-auto rounded-[10px] px-[10px] py-[4px] text-sm"
        onClick={cancelEdit}
        disabled={isSubmitting}
        data-testid="btn-cancel-edit-identity"
      >
        {t("detail.overview.cancel")}
      </Button>
      <Button
        type="submit"
        form="identity-edit-form"
        className="h-auto rounded-[10px] px-[10px] py-[4px] text-sm"
        disabled={isSubmitting}
        data-testid="btn-confirm-edit-identity"
      >
        {t("detail.overview.confirmChange")}
      </Button>
    </div>
  ) : fullTenant && isAdmin && !isArchived ? (
    <Button
      type="button"
      variant="outline"
      className="h-auto gap-1 rounded-[10px] px-[10px] py-[4px] text-sm"
      onClick={() => setIsEditingIdentity(true)}
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
      value: formatCountry(tenant.country),
    },
    {
      label: t("detail.overview.tenantIdentity.defaultCurrency"),
      value: formatCurrency(tenant.default_currency),
    },
    ...(fullTenant
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
      value: newBusinessAllowed
        ? t("detail.overview.lifecycleStatus.yes")
        : t("detail.overview.lifecycleStatus.no"),
    },
    {
      label: t("detail.overview.lifecycleStatus.operationalReadiness"),
      value: operationalReady
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

  const policyFlags = [
    {
      key: "supportReadOnly",
      label: t("detail.overview.accessPolicy.supportReadOnlyAccess"),
      flag: accessPolicy?.support_read_only_access,
    },
    {
      key: "auditor",
      label: t("detail.overview.accessPolicy.auditorAccess"),
      flag: accessPolicy?.auditor_access,
    },
    {
      key: "lcPortal",
      label: t("detail.overview.accessPolicy.lcPortal"),
      flag: accessPolicy?.lc_portal,
    },
  ]

  const accessPolicyCardActions = isEditingAccessPolicy ? (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-auto rounded-[10px] px-[10px] py-[4px] text-sm"
        onClick={cancelAccessPolicyEdit}
        disabled={apIsSubmitting}
        data-testid="btn-cancel-edit-access-policy"
      >
        {t("detail.overview.cancel")}
      </Button>
      <Button
        type="submit"
        form="access-policy-edit-form"
        className="h-auto rounded-[10px] px-[10px] py-[4px] text-sm"
        disabled={apIsSubmitting}
        data-testid="btn-confirm-edit-access-policy"
      >
        {t("detail.overview.confirmChange")}
      </Button>
    </div>
  ) : !isArchived ? (
    <Button
      type="button"
      variant="outline"
      className="h-auto gap-1 rounded-[10px] px-[10px] py-[4px] text-sm"
      onClick={() => setIsEditingAccessPolicy(true)}
      data-testid="btn-edit-access-policy"
    >
      <SquarePen size={14} />
      {t("detail.overview.edit")}
    </Button>
  ) : undefined

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
                        {errors.name.message}
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
                        {errors.legal_entity_name.message}
                      </p>
                    )}
                  </div>

                  {/* Country — read-only */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.country")}
                  </span>
                  <Input
                    disabled
                    defaultValue={formatCountry(fullTenant.country)}
                    className="h-8 text-sm"
                  />

                  {/* Default currency — read-only */}
                  <span className="flex h-8 items-center text-muted-foreground">
                    {t("detail.overview.tenantIdentity.defaultCurrency")}
                  </span>
                  <Input
                    disabled
                    defaultValue={formatCurrency(fullTenant.default_currency)}
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
                    {nameChanged && (
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
            <TenantInfoCard
              title={t("detail.overview.accessPolicy.title")}
              editButton={accessPolicyCardActions}
            >
              {isEditingAccessPolicy ? (
                <form
                  id="access-policy-edit-form"
                  onSubmit={apHandleSubmit(onSubmitAccessPolicy)}
                  noValidate
                >
                  <div className="flex flex-col gap-3 text-sm">
                    {[
                      {
                        key: "support_read_only_access_allowed" as const,
                        label: t(
                          "detail.overview.accessPolicy.supportReadOnlyAccess"
                        ),
                        flag: accessPolicy?.support_read_only_access,
                      },
                      {
                        key: "auditor_access_allowed" as const,
                        label: t("detail.overview.accessPolicy.auditorAccess"),
                        flag: accessPolicy?.auditor_access,
                      },
                      {
                        key: "lc_portal_enabled" as const,
                        label: t("detail.overview.accessPolicy.lcPortal"),
                        flag: accessPolicy?.lc_portal,
                      },
                    ].map(item => (
                      <div
                        key={item.key}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground leading-5">
                            {item.label}
                          </span>
                          {(item.flag?.modified_by ??
                            item.flag?.modified_at) && (
                            <span className="text-xs text-muted-foreground">
                              {t("detail.overview.accessPolicy.modifiedBy", {
                                name: item.flag?.modified_by ?? "",
                                date: formatDate(item.flag?.modified_at),
                              })}
                            </span>
                          )}
                        </div>
                        <Controller
                          control={apControl}
                          name={item.key}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label={item.label}
                            />
                          )}
                        />
                      </div>
                    ))}

                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-muted-foreground">
                        {t(
                          "detail.overview.accessPolicy.governanceJustification"
                        )}
                        <span className="text-destructive ml-0.5">*</span>
                      </span>
                      <Textarea
                        {...apRegister("reason")}
                        className="resize-none text-sm"
                        rows={2}
                        data-testid="edit-access-policy-reason"
                        aria-invalid={!!apErrors.reason}
                      />
                      {apErrors.reason && (
                        <p className="text-xs text-destructive">
                          {t(
                            "detail.overview.accessPolicy.errors.reasonRequired"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex gap-16 text-sm">
                  <div className="flex flex-col gap-3 text-muted-foreground shrink-0">
                    {policyFlags.map(item => (
                      <span
                        key={item.key}
                        className="min-h-[38px] flex items-start leading-5"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    {policyFlags.map(({ key, flag }) => (
                      <div
                        key={key}
                        className="flex flex-col gap-1 min-h-[38px]"
                      >
                        {flag !== undefined ? (
                          <>
                            <span
                              className={cn(
                                "self-start inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium h-[18px]",
                                flag.enabled
                                  ? "bg-green-600/10 text-green-600"
                                  : "bg-slate-200 text-muted-foreground"
                              )}
                            >
                              {flag.enabled
                                ? t("detail.overview.accessPolicy.enabled")
                                : t("detail.overview.accessPolicy.disabled")}
                            </span>
                            {(flag.modified_by ?? flag.modified_at) && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {t("detail.overview.accessPolicy.modifiedBy", {
                                  name: flag.modified_by ?? "",
                                  date: formatDate(flag.modified_at),
                                })}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground leading-5">
                            —
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TenantInfoCard>
          )}
        </div>
      </div>
    </div>
  )
}
