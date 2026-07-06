import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PartnerSubmitForm } from "@/features/partners/components/PartnerSubmitForm"
import type { SubmitResult } from "@/features/partners/components/PartnerSubmitForm"
import { MatchingReview } from "@/features/partners/components/MatchingReview"
import {
  matchPartner,
  submitPartner,
} from "@/features/partners/api/partnersApi"
import type {
  MatchPartnerBody,
  PartnerIdentityInput,
  SubmitPartnerBody,
} from "@/features/partners/api/partnersApi"
import type {
  PartnerMatchResponse,
  PartnerRole,
} from "@/features/partners/api/schema"
import { partnerDetail } from "@/router/paths"
import { ApiError } from "@/lib/api"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"

type View = "form" | "matching"

const SUBMIT_FORM_ID = "partner-submit-form"

export default function SubmitPartnerPage() {
  const { t } = useTranslation("partners")
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const tenantId = currentUser?.tenant_id ?? null

  const [view, setView] = useState<View>("form")
  const [pending, setPending] = useState<{
    identity: PartnerIdentityInput
    roles: PartnerRole[]
  } | null>(null)
  const [matchResult, setMatchResult] = useState<PartnerMatchResponse | null>(
    null
  )

  const matchMutation = useMutation({
    mutationFn: (body: MatchPartnerBody) =>
      matchPartner(tenantId as string, body),
    onError: err => {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, {
              defaultValue: t("submit.errors.matchFailed"),
            })
          : t("submit.errors.matchFailed")
      )
      setView("form")
    },
  })

  const submitMutation = useMutation({
    mutationFn: (body: SubmitPartnerBody) =>
      submitPartner(tenantId as string, body),
    onSuccess: result => {
      navigate(partnerDetail(result.partner_id))
    },
    onError: err => {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, {
              defaultValue: t("submit.errors.submitFailed"),
            })
          : t("submit.errors.submitFailed")
      )
    },
  })

  async function handleFormSubmit({ identity, roles }: SubmitResult) {
    if (!tenantId) return
    setPending({ identity, roles })
    setMatchResult(null)
    setView("matching")
    const result = await matchMutation.mutateAsync({ identity })
    if (result) setMatchResult(result)
  }

  function handleConfirmCreate() {
    if (!pending || !tenantId) return
    submitMutation.mutate(pending)
  }

  function handleCancel() {
    setView("form")
    setMatchResult(null)
    setPending(null)
  }

  // NOTE: submit/match are tenant-scoped (POST /tenants/{tenant_id}/partners...).
  // System Admin has no single tenant_id, so submission isn't possible yet — pending a
  // team decision on how System Admin should select a tenant. Block the screen rather
  // than guess at a selector.
  if (currentUser && !tenantId) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">
          {t("submit.tenantRequired")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground">
            {t("submit.title")}
          </h1>
          {view === "form" && (
            <p className="text-sm text-muted-foreground">
              {t("submit.subtitle")}
            </p>
          )}
        </div>
      </div>

      {view === "form" ? (
        <>
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="max-w-2xl mx-auto">
              <PartnerSubmitForm
                formId={SUBMIT_FORM_ID}
                onSubmit={handleFormSubmit}
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-8 py-3.5 border-t border-border">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              data-testid="submit-cancel"
            >
              {t("submit.form.cancel")}
            </Button>
            <Button
              type="submit"
              form={SUBMIT_FORM_ID}
              disabled={matchMutation.isPending || !tenantId}
              data-testid="submit-for-matching"
            >
              {matchMutation.isPending
                ? t("submit.form.submitting")
                : t("submit.form.submitButton")}
            </Button>
          </div>
        </>
      ) : (
        pending && (
          <MatchingReview
            matchResult={matchResult}
            identity={pending.identity}
            roles={pending.roles}
            isSubmitting={submitMutation.isPending}
            onConfirmCreate={handleConfirmCreate}
            onCancel={handleCancel}
          />
        )
      )}
    </div>
  )
}
