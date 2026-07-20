import { useQuery } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Check, Link2Off, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { verifyEmailChange } from "../api/verifyEmailApi"
import { AUTH_QUERY_KEYS } from "../api/queryKeys"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import { Button } from "@/components/ui/button"
import { AuthPageLayout } from "./AuthPageLayout"
import {
  useCountdownRedirect,
  REDIRECT_SECONDS,
} from "@/features/auth/hooks/useCountdownRedirect"

export default function VerifyEmailPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get("token") ?? ""

  const { isSuccess, error } = useQuery({
    queryKey: AUTH_QUERY_KEYS.verifyEmailChange(token),
    queryFn: async () => {
      await verifyEmailChange(token)
      return null
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  const pageState =
    !token || error ? "error" : isSuccess ? "success" : "loading"

  const errorCode = error instanceof ApiError ? error.code : ""

  const countdown = useCountdownRedirect(
    pageState === "success",
    PATHS.LOGIN,
    REDIRECT_SECONDS
  )

  if (pageState === "loading") {
    return (
      <AuthPageLayout>
        <div className="w-full max-w-[480px] flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthPageLayout>
    )
  }

  if (pageState === "success") {
    return (
      <AuthPageLayout>
        <div
          data-testid="verify-email-success"
          className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6 items-center"
        >
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="bg-success/10 p-3 rounded-[14px]">
              <Check size={24} className="text-success" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-3 text-center w-full">
              <h1 className="text-xl font-semibold text-foreground">
                {t("verifyEmail.success.title")}
              </h1>
              <p className="text-base text-muted-foreground">
                {t("verifyEmail.success.body")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <Button
              type="button"
              className="w-full"
              data-testid="verify-email-success-go-to-login-button"
              onClick={() => navigate(PATHS.LOGIN)}
            >
              {t("verifyEmail.success.goToLogin")}
              <ArrowRight size={16} />
            </Button>
            <p className="text-xs text-slate-400 text-center">
              {t("verifyEmail.success.autoRedirect", { seconds: countdown })}
            </p>
          </div>
        </div>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout>
      <div
        data-testid="verify-email-error"
        className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-[14px] flex items-center justify-center">
            <Link2Off size={24} className="text-amber-600" />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {t("verifyEmail.error.title")}
            </h1>
            <p className="text-base text-muted-foreground">
              {errorCode
                ? t(`errors.${errorCode}`, {
                    defaultValue: t("verifyEmail.error.body"),
                  })
                : t("verifyEmail.error.body")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full h-9 justify-start gap-2 rounded-[12px] text-sm text-muted-foreground"
          data-testid="verify-email-error-go-to-login-button"
          onClick={() => navigate(PATHS.LOGIN)}
        >
          <ArrowRight size={16} className="shrink-0" />
          <span>{t("verifyEmail.error.goToLogin")}</span>
        </Button>
      </div>
    </AuthPageLayout>
  )
}
