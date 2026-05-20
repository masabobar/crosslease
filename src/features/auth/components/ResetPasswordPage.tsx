import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, CheckCircle, Circle, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ResetPasswordInputSchema,
  getPasswordRequirements,
} from "../api/forgotPasswordSchema"
import type { ResetPasswordInput } from "../api/forgotPasswordSchema"
import { resetPassword } from "../api/forgotPasswordApi"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import { AppLogo } from "./AppLogo"
import { cn } from "@/lib/utils"

type Step = "set-password" | "success"

export default function ResetPasswordPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<Step>("set-password")
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const token = searchParams.get("token") ?? ""

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordInputSchema),
    defaultValues: { password: "" },
  })

  const { isSubmitting } = form.formState
  const password = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  })
  const requirements = getPasswordRequirements(password)

  const onSubmit = form.handleSubmit(async data => {
    setServerError(null)
    try {
      await resetPassword(token, data.password)
      setStep("success")
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      const messages: Record<string, string> = {
        INVALID_TOKEN: t("resetPassword.setPassword.errors.INVALID_TOKEN"),
      }
      setServerError(
        messages[code] ?? t("resetPassword.setPassword.errors.default")
      )
    }
  })

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <header className="flex justify-center pt-8">
        <AppLogo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        {step === "set-password" ? (
          <div className="w-full max-w-[480px] bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <h1 className="text-xl font-semibold text-foreground">
                {t("resetPassword.setPassword.title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("resetPassword.setPassword.subtitle")}
              </p>
            </div>

            <div className="px-6 pb-5">
              {serverError && (
                <div className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                  {serverError}
                </div>
              )}

              <form id="reset-password-form" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="rp-password"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    {t("resetPassword.setPassword.passwordLabel")}
                  </label>
                  <div className="relative">
                    <input
                      id="rp-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      data-testid="reset-password-input"
                      {...form.register("password")}
                      className="w-full pl-4 pr-10 py-2.5 bg-background border border-border text-foreground rounded-lg text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword
                          ? t("resetPassword.setPassword.hidePassword")
                          : t("resetPassword.setPassword.showPassword")
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {(
                      [
                        ["minLength", "minLength"],
                        ["hasLower", "hasLower"],
                        ["hasUpper", "hasUpper"],
                        ["hasNumber", "hasNumber"],
                        ["hasSymbol", "hasSymbol"],
                      ] as const
                    ).map(([key, i18nKey]) => (
                      <li key={key} className="flex items-center gap-2">
                        {requirements[key] ? (
                          <CheckCircle
                            size={16}
                            className="text-success shrink-0"
                          />
                        ) : (
                          <Circle
                            size={16}
                            className="text-muted-foreground/50 shrink-0"
                          />
                        )}
                        <span
                          className={cn(
                            "text-xs",
                            requirements[key]
                              ? "text-muted-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {t(
                            `resetPassword.setPassword.requirements.${i18nKey}`
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-border">
              <button
                type="submit"
                form="reset-password-form"
                disabled={isSubmitting}
                data-testid="reset-password-submit-button"
                className="h-9 px-3.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? t("resetPassword.setPassword.updating")
                  : t("resetPassword.setPassword.updatePassword")}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full max-w-[400px] bg-card rounded-xl shadow-sm border border-border p-6"
            data-testid="reset-password-success"
          >
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
              <Check size={24} className="text-success" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {t("resetPassword.success.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("resetPassword.success.body")}
            </p>
            <button
              type="button"
              onClick={() => navigate(PATHS.LOGIN)}
              className="mt-6 w-full h-9 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("resetPassword.success.backToSignIn")}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
