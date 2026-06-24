import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SquarePen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useTenantAccessPolicy } from "@/features/tenants/hooks/useTenantAccessPolicy"
import { isFullTenantResponse } from "@/features/tenants/api/schema"
import type { TenantDetail } from "@/features/tenants/api/schema"
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
  const isFull = isFullTenantResponse(tenant)

  const newBusinessAllowed = tenant.status === "active"
  const operationalReady = tenant.status === "active"

  const editButton = (
    <Button
      variant="outline"
      className="h-auto gap-1 rounded-[10px] px-[10px] py-[4px] text-sm"
    >
      <SquarePen size={14} />
      {t("detail.overview.edit")}
    </Button>
  )

  const identityRows: InfoRow[] = [
    {
      label: t("detail.overview.tenantIdentity.tenantId"),
      value: isFull ? tenant.tenant_id : "—",
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
    ...(isFull
      ? [
          {
            label: t("detail.overview.tenantIdentity.legalEntityName"),
            value: tenant.legal_entity_name,
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
    ...(isFull
      ? [
          {
            label: t("detail.overview.tenantIdentity.description"),
            value: tenant.description ?? "—",
          },
        ]
      : []),
  ]

  const governanceRows: InfoRow[] = [
    ...(isFull
      ? [
          {
            label: t("detail.overview.governanceActors.creationRequestedBy"),
            value: tenant.created_by ?? "—",
          },
        ]
      : []),
    {
      label: t("detail.overview.governanceActors.provisionedAt"),
      value: formatDateTime(tenant.created_at),
    },
    ...(isFull
      ? [
          {
            label: t(
              "detail.overview.governanceActors.creationCountersignedBy"
            ),
            value: tenant.approved_by ?? "—",
          },
          {
            label: t("detail.overview.governanceActors.activatedAt"),
            value: formatDateTime(tenant.activated_at),
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
    ...(isFull
      ? [
          {
            label: t("detail.overview.lifecycleStatus.legalHold"),
            value: tenant.legal_hold_flag
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

  return (
    <div className="flex gap-6" data-testid="tab-content-overview">
      {/* Left column: identity + governance */}
      <div className="flex flex-col gap-6 flex-1 min-w-0">
        <TenantInfoCard
          title={t("detail.overview.tenantIdentity.title")}
          editButton={isAdmin ? editButton : undefined}
        >
          <InfoRows rows={identityRows} />
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
            editButton={editButton}
          >
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
                  <div key={key} className="flex flex-col gap-1 min-h-[38px]">
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
                      <span className="text-muted-foreground leading-5">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TenantInfoCard>
        )}
      </div>
    </div>
  )
}
