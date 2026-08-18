import { useTranslation } from "react-i18next"
import { SectionCard } from "@/features/partners/components/PartnerDetailPrimitives"
import { useBankAccounts } from "@/features/partners/hooks/useBankAccounts"
import { ApiError } from "@/lib/api"
import type { BankAccountResponse } from "@/features/partners/api/schema"

type BankAccountsSectionProps = {
  partnerId: string
}

const ACCOUNT_FIELDS: {
  key: keyof Pick<
    BankAccountResponse,
    "iban" | "account_number" | "bank_name" | "holder_name" | "bic"
  >
  labelKey:
    | "submit.form.accountDialog.fields.iban"
    | "submit.form.accountDialog.fields.accountNumber"
    | "submit.form.accountDialog.fields.bankName"
    | "submit.form.accountDialog.fields.holderName"
    | "submit.form.accountDialog.fields.bic"
}[] = [
  { key: "iban", labelKey: "submit.form.accountDialog.fields.iban" },
  {
    key: "account_number",
    labelKey: "submit.form.accountDialog.fields.accountNumber",
  },
  { key: "bank_name", labelKey: "submit.form.accountDialog.fields.bankName" },
  {
    key: "holder_name",
    labelKey: "submit.form.accountDialog.fields.holderName",
  },
  { key: "bic", labelKey: "submit.form.accountDialog.fields.bic" },
]

function BankAccountsSection({ partnerId }: BankAccountsSectionProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError, error } = useBankAccounts(partnerId)
  const items = data?.items ?? []

  return (
    <SectionCard title={t("detail.overview.accountsSectionTitle")}>
      {isLoading ? (
        <div className="h-6 rounded-lg bg-muted animate-pulse" />
      ) : isError ? (
        <p className="text-sm text-destructive">
          {error instanceof ApiError
            ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.overview.accountsEmpty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(account => (
            <div
              key={account.id}
              className="flex flex-col gap-2 rounded-[10px] border border-border bg-background p-4"
            >
              {ACCOUNT_FIELDS.map(({ key, labelKey }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-muted-foreground">{t(labelKey)}</span>
                  <span className="font-medium text-foreground truncate">
                    {account[key] || "—"}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

export { BankAccountsSection }
