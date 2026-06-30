import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PartnerRoleBadge } from "@/features/partners/components/PartnerRoleBadge"
import {
  fetchPartnerRoles,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { formatDateTime } from "@/lib/formatters"
import { ApiError } from "@/lib/api"
import type { PartnerStatus } from "@/features/partners/api/schema"
import { AssignRoleDialog } from "@/features/partners/components/AssignRoleDialog"

type RolesTabProps = {
  partnerId: string
  partnerStatus: PartnerStatus
  canAssignRole: boolean
}

function RolesTab({
  partnerId,
  partnerStatus: _partnerStatus,
  canAssignRole,
}: RolesTabProps) {
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
      {/* Active roles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {t("detail.roles.activeTitle")}
          </p>
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
          <div className="flex flex-col gap-2">
            {roles.map(ra => (
              <div
                key={ra.role_assignment_id}
                className="rounded-xl border border-border px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PartnerRoleBadge role={ra.role} />
                    {ra.status === "pending_four_eyes" && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {t("roleStatus.pending_four_eyes")}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(ra.assigned_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("detail.roles.assignedBy")}: {ra.assigned_by.display_name}
                </p>
                {ra.note && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("detail.roles.note")}: {ra.note}
                  </p>
                )}
                {ra.status === "pending_four_eyes" && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t("detail.roles.pendingApprovalNote")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role history */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">
          {t("detail.roles.historyTitle")}
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("detail.roles.emptyHistory")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {history.map(entry => (
              <div
                key={`${entry.role_assignment_id}-${entry.timestamp}`}
                className="flex items-start gap-3 py-2 border-b border-border last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {entry.description_key}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor.display_name} ·{" "}
                    {formatDateTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canAssignRole && (
        <AssignRoleDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          partnerId={partnerId}
          onSuccess={() => {
            toast.success(t("assignRoleDialog.success"))
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
