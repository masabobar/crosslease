import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
  Lock,
  User,
  Check,
  Loader2,
  Clock,
  Link2Off,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ActivateAccountInputSchema,
  decodeTokenEmail,
  getPasswordRequirements,
} from "../api/activationSchema"
import type { ActivateAccountInput } from "../api/activationSchema"
import {
  validateActivationToken,
  activateSetPassword,
} from "../api/activationApi"
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
// import { GeneratePasswordButton } from "./GeneratePasswordButton"
import { cn } from "@/lib/utils"

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
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const token = searchParams.get("token") ?? ""
  const [pageState, setPageState] = useState<PageState>(() =>
    token ? "loading" : "blocked-link"
  )
  const [email] = useState(() => (token ? (decodeTokenEmail(token) ?? "") : ""))

  const form = useForm<ActivateAccountInput>({
    resolver: zodResolver(ActivateAccountInputSchema),
    defaultValues: { password: "", password_confirm: "" },
  })

  const { isSubmitting, submitCount, errors } = form.formState
  const hasSubmitted = submitCount > 0
  const password = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  })
  const requirements = getPasswordRequirements(password)

  useEffect(() => {
    if (pageState !== "loading") return

    validateActivationToken(token)
      .then(() => setPageState("ready"))
      .catch((err: unknown) => {
        const code = err instanceof ApiError ? err.code : ""
        setPageState(
          LINK_BLOCKED_CODES.has(code) ? "blocked-link" : "blocked-account"
        )
      })
  }, [token, pageState])

  const onSubmit = form.handleSubmit(async data => {
    setServerError(null)
    try {
      await activateSetPassword(token, data.password, data.password_confirm)
      setPageState("success")
      setTimeout(() => navigate(PATHS.LOGIN), 3000)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ""
      if (LINK_BLOCKED_CODES.has(code)) {
        setPageState("blocked-link")
        return
      }
      setServerError(
        code === "PASSWORD_POLICY_VIOLATION"
          ? t("activateAccount.errors.PASSWORD_POLICY_VIOLATION")
          : t("activateAccount.errors.default")
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
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
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
          <div className="bg-slate-100 rounded-xl px-2.5 py-2 text-sm text-foreground/80">
            {t("activateAccount.blockedLink.contact")}
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
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-amber-600" />
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
          <div className="bg-slate-100 rounded-xl px-2.5 py-2 text-sm text-foreground/80">
            {t("activateAccount.blockedAccount.contact")}
          </div>
        </div>
      </AuthPageLayout>
    )
  }

  if (pageState === "success") {
    return (
      <AuthPageLayout>
        <div
          className="w-full max-w-[480px] bg-card rounded-xl shadow-sm border border-border p-6"
          data-testid="activate-account-success"
        >
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
            <Check size={24} className="text-success" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("activateAccount.success.title")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t("activateAccount.success.body")}
          </p>
          <Button
            type="button"
            disabled
            className="mt-6 w-full h-9 px-3.5 opacity-50"
          >
            <Loader2 size={14} className="animate-spin" />
            {t("activateAccount.success.redirecting")}
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
            {t("activateAccount.title")}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
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
                  {/* <GeneratePasswordButton
                    onGenerate={pwd => {
                      form.setValue("password", pwd, { shouldValidate: true })
                      form.setValue("password_confirm", pwd, {
                        shouldValidate: true,
                      })
                      setShowPassword(true)
                    }}
                  /> */}
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
                    <button
                      type="button"
                      data-testid="activate-toggle-visibility"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={
                        showPassword
                          ? t("activateAccount.hidePassword")
                          : t("activateAccount.showPassword")
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
                        {t(`activateAccount.requirements.${i18nKey}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Label htmlFor="activate-confirm" className="mb-1.5">
                  {t("activateAccount.confirmPasswordLabel")}
                </Label>
                <Input
                  id="activate-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  data-testid="activate-confirm-input"
                  startIcon={<Lock size={16} />}
                  className="pl-9 text-sm"
                  endAction={
                    <button
                      type="button"
                      data-testid="activate-confirm-toggle-visibility"
                      onClick={() => setShowConfirm(v => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={
                        showConfirm
                          ? t("activateAccount.hidePassword")
                          : t("activateAccount.showPassword")
                      }
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  {...form.register("password_confirm")}
                />
                {errors.password_confirm && (
                  <p
                    data-testid="activate-confirm-error"
                    className="mt-1.5 text-sm text-destructive"
                  >
                    {errors.password_confirm.message ===
                    "PASSWORDS_DO_NOT_MATCH"
                      ? t("activateAccount.errors.PASSWORDS_DO_NOT_MATCH")
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
