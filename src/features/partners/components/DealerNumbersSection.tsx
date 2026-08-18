import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { SectionCard } from "@/features/partners/components/PartnerDetailPrimitives"
import { useLcNumbers } from "@/features/partners/hooks/useLcNumbers"
import { ApiError } from "@/lib/api"

type DealerNumbersSectionProps = {
  partnerId: string
}

function DealerNumbersSection({ partnerId }: DealerNumbersSectionProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError, error } = useLcNumbers(partnerId)
  const items = data?.items ?? []

  return (
    <SectionCard title={t("detail.overview.dealerNumbersSectionTitle")}>
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
          {t("detail.overview.dealerNumbersEmpty")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map(item => (
            <Badge key={item.id} variant="outline">
              {item.lc_number}
            </Badge>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

export { DealerNumbersSection }
