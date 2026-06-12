import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useLocation } from "react-router-dom"
import { Shield, AlertCircle, Copy, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { mfaEnroll, mfaActivate } from "../api/mfaApi"
import type { MfaEnrollResponse } from "../api/mfaSchema"
import { AUTH_QUERY_KEYS } from "@/features/auth/api/queryKeys"
import { useAuthStore } from "@/store/authStore"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import { COPIED_RESET_DELAY_MS } from "@/lib/constants"
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
type PageStep = "enroll" | "recovery"

export default function MfaEnrollPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticated } = useAuthStore()

  const state = (location.state as LocationState) ?? null
  const initialToken = state?.mfa_token ?? ""

  const [step, setStep] = useState<PageStep>("enroll")
  const [enrollData, setEnrollData] = useState<MfaEnrollResponse | null>(null)
  const [code, setCode] = useState("")
  const [isActivating, setIsActivating] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const { isLoading: isEnrolling, error: enrollError } = useQuery({
    queryKey: AUTH_QUERY_KEYS.mfaEnroll(initialToken),
    queryFn: async () => {
      const data = await mfaEnroll(initialToken)
      setEnrollData(data)
      return data
    },
    enabled: !!initialToken,
    retry: false,
    staleTime: Infinity,
  })

  if (!initialToken) {
    return (
      <AuthPageLayout>
        <div className="w-full max-w-[400px] bg-card rounded-xl shadow-sm border border-border p-6">
          <p className="text-sm text-muted-foreground">
            {t("mfaEnroll.sessionExpired")}
          </p>
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={() => navigate(PATHS.LOGIN)}
          >
            {t("mfaEnroll.backToLogin")}
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  if (isEnrolling) {
    return (
      <AuthPageLayout>
        <div className="w-full max-w-[480px] flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthPageLayout>
    )
  }

  if (enrollError || !enrollData) {
    const apiCode = enrollError instanceof ApiError ? enrollError.code : ""
    return (
      <AuthPageLayout>
        <div className="w-full max-w-[400px] bg-card rounded-xl shadow-sm border border-border p-6">
          <p className="text-sm text-destructive">
            {apiCode === "MFA_TOKEN_INVALID"
              ? t("mfaEnroll.errors.MFA_TOKEN_INVALID")
              : t("mfaEnroll.errors.default")}
          </p>
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={() => navigate(PATHS.LOGIN)}
          >
            {t("mfaEnroll.backToLogin")}
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6 || isActivating) return
    setIsActivating(true)
    setServerError(null)
    try {
      const result = await mfaActivate(enrollData.mfa_token, code)
      setRecoveryCodes(result.recovery_codes)
      setAuthenticated(true)
      setStep("recovery")
    } catch (err) {
      const apiCode = err instanceof ApiError ? err.code : ""
      const messages: Record<string, string> = {
        MFA_CODE_INVALID: t("mfaEnroll.errors.MFA_CODE_INVALID"),
        MFA_TOKEN_INVALID: t("mfaEnroll.errors.MFA_TOKEN_INVALID"),
      }
      setServerError(messages[apiCode] ?? t("mfaEnroll.errors.default"))
    } finally {
      setIsActivating(false)
    }
  }

  const handleCopyCodes = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS)
  }

  if (step === "recovery") {
    return (
      <AuthPageLayout>
        <AuthCard>
          <AuthCardHeader>
            <div className="p-3 bg-amber-100 rounded-[14px] w-fit mb-4">
              <Shield size={24} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {t("mfaEnroll.recovery.title")}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {t("mfaEnroll.recovery.subtitle")}
            </p>
          </AuthCardHeader>

          <AuthCardBody>
            <div
              data-testid="mfa-recovery-codes"
              className="bg-muted rounded-lg p-4 font-mono text-sm grid grid-cols-2 gap-2"
            >
              {recoveryCodes.map(c => (
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
              data-testid="mfa-copy-recovery-codes-button"
              onClick={handleCopyCodes}
              className="gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied
                ? t("mfaEnroll.recovery.copied")
                : t("mfaEnroll.recovery.copy")}
            </Button>
            <Button
              type="button"
              data-testid="mfa-recovery-continue-button"
              onClick={() => navigate(PATHS.DASHBOARD)}
            >
              {t("mfaEnroll.recovery.continue")}
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
            {t("mfaEnroll.title")}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("mfaEnroll.subtitle")}
          </p>
        </AuthCardHeader>

        <AuthCardBody>
          {serverError && (
            <div
              data-testid="mfa-enroll-error-message"
              className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                {t("mfaEnroll.scanQr")}
              </p>
              <div data-testid="mfa-qr-code" className="flex justify-center">
                <img
                  src={`data:image/png;base64,${enrollData.qr_code}`}
                  alt={t("mfaEnroll.qrAlt")}
                  className="w-48 h-48 rounded-lg border border-border"
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t("mfaEnroll.manualEntry")}
              </p>
              <code
                data-testid="mfa-secret-key"
                className="block bg-muted rounded-md px-3 py-2 text-sm font-mono break-all"
              >
                {enrollData.secret}
              </code>
            </div>

            <form
              id="mfa-activate-form"
              data-testid="mfa-activate-form"
              onSubmit={handleActivate}
            >
              <Label htmlFor="mfa-activate-code" className="mb-1.5">
                {t("mfaEnroll.codeLabel")}
              </Label>
              <Input
                id="mfa-activate-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                data-testid="mfa-activate-code-input"
                value={code}
                onChange={e =>
                  setCode(e.target.value.trim().replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("mfaEnroll.codeHint")}
              </p>
            </form>
          </div>
        </AuthCardBody>

        <AuthCardFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="mfa-enroll-back-button"
            onClick={() => navigate(PATHS.LOGIN)}
          >
            {t("mfaEnroll.back")}
          </Button>
          <Button
            type="submit"
            form="mfa-activate-form"
            disabled={code.length !== 6 || isActivating}
            data-testid="mfa-enroll-activate-button"
          >
            {isActivating ? t("mfaEnroll.activating") : t("mfaEnroll.activate")}
          </Button>
        </AuthCardFooter>
      </AuthCard>
    </AuthPageLayout>
  )
}
