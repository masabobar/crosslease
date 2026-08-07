import { Shield, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"

export function LoginBrandingPanel() {
  const { t } = useTranslation("auth")

  return (
    <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-25" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary/30 rounded-full blur-3xl opacity-20" />

        <svg
          className="absolute inset-0 w-full h-full opacity-[0.12] text-primary"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 200 Q 150 100, 400 200 T 900 200"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M-100 350 Q 200 250, 450 350 T 1000 350"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M-100 500 Q 180 400, 420 500 T 950 500"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M-100 650 Q 220 550, 480 650 T 1000 650"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        <div className="absolute top-20 right-20 w-32 h-32 border border-primary/30 rounded-2xl rotate-12 backdrop-blur-sm" />
        <div className="absolute bottom-32 left-32 w-24 h-24 border border-primary/30 rounded-full backdrop-blur-sm" />
        <div className="absolute top-40 right-40 w-3 h-3 bg-primary/50 rounded-full shadow-md shadow-primary/30" />
        <div className="absolute top-60 right-60 w-2 h-2 bg-primary/40 rounded-full shadow-md shadow-primary/30" />
        <div className="absolute bottom-40 left-40 w-3 h-3 bg-primary/40 rounded-full shadow-md shadow-primary/30" />
        <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-primary/40 rounded-full shadow-md shadow-primary/30" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col justify-center px-20 py-24 text-gray-900">
        <div className="mb-16">
          <div className="w-20 h-20 bg-primary/15 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-xl">
            <TrendingUp size={40} className="text-primary" strokeWidth={2.5} />
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
              <div className="text-4xl font-bold mb-1">
                {t("login.stats.institutionsValue")}
              </div>
              <div className="text-gray-600 text-sm font-medium">
                {t("login.stats.institutions")}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">
                {t("login.stats.volumeValue")}
              </div>
              <div className="text-gray-600 text-sm font-medium">
                {t("login.stats.volume")}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">
                {t("login.stats.uptimeValue")}
              </div>
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
  )
}
