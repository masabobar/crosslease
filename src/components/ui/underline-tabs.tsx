import { cn } from "@/lib/utils"

// NOTE: raw <button> instead of shadcn Tabs — the underline sits on the
// container's border-b via a -mb-px overlap trick (per Figma "Advance Tabs"
// spec), which conflicts with shadcn Tabs' DOM structure.
export type UnderlineTab<T extends string> = {
  key: T
  label: React.ReactNode
  testId?: string
}

type UnderlineTabBarProps<T extends string> = {
  tabs: UnderlineTab<T>[]
  activeTab: T
  onChange: (key: T) => void
  className?: string
  tabClassName?: string
}

export function UnderlineTabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
  tabClassName,
}: UnderlineTabBarProps<T>) {
  return (
    <div
      className={cn(
        "border-b border-border flex items-center gap-1",
        className
      )}
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          data-testid={tab.testId}
          onClick={() => onChange(tab.key)}
          className={cn(
            "pb-3 pt-0.5 px-1.5 text-sm font-medium leading-5 whitespace-nowrap transition-colors",
            activeTab === tab.key
              ? "border-b-2 border-primary text-foreground -mb-px"
              : "text-foreground/60 hover:text-foreground",
            tabClassName
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
