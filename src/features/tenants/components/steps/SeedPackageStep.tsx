import type { UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { CreateTenantForm } from "@/features/tenants/api/schema"
import type {
  SeedPackage,
  SeedPackageEntry,
} from "@/features/tenants/api/schema"

type Props = {
  form: UseFormReturn<CreateTenantForm>
  packages: SeedPackageEntry[]
  isLoading: boolean
}

function SeedPackageStep({ form, packages, isLoading }: Props) {
  const { t } = useTranslation("tenants")

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="seed-step">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="seed-step">
      <Controller
        control={form.control}
        name="seed_package"
        render={({ field }) => (
          <div className="space-y-3">
            {packages.map(pkg => {
              const isSelected = field.value === pkg.key
              return (
                <label
                  key={pkg.key}
                  data-testid={`seed-package-${pkg.key}`}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    isSelected
                      ? "border-[#1d41a8] bg-[#dbe9fc]"
                      : "border-border hover:bg-muted/30",
                    !pkg.available && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* NOTE: raw <input type="radio"> — custom card layout wraps label+radio in a styled card; RadioGroup primitive doesn't expose per-item card styling at this level */}
                  <input
                    type="radio"
                    data-testid={`seed-package-input-${pkg.key}`}
                    className="mt-1 shrink-0 accent-[#1d41a8]"
                    value={pkg.key}
                    checked={isSelected}
                    disabled={!pkg.available}
                    onChange={() => field.onChange(pkg.key)}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isSelected ? "text-[#1d41a8]" : "text-foreground"
                      )}
                    >
                      {t(`seedPackages.${pkg.key as SeedPackage}`, {
                        defaultValue: pkg.display_name,
                      })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        `seedPackages.descriptions.${pkg.key as SeedPackage}`,
                        { defaultValue: pkg.description }
                      )}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      />
    </div>
  )
}

export { SeedPackageStep }
