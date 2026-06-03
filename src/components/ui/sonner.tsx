import {
  CheckCheckIcon,
  CircleAlertIcon,
  InfoIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      closeButton
      icons={{
        success: <CheckCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <CircleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--foreground)",
          "--success-bg": "var(--card)",
          "--success-border": "var(--success)",
          "--success-text": "var(--foreground)",
          "--error-bg": "var(--card)",
          "--error-border": "var(--destructive)",
          "--error-text": "var(--foreground)",
          "--warning-bg": "var(--card)",
          "--warning-border": "var(--warning)",
          "--warning-text": "var(--foreground)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          icon: "cn-toast-icon",
          title: "cn-toast-title",
          description: "cn-toast-description",
          actionButton: "cn-toast-action",
          closeButton: "cn-toast-close",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
