import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ForgotPasswordInputSchema } from "../api/forgotPasswordSchema"
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
import { FieldError } from "./FieldError"

type Step = "enter-email" | "check-email"

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const showToast = useToastStore(s => s.showToast)
  const [step, setStep] = useState<Step>("enter-email")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordInputSchema),
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
      setServerError(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("errors.generic")
      )
    }
  })

  const handleResend = async () => {
    setIsResending(true)
    try {
      await requestPasswordReset(submittedEmail)
    } catch (err) {
      showToast({
        variant: "warning",
        title: t("forgotPassword.checkEmail.resendFailed.title"),
        message:
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic"),
      })
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
                <FieldError
                  code={errors.email?.message}
                  testId="forgot-password-email-error"
                />
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
              <Button
                type="button"
                variant="link"
                onClick={handleResend}
                disabled={isResending}
                data-testid="check-email-resend-button"
                className="h-auto p-0 underline underline-offset-2 hover:text-primary/80 font-normal"
              >
                {t("forgotPassword.checkEmail.resendLink")}
              </Button>
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
