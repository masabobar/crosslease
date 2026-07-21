import type { ReactNode } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: React.FormEventHandler<HTMLFormElement>
  title: string
  subtitle?: string
  infoRows: ReactNode
  justificationFieldId: string
  justificationLabel: string
  justificationMinCharsLabel: string
  justificationHint: string
  justificationErrorMessage?: string
  justificationRegister: UseFormRegisterReturn
  justificationPlaceholder?: string
  justificationRows?: number
  extraContent?: ReactNode
  onCancel: () => void
  isActionDisabled: boolean
  isPending: boolean
  cancelLabel: string
  cancelTestId: string
  submitLabel: string
  submittingLabel: string
  submitTestId: string
  submitButtonClassName?: string
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  subtitle,
  infoRows,
  justificationFieldId,
  justificationLabel,
  justificationMinCharsLabel,
  justificationHint,
  justificationErrorMessage,
  justificationRegister,
  justificationPlaceholder,
  justificationRows = 3,
  extraContent,
  onCancel,
  isActionDisabled,
  isPending,
  cancelLabel,
  cancelTestId,
  submitLabel,
  submittingLabel,
  submitTestId,
  submitButtonClassName,
}: Props) {
  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={onSubmit}>
        {/* Header */}
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </DialogHeader>
        </div>

        <Separator />

        {/* Content */}
        <div className="flex flex-col gap-6 px-4 py-4">
          <div className="flex flex-col gap-4">{infoRows}</div>

          <Separator />

          {/* Justification */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={justificationFieldId}
                className="text-sm font-medium"
              >
                {justificationLabel}
              </Label>
              <span className="text-sm text-muted-foreground/80">
                {justificationMinCharsLabel}
              </span>
            </div>
            <Textarea
              id={justificationFieldId}
              data-testid={justificationFieldId}
              placeholder={justificationPlaceholder}
              rows={justificationRows}
              {...justificationRegister}
            />
            {justificationErrorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {justificationErrorMessage}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {justificationHint}
              </p>
            )}
          </div>

          {extraContent}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isActionDisabled}
            data-testid={cancelTestId}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            className={submitButtonClassName}
            disabled={isActionDisabled}
            data-testid={submitTestId}
          >
            {isPending ? submittingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
