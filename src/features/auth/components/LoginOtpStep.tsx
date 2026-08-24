import { useEffect, useRef, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, CircleAlert, CircleCheckBig, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { verifyOtp, resendOtp } from "../api/loginApi"
import { TOTP_CODE_LENGTH } from "../api/mfaSchema"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"
import { SUCCESS_REDIRECT_DELAY_MS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { AppLogo } from "./AppLogo"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

type OtpHelper =
  | { type: "none" }
  | { type: "error"; message: string }
  | { type: "success"; message: string }

type LoginOtpStepProps = {
  email: string
  verificationToken: string
  onBack: () => void
}

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@")
  if (atIndex <= 1) return email
  return `${email[0]}${"*".repeat(Math.min(atIndex - 1, 6))}${email.slice(atIndex)}`
}

export function LoginOtpStep({
  email,
  verificationToken,
  onBack,
}: LoginOtpStepProps) {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const setAuthenticated = useAuthStore(s => s.setAuthenticated)

  const [otpValue, setOtpValue] = useState("")
  const [otpHelper, setOtpHelper] = useState<OtpHelper>({ type: "none" })
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const isSuccess = otpHelper.type === "success"
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // The success state is held briefly so the confirmation is readable before the redirect;
  // the timer is cleared on unmount so it cannot navigate a torn-down tree.
  useEffect(() => {
    if (!isSuccess) return
    redirectTimeoutRef.current = setTimeout(
      () => navigate(PATHS.DASHBOARD),
      SUCCESS_REDIRECT_DELAY_MS
    )
    return () => clearTimeout(redirectTimeoutRef.current)
  }, [isSuccess, navigate])

  const resolveErrorMessage = (err: unknown) => resolveApiErrorMessage(err, t)

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (otpValue.length !== TOTP_CODE_LENGTH || isOtpSubmitting) return
    setIsOtpSubmitting(true)
    setOtpHelper({ type: "none" })
    try {
      await verifyOtp({ verification_token: verificationToken, code: otpValue })
      setAuthenticated(true)
      setOtpHelper({ type: "success", message: t("login.otp.success") })
    } catch (err) {
      setOtpHelper({ type: "error", message: resolveErrorMessage(err) })
      setIsOtpSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (isResending) return
    setIsResending(true)
    setOtpHelper({ type: "none" })
    try {
      await resendOtp({ verification_token: verificationToken })
      setOtpValue("")
    } catch (err) {
      setOtpHelper({ type: "error", message: resolveErrorMessage(err) })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex justify-center pt-8">
        <AppLogo />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-[416px] bg-card rounded-[14px] shadow-xl overflow-hidden">
          <form onSubmit={handleOtpSubmit} data-testid="otp-form">
            <div className="flex flex-col gap-6 p-4">
              <div className="p-3 bg-primary/10 rounded-[14px] w-fit">
                <Mail size={24} className="text-primary" />
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-foreground leading-7">
                  {t("login.otp.title")}
                </h2>
                <p className="text-base text-muted-foreground leading-6">
                  {t("login.otp.subtitle", { email: maskEmail(email) })}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <InputOTP
                  maxLength={TOTP_CODE_LENGTH}
                  value={otpValue}
                  onChange={setOtpValue}
                  hasError={otpHelper.type === "error"}
                  disabled={isOtpSubmitting || isSuccess}
                  autoFocus
                  data-testid="otp-code-input"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                {otpHelper.type !== "none" && (
                  <div
                    className="flex items-center gap-1.5"
                    data-testid="otp-helper-text"
                  >
                    {otpHelper.type === "error" ? (
                      <CircleAlert
                        size={16}
                        className="text-destructive shrink-0"
                      />
                    ) : (
                      <CircleCheckBig
                        size={16}
                        className="text-green-600 shrink-0"
                      />
                    )}
                    <span
                      className={
                        otpHelper.type === "error"
                          ? "text-sm text-destructive"
                          : "text-base text-green-600"
                      }
                    >
                      {otpHelper.message}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-base text-muted-foreground leading-6">
                {t("login.otp.didntReceive")}{" "}
                <Button
                  type="button"
                  variant="link"
                  data-testid="otp-resend-button"
                  disabled={isResending || isSuccess}
                  onClick={handleResend}
                  className="h-auto p-0 underline underline-offset-2 hover:text-primary/80 font-normal"
                >
                  {isResending
                    ? t("login.otp.resending")
                    : t("login.otp.resend")}
                </Button>
              </p>
            </div>

            <div className="border-t p-4 flex items-center justify-end gap-1.5 bg-slate-50/80">
              <Button
                type="button"
                variant="outline"
                data-testid="otp-back-button"
                disabled={isOtpSubmitting || isSuccess}
                onClick={onBack}
              >
                {t("login.otp.back")}
              </Button>
              <Button
                type="submit"
                data-testid="otp-submit-button"
                disabled={
                  otpValue.length !== TOTP_CODE_LENGTH ||
                  isOtpSubmitting ||
                  isSuccess
                }
              >
                {isSuccess ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("login.otp.redirecting")}
                  </>
                ) : isOtpSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("login.otp.submitting")}
                  </>
                ) : (
                  t("login.otp.submit")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
