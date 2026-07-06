import { useTranslation } from "react-i18next"
import {
  DetailRow,
  SectionCard,
} from "@/features/partners/components/PartnerDetailPrimitives"
import { PartnerTypeBadge } from "@/features/partners/components/PartnerTypeBadge"
import { UBO_STATUS_DOT_COLOR } from "@/features/partners/constants"
import type {
  PartnerDetailResponse,
  RoleAssignmentSummary,
} from "@/features/partners/api/schema"

function formatAddressLines(
  addr: {
    street?: string | null
    city?: string | null
    postal_code?: string | null
    country?: string | null
  } | null
): string[] {
  if (!addr) return []
  const line2 = [addr.postal_code, addr.city].filter(Boolean).join(" ")
  return [addr.street, line2, addr.country].filter(Boolean) as string[]
}

function RolesList({ roles }: { roles: RoleAssignmentSummary[] }) {
  const { t } = useTranslation("partners")
  if (roles.length === 0) return "—"
  return roles.map((r, i) => (
    <span key={r.role_assignment_id}>
      <span className={r.is_risk_sensitive ? "text-warning" : undefined}>
        {t(`role.${r.role}` as "role.lessee")}
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
  const addressLines = formatAddressLines(identity.registered_address)

  const addressValue =
    addressLines.length > 0 ? (
      <div className="flex flex-col">
        {addressLines.map(line => (
          <span key={line}>{line}</span>
        ))}
      </div>
    ) : (
      t("detail.overview.noAddress")
    )

  return (
    <div className="flex gap-6 p-3">
      <SectionCard title={t("detail.overview.identitySectionTitle")}>
        {identity.partner_type === "legal_entity" && (
          <>
            <DetailRow label={t("detail.overview.fields.legalName")}>
              {identity.legal_name}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.legalForm")}>
              {identity.legal_form ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.commercialRegisterNo")}>
              {identity.commercial_register_no ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.taxIdVat")}>
              {identity.tax_id_vat ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.lei")}>
              {identity.lei ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.address")}>
              {addressValue}
            </DetailRow>
            {identity.foreign_identifier && (
              <DetailRow label={t("detail.overview.fields.foreignIdentifier")}>
                {identity.foreign_identifier}
              </DetailRow>
            )}
          </>
        )}

        {identity.partner_type === "natural_person" && (
          <>
            <DetailRow label={t("detail.overview.fields.fullName")}>
              {identity.full_name}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.dateOfBirth")}>
              {identity.date_of_birth}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.placeOfBirth")}>
              {identity.place_of_birth}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.birthName")}>
              {identity.birth_name ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.nationalId")}>
              {identity.national_id ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.address")}>
              {addressValue}
            </DetailRow>
          </>
        )}

        {identity.partner_type === "sole_proprietor" && (
          <>
            <DetailRow label={t("detail.overview.fields.fullName")}>
              {identity.full_name}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.dateOfBirth")}>
              {identity.date_of_birth}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.taxIdVat")}>
              {identity.tax_id_vat ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.commercialRegisterNo")}>
              {identity.commercial_register_no ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.overview.fields.address")}>
              {addressValue}
            </DetailRow>
          </>
        )}
      </SectionCard>

      <div className="flex flex-col gap-6 flex-1 min-w-0">
        <SectionCard title={t("detail.overview.classificationSectionTitle")}>
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
  )
}

export { OverviewTab, RolesList }
