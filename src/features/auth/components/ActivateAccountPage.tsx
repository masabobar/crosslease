import { useEffect, useState } from "react"
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
  Info,
  ArrowRight,
  Mail,
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
import { GeneratePasswordButton } from "./GeneratePasswordButton"
import { cn } from "@/lib/utils"

type PageState =
  | "loading"
  | "blocked-link"
  | "blocked-account"
  | "ready"
  | "success"

type StrengthLevel = 0 | 1 | 2 | 3 | 4

const LINK_BLOCKED_CODES = new Set(["INVALID_TOKEN", "PASSWORD_ALREADY_SET"])
const REDIRECT_SECONDS = 5

function getStrengthLevel(password: string): StrengthLevel {
  if (!password) return 0
  const reqs = getPasswordRequirements(password)
  const met = Object.values(reqs).filter(Boolean).length
  if (met <= 2) return 1
  if (met === 3) return 2
  if (met === 4) return 3
  return 4
}

interface StrengthConfig {
  bars: number
  barColor: string
  labelColor: string
  hintBg: string
  hintTextColor: string
  hintIconColor: string
}

const STRENGTH_CONFIG: Record<StrengthLevel, StrengthConfig> = {
  0: {
    bars: 0,
    barColor: "bg-slate-200",
    labelColor: "text-muted-foreground",
    hintBg: "bg-muted border border-border",
    hintTextColor: "text-muted-foreground",
    hintIconColor: "text-muted-foreground",
  },
  1: {
    bars: 1,
    barColor: "bg-rose-600",
    labelColor: "text-rose-600",
    hintBg: "bg-rose-50",
    hintTextColor: "text-rose-700",
    hintIconColor: "text-rose-700",
  },
  2: {
    bars: 2,
    barColor: "bg-amber-500",
    labelColor: "text-amber-500",
    hintBg: "bg-amber-50",
    hintTextColor: "text-amber-700",
    hintIconColor: "text-amber-700",
  },
  3: {
    bars: 3,
    barColor: "bg-lime-500",
    labelColor: "text-lime-500",
    hintBg: "bg-lime-50 border border-border",
    hintTextColor: "text-lime-700",
    hintIconColor: "text-lime-700",
  },
  4: {
    bars: 4,
    barColor: "bg-teal-500",
    labelColor: "text-teal-500",
    hintBg: "bg-teal-50",
    hintTextColor: "text-teal-700",
    hintIconColor: "text-teal-700",
  },
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useTranslation("auth")
  const level = getStrengthLevel(password)
  const config = STRENGTH_CONFIG[level]

  const labels: Record<StrengthLevel, string> = {
    0: t("activateAccount.strength.empty"),
    1: t("activateAccount.strength.weak"),
    2: t("activateAccount.strength.fair"),
    3: t("activateAccount.strength.good"),
    4: t("activateAccount.strength.strong"),
  }

  const hints: Record<StrengthLevel, string> = {
    0: t("activateAccount.strength.hintEmpty"),
    1: t("activateAccount.strength.hintWeak"),
    2: t("activateAccount.strength.hintFair"),
    3: t("activateAccount.strength.hintGood"),
    4: t("activateAccount.strength.hintStrong"),
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground opacity-80">
          {t("activateAccount.strength.label")}
        </span>
        <span
          className={cn("text-xs font-semibold opacity-80", config.labelColor)}
        >
          {labels[level]}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < config.bars ? config.barColor : "bg-slate-200"
            )}
          />
        ))}
      </div>
      <div
        className={cn(
          "flex items-start gap-2 p-4 rounded-[10px]",
          config.hintBg
        )}
      >
        <Info
          size={16}
          className={cn("shrink-0 mt-px", config.hintIconColor)}
        />
        <p className={cn("text-xs leading-4", config.hintTextColor)}>
          {hints[level]}
        </p>
      </div>
    </div>
  )
}

export default function ActivateAccountPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)

  const token = searchParams.get("token") ?? ""
  const [pageState, setPageState] = useState<PageState>(() =>
    token ? "loading" : "blocked-link"
  )
  const [email] = useState(() => (token ? (decodeTokenEmail(token) ?? "") : ""))

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

  useEffect(() => {
    if (pageState !== "loading") return

    validateActivationToken(token)
      .then(() => setPageState("ready"))
      .catch((err: unknown) => {
        const code = err instanceof ApiError ? err.code : ""
        if (LINK_BLOCKED_CODES.has(code)) {
          setPageState("blocked-link")
        } else {
          setBlockedReason(err instanceof ApiError ? err.message : null)
          setPageState("blocked-account")
        }
      })
  }, [token, pageState])

  useEffect(() => {
    if (pageState !== "success") return
    if (countdown <= 0) {
      navigate(PATHS.LOGIN)
      return
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [pageState, countdown, navigate])

  const onSubmit = form.handleSubmit(async data => {
    setServerError(null)
    try {
      await activateSetPassword(token, data.password, data.passwordConfirm)
      setPageState("success")
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
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2 h-9 bg-background border border-border rounded-[12px] text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Mail size={16} className="shrink-0" />
              <span className="flex-1 text-left">
                {t("activateAccount.blockedLink.requestInvitation")}
              </span>
              <ArrowRight size={16} className="shrink-0" />
            </button>
            <p className="text-xs text-slate-500 text-center">
              {t("activateAccount.blockedLink.goToSite")}
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
          <button
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2 h-9 bg-background border border-border rounded-[12px] text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Mail size={16} className="shrink-0" />
            <span className="flex-1 text-left">
              {t("activateAccount.blockedAccount.contactAdmin")}
            </span>
            <ArrowRight size={16} className="shrink-0" />
          </button>
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
                    <button
                      type="button"
                      data-testid="activate-toggle-confirm-visibility"
                      onClick={() => setShowPasswordConfirm(v => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={
                        showPasswordConfirm
                          ? t("activateAccount.hidePassword")
                          : t("activateAccount.showPassword")
                      }
                    >
                      {showPasswordConfirm ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
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
