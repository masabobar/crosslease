import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Shield, AlertCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { mfaVerify } from "../api/mfaApi"
import { RECOVERY_CODE_LENGTH, TOTP_CODE_LENGTH } from "../api/mfaSchema"
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

type LocationState = { mfa_token: string; email?: string } | null

export default function MfaVerifyPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticated } = useAuthStore()

  const state = (location.state as LocationState) ?? null
  const mfaToken = state?.mfa_token ?? ""

  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  if (!mfaToken) {
    return (
      <AuthPageLayout>
        <div className="w-full max-w-[400px] bg-card rounded-xl shadow-sm border border-border p-6">
          <p className="text-sm text-muted-foreground">
            {t("mfaVerify.sessionExpired")}
          </p>
          <Button
            type="button"
            className="mt-4 w-full"
            data-testid="mfa-verify-no-token-back-button"
            onClick={() => navigate(PATHS.LOGIN)}
          >
            {t("mfaVerify.backToLogin")}
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  const isRecoveryCode =
    code.length === RECOVERY_CODE_LENGTH && /^[0-9a-f]+$/.test(code)
  const isTotpCode = code.length === TOTP_CODE_LENGTH && /^\d+$/.test(code)
  const isValid = isRecoveryCode || isTotpCode

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    setServerError(null)
    try {
      await mfaVerify(mfaToken, code)
      setAuthenticated(true)
      navigate(PATHS.DASHBOARD)
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("errors.generic")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageLayout>
      <AuthCard>
        <AuthCardHeader>
          <div className="p-3 bg-primary/10 rounded-[14px] w-fit mb-4">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("mfaVerify.title")}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("mfaVerify.subtitle")}
          </p>
        </AuthCardHeader>

        <AuthCardBody>
          {serverError && (
            <div
              data-testid="mfa-verify-error-message"
              className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          <form
            id="mfa-verify-form"
            data-testid="mfa-verify-form"
            onSubmit={handleSubmit}
          >
            <div>
              <Label htmlFor="mfa-code" className="mb-1.5">
                {t("mfaVerify.codeLabel")}
              </Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                data-testid="mfa-code-input"
                value={code}
                onChange={e => setCode(e.target.value.trim())}
                placeholder={t("mfaVerify.codePlaceholder")}
                className="text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("mfaVerify.recoveryHint")}
              </p>
            </div>
          </form>
        </AuthCardBody>

        <AuthCardFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="mfa-verify-back-button"
            onClick={() => navigate(PATHS.LOGIN)}
          >
            {t("mfaVerify.back")}
          </Button>
          <Button
            type="submit"
            form="mfa-verify-form"
            disabled={!isValid || isSubmitting}
            data-testid="mfa-verify-submit-button"
          >
            {isSubmitting ? t("mfaVerify.submitting") : t("mfaVerify.submit")}
          </Button>
        </AuthCardFooter>
      </AuthCard>
    </AuthPageLayout>
  )
}
