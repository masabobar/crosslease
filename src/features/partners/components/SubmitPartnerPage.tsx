import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PartnerTypeStep } from "@/features/partners/components/steps/PartnerTypeStep"
import { PartnerIdentityStep } from "@/features/partners/components/steps/PartnerIdentityStep"
import { PartnerMatchStep } from "@/features/partners/components/steps/PartnerMatchStep"
import {
  matchPartner,
  submitPartner,
} from "@/features/partners/api/partnersApi"
import type { PartnerIdentityInput } from "@/features/partners/api/partnersApi"
import type {
  PartnerType,
  PartnerRole,
  PartnerMatchResponse,
} from "@/features/partners/api/schema"
import { partnerDetail } from "@/router/paths"
import { ApiError } from "@/lib/api"

type WizardStep = "type" | "identity" | "match"

export default function SubmitPartnerPage() {
  const { t } = useTranslation("partners")
  const navigate = useNavigate()

  const [step, setStep] = useState<WizardStep>("type")
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null)
  const [identity, setIdentity] = useState<PartnerIdentityInput | null>(null)
  const [matchResult, setMatchResult] = useState<PartnerMatchResponse | null>(
    null
  )

  const matchMutation = useMutation({
    mutationFn: matchPartner,
    onError: err => {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("submit.errors.matchFailed")
      )
    },
  })

  const submitMutation = useMutation({
    mutationFn: submitPartner,
    onSuccess: result => {
      navigate(partnerDetail(result.partner_id))
    },
    onError: err => {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("submit.errors.submitFailed")
      )
    },
  })

  const STEP_LABELS = [
    t("submit.steps.type"),
    t("submit.steps.identity"),
    t("submit.steps.match"),
  ]

  const stepIndex: Record<WizardStep, number> = {
    type: 0,
    identity: 1,
    match: 2,
  }

  async function handleIdentityNext(data: PartnerIdentityInput) {
    setIdentity(data)
    const result = await matchMutation.mutateAsync({ identity: data })
    if (result) {
      setMatchResult(result)
      setStep("match")
    }
  }

  async function handleSubmit(role: PartnerRole) {
    if (!identity) return
    await submitMutation.mutateAsync({ identity, role })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-border">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(-1)}
          data-testid="wizard-back"
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">
          {t("submit.title")}
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 px-8 py-4 border-b border-border">
        {STEP_LABELS.map((label, i) => {
          const current = stepIndex[step]
          const isActive = i === current
          const isDone = i < current
          return (
            <div key={label} className="flex items-center gap-0">
              <div className="flex items-center gap-2">
                <span
                  className={`shrink-0 size-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="mx-3 h-px w-8 bg-border" />
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 max-w-2xl">
        {step === "type" && (
          <>
            <PartnerTypeStep selected={partnerType} onChange={setPartnerType} />
            <div className="flex justify-end pt-6">
              <Button
                data-testid="type-next"
                disabled={!partnerType}
                onClick={() => setStep("identity")}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === "identity" && partnerType && (
          <PartnerIdentityStep
            partnerType={partnerType}
            defaultValues={identity ?? undefined}
            onNext={handleIdentityNext}
            onBack={() => setStep("type")}
          />
        )}

        {step === "match" && matchResult && (
          <PartnerMatchStep
            matchResult={matchResult}
            isSubmitting={submitMutation.isPending}
            onSubmit={handleSubmit}
            onBack={() => setStep("identity")}
          />
        )}
      </div>
    </div>
  )
}
