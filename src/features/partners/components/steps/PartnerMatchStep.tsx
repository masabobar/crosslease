import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertCircle, CheckCircle2, HelpCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PartnerRoleBadge } from "@/features/partners/components/PartnerRoleBadge"
import type { PartnerMatchResponse } from "@/features/partners/api/schema"
import { PartnerRoleSchema } from "@/features/partners/api/schema"
import type { PartnerRole } from "@/features/partners/api/schema"

const RISK_SENSITIVE_ROLES: PartnerRole[] = [
  "leasing_company",
  "bank_entity",
  "ubo_related_person",
]

type PartnerMatchStepProps = {
  matchResult: PartnerMatchResponse
  isSubmitting: boolean
  onSubmit: (role: PartnerRole) => void
  onBack: () => void
}

function classificationIcon(classification: string) {
  switch (classification) {
    case "NEW":
      return <Info size={16} className="text-blue-500" />
    case "EXACT_MATCH":
      return <CheckCircle2 size={16} className="text-green-600" />
    case "AMBIGUOUS":
      return <HelpCircle size={16} className="text-amber-500" />
    default:
      return <AlertCircle size={16} className="text-orange-500" />
  }
}

function PartnerMatchStep({
  matchResult,
  isSubmitting,
  onSubmit,
  onBack,
}: PartnerMatchStepProps) {
  const { t } = useTranslation("partners")
  const [selectedRole, setSelectedRole] = useState<PartnerRole | null>(null)
  const ALL_ROLES = PartnerRoleSchema.options

  const classificationKey =
    matchResult.classification as keyof typeof t extends never ? string : string

  const classificationLabel =
    t(
      `submit.matchStep.classification.${classificationKey}` as `submit.matchStep.classification.NEW`
    ) ?? matchResult.classification

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("submit.matchStep.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("submit.matchStep.subtitle")}
        </p>
      </div>

      {/* Classification result */}
      <div className="flex items-start gap-3 rounded-xl border border-border px-4 py-3">
        {classificationIcon(matchResult.classification)}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {classificationLabel}
          </p>
          {matchResult.confidence && (
            <p className="text-xs text-muted-foreground">
              {t("submit.matchStep.confidence")}: {matchResult.confidence}
            </p>
          )}
        </div>
      </div>

      {/* Candidates */}
      {matchResult.candidate_summaries.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">
            {t("submit.matchStep.candidates")}
          </p>
          <div className="flex flex-col gap-1">
            {matchResult.candidate_summaries.map(c => (
              <div
                key={c.partner_id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {c.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("submit.matchStep.matchedAnchors")}:{" "}
                    {c.matched_anchors.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PartnerRoleBadge role={c.confidence as PartnerRole} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role selector */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="role-select">{t("submit.matchStep.roleLabel")}</Label>
        <Select
          value={selectedRole ?? ""}
          onValueChange={v => setSelectedRole(v as PartnerRole)}
        >
          <SelectTrigger
            id="role-select"
            data-testid="role-select"
            className="w-full"
          >
            <SelectValue placeholder={t("submit.matchStep.rolePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {ALL_ROLES.map(role => (
              <SelectItem key={role} value={role}>
                {t(`role.${role}` as "role.lessee")}
                {RISK_SENSITIVE_ROLES.includes(role) && (
                  <span className="ml-2 text-xs text-amber-600">
                    (risk-sensitive)
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRole && RISK_SENSITIVE_ROLES.includes(selectedRole) && (
          <p className="text-xs text-amber-600">
            {t("submit.matchStep.riskSensitiveNote")}
          </p>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          data-testid="submit-partner"
          disabled={!selectedRole || isSubmitting}
          onClick={() => selectedRole && onSubmit(selectedRole)}
        >
          {isSubmitting ? "Submitting…" : t("submit.matchStep.submitButton")}
        </Button>
      </div>
    </div>
  )
}

export { PartnerMatchStep }
