import type { UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { CreateTenantForm } from "@/features/tenants/api/schema"
import type { SeedPackageEntry } from "@/features/tenants/api/schema"

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
                    "flex gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    isSelected
                      ? "border-[#1d41a8] bg-[#dbe9fc]"
                      : "border-border hover:bg-muted/30",
                    !pkg.available && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    type="radio"
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
                      {t(
                        `seedPackages.${pkg.key as "standard_retail_bank" | "minimal_sandbox"}`,
                        { defaultValue: pkg.display_name }
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pkg.description}
                    </p>
                    {pkg.includes.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {pkg.includes.map(item => (
                          <li
                            key={item}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          >
                            <span className="size-1 rounded-full bg-muted-foreground/50 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
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
