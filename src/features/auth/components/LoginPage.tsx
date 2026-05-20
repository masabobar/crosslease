import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Lock, User, AlertCircle, Shield, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LoginInputSchema } from "../api/schema"
import type { LoginInput } from "../api/schema"
import { login } from "../api/loginApi"
import { useAuthStore } from "@/store/authStore"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"

export default function LoginPage() {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const accessToken = useAuthStore(s => s.accessToken)
  const { setTokens } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { username: "", password: "" },
  })

  const { isSubmitting, errors } = form.formState

  if (accessToken) {
    return <Navigate to={PATHS.DASHBOARD} replace />
  }

  const onSubmit = form.handleSubmit(async data => {
    setServerError(null)
    try {
      const result = await login(data)
      setTokens(result.access_token, result.refresh_token)
      navigate(PATHS.DASHBOARD)
    } catch (err) {
      const errorMessages: Record<string, string> = {
        INVALID_CREDENTIALS: t("login.errors.INVALID_CREDENTIALS"),
        EMAIL_NOT_VERIFIED: t("login.errors.EMAIL_NOT_VERIFIED"),
        ACCOUNT_DISABLED: t("login.errors.ACCOUNT_DISABLED"),
      }
      const code = err instanceof ApiError ? err.code : ""
      setServerError(errorMessages[code] ?? t("login.errors.default"))
    }
  })

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-violet-50 to-violet-100 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-200 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-200 rounded-full blur-3xl opacity-25" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-300 rounded-full blur-3xl opacity-20" />

          <svg
            className="absolute inset-0 w-full h-full opacity-[0.12]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-100 200 Q 150 100, 400 200 T 900 200"
              stroke="#7c3aed"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M-100 350 Q 200 250, 450 350 T 1000 350"
              stroke="#8b5cf6"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M-100 500 Q 180 400, 420 500 T 950 500"
              stroke="#6d28d9"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M-100 650 Q 220 550, 480 650 T 1000 650"
              stroke="#a78bfa"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />

          <div className="absolute top-20 right-20 w-32 h-32 border border-violet-300/40 rounded-2xl rotate-12 backdrop-blur-sm" />
          <div className="absolute bottom-32 left-32 w-24 h-24 border border-violet-300/40 rounded-full backdrop-blur-sm" />
          <div className="absolute top-40 right-40 w-3 h-3 bg-violet-500/60 rounded-full shadow-md shadow-violet-300/40" />
          <div className="absolute top-60 right-60 w-2 h-2 bg-violet-400/60 rounded-full shadow-md shadow-violet-300/40" />
          <div className="absolute bottom-40 left-40 w-3 h-3 bg-violet-400/60 rounded-full shadow-md shadow-violet-300/40" />
          <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-violet-400/60 rounded-full shadow-md shadow-violet-300/40" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-violet-200/40 to-transparent rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-20 py-24 text-gray-900">
          <div className="mb-16">
            <div className="w-20 h-20 bg-primary/15 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-xl">
              <TrendingUp
                size={40}
                className="text-primary"
                strokeWidth={2.5}
              />
            </div>

            <h1 className="text-6xl font-bold mb-6 leading-tight tracking-tight">
              {t("login.headline")}
              <br />
              {t("login.headline2")}
            </h1>
            <p className="text-2xl text-gray-700 leading-relaxed font-light max-w-lg">
              {t("login.subtitle")}
            </p>

            <div className="mt-12 flex gap-12 opacity-90">
              <div>
                <div className="text-4xl font-bold mb-1">50+</div>
                <div className="text-gray-600 text-sm font-medium">
                  {t("login.stats.institutions")}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">€2.5B+</div>
                <div className="text-gray-600 text-sm font-medium">
                  {t("login.stats.volume")}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">99.9%</div>
                <div className="text-gray-600 text-sm font-medium">
                  {t("login.stats.uptime")}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 backdrop-blur-md rounded-full shadow-sm">
                <Shield size={20} className="text-primary" />
                <span className="text-gray-700 font-medium">
                  {t("login.trust")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 lg:w-[55%] bg-muted flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <TrendingUp size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-foreground mb-2">
              {tCommon("app.name")}
            </h1>
          </div>

          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {t("login.title")}
              </h2>
              <p className="text-muted-foreground">{t("login.subtitle2")}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {serverError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <span className="text-sm">{serverError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t("login.username")}
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    size={20}
                  />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder={t("login.usernamePlaceholder")}
                    {...form.register("username")}
                    className="w-full pl-12 pr-4 py-3.5 bg-card border border-border text-foreground rounded-xl outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t("login.password")}
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    size={20}
                  />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...form.register("password")}
                    className="w-full pl-12 pr-4 py-3.5 bg-card border border-border text-foreground rounded-xl outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {t("login.forgotPassword")}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-500 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="block text-lg">
                  {isSubmitting ? t("login.submitting") : t("login.submit")}
                </span>
                <span className="block text-xs mt-1 text-violet-100 font-normal">
                  {t("login.submitSubtitle")}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
