import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate, useNavigate } from "react-router-dom"
import { useState, type FormEvent } from "react"
import { z } from "zod"
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  Shield,
  TrendingUp,
  CircleAlert,
  CircleCheckBig,
  Loader2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { login, verifyOtp, resendOtp } from "../api/loginApi"
import { useAuthStore } from "@/store/authStore"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { AppLogo } from "./AppLogo"

const SUCCESS_REDIRECT_DELAY_MS = 800

const credentialsSchema = z.object({
  email: z.string().min(1, "required").email("required"),
  password: z.string().min(1, "required"),
})

type CredentialsInput = z.infer<typeof credentialsSchema>

type OtpHelper =
  | { type: "none" }
  | { type: "error"; message: string }
  | { type: "success"; message: string }

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@")
  if (atIndex <= 1) return email
  return `${email[0]}${"*".repeat(Math.min(atIndex - 1, 6))}${email.slice(atIndex)}`
}

export default function LoginPage() {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { setAuthenticated } = useAuthStore()

  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [verificationToken, setVerificationToken] = useState("")
  const [emailForOtp, setEmailForOtp] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)

  const [otpValue, setOtpValue] = useState("")
  const [otpHelper, setOtpHelper] = useState<OtpHelper>({ type: "none" })
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const resolveMsg = (msg: string | undefined) =>
    msg === "required" ? tCommon("validation.required") : msg

  const credentialsForm = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  })

  const errorMessages: Record<string, string> = {
    INVALID_CREDENTIALS: t("login.errors.INVALID_CREDENTIALS"),
    ACCOUNT_LOCKED: t("login.errors.ACCOUNT_LOCKED"),
    ACCOUNT_DISABLED: t("login.errors.ACCOUNT_DISABLED"),
    IP_THROTTLED: t("login.errors.IP_THROTTLED"),
    ACCOUNT_NOT_ACTIVATED: t("login.errors.ACCOUNT_NOT_ACTIVATED"),
    ACCOUNT_SUSPENDED: t("login.errors.ACCOUNT_SUSPENDED"),
    ACCOUNT_DEACTIVATED: t("login.errors.ACCOUNT_DEACTIVATED"),
    ACCOUNT_EXPIRED: t("login.errors.ACCOUNT_EXPIRED"),
    INVALID_OTP: t("login.errors.INVALID_OTP"),
    OTP_EXPIRED: t("login.errors.OTP_EXPIRED"),
    OTP_MAX_ATTEMPTS: t("login.errors.OTP_MAX_ATTEMPTS"),
    OTP_RESEND_THROTTLED: t("login.errors.OTP_RESEND_THROTTLED"),
  }

  if (isAuthenticated) {
    return <Navigate to={PATHS.DASHBOARD} replace />
  }

  const onCredentialsSubmit = credentialsForm.handleSubmit(async data => {
    setServerError(null)
    try {
      const result = await login(data)
      setVerificationToken(result.verification_token)
      setEmailForOtp(data.email)
      setStep("otp")
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      setServerError(errorMessages[code] ?? t("login.errors.default"))
    }
  })

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (otpValue.length !== 6 || isOtpSubmitting) return
    setIsOtpSubmitting(true)
    setOtpHelper({ type: "none" })
    try {
      await verifyOtp({
        verification_token: verificationToken,
        code: otpValue,
      })
      setOtpHelper({ type: "success", message: t("login.otp.success") })
      setAuthenticated(true)
      setTimeout(() => navigate(PATHS.DASHBOARD), SUCCESS_REDIRECT_DELAY_MS)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      const message = errorMessages[code] ?? t("login.errors.default")
      if (code === "OTP_EXPIRED" || code === "OTP_MAX_ATTEMPTS") {
        setServerError(message)
        setStep("credentials")
        setOtpValue("")
        setOtpHelper({ type: "none" })
      } else {
        setOtpHelper({ type: "error", message })
      }
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
      const code = err instanceof ApiError ? err.code : ""
      setOtpHelper({
        type: "error",
        message: errorMessages[code] ?? t("login.errors.default"),
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToCredentials = () => {
    setStep("credentials")
    setVerificationToken("")
    setEmailForOtp("")
    setOtpValue("")
    setOtpHelper({ type: "none" })
    setServerError(null)
  }

  if (step === "otp") {
    const isSuccess = otpHelper.type === "success"

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
                    {t("login.otp.subtitle", { email: maskEmail(emailForOtp) })}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    hasError={otpHelper.type === "error"}
                    disabled={isOtpSubmitting || isSuccess}
                    autoFocus
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
                  <button
                    type="button"
                    data-testid="otp-resend-button"
                    disabled={isResending || isSuccess}
                    onClick={handleResend}
                    className="text-primary underline underline-offset-2 hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending
                      ? t("login.otp.resending")
                      : t("login.otp.resend")}
                  </button>
                </p>
              </div>

              <div className="border-t p-4 flex items-center justify-end gap-1.5 bg-slate-50/80">
                <Button
                  type="button"
                  variant="outline"
                  data-testid="otp-back-button"
                  disabled={isOtpSubmitting || isSuccess}
                  onClick={handleBackToCredentials}
                >
                  {t("login.otp.back")}
                </Button>
                <Button
                  type="submit"
                  data-testid="otp-submit-button"
                  disabled={
                    otpValue.length !== 6 || isOtpSubmitting || isSuccess
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

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-25" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary/30 rounded-full blur-3xl opacity-20" />

          <svg
            className="absolute inset-0 w-full h-full opacity-[0.12] text-primary"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-100 200 Q 150 100, 400 200 T 900 200"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M-100 350 Q 200 250, 450 350 T 1000 350"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M-100 500 Q 180 400, 420 500 T 950 500"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M-100 650 Q 220 550, 480 650 T 1000 650"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />

          <div className="absolute top-20 right-20 w-32 h-32 border border-primary/30 rounded-2xl rotate-12 backdrop-blur-sm" />
          <div className="absolute bottom-32 left-32 w-24 h-24 border border-primary/30 rounded-full backdrop-blur-sm" />
          <div className="absolute top-40 right-40 w-3 h-3 bg-primary/50 rounded-full shadow-md shadow-primary/30" />
          <div className="absolute top-60 right-60 w-2 h-2 bg-primary/40 rounded-full shadow-md shadow-primary/30" />
          <div className="absolute bottom-40 left-40 w-3 h-3 bg-primary/40 rounded-full shadow-md shadow-primary/30" />
          <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-primary/40 rounded-full shadow-md shadow-primary/30" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-20 py-24 text-gray-900">
          <div className="mb-16">
            <div className="w-20 h-20 bg-primary/15 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-xl">
              <TrendingUp
                size={40}
                className="text-primary"
                strokeWidth={2.5}
              />
            </div>

            <h1 className="text-6xl font-bold mb-6 leading-tight tracking-tight">
              {t("login.headline")}
              <br />
              {t("login.headline2")}
            </h1>
            <p className="text-2xl text-gray-700 leading-relaxed font-light max-w-lg">
              {t("login.subtitle")}
            </p>

            <div className="mt-12 flex gap-12 opacity-90">
              <div>
                <div className="text-4xl font-bold mb-1">50+</div>
                <div className="text-gray-600 text-sm font-medium">
                  {t("login.stats.institutions")}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">€2.5B+</div>
                <div className="text-gray-600 text-sm font-medium">
                  {t("login.stats.volume")}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">99.9%</div>
                <div className="text-gray-600 text-sm font-medium">
                  {t("login.stats.uptime")}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 backdrop-blur-md rounded-full shadow-sm">
                <Shield size={20} className="text-primary" />
                <span className="text-gray-700 font-medium">
                  {t("login.trust")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 lg:w-[55%] bg-muted flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp size={32} className="text-white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {t("login.title")}
              </h2>
              <p className="text-muted-foreground">{t("login.subtitle2")}</p>
            </div>

            <form
              data-testid="login-form"
              onSubmit={onCredentialsSubmit}
              className="space-y-6"
            >
              {serverError && (
                <div
                  data-testid="login-error-message"
                  className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <span className="text-sm">{serverError}</span>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="mb-2">
                  {t("login.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.emailPlaceholder")}
                  data-testid="login-email-input"
                  startIcon={<User size={16} />}
                  className="py-3.5 bg-card rounded-xl"
                  {...credentialsForm.register("email")}
                />
                {credentialsForm.formState.errors.email && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {resolveMsg(credentialsForm.formState.errors.email.message)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="mb-2">
                  {t("login.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="login-password-input"
                  startIcon={<Lock size={20} />}
                  className="pl-12 py-3.5 bg-card rounded-xl"
                  {...credentialsForm.register("password")}
                />
                {credentialsForm.formState.errors.password && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {resolveMsg(
                      credentialsForm.formState.errors.password.message
                    )}
                  </p>
                )}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    data-testid="login-forgot-password-button"
                    onClick={() => navigate(PATHS.FORGOT_PASSWORD)}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                  >
                    {t("login.forgotPassword")}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={credentialsForm.formState.isSubmitting}
                data-testid="login-submit-button"
                className="w-full h-auto py-4 rounded-xl font-semibold flex-col shadow-lg"
              >
                <span className="block text-lg">
                  {credentialsForm.formState.isSubmitting
                    ? t("login.submitting")
                    : t("login.submit")}
                </span>
                <span className="block text-xs mt-1 text-primary-foreground/70 font-normal">
                  {t("login.submitSubtitle")}
                </span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
