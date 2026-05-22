import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, CheckCircle, Circle, Check, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ResetPasswordInputSchema,
  getPasswordRequirements,
} from "../api/forgotPasswordSchema"
import type { ResetPasswordInput } from "../api/forgotPasswordSchema"
import { resetPassword } from "../api/forgotPasswordApi"
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

  const { isSubmitting, submitCount } = form.formState
  const hasSubmitted = submitCount > 0
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
    <AuthPageLayout>
      {step === "set-password" ? (
        <AuthCard>
          <AuthCardHeader>
            <h1 className="text-xl font-semibold text-foreground">
              {t("resetPassword.setPassword.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("resetPassword.setPassword.subtitle")}
            </p>
          </AuthCardHeader>

          <AuthCardBody>
            {serverError && (
              <div className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                {serverError}
              </div>
            )}

            <form id="reset-password-form" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="rp-password" className="mb-1.5">
                  {t("resetPassword.setPassword.passwordLabel")}
                </Label>
                <Input
                  id="rp-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  data-testid="reset-password-input"
                  startIcon={<Lock size={16} />}
                  className="pl-9 text-sm"
                  endAction={
                    <button
                      type="button"
                      data-testid="reset-password-toggle-visibility"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={
                        showPassword
                          ? t("resetPassword.setPassword.hidePassword")
                          : t("resetPassword.setPassword.showPassword")
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  {...form.register("password")}
                />

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
                          className={cn(
                            "shrink-0",
                            hasSubmitted
                              ? "text-destructive"
                              : "text-muted-foreground/50"
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "text-xs",
                          requirements[key]
                            ? "text-muted-foreground"
                            : hasSubmitted
                              ? "text-destructive"
                              : "text-muted-foreground"
                        )}
                      >
                        {t(`resetPassword.setPassword.requirements.${i18nKey}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </form>
          </AuthCardBody>

          <AuthCardFooter>
            <Button
              type="submit"
              form="reset-password-form"
              size="lg"
              disabled={isSubmitting}
              data-testid="reset-password-submit-button"
              className="px-3.5"
            >
              {isSubmitting
                ? t("resetPassword.setPassword.updating")
                : t("resetPassword.setPassword.updatePassword")}
            </Button>
          </AuthCardFooter>
        </AuthCard>
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
          <Button
            type="button"
            onClick={() => navigate(PATHS.LOGIN)}
            className="mt-6 w-full h-9 px-3.5"
          >
            {t("resetPassword.success.backToSignIn")}
          </Button>
        </div>
      )}
    </AuthPageLayout>
  )
}
