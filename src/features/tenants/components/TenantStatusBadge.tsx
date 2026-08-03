import { useTranslation } from "react-i18next"
import type { TenantStatus } from "@/features/tenants/api/schema"
import { StatusPill } from "@/features/tenants/components/StatusPill"
import { STATUS_TONES } from "@/features/tenants/components/statusPalette"
import type { StatusConfig } from "@/features/tenants/components/statusPalette"

type TenantStatusBadgeProps = {
  status: TenantStatus
}

const STATUS_CONFIG: Record<TenantStatus, StatusConfig> = {
  active: STATUS_TONES.green,
  draft: STATUS_TONES.blue,
  suspended: STATUS_TONES.orange,
  rejected: STATUS_TONES.red,
  archived: STATUS_TONES.slate,
  expired: STATUS_TONES.purple,
}

function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  const { t } = useTranslation("tenants")
  const config = STATUS_CONFIG[status]

  return (
    <StatusPill
      colorClassName={`${config.container} ${config.text}`}
      dotClassName={config.dot}
    >
      {t(`statuses.${status}` as `statuses.${TenantStatus}`)}
    </StatusPill>
  )
}

export { TenantStatusBadge }
