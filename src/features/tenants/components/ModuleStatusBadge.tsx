import { useTranslation } from "react-i18next"
import type { TenantModuleStatus } from "@/features/tenants/api/schema"
import { StatusPill } from "@/features/tenants/components/StatusPill"
import { STATUS_TONES } from "@/features/tenants/components/statusPalette"
import type { StatusConfig } from "@/features/tenants/components/statusPalette"

const MODULE_STATUS_CONFIG: Record<TenantModuleStatus, StatusConfig> = {
  active: STATUS_TONES.green,
  inactive: STATUS_TONES.slate,
  pending_activation: STATUS_TONES.blue,
  pending_enforcement: STATUS_TONES.orange,
  pending_deactivation: STATUS_TONES.orange,
}

type Props = {
  status: TenantModuleStatus
}

export function ModuleStatusBadge({ status }: Props) {
  const { t } = useTranslation("tenants")
  const config = MODULE_STATUS_CONFIG[status]

  return (
    <StatusPill
      colorClassName={`${config.container} ${config.text}`}
      dotClassName={config.dot}
      shrink
    >
      {t(`detail.modules.status.${status}` as "detail.modules.status.active", {
        defaultValue: status,
      })}
    </StatusPill>
  )
}
