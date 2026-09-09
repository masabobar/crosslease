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
        // Scrolls rather than overflows: six tabs with German labels outgrow a narrow modal, and
        // an overflowing bar hides its last tabs with no way to reach them. `pb-px` leaves room
        // for the active tab's -mb-px underline, which the scroll container would otherwise clip.
        "border-b border-border flex items-center gap-1 overflow-x-auto pb-px",
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
            // Without this the browser draws its own box, which reads as a border around one tab
            // in a bar whose whole idiom is an underline. A rounded ring says "focused" without
            // competing with the active-tab underline.
            "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
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
