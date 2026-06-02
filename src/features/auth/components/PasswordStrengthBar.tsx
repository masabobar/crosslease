import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import { getPasswordRequirements } from "../api/forgotPasswordSchema"
import { cn } from "@/lib/utils"

type StrengthLevel = 0 | 1 | 2 | 3 | 4

interface StrengthConfig {
  bars: number
  barColor: string
  labelColor: string
  hintBg: string
  hintTextColor: string
  hintIconColor: string
}

const STRENGTH_CONFIG: Record<StrengthLevel, StrengthConfig> = {
  0: {
    bars: 0,
    barColor: "bg-slate-200",
    labelColor: "text-muted-foreground",
    hintBg: "bg-muted border border-border",
    hintTextColor: "text-muted-foreground",
    hintIconColor: "text-muted-foreground",
  },
  1: {
    bars: 1,
    barColor: "bg-rose-600",
    labelColor: "text-rose-600",
    hintBg: "bg-rose-50",
    hintTextColor: "text-rose-700",
    hintIconColor: "text-rose-700",
  },
  2: {
    bars: 2,
    barColor: "bg-amber-500",
    labelColor: "text-amber-500",
    hintBg: "bg-amber-50",
    hintTextColor: "text-amber-700",
    hintIconColor: "text-amber-700",
  },
  3: {
    bars: 3,
    barColor: "bg-lime-500",
    labelColor: "text-lime-500",
    hintBg: "bg-lime-50 border border-border",
    hintTextColor: "text-lime-700",
    hintIconColor: "text-lime-700",
  },
  4: {
    bars: 4,
    barColor: "bg-teal-500",
    labelColor: "text-teal-500",
    hintBg: "bg-teal-50",
    hintTextColor: "text-teal-700",
    hintIconColor: "text-teal-700",
  },
}

function getStrengthLevel(password: string): StrengthLevel {
  if (!password) return 0
  const reqs = getPasswordRequirements(password)
  const met = Object.values(reqs).filter(Boolean).length
  if (met <= 2) return 1
  if (met === 3) return 2
  if (met === 4) return 3
  return 4
}

export function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useTranslation("auth")
  const level = getStrengthLevel(password)
  const config = STRENGTH_CONFIG[level]

  const labels: Record<StrengthLevel, string> = {
    0: t("passwordStrength.empty"),
    1: t("passwordStrength.weak"),
    2: t("passwordStrength.fair"),
    3: t("passwordStrength.good"),
    4: t("passwordStrength.strong"),
  }

  const reqs = getPasswordRequirements(password)
  const missing: string[] = []
  if (!reqs.minLength) missing.push(t("passwordStrength.req.minLength"))
  if (!reqs.hasUpper) missing.push(t("passwordStrength.req.hasUpper"))
  if (!reqs.hasLower) missing.push(t("passwordStrength.req.hasLower"))
  if (!reqs.hasNumber) missing.push(t("passwordStrength.req.hasNumber"))
  if (!reqs.hasSymbol) missing.push(t("passwordStrength.req.hasSymbol"))

  const hint = !password
    ? t("passwordStrength.hintEmpty")
    : missing.length === 0
      ? t("passwordStrength.hintStrong")
      : t("passwordStrength.needs", {
          items:
            missing.length === 1
              ? missing[0]
              : `${missing.slice(0, -1).join(", ")} ${t("passwordStrength.and")} ${missing[missing.length - 1]}`,
        })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground opacity-80">
          {t("passwordStrength.label")}
        </span>
        <span
          className={cn("text-xs font-semibold opacity-80", config.labelColor)}
        >
          {labels[level]}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < config.bars ? config.barColor : "bg-slate-200"
            )}
          />
        ))}
      </div>
      <div
        className={cn(
          "flex items-start gap-2 p-4 rounded-[10px]",
          config.hintBg
        )}
      >
        <Info
          size={16}
          className={cn("shrink-0 mt-px", config.hintIconColor)}
        />
        <p className={cn("text-xs leading-4", config.hintTextColor)}>{hint}</p>
      </div>
    </div>
  )
}
