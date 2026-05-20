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
import { AppLogo } from "./AppLogo"
import { cn } from "@/lib/utils"

type Step = "enter-email" | "check-email"

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("enter-email")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [isResending, setIsResending] = useState(false)

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
    try {
      await requestPasswordReset(data.email)
      setSubmittedEmail(data.email)
      setStep("check-email")
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      const messages: Record<string, string> = {
        USER_NOT_FOUND: t("forgotPassword.enterEmail.errors.USER_NOT_FOUND"),
      }
      form.setError("email", {
        message:
          messages[code] ?? t("forgotPassword.enterEmail.errors.default"),
      })
    }
  })

  const handleResend = async () => {
    setIsResending(true)
    try {
      await requestPasswordReset(submittedEmail)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <header className="flex justify-center pt-8">
        <AppLogo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        {step === "enter-email" ? (
          <div className="w-full max-w-[480px] bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <h1 className="text-xl font-semibold text-foreground">
                {t("forgotPassword.enterEmail.title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("forgotPassword.enterEmail.subtitle")}
              </p>
            </div>

            <div className="px-6 pb-5">
              <form id="forgot-password-form" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="fp-email"
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      errors.email ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {t("forgotPassword.enterEmail.emailLabel")}
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      size={16}
                    />
                    <input
                      id="fp-email"
                      type="email"
                      autoComplete="email"
                      placeholder={t(
                        "forgotPassword.enterEmail.emailPlaceholder"
                      )}
                      data-testid="forgot-password-email-input"
                      {...form.register("email")}
                      className={cn(
                        "w-full pl-9 pr-4 py-2.5 bg-background border text-foreground rounded-lg text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30",
                        errors.email
                          ? "border-destructive focus-visible:border-destructive"
                          : "border-border focus-visible:border-primary"
                      )}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {errors.email.message ??
                        t("forgotPassword.enterEmail.errors.emailInvalid")}
                    </p>
                  )}
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                type="button"
                data-testid="forgot-password-back-button"
                onClick={() => navigate(PATHS.LOGIN)}
                className="h-9 px-3.5 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                {t("forgotPassword.enterEmail.backToSignIn")}
              </button>
              <button
                type="submit"
                form="forgot-password-form"
                disabled={isSubmitting}
                data-testid="forgot-password-submit-button"
                className="h-9 px-3.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? t("forgotPassword.enterEmail.sending")
                  : t("forgotPassword.enterEmail.sendResetLink")}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[480px] bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 pt-6 pb-5">
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
                  className="text-primary hover:text-primary/80 underline underline-offset-2 disabled:opacity-50 transition-colors"
                >
                  {t("forgotPassword.checkEmail.resendLink")}
                </button>
              </p>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-border">
              <button
                type="button"
                data-testid="check-email-back-button"
                onClick={() => navigate(PATHS.LOGIN)}
                className="h-9 px-3.5 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                {t("forgotPassword.checkEmail.backToSignIn")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
