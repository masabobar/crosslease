import { useTranslation } from "react-i18next"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import {
  DetailRow,
  SectionCard,
} from "@/features/users/components/UserDetailPrimitives"
import { getRoleClassificationKey } from "@/features/users/utils"
import { AUDITOR_DATE_RANGE_ROLES } from "@/features/users/types"
import { formatDate } from "@/lib/formatters"
import type { UserDetail } from "@/features/users/api/schema"

type UserRoleScopeCardProps = {
  user: UserDetail
  /** Omitted on the self-service profile, where a user cannot change their own role. */
  onEdit?: () => void
}

/** Role, classification, tenant and access-window rows. Read-only in every surface. */
export function UserRoleScopeCard({ user, onEdit }: UserRoleScopeCardProps) {
  const { t } = useTranslation("users")

  return (
    <SectionCard
      title={t("detail.page.sections.roleScope")}
      onEdit={onEdit}
      data-testid="role-scope-edit-button"
    >
      <DetailRow label={t("detail.page.fields.role")}>
        <RoleBadge role={user.role} />
      </DetailRow>
      <DetailRow label={t("detail.page.fields.roleClassification")}>
        {t(getRoleClassificationKey(user.role))}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.tenant")}>
        {user.tenant_name ?? "—"}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.accessValidityPeriod")}>
        {user.access_valid_until ? formatDate(user.access_valid_until) : "—"}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.auditEngagementValidUntil")}>
        {AUDITOR_DATE_RANGE_ROLES.includes(user.role)
          ? formatDate(user.access_valid_until)
          : "—"}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.effectiveTenantScope")}>
        {user.tenant_name ?? "—"}
      </DetailRow>
    </SectionCard>
  )
}
