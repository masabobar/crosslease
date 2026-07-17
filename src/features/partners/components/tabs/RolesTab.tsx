import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PartnerRoleBadge } from "@/features/partners/components/PartnerRoleBadge"
import { SectionCard } from "@/features/partners/components/PartnerDetailPrimitives"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import type { UserRole } from "@/features/users/types"
import {
  fetchPartnerRoles,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { formatDateTime } from "@/lib/formatters"
import { ApiError } from "@/lib/api"
import { RoleStatusSchema } from "@/features/partners/api/schema"
import type { RoleStatus } from "@/features/partners/api/schema"
import { AssignRoleDialog } from "@/features/partners/components/AssignRoleDialog"
import { initialsFromName } from "@/features/partners/utils"

const COL_ROLE = "flex-1 min-w-[160px]"
const COL_STATUS = "w-[140px] shrink-0"
const COL_ASSIGNED_BY = "flex-1 min-w-[220px]"
const COL_ASSIGNED_ON = "w-[160px] shrink-0"

function RoleStatusCell({ status }: { status: RoleStatus }) {
  const { t } = useTranslation("partners")
  if (status === RoleStatusSchema.in.enum.active) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-success/10 text-success">
        {t(`roleStatus.${status}`)}
      </span>
    )
  }
  const COLOR: Record<RoleStatus, string> = {
    active: "text-success",
    pending_four_eyes: "text-warning",
    rejected: "text-destructive",
    withdrawn: "text-muted-foreground",
  }
  return (
    <span className={`text-xs font-medium ${COLOR[status]}`}>
      {t(`roleStatus.${status}`)}
    </span>
  )
}

type RolesTabProps = {
  partnerId: string
  canAssignRole: boolean
}

function RolesTab({ partnerId, canAssignRole }: RolesTabProps) {
  const { t } = useTranslation("partners")
  const [assignOpen, setAssignOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.roles(partnerId),
    queryFn: () => fetchPartnerRoles(partnerId),
  })

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-muted animate-pulse mb-2"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        {t("errors.generic")}
      </p>
    )
  }

  const roles = data?.roles ?? []
  const history = data?.history ?? []

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Assigned roles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">
              {t("detail.roles.activeTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("detail.roles.subtitle")}
            </p>
          </div>
          {canAssignRole && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssignOpen(true)}
              data-testid="assign-role-button"
              className="gap-1.5"
            >
              <Plus size={14} />
              {t("detail.roles.assignButton")}
            </Button>
          )}
        </div>

        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("detail.roles.emptyActive")}
          </p>
        ) : (
          <div className="w-full border border-border rounded-[10px] overflow-hidden bg-background">
            <div className="flex border-b border-border h-10 items-center">
              <div
                className={`${COL_ROLE} text-sm font-medium text-foreground px-2`}
              >
                {t("detail.roles.columns.role")}
              </div>
              <div
                className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
              >
                {t("detail.roles.columns.status")}
              </div>
              <div
                className={`${COL_ASSIGNED_BY} text-sm font-medium text-foreground px-2`}
              >
                {t("detail.roles.assignedBy")}
              </div>
              <div
                className={`${COL_ASSIGNED_ON} text-sm font-medium text-foreground px-2`}
              >
                {t("detail.roles.columns.assignedOn")}
              </div>
            </div>
            {roles.map(ra => (
              <div
                key={ra.role_assignment_id}
                className="flex border-b border-border last:border-0 h-16 items-center"
              >
                <div className={`${COL_ROLE} px-2 flex items-center gap-1.5`}>
                  <PartnerRoleBadge role={ra.role} />
                  {ra.is_risk_sensitive && (
                    <ShieldCheck size={14} className="text-warning" />
                  )}
                </div>
                <div className={`${COL_STATUS} px-2`}>
                  <RoleStatusCell status={ra.status} />
                </div>
                <div
                  className={`${COL_ASSIGNED_BY} px-2 flex items-center gap-2`}
                >
                  <div className="size-8 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {initialsFromName(ra.assigned_by.display_name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {ra.assigned_by.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ra.assigned_by.email}
                    </p>
                  </div>
                </div>
                <div
                  className={`${COL_ASSIGNED_ON} px-2 text-sm text-muted-foreground`}
                >
                  {formatDateTime(ra.assigned_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role history */}
      <SectionCard title={t("detail.roles.historyTitle")}>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("detail.roles.emptyHistory")}
          </p>
        ) : (
          <div className="flex flex-col">
            {history.map((entry, i) => (
              <div
                key={`${entry.role_assignment_id}-${entry.timestamp}`}
                className="flex items-start gap-3 py-3"
              >
                <div className="flex flex-col items-center self-stretch pt-1.5">
                  <span className="size-2 rounded-full bg-border shrink-0" />
                  {i < history.length - 1 && (
                    <span className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {entry.actor.display_name}
                    </span>
                    <RoleBadge role={entry.actor_role as UserRole} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(entry.description_key as "partner.role.assigned", {
                      role: t(
                        `role.${String(entry.description_params.role)}` as "role.lessee"
                      ),
                    })}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {canAssignRole && (
        <AssignRoleDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          partnerId={partnerId}
          onSuccess={response => {
            const pendingApproval = response.results.some(
              r => r.status === RoleStatusSchema.in.enum.pending_four_eyes
            )
            toast.success(
              pendingApproval
                ? t("assignRoleDialog.successPending")
                : t("assignRoleDialog.success")
            )
          }}
          onError={(err: unknown) => {
            toast.error(
              err instanceof ApiError
                ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
                : t("errors.generic")
            )
          }}
        />
      )}
    </div>
  )
}

export { RolesTab }
