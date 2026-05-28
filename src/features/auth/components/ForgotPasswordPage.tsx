import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { User } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ForgotPasswordInput } from "../api/forgotPasswordSchema"
import { requestPasswordReset } from "../api/forgotPasswordApi"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import { useToastStore } from "@/store/toastStore"
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

type Step = "enter-email" | "check-email"

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const showToast = useToastStore(s => s.showToast)
  const [step, setStep] = useState<Step>("enter-email")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const formSchema = z.object({
    email: z
      .string()
      .min(1, tCommon("validation.required"))
      .email(t("forgotPassword.enterEmail.errors.emailInvalid")),
  })

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  const { isSubmitting, errors } = form.formState

  const onSubmit = form.handleSubmit(async data => {
    setServerError(null)
    try {
      await requestPasswordReset(data.email)
      setSubmittedEmail(data.email)
      setStep("check-email")
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      if (code === "PASSWORD_RESET_THROTTLED") {
        setServerError(
          t("forgotPassword.enterEmail.errors.PASSWORD_RESET_THROTTLED")
        )
      } else {
        setServerError(t("forgotPassword.enterEmail.errors.default"))
      }
    }
  })

  const handleResend = async () => {
    setIsResending(true)
    try {
      await requestPasswordReset(submittedEmail)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      if (code === "PASSWORD_RESET_THROTTLED") {
        showToast({
          variant: "warning",
          title: t("forgotPassword.checkEmail.resendThrottled.title"),
          message: t("forgotPassword.checkEmail.resendThrottled.message"),
        })
      } else {
        showToast({
          variant: "warning",
          title: t("forgotPassword.checkEmail.resendFailed.title"),
          message: t("forgotPassword.checkEmail.resendFailed.message"),
        })
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthPageLayout>
      {step === "enter-email" ? (
        <AuthCard>
          <AuthCardHeader>
            <h1 className="text-xl font-semibold text-foreground">
              {t("forgotPassword.enterEmail.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("forgotPassword.enterEmail.subtitle")}
            </p>
          </AuthCardHeader>

          <AuthCardBody>
            {serverError && (
              <div
                data-testid="forgot-password-server-error"
                className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm"
              >
                {serverError}
              </div>
            )}
            <form
              id="forgot-password-form"
              data-testid="forgot-password-form"
              onSubmit={onSubmit}
            >
              <div>
                <Label
                  htmlFor="fp-email"
                  error={!!errors.email}
                  className="mb-1.5"
                >
                  {t("forgotPassword.enterEmail.emailLabel")}
                </Label>
                <Input
                  id="fp-email"
                  type="text"
                  autoComplete="email"
                  placeholder={t("forgotPassword.enterEmail.emailPlaceholder")}
                  data-testid="forgot-password-email-input"
                  error={!!errors.email}
                  startIcon={<User size={16} />}
                  className="text-sm"
                  {...form.register("email")}
                />
                {errors.email && (
                  <p
                    data-testid="forgot-password-email-error"
                    className="mt-1.5 text-xs text-destructive"
                  >
                    {errors.email.message ??
                      t("forgotPassword.enterEmail.errors.emailInvalid")}
                  </p>
                )}
              </div>
            </form>
          </AuthCardBody>

          <AuthCardFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-testid="forgot-password-back-button"
              onClick={() => navigate(PATHS.LOGIN)}
              className="px-3.5"
            >
              {t("forgotPassword.enterEmail.backToSignIn")}
            </Button>
            <Button
              type="submit"
              form="forgot-password-form"
              size="lg"
              disabled={isSubmitting}
              data-testid="forgot-password-submit-button"
              className="px-3.5"
            >
              {isSubmitting
                ? t("forgotPassword.enterEmail.sending")
                : t("forgotPassword.enterEmail.sendResetLink")}
            </Button>
          </AuthCardFooter>
        </AuthCard>
      ) : (
        <AuthCard>
          <AuthCardHeader>
            <h1 className="text-xl font-semibold text-foreground">
              {t("forgotPassword.checkEmail.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("forgotPassword.checkEmail.body", {
                email: submittedEmail,
              })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("forgotPassword.checkEmail.notReceived")}{" "}
              <button
                onClick={handleResend}
                disabled={isResending}
                data-testid="check-email-resend-button"
                className="text-primary hover:text-primary/80 underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {t("forgotPassword.checkEmail.resendLink")}
              </button>
            </p>
          </AuthCardHeader>

          <AuthCardFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-testid="check-email-back-button"
              onClick={() => navigate(PATHS.LOGIN)}
              className="px-3.5"
            >
              {t("forgotPassword.checkEmail.backToSignIn")}
            </Button>
          </AuthCardFooter>
        </AuthCard>
      )}
    </AuthPageLayout>
  )
}
