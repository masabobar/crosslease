import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Lock, ShieldAlert } from "lucide-react"
import type { CreateTenantForm } from "@/features/tenants/api/schema"
import type {
  PlatformModule,
  SeedPackageEntry,
} from "@/features/tenants/api/schema"

type Props = {
  values: CreateTenantForm
  modules: PlatformModule[]
  packages: SeedPackageEntry[]
}

type ReviewRow = { label: string; value: ReactNode }

function ReviewSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="bg-slate-100 border border-border rounded-[6px] flex flex-col">
      <div className="h-8 px-2 flex items-center">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {title}
        </p>
      </div>
      <div className="bg-background border border-border rounded-[6px] p-4">
        {children}
      </div>
    </div>
  )
}

function ReviewTable({ rows }: { rows: ReviewRow[] }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-x-6 gap-y-3 text-sm">
      {rows.map((row, i) => (
        <Fragment key={i} label={row.label} value={row.value} />
      ))}
    </div>
  )
}

function Fragment({ label, value }: ReviewRow) {
  return (
    <>
      <span className="text-muted-foreground leading-5">{label}</span>
      <div className="text-foreground leading-5">{value}</div>
    </>
  )
}

function ReviewStep({ values, modules, packages }: Props) {
  const { t } = useTranslation("tenants")

  const selectedPkg = packages.find(p => p.key === values.seed_package)
  const alwaysOnModules = modules.filter(m => m.always_on)
  const selectedOptionalModules = modules.filter(
    m => !m.always_on && values.modules.includes(m.key)
  )
  const allActivatedModules = [...alwaysOnModules, ...selectedOptionalModules]

  const identityRows: ReviewRow[] = [
    { label: t("fields.tenantName"), value: values.name || "-" },
    { label: t("fields.tenantCode"), value: values.code || "-" },
    {
      label: t("fields.tenantType"),
      value: values.tenant_type ? t(`tenantTypes.${values.tenant_type}`) : "-",
    },
    {
      label: t("fields.legalEntityName"),
      value: values.legal_entity_name || "-",
    },
    { label: t("fields.country"), value: values.country || "-" },
    {
      label: t("fields.defaultCurrency"),
      value: values.default_currency || "-",
    },
    { label: t("fields.description"), value: values.description || "-" },
  ]

  const seedRows: ReviewRow[] = [
    {
      label: t("wizard.review.package"),
      value: selectedPkg
        ? t(
            `seedPackages.${values.seed_package as "standard_retail_bank" | "minimal_sandbox"}`,
            {
              defaultValue: selectedPkg.display_name,
            }
          )
        : values.seed_package,
    },
    {
      label: t("wizard.review.includes"),
      value: selectedPkg ? (
        <span className="text-muted-foreground">
          {selectedPkg.includes.join(", ")}
        </span>
      ) : (
        "-"
      ),
    },
  ]

  const integrationRows: ReviewRow[] = [
    {
      label: t("fields.coreBankingRef"),
      value: values.core_banking_integration_ref || "-",
    },
  ]

  return (
    <div className="flex flex-col gap-[14px]" data-testid="review-step">
      {/* Identity */}
      <ReviewSection title={t("wizard.review.sections.identity")}>
        <ReviewTable rows={identityRows} />
      </ReviewSection>

      {/* Modules */}
      <ReviewSection title={t("wizard.review.sections.modules")}>
        {allActivatedModules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("wizard.review.notSet")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {alwaysOnModules.map(mod => (
              <span
                key={mod.key}
                className="inline-flex items-center gap-0.5 bg-sky-500/10 border border-sky-600 text-sky-600 text-xs font-medium rounded-full px-1.5 py-0.5"
              >
                <Lock size={12} />
                {mod.display_name}
              </span>
            ))}
            {selectedOptionalModules.map(mod => (
              <span
                key={mod.key}
                className="inline-flex items-center border border-sky-600 text-sky-600 text-xs font-medium rounded-full px-1.5 py-0.5"
              >
                {mod.display_name}
              </span>
            ))}
          </div>
        )}
      </ReviewSection>

      {/* Seed package */}
      <ReviewSection title={t("wizard.review.sections.seed")}>
        <ReviewTable rows={seedRows} />
      </ReviewSection>

      {/* Integration */}
      <ReviewSection title={t("wizard.review.sections.integration")}>
        <ReviewTable rows={integrationRows} />
      </ReviewSection>

      {/* Governance alert */}
      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-600 rounded-xl px-2.5 py-2">
        <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-amber-600">
            {t("wizard.review.governanceAlertTitle")}
          </p>
          <p className="text-sm text-amber-600/80">
            {t("wizard.review.governanceAlert")}
          </p>
        </div>
      </div>
    </div>
  )
}

export { ReviewStep }
