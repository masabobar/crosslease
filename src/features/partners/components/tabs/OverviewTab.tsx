import { useTranslation } from "react-i18next"
import {
  DetailRow,
  SectionCard,
} from "@/features/partners/components/PartnerDetailPrimitives"
import { PartnerIdentityFields } from "@/features/partners/components/PartnerIdentityFields"
import { PartnerTypeBadge } from "@/features/partners/components/PartnerTypeBadge"
import { DealerNumbersSection } from "@/features/partners/components/DealerNumbersSection"
import { BankAccountsSection } from "@/features/partners/components/BankAccountsSection"
import { UBO_STATUS_DOT_COLOR } from "@/features/partners/constants"
import { PartnerTypeSchema } from "@/features/partners/api/schema"
import type {
  PartnerDetailResponse,
  RoleAssignmentSummary,
} from "@/features/partners/api/schema"

function RolesList({ roles }: { roles: RoleAssignmentSummary[] }) {
  const { t } = useTranslation("partners")
  if (roles.length === 0) return "—"
  return roles.map((r, i) => (
    <span key={r.role_assignment_id}>
      <span className={r.is_risk_sensitive ? "text-warning" : undefined}>
        {/* role is a plain string on the wire — history may carry values removed
            from PartnerRoleSchema, so fall back to the raw value. */}
        {t(`role.${r.role}` as "role.lessee", { defaultValue: r.role })}
      </span>
      {i < roles.length - 1 ? ", " : ""}
    </span>
  ))
}

type OverviewTabProps = {
  partner: PartnerDetailResponse
  roles: RoleAssignmentSummary[]
}

function OverviewTab({ partner, roles }: OverviewTabProps) {
  const { t } = useTranslation("partners")
  const identity = partner.identity
  const isLegalEntity =
    partner.partner_type === PartnerTypeSchema.enum.legal_entity

  return (
    <div className="flex flex-col gap-6 p-3">
      <div className="flex gap-6">
        <SectionCard title={t("detail.overview.identitySectionTitle")}>
          <PartnerIdentityFields identity={identity} />
        </SectionCard>

        <div className="flex flex-col gap-6 flex-1 min-w-0">
          <SectionCard
            title={t("detail.overview.classificationSectionTitle")}
          >
            <DetailRow label={t("detail.overview.fields.entityType")}>
              <PartnerTypeBadge type={partner.partner_type} />
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.country")}>
              {identity.country}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.partnerId")}>
              {partner.partner_id}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.roles")}>
              <RolesList roles={roles} />
            </DetailRow>
          </SectionCard>

          <SectionCard title={t("detail.overview.complianceSectionTitle")}>
            <DetailRow label={t("detail.overview.uboCompleteness")}>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-block size-2 rounded-full ${UBO_STATUS_DOT_COLOR[partner.ubo_completeness_status]}`}
                />
                {t(
                  `uboStatus.${partner.ubo_completeness_status}` as "uboStatus.missing"
                )}
              </span>
            </DetailRow>
          </SectionCard>
        </div>
      </div>

      {isLegalEntity && (
        <>
          <DealerNumbersSection partnerId={partner.partner_id} />
          <BankAccountsSection partnerId={partner.partner_id} />
        </>
      )}
    </div>
  )
}

export { OverviewTab, RolesList }
