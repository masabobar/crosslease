import { SquarePen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { isFullTenantResponse } from "@/features/tenants/api/schema"
import type { TenantDetail } from "@/features/tenants/api/schema"

function ProgressBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.round((used / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground whitespace-nowrap">
        {used}/{max}
      </span>
      <div className="relative flex-1 h-1 bg-slate-300 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {pct}%
      </span>
    </div>
  )
}

function LimitCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 bg-muted border border-border rounded-[14px] py-4 flex flex-col gap-4 min-w-0 overflow-hidden">
      <div className="px-4 flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

type LicenceLimitsTabProps = {
  tenant: TenantDetail
}

export function LicenceLimitsTab({ tenant }: LicenceLimitsTabProps) {
  const { t } = useTranslation("tenants")

  if (!isFullTenantResponse(tenant)) return null

  const {
    max_lc_count,
    lc_utilisation,
    max_bank_user_count,
    bank_user_utilisation,
    max_users_per_lc,
    lc_user_highest_active,
  } = tenant

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="tab-content-licence-limits"
    >
      <div className="bg-slate-100 border border-border rounded-[10px] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-3 py-2.5">
          <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
            <span className="text-xs font-semibold text-foreground">
              {t("detail.licenceLimits.sectionTitle")}
            </span>
            <p className="text-xs text-muted-foreground">
              {t("detail.licenceLimits.sectionDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-auto gap-1.5 px-2.5 py-1 text-sm rounded-[10px] shrink-0"
            data-testid="btn-edit-limits"
          >
            <SquarePen size={14} />
            {t("detail.licenceLimits.editLimits")}
          </Button>
        </div>

        {/* Body */}
        <div className="bg-background border border-border rounded-b-[10px] p-4 flex flex-col gap-4">
          <div className="flex gap-4">
            <LimitCard
              title={t("detail.licenceLimits.leasingCompanies.title")}
              description={t(
                "detail.licenceLimits.leasingCompanies.description"
              )}
            >
              <ProgressBar used={lc_utilisation} max={max_lc_count} />
            </LimitCard>

            <LimitCard
              title={t("detail.licenceLimits.bankUsers.title")}
              description={t("detail.licenceLimits.bankUsers.description")}
            >
              <ProgressBar
                used={bank_user_utilisation}
                max={max_bank_user_count}
              />
            </LimitCard>

            <LimitCard
              title={t("detail.licenceLimits.usersPerLc.title")}
              description={t("detail.licenceLimits.usersPerLc.description")}
            >
              <p className="text-sm">
                <span className="text-muted-foreground">
                  {t("detail.licenceLimits.usersPerLc.highestActive")}
                </span>{" "}
                <span className="text-foreground">
                  {lc_user_highest_active}/{max_users_per_lc}
                </span>
              </p>
            </LimitCard>
          </div>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground">
            {t("detail.licenceLimits.defaultsPrefix")}{" "}
            <span className="text-foreground">{max_lc_count}</span>{" "}
            {t("detail.licenceLimits.defaultsLc")} ·{" "}
            <span className="text-foreground">{max_bank_user_count}</span>{" "}
            {t("detail.licenceLimits.defaultsBankUsers")} ·{" "}
            <span className="text-foreground">{max_users_per_lc}</span>{" "}
            {t("detail.licenceLimits.defaultsUsersPerLc")}
          </p>
        </div>
      </div>
    </div>
  )
}
