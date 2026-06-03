import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlertIcon, CheckCheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

// --- AlertOutline ---

const alertOutlineVariants = cva(
  "flex w-full items-start gap-2 rounded-xl border p-2",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        info: "bg-card border-info",
        success: "bg-card border-success",
        warning: "bg-card border-warning",
        destructive: "bg-card border-destructive",
        amber: "bg-amber-50 border-amber-900",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

type AlertOutlineVariant = NonNullable<
  VariantProps<typeof alertOutlineVariants>["variant"]
>

const alertOutlineIconBadgeVariants = cva(
  "flex shrink-0 items-center justify-center rounded-md p-1",
  {
    variants: {
      variant: {
        default: "bg-accent text-foreground",
        info: "bg-info/10 text-info",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        amber: "bg-destructive/10 text-amber-900",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const CLOSE_ICON_COLOR: Record<AlertOutlineVariant, string> = {
  default: "text-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  amber: "text-amber-900",
}

const OUTLINE_ICONS: Record<AlertOutlineVariant, React.ElementType> = {
  default: CircleAlertIcon,
  info: CircleAlertIcon,
  success: CheckCheckIcon,
  warning: CircleAlertIcon,
  destructive: CircleAlertIcon,
  amber: CircleAlertIcon,
}

type AlertOutlineProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertOutlineVariants> & {
    onClose?: () => void
    action?: React.ReactNode
  }

function AlertOutline({
  className,
  variant = "default",
  onClose,
  action,
  children,
  ...props
}: AlertOutlineProps) {
  const v = variant ?? "default"
  const Icon = OUTLINE_ICONS[v]
  return (
    <div
      data-slot="alert-outline"
      role="alert"
      className={cn(alertOutlineVariants({ variant }), className)}
      {...props}
    >
      <div className={alertOutlineIconBadgeVariants({ variant })}>
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        {children}
      </div>
      {action}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className={cn(
            "shrink-0 opacity-60 transition-opacity hover:opacity-100",
            CLOSE_ICON_COLOR[v]
          )}
        >
          <XIcon className="size-5" />
        </button>
      )}
    </div>
  )
}

function AlertOutlineTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-outline-title"
      className={cn("text-sm font-medium leading-5 text-foreground", className)}
      {...props}
    />
  )
}

function AlertOutlineDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-outline-description"
      className={cn(
        "text-sm font-normal leading-5 text-muted-foreground/80",
        className
      )}
      {...props}
    />
  )
}

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  AlertOutline,
  AlertOutlineTitle,
  AlertOutlineDescription,
}
