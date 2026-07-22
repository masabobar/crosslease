import { useTranslation } from "react-i18next"
import { DetailRow } from "@/features/partners/components/PartnerDetailPrimitives"
import { isCommercialRegisterApplicable } from "@/features/partners/utils"
import type { PartnerIdentityDetail } from "@/features/partners/api/schema"

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

type PartnerIdentityFieldsProps = {
  identity: PartnerIdentityDetail
  showAddress?: boolean
}

function PartnerIdentityFields({
  identity,
  showAddress = true,
}: PartnerIdentityFieldsProps) {
  const { t } = useTranslation("partners")
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

  if (identity.partner_type === "legal_entity") {
    return (
      <>
        <DetailRow label={t("detail.overview.fields.legalName")}>
          {identity.legal_name}
        </DetailRow>
        <DetailRow label={t("detail.overview.fields.legalForm")}>
          {identity.legal_form ?? "—"}
        </DetailRow>
        {isCommercialRegisterApplicable(
          identity.partner_type,
          identity.country
        ) && (
          <DetailRow label={t("detail.overview.fields.commercialRegisterNo")}>
            {identity.commercial_register_no ?? "—"}
          </DetailRow>
        )}
        <DetailRow label={t("detail.overview.fields.taxIdVat")}>
          {identity.tax_id_vat ?? "—"}
        </DetailRow>
        <DetailRow label={t("detail.overview.fields.lei")}>
          {identity.lei ?? "—"}
        </DetailRow>
        {showAddress && (
          <DetailRow label={t("detail.overview.fields.address")}>
            {addressValue}
          </DetailRow>
        )}
        {identity.foreign_identifier && (
          <DetailRow label={t("detail.overview.fields.foreignIdentifier")}>
            {identity.foreign_identifier}
          </DetailRow>
        )}
      </>
    )
  }

  if (identity.partner_type === "natural_person") {
    return (
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
        {showAddress && (
          <DetailRow label={t("detail.overview.fields.address")}>
            {addressValue}
          </DetailRow>
        )}
      </>
    )
  }

  return (
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
      {isCommercialRegisterApplicable(
        identity.partner_type,
        identity.country
      ) && (
        <DetailRow label={t("detail.overview.fields.commercialRegisterNo")}>
          {identity.commercial_register_no ?? "—"}
        </DetailRow>
      )}
      {showAddress && (
        <DetailRow label={t("detail.overview.fields.address")}>
          {addressValue}
        </DetailRow>
      )}
    </>
  )
}

export { PartnerIdentityFields }
