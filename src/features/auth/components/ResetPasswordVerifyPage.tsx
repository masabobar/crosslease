import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Shield, AlertCircle, Check, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"
import { resetPasswordVerify } from "../api/mfaApi"
import { useAuthStore } from "@/store/authStore"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthPageLayout } from "./AuthPageLayout"
import {
  AuthCard,
  AuthCardHeader,
  AuthCardBody,
  AuthCardFooter,
} from "./AuthCard"

type LocationState = { mfa_token: string } | null
type PageStep = "verify" | "recovery" | "success"

export default function ResetPasswordVerifyPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticated } = useAuthStore()

  const state = (location.state as LocationState) ?? null
  const mfaToken = state?.mfa_token ?? ""

  const [step, setStep] = useState<PageStep>("verify")
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(
    null
  )
  const [copied, setCopied] = useState(false)

  if (!mfaToken) {
    return (
      <AuthPageLayout>
        <div className="w-full max-w-[400px] bg-card rounded-xl shadow-sm border border-border p-6">
          <p className="text-sm text-muted-foreground">
            {t("resetPasswordVerify.sessionExpired")}
          </p>
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={() => navigate(PATHS.FORGOT_PASSWORD)}
          >
            {t("resetPasswordVerify.requestNew")}
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  const isRecoveryCode = code.length === 20 && /^[0-9a-f]+$/.test(code)
  const isTotpCode = code.length === 6 && /^\d+$/.test(code)
  const isValid = isRecoveryCode || isTotpCode

  const errorMessages: Record<string, string> = {
    MFA_TOKEN_INVALID: t("resetPasswordVerify.errors.MFA_TOKEN_INVALID"),
    MFA_CODE_INVALID: t("resetPasswordVerify.errors.MFA_CODE_INVALID"),
    MFA_RECOVERY_RATE_LIMITED: t(
      "resetPasswordVerify.errors.MFA_RECOVERY_RATE_LIMITED"
    ),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    setServerError(null)
    try {
      const result = await resetPasswordVerify(mfaToken, code)
      setAuthenticated(true)
      if (result.new_recovery_codes?.length) {
        setNewRecoveryCodes(result.new_recovery_codes)
        setStep("recovery")
      } else {
        setStep("success")
      }
    } catch (err) {
      const apiCode = err instanceof ApiError ? err.code : ""
      setServerError(
        errorMessages[apiCode] ?? t("resetPasswordVerify.errors.default")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyCodes = async () => {
    if (!newRecoveryCodes) return
    await navigator.clipboard.writeText(newRecoveryCodes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === "success") {
    return (
      <AuthPageLayout>
        <div
          data-testid="reset-password-verify-success"
          className="w-full max-w-[400px] bg-card rounded-xl shadow-sm border border-border p-6"
        >
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
            <Check size={24} className="text-success" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("resetPasswordVerify.success.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("resetPasswordVerify.success.body")}
          </p>
          <Button
            type="button"
            data-testid="reset-password-verify-go-to-dashboard"
            onClick={() => navigate(PATHS.DASHBOARD)}
            className="mt-6 w-full"
          >
            {t("resetPasswordVerify.success.goToDashboard")}
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  if (step === "recovery" && newRecoveryCodes) {
    return (
      <AuthPageLayout>
        <AuthCard>
          <AuthCardHeader>
            <div className="p-3 bg-amber-100 rounded-[14px] w-fit mb-4">
              <Shield size={24} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {t("resetPasswordVerify.newCodes.title")}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {t("resetPasswordVerify.newCodes.subtitle")}
            </p>
          </AuthCardHeader>

          <AuthCardBody>
            <div
              data-testid="reset-password-verify-new-recovery-codes"
              className="bg-muted rounded-lg p-4 font-mono text-sm grid grid-cols-2 gap-2"
            >
              {newRecoveryCodes.map(c => (
                <span key={c} className="text-foreground">
                  {c}
                </span>
              ))}
            </div>
          </AuthCardBody>

          <AuthCardFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="reset-password-verify-copy-codes-button"
              onClick={handleCopyCodes}
              className="gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied
                ? t("resetPasswordVerify.newCodes.copied")
                : t("resetPasswordVerify.newCodes.copy")}
            </Button>
            <Button
              type="button"
              data-testid="reset-password-verify-continue-button"
              onClick={() => navigate(PATHS.DASHBOARD)}
            >
              {t("resetPasswordVerify.newCodes.continue")}
            </Button>
          </AuthCardFooter>
        </AuthCard>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout>
      <AuthCard>
        <AuthCardHeader>
          <div className="p-3 bg-primary/10 rounded-[14px] w-fit mb-4">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("resetPasswordVerify.title")}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("resetPasswordVerify.subtitle")}
          </p>
        </AuthCardHeader>

        <AuthCardBody>
          {serverError && (
            <div
              data-testid="reset-password-verify-error-message"
              className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          <form
            id="reset-password-verify-form"
            data-testid="reset-password-verify-form"
            onSubmit={handleSubmit}
          >
            <div>
              <Label htmlFor="rpv-code" className="mb-1.5">
                {t("resetPasswordVerify.codeLabel")}
              </Label>
              <Input
                id="rpv-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                data-testid="reset-password-verify-code-input"
                value={code}
                onChange={e => setCode(e.target.value.trim())}
                placeholder={t("resetPasswordVerify.codePlaceholder")}
                className="text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("resetPasswordVerify.recoveryHint")}
              </p>
            </div>
          </form>
        </AuthCardBody>

        <AuthCardFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="reset-password-verify-back-button"
            onClick={() => navigate(PATHS.FORGOT_PASSWORD)}
          >
            {t("resetPasswordVerify.back")}
          </Button>
          <Button
            type="submit"
            form="reset-password-verify-form"
            disabled={!isValid || isSubmitting}
            data-testid="reset-password-verify-submit-button"
          >
            {isSubmitting
              ? t("resetPasswordVerify.submitting")
              : t("resetPasswordVerify.submit")}
          </Button>
        </AuthCardFooter>
      </AuthCard>
    </AuthPageLayout>
  )
}
