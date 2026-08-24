import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Lock, User, AlertCircle, TrendingUp, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { login } from "../api/loginApi"
import { LoginInputSchema, REQUIRED_FIELD_MESSAGE } from "../api/schema"
import type { LoginInput } from "../api/schema"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginBrandingPanel } from "./LoginBrandingPanel"
import { LoginOtpStep } from "./LoginOtpStep"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

type LoginStep =
  | { name: "credentials" }
  | { name: "otp"; verificationToken: string; email: string }

export default function LoginPage() {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const setAuthenticated = useAuthStore(s => s.setAuthenticated)

  const [step, setStep] = useState<LoginStep>({ name: "credentials" })
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const resolveMsg = (msg: string | undefined) =>
    msg === REQUIRED_FIELD_MESSAGE ? tCommon("validation.required") : msg

  const credentialsForm = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: "", password: "" },
  })

  // Bounces an already-signed-in visitor away from /login — but not mid-OTP: the OTP step
  // sets the auth flag itself and then holds a success state briefly before redirecting.
  // Without the step check, that re-render unmounts the step and the confirmation is never seen.
  if (isAuthenticated && step.name !== "otp") {
    return <Navigate to={PATHS.DASHBOARD} replace />
  }

  const onCredentialsSubmit = credentialsForm.handleSubmit(async data => {
    setServerError(null)
    try {
      const result = await login(data)
      if (result.next_step === "session") {
        setAuthenticated(true)
        navigate(PATHS.DASHBOARD)
        return
      }
      if (result.next_step === "otp") {
        setStep({
          name: "otp",
          verificationToken: result.token ?? "",
          email: data.email,
        })
        return
      }
      if (result.next_step === "mfa") {
        navigate(PATHS.MFA_VERIFY, {
          state: { mfa_token: result.token ?? "", email: data.email },
        })
        return
      }
      if (result.next_step === "mfa_setup") {
        navigate(PATHS.MFA_ENROLL, {
          state: { mfa_token: result.token ?? "" },
        })
        return
      }
    } catch (err) {
      setServerError(resolveApiErrorMessage(err, t))
    }
  })

  const handleBackToCredentials = () => {
    setStep({ name: "credentials" })
    setServerError(null)
    credentialsForm.reset()
  }

  if (step.name === "otp") {
    return (
      <LoginOtpStep
        email={step.email}
        verificationToken={step.verificationToken}
        onBack={handleBackToCredentials}
      />
    )
  }

  return (
    <div className="min-h-screen flex">
      <LoginBrandingPanel />

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
                  autoFocus
                  placeholder={t("login.emailPlaceholder")}
                  data-testid="login-email-input"
                  startIcon={<User size={16} />}
                  error={!!credentialsForm.formState.errors.email}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="login-password-input"
                  startIcon={<Lock size={20} />}
                  error={!!credentialsForm.formState.errors.password}
                  endAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      data-testid="login-toggle-password-visibility"
                      tabIndex={-1}
                      aria-label={
                        showPassword
                          ? t("login.hidePassword")
                          : t("login.showPassword")
                      }
                      onClick={() => setShowPassword(v => !v)}
                      className="text-muted-foreground hover:text-foreground hover:bg-transparent [&_svg]:size-4"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  }
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
                  <Button
                    variant="link"
                    type="button"
                    data-testid="login-forgot-password-button"
                    onClick={() => navigate(PATHS.FORGOT_PASSWORD)}
                    className="h-auto p-0 text-sm font-medium"
                  >
                    {t("login.forgotPassword")}
                  </Button>
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
