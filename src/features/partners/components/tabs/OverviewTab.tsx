import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { PartnerTypeBadge } from "@/features/partners/components/PartnerTypeBadge"
import { formatDateTime } from "@/lib/formatters"
import type { PartnerDetailResponse } from "@/features/partners/api/schema"

type InfoRowProps = { label: string; value: ReactNode }

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right">{value ?? "—"}</span>
    </div>
  )
}

function formatAddress(
  addr: {
    street?: string | null
    city?: string | null
    postal_code?: string | null
    country?: string | null
  } | null
): string {
  if (!addr) return "—"
  return [addr.street, addr.city, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(", ")
}

type OverviewTabProps = {
  partner: PartnerDetailResponse
}

function OverviewTab({ partner }: OverviewTabProps) {
  const { t } = useTranslation("partners")
  const identity = partner.identity

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <PartnerTypeBadge type={partner.partner_type} />
        <PartnerStatusBadge status={partner.status} />
        <span className="text-sm text-muted-foreground ml-auto">
          {t("detail.overview.uboCompleteness")}:{" "}
          <span className="text-foreground capitalize">
            {partner.ubo_completeness_status}
          </span>
        </span>
      </div>

      {/* Identity fields */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">
          {t("detail.overview.identitySectionTitle")}
        </p>

        {identity.partner_type === "legal_entity" && (
          <>
            <InfoRow
              label={t("detail.overview.fields.legalName")}
              value={identity.legal_name}
            />
            <InfoRow
              label={t("detail.overview.fields.legalForm")}
              value={identity.legal_form}
            />
            <InfoRow
              label={t("detail.overview.fields.country")}
              value={identity.country}
            />
            <InfoRow
              label={t("detail.overview.fields.taxIdVat")}
              value={identity.tax_id_vat}
            />
            <InfoRow
              label={t("detail.overview.fields.lei")}
              value={identity.lei}
            />
            <InfoRow
              label={t("detail.overview.fields.commercialRegisterNo")}
              value={identity.commercial_register_no}
            />
            <InfoRow
              label={t("detail.overview.fields.foreignIdentifier")}
              value={identity.foreign_identifier}
            />
            <InfoRow
              label={t("detail.overview.fields.address")}
              value={
                identity.registered_address
                  ? formatAddress(identity.registered_address)
                  : t("detail.overview.noAddress")
              }
            />
          </>
        )}

        {identity.partner_type === "natural_person" && (
          <>
            <InfoRow
              label={t("detail.overview.fields.fullName")}
              value={identity.full_name}
            />
            <InfoRow
              label={t("detail.overview.fields.dateOfBirth")}
              value={identity.date_of_birth}
            />
            <InfoRow
              label={t("detail.overview.fields.placeOfBirth")}
              value={identity.place_of_birth}
            />
            <InfoRow
              label={t("detail.overview.fields.country")}
              value={identity.country}
            />
            <InfoRow
              label={t("detail.overview.fields.birthName")}
              value={identity.birth_name}
            />
            <InfoRow
              label={t("detail.overview.fields.nationalId")}
              value={identity.national_id}
            />
            <InfoRow
              label={t("detail.overview.fields.address")}
              value={
                identity.registered_address
                  ? formatAddress(identity.registered_address)
                  : t("detail.overview.noAddress")
              }
            />
          </>
        )}

        {identity.partner_type === "sole_proprietor" && (
          <>
            <InfoRow
              label={t("detail.overview.fields.fullName")}
              value={identity.full_name}
            />
            <InfoRow
              label={t("detail.overview.fields.dateOfBirth")}
              value={identity.date_of_birth}
            />
            <InfoRow
              label={t("detail.overview.fields.country")}
              value={identity.country}
            />
            <InfoRow
              label={t("detail.overview.fields.taxIdVat")}
              value={identity.tax_id_vat}
            />
            <InfoRow
              label={t("detail.overview.fields.commercialRegisterNo")}
              value={identity.commercial_register_no}
            />
            <InfoRow
              label={t("detail.overview.fields.address")}
              value={
                identity.registered_address
                  ? formatAddress(identity.registered_address)
                  : t("detail.overview.noAddress")
              }
            />
          </>
        )}
      </div>

      {/* Timestamps */}
      <div>
        <InfoRow
          label={t("detail.overview.fields.createdAt")}
          value={formatDateTime(partner.created_at)}
        />
        <InfoRow
          label={t("detail.overview.fields.updatedAt")}
          value={formatDateTime(partner.updated_at)}
        />
      </div>
    </div>
  )
}

export { OverviewTab }
