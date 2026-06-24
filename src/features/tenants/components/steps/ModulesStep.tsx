import type { UseFormReturn } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LockIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  CreateTenantForm,
  PlatformModule,
} from "@/features/tenants/api/schema"

type Props = {
  form: UseFormReturn<CreateTenantForm>
  modules: PlatformModule[]
  isLoading: boolean
}

function moduleDescription(
  mod: PlatformModule,
  t: ReturnType<typeof useTranslation<"tenants">>["t"]
): string {
  return (
    mod.description ??
    t(`wizard.modules.descriptions.${mod.key}` as never, { defaultValue: "" })
  )
}

function ModulesStep({ form, modules, isLoading }: Props) {
  const { t } = useTranslation("tenants")

  const selectedModules = useWatch({ control: form.control, name: "modules" })

  const alwaysOnModules = modules.filter(m => m.always_on)
  const optionalModules = modules.filter(m => !m.always_on)

  const selectedCount = selectedModules.length + alwaysOnModules.length

  function handleToggle(key: string, checked: boolean) {
    const current = form.getValues("modules")
    const next = checked ? [...current, key] : current.filter(k => k !== key)
    form.setValue("modules", next)
  }

  if (isLoading) {
    return (
      <div className="flex gap-4" data-testid="modules-step">
        <div className="flex-1 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
        <div className="w-[260px] shrink-0">
          <Skeleton className="h-48 w-full rounded-[14px]" />
        </div>
      </div>
    )
  }

  // Group optional modules by their translated group label
  const groupedOptional = optionalModules.reduce<
    Record<string, PlatformModule[]>
  >((acc, mod) => {
    const group = t(`wizard.modules.moduleGroups.${mod.key}` as never, {
      defaultValue: mod.group,
    })
    return { ...acc, [group]: [...(acc[group] ?? []), mod] }
  }, {})

  return (
    <div className="flex gap-4" data-testid="modules-step">
      {/* Left: module list */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Always-on section */}
        {alwaysOnModules.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("wizard.modules.alwaysOn")}
            </p>
            {alwaysOnModules.map(mod => (
              <LockedModuleCard key={mod.key} mod={mod} t={t} />
            ))}
          </div>
        )}

        {/* Optional modules grouped */}
        {Object.entries(groupedOptional).map(([group, groupModules]) => (
          <div key={group} className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {group}
            </p>
            {groupModules.map(mod => {
              const isChecked = selectedModules.includes(mod.key)
              return (
                <OptionalModuleCard
                  key={mod.key}
                  mod={mod}
                  isChecked={isChecked}
                  onToggle={handleToggle}
                  t={t}
                />
              )
            })}
          </div>
        ))}

        {modules.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("wizard.modules.noModules")}
          </p>
        )}
      </div>

      {/* Right: selected modules summary */}
      <div className="w-[260px] shrink-0">
        <div className="sticky top-4 rounded-[14px] border border-border bg-background overflow-hidden">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-card-foreground">
              {t("wizard.modules.selectedModules")}
            </p>
            <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 min-w-[18px] h-[18px] text-xs font-medium text-primary-foreground leading-none">
              {selectedCount}
            </span>
          </div>
          <Separator />
          <div className="p-4 flex flex-col gap-4">
            {alwaysOnModules.map(mod => (
              <div key={mod.key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {mod.display_name}
                </span>
                <LockIcon
                  size={16}
                  className="shrink-0 text-muted-foreground"
                />
              </div>
            ))}
            {selectedModules.map(key => {
              const mod = modules.find(m => m.key === key)
              return (
                <div key={key} className="flex items-start">
                  <span className="text-sm text-foreground">
                    {mod?.display_name ?? key}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

type TFunction = ReturnType<typeof useTranslation<"tenants">>["t"]

type LockedModuleCardProps = { mod: PlatformModule; t: TFunction }

function LockedModuleCard({ mod, t }: LockedModuleCardProps) {
  const description = moduleDescription(mod, t)
  return (
    <div
      className="flex gap-2.5 items-start p-3 rounded-[10px] border border-dashed border-muted-foreground/60 bg-accent"
      data-testid={`module-locked-${mod.key}`}
    >
      {/* Checkbox + text faded as a unit; lock icon stays crisp */}
      <div className="flex flex-1 min-w-0 gap-2 items-start opacity-50">
        <Checkbox
          checked={true}
          disabled={true}
          aria-label={mod.display_name}
          className="mt-0.5 shrink-0"
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground leading-5">
            {mod.display_name}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground leading-[16px]">
              {description}
            </span>
          )}
        </div>
      </div>
      <LockIcon
        size={16}
        className="shrink-0 text-muted-foreground/60 mt-0.5"
      />
    </div>
  )
}

type OptionalModuleCardProps = {
  mod: PlatformModule
  isChecked: boolean
  onToggle: (key: string, checked: boolean) => void
  t: TFunction
}

function OptionalModuleCard({
  mod,
  isChecked,
  onToggle,
  t,
}: OptionalModuleCardProps) {
  const description = moduleDescription(mod, t)
  return (
    <label
      className={cn(
        "flex gap-2 items-start p-3 rounded-[10px] border cursor-pointer transition-colors",
        isChecked
          ? "border-primary bg-[rgba(57,129,246,0.1)]"
          : "border-border bg-card hover:bg-accent/50"
      )}
      data-testid={`module-${mod.key}`}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={checked => onToggle(mod.key, checked as boolean)}
        aria-label={mod.display_name}
        className="mt-0.5 shrink-0"
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground leading-5">
          {mod.display_name}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground leading-[16px]">
            {description}
          </span>
        )}
      </div>
    </label>
  )
}

export { ModulesStep }
