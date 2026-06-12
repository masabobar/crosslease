import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, Check, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ResetPasswordInputSchema } from "../api/forgotPasswordSchema"
import type { ResetPasswordInput } from "../api/forgotPasswordSchema"
import { validateResetToken, resetPassword } from "../api/forgotPasswordApi"
import { AUTH_QUERY_KEYS } from "../api/queryKeys"
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
import { GeneratePasswordButton } from "./GeneratePasswordButton"
import { PasswordStrengthBar } from "./PasswordStrengthBar"

type PageState = "loading" | "valid" | "blocked" | "success"

export default function ResetPasswordPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const token = searchParams.get("token") ?? ""
  const [isSuccess, setIsSuccess] = useState(false)

  const { isLoading: isValidating, error: validationError } = useQuery({
    queryKey: AUTH_QUERY_KEYS.validateResetToken(token),
    queryFn: async () => {
      await validateResetToken(token)
      return null
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  const pageState: PageState = (() => {
    if (!token) return "blocked"
    if (isSuccess) return "success"
    if (isValidating) return "loading"
    if (validationError) return "blocked"
    return "valid"
  })()

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordInputSchema),
    defaultValues: { password: "", password_confirm: "" },
  })

  const { isSubmitting, errors } = form.formState
  const password = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  })

  const onSubmit = form.handleSubmit(async data => {
    setServerError(null)
    try {
      const result = await resetPassword(
        token,
        data.password,
        data.password_confirm
      )
      if (result.mfa_required) {
        navigate(PATHS.RESET_PASSWORD_VERIFY, {
          state: { mfa_token: result.mfa_token ?? "" },
        })
        return
      }
      setIsSuccess(true)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      const messages: Record<string, string> = {
        PASSWORD_RESET_TOKEN_INVALID: t(
          "resetPassword.setPassword.errors.PASSWORD_RESET_TOKEN_INVALID"
        ),
        PASSWORD_RESET_TOKEN_EXPIRED: t(
          "resetPassword.setPassword.errors.PASSWORD_RESET_TOKEN_EXPIRED"
        ),
      }
      setServerError(
        messages[code] ?? t("resetPassword.setPassword.errors.default")
      )
    }
  })

  if (pageState === "loading") {
    return (
      <AuthPageLayout>
        <div
          data-testid="reset-password-loading"
          className="w-full max-w-[400px] flex items-center justify-center py-12"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthPageLayout>
    )
  }

  if (pageState === "blocked") {
    return (
      <AuthPageLayout>
        <div
          data-testid="reset-password-blocked"
          className="w-full max-w-[400px] bg-card rounded-xl shadow-sm border border-border p-6"
        >
          <h1 className="text-xl font-semibold text-foreground">
            {t("resetPassword.blocked.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("resetPassword.blocked.body")}
          </p>
          <Button
            type="button"
            data-testid="reset-password-blocked-request-new"
            onClick={() => navigate(PATHS.FORGOT_PASSWORD)}
            className="mt-6 w-full h-9 px-3.5"
          >
            {t("resetPassword.blocked.requestNew")}
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  if (pageState === "success") {
    return (
      <AuthPageLayout>
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
            data-testid="reset-password-back-to-sign-in"
            onClick={() => navigate(PATHS.LOGIN)}
            className="mt-6 w-full h-9 px-3.5"
          >
            {t("resetPassword.success.backToSignIn")}
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout>
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
            <div
              data-testid="reset-password-error-message"
              className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm"
            >
              {serverError}
            </div>
          )}

          <form
            id="reset-password-form"
            data-testid="reset-password-form"
            onSubmit={onSubmit}
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="rp-password">
                    {t("resetPassword.setPassword.passwordLabel")}
                  </Label>
                  <GeneratePasswordButton
                    onGenerate={pwd => {
                      form.setValue("password", pwd, { shouldValidate: true })
                      form.setValue("password_confirm", pwd, {
                        shouldValidate: true,
                      })
                      setShowPassword(true)
                    }}
                  />
                </div>
                <Input
                  id="rp-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  data-testid="reset-password-input"
                  startIcon={<Lock size={16} />}
                  className="pl-9 text-sm"
                  endAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      data-testid="reset-password-toggle-visibility"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-muted-foreground hover:text-foreground hover:bg-transparent [&_svg]:size-4"
                      aria-label={
                        showPassword
                          ? t("resetPassword.setPassword.hidePassword")
                          : t("resetPassword.setPassword.showPassword")
                      }
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  }
                  {...form.register("password")}
                />

                <div className="mt-3">
                  <PasswordStrengthBar password={password} />
                </div>
              </div>

              <div>
                <Label htmlFor="rp-confirm" className="mb-1.5">
                  {t("resetPassword.setPassword.confirmPasswordLabel")}
                </Label>
                <Input
                  id="rp-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  data-testid="reset-password-confirm-input"
                  error={!!errors.password_confirm}
                  startIcon={<Lock size={16} />}
                  className="pl-9 text-sm"
                  endAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      data-testid="reset-password-confirm-toggle-visibility"
                      onClick={() => setShowConfirm(v => !v)}
                      className="text-muted-foreground hover:text-foreground hover:bg-transparent [&_svg]:size-4"
                      aria-label={
                        showConfirm
                          ? t("resetPassword.setPassword.hidePassword")
                          : t("resetPassword.setPassword.showPassword")
                      }
                    >
                      {showConfirm ? <EyeOff /> : <Eye />}
                    </Button>
                  }
                  {...form.register("password_confirm")}
                />
                {errors.password_confirm && (
                  <p
                    data-testid="reset-password-confirm-error"
                    className="mt-1.5 text-xs text-destructive"
                  >
                    {errors.password_confirm.message ===
                    "PASSWORDS_DO_NOT_MATCH"
                      ? t(
                          "resetPassword.setPassword.errors.PASSWORDS_DO_NOT_MATCH"
                        )
                      : errors.password_confirm.message}
                  </p>
                )}
              </div>
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
    </AuthPageLayout>
  )
}
