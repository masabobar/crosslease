import { useTranslation } from "react-i18next"
import { Building2, User, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PartnerType } from "@/features/partners/api/schema"

const TYPE_OPTIONS: Array<{
  value: PartnerType
  icon: React.ReactNode
  descKey: string
}> = [
  {
    value: "legal_entity",
    icon: <Building2 size={20} />,
    descKey: "A registered company or organisation",
  },
  {
    value: "natural_person",
    icon: <User size={20} />,
    descKey: "An individual person",
  },
  {
    value: "sole_proprietor",
    icon: <Briefcase size={20} />,
    descKey: "A self-employed individual operating under their own name",
  },
]

type PartnerTypeStepProps = {
  selected: PartnerType | null
  onChange: (type: PartnerType) => void
}

function PartnerTypeStep({ selected, onChange }: PartnerTypeStepProps) {
  const { t } = useTranslation("partners")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("submit.typeStep.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("submit.typeStep.subtitle")}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {TYPE_OPTIONS.map(({ value, icon, descKey }) => (
          <button
            key={value}
            type="button"
            data-testid={`partner-type-${value}`}
            onClick={() => onChange(value)}
            className={cn(
              "flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-colors",
              selected === value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
            )}
          >
            <span
              className={cn(
                "shrink-0",
                selected === value ? "text-primary" : "text-muted-foreground"
              )}
            >
              {icon}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t(`type.${value}` as "type.legal_entity")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{descKey}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export { PartnerTypeStep }
