import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Check,
  Clock,
  Link2Off,
  ArrowRight,
  Mail,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ActivateAccountInputSchema,
  decodeTokenEmail,
} from "../api/activationSchema"
import type { ActivateAccountInput } from "../api/activationSchema"
import {
  validateActivationToken,
  activateSetPassword,
} from "../api/activationApi"
import { AUTH_QUERY_KEYS } from "../api/queryKeys"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthPageLayout } from "./AuthPageLayout"
import {
  useCountdownRedirect,
  REDIRECT_SECONDS,
} from "@/features/auth/hooks/useCountdownRedirect"
import {
  AuthCard,
  AuthCardHeader,
  AuthCardBody,
  AuthCardFooter,
} from "./AuthCard"
import { GeneratePasswordButton } from "./GeneratePasswordButton"
import { PasswordStrengthBar } from "./PasswordStrengthBar"

type PageState =
  | "loading"
  | "blocked-link"
  | "blocked-account"
  | "ready"
  | "success"

const LINK_BLOCKED_CODES = new Set(["INVALID_TOKEN", "PASSWORD_ALREADY_SET"])

export default function ActivateAccountPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const token = searchParams.get("token") ?? ""
  const [email] = useState(() => (token ? (decodeTokenEmail(token) ?? "") : ""))

  const { isLoading: isValidating, error: validationError } = useQuery({
    queryKey: AUTH_QUERY_KEYS.validateActivationToken(token),
    queryFn: async () => {
      await validateActivationToken(token)
      return null
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  const pageState: PageState = (() => {
    if (!token) return "blocked-link"
    if (isSuccess) return "success"
    if (isValidating) return "loading"
    if (validationError) {
      const code =
        validationError instanceof ApiError ? validationError.code : ""
      return LINK_BLOCKED_CODES.has(code) ? "blocked-link" : "blocked-account"
    }
    return "ready"
  })()

  const blockedReason = (() => {
    if (!validationError) return null
    const code = validationError instanceof ApiError ? validationError.code : ""
    if (LINK_BLOCKED_CODES.has(code)) return null
    return validationError instanceof ApiError
      ? t(`errors.${validationError.code}`, { defaultValue: "" }) || null
      : null
  })()

  const form = useForm<ActivateAccountInput>({
    resolver: zodResolver(ActivateAccountInputSchema),
    defaultValues: { password: "", passwordConfirm: "" },
  })

  const { isSubmitting } = form.formState
  const password = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  })

  const countdown = useCountdownRedirect(
    isSuccess,
    PATHS.LOGIN,
    REDIRECT_SECONDS
  )

  const onSubmit = form.handleSubmit(async data => {
    setServerError(null)
    try {
      const result = await activateSetPassword(
        token,
        data.password,
        data.passwordConfirm
      )
      if (result.mfa_enrollment_required) {
        navigate(PATHS.MFA_ENROLL, {
          state: { mfa_token: result.mfa_token ?? "" },
        })
        return
      }
      setIsSuccess(true)
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("errors.generic")
      )
    }
  })

  if (pageState === "loading") {
    return (
      <AuthPageLayout>
        <div className="w-full max-w-[480px] flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthPageLayout>
    )
  }

  if (pageState === "blocked-link") {
    return (
      <AuthPageLayout>
        <div
          data-testid="activate-account-blocked-link"
          className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-[14px] flex items-center justify-center">
              <Link2Off size={24} className="text-amber-600" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                {t("activateAccount.blockedLink.title")}
              </h1>
              <p className="text-base text-muted-foreground">
                {t("activateAccount.blockedLink.body")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t("activateAccount.blockedLink.resendNotice")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("activateAccount.blockedLink.contactSupportPrompt")}{" "}
              {/* NOTE: raw <a> — inline mailto link inside body text; shadcn Button doesn't compose as inline text */}
              <a
                href="mailto:support@crosslease.com"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                {t("activateAccount.blockedLink.contactSupportLink")}
              </a>
              .
            </p>
          </div>
        </div>
      </AuthPageLayout>
    )
  }

  if (pageState === "blocked-account") {
    return (
      <AuthPageLayout>
        <div
          data-testid="activate-account-blocked-account"
          className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 bg-[rgba(2,132,199,0.1)] rounded-[14px] flex items-center justify-center">
              <Clock size={24} className="text-sky-600" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                {t("activateAccount.blockedAccount.title")}
              </h1>
              <p className="text-base text-muted-foreground">
                {t("activateAccount.blockedAccount.body")}
              </p>
            </div>
          </div>
          {blockedReason && (
            <div className="border-l-[3px] border-primary bg-slate-100 rounded-[12px] p-4 text-sm text-foreground/80">
              <span className="font-semibold">
                {t("activateAccount.blockedAccount.reason")}
              </span>{" "}
              {blockedReason}
            </div>
          )}
          <Button
            variant="outline"
            data-testid="activate-account-contact-admin-button"
            className="w-full h-9 justify-start gap-2 rounded-[12px] text-sm text-muted-foreground"
            onClick={() => {
              window.location.href = "mailto:support@crosslease.com"
            }}
          >
            <Mail size={16} className="shrink-0" />
            <span className="flex-1 text-left">
              {t("activateAccount.blockedAccount.contactAdmin")}
            </span>
            <ArrowRight size={16} className="shrink-0 ml-auto" />
          </Button>
        </div>
      </AuthPageLayout>
    )
  }

  if (pageState === "success") {
    return (
      <AuthPageLayout>
        <div
          className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6 items-center"
          data-testid="activate-account-success"
        >
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="bg-success/10 p-3 rounded-[14px]">
              <Check size={24} className="text-success" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-3 text-center w-full">
              <h1 className="text-xl font-semibold text-foreground">
                {t("activateAccount.success.title")}
              </h1>
              <p className="text-base text-muted-foreground">
                {t("activateAccount.success.body")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <Button
              type="button"
              className="w-full"
              data-testid="activate-account-go-to-login-button"
              onClick={() => navigate(PATHS.LOGIN)}
            >
              {t("activateAccount.success.goToLogin")}
              <ArrowRight size={16} />
            </Button>
            <p className="text-xs text-slate-400 text-center">
              {t("activateAccount.success.autoRedirect", {
                seconds: countdown,
              })}
            </p>
          </div>
        </div>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout>
      <AuthCard>
        <AuthCardHeader>
          <h1 className="text-xl font-semibold text-foreground">
            {t("activateAccount.title")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t("activateAccount.subtitle")}
          </p>
        </AuthCardHeader>

        <AuthCardBody>
          {serverError && (
            <div
              data-testid="activate-account-error-message"
              className="mb-4 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm"
            >
              {serverError}
            </div>
          )}

          <form
            id="activate-account-form"
            data-testid="activate-account-form"
            onSubmit={onSubmit}
          >
            <div className="flex flex-col gap-6">
              <div className="opacity-50">
                <Label htmlFor="activate-email" className="mb-1.5">
                  {t("activateAccount.emailLabel")}
                </Label>
                <Input
                  id="activate-email"
                  type="email"
                  value={email}
                  disabled
                  readOnly
                  startIcon={<User size={16} />}
                  className="pl-9 text-sm"
                />
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t("activateAccount.emailHint")}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="activate-password">
                    {t("activateAccount.passwordLabel")}
                  </Label>
                  <GeneratePasswordButton
                    onGenerate={pwd => {
                      form.setValue("password", pwd, { shouldValidate: true })
                      setShowPassword(true)
                    }}
                  />
                </div>
                <Input
                  id="activate-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  autoFocus
                  data-testid="activate-password-input"
                  startIcon={<Lock size={16} />}
                  className="pl-9 text-sm"
                  endAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      data-testid="activate-toggle-visibility"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-muted-foreground hover:text-foreground hover:bg-transparent [&_svg]:size-4"
                      aria-label={
                        showPassword
                          ? t("activateAccount.hidePassword")
                          : t("activateAccount.showPassword")
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
                <Label htmlFor="activate-password-confirm" className="mb-1.5">
                  {t("activateAccount.confirmPasswordLabel")}
                </Label>
                <Input
                  id="activate-password-confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  data-testid="activate-password-confirm-input"
                  startIcon={<Lock size={16} />}
                  className="pl-9 text-sm"
                  endAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      data-testid="activate-toggle-confirm-visibility"
                      onClick={() => setShowPasswordConfirm(v => !v)}
                      className="text-muted-foreground hover:text-foreground hover:bg-transparent [&_svg]:size-4"
                      aria-label={
                        showPasswordConfirm
                          ? t("activateAccount.hidePassword")
                          : t("activateAccount.showPassword")
                      }
                    >
                      {showPasswordConfirm ? <EyeOff /> : <Eye />}
                    </Button>
                  }
                  {...form.register("passwordConfirm")}
                />
                {form.formState.errors.passwordConfirm && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {t("activateAccount.errors.passwords_mismatch")}
                  </p>
                )}
              </div>
            </div>
          </form>
        </AuthCardBody>

        <AuthCardFooter>
          <Button
            type="submit"
            form="activate-account-form"
            size="lg"
            disabled={isSubmitting}
            data-testid="activate-account-submit-button"
            className="px-3.5"
          >
            {isSubmitting
              ? t("activateAccount.submitting")
              : t("activateAccount.submit")}
          </Button>
        </AuthCardFooter>
      </AuthCard>
    </AuthPageLayout>
  )
}
