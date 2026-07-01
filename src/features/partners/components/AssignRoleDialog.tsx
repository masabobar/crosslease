import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NonRiskPartnerRoleSchema } from "@/features/partners/api/schema"
import { useAssignPartnerRoles } from "@/features/partners/hooks/useAssignPartnerRoles"
import type { NonRiskPartnerRole } from "@/features/partners/api/schema"

const assignSchema = z.object({
  role: NonRiskPartnerRoleSchema,
  note: z.string().optional(),
})
type AssignForm = z.infer<typeof assignSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  onSuccess: () => void
  onError: (err: unknown) => void
}

function AssignRoleDialog({
  open,
  onOpenChange,
  partnerId,
  onSuccess,
  onError,
}: Props) {
  const { t } = useTranslation("partners")
  const mutation = useAssignPartnerRoles(partnerId)
  const NON_RISK_ROLES: NonRiskPartnerRole[] = NonRiskPartnerRoleSchema.options

  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: AssignForm) {
    mutation.mutate(
      { roles: [values.role], note: values.note ?? null },
      {
        onSuccess: () => {
          onSuccess()
          handleClose()
        },
        onError,
      }
    )
  }

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("assignRoleDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-select">
              {t("assignRoleDialog.fields.role")}
            </Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="role-select"
                    data-testid="assign-role-select"
                  >
                    <SelectValue
                      placeholder={t("assignRoleDialog.fields.rolePlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {NON_RISK_ROLES.map(role => (
                      <SelectItem key={role} value={role}>
                        {t(`role.${role}` as "role.lessee")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-xs text-destructive">Role is required.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assign-note">
              {t("assignRoleDialog.fields.note")}
            </Label>
            <Textarea
              id="assign-note"
              data-testid="assign-role-note"
              rows={2}
              {...register("note")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="assign-role-cancel"
          >
            {t("assignRoleDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="assign-role-submit"
          >
            {mutation.isPending
              ? t("assignRoleDialog.submitting")
              : t("assignRoleDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { AssignRoleDialog }
