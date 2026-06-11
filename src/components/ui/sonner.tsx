"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleAlertIcon, CheckCheckIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: <CheckCheckIcon className="size-4" />,
        info: <CircleAlertIcon className="size-4" />,
        warning: <CircleAlertIcon className="size-4" />,
        error: <CircleAlertIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          icon: "cn-toast-icon",
          title: "cn-toast-title",
          description: "cn-toast-description",
          closeButton: "cn-toast-close",
          actionButton: "cn-toast-action",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
