import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/ui/select"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import {
  ROLE_TRANSITIONS,
  USER_ROLES,
  type UserRole,
} from "@/features/users/types"

const EditRoleFormSchema = z.object({
  new_role: z.enum(USER_ROLES, { error: "required" }),
  reason: z.string().min(10),
})
type EditRoleFormValues = z.infer<typeof EditRoleFormSchema>

type Props = {
  open: boolean
  currentRole: UserRole
  isPending: boolean
  onClose: () => void
  onSubmit: (values: EditRoleFormValues) => void
}

export function EditRoleScopeDialog({
  open,
  currentRole,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation("users")

  const form = useForm<EditRoleFormValues>({
    resolver: zodResolver(EditRoleFormSchema),
    defaultValues: { new_role: undefined, reason: "" },
  })

  const selectedRole = useWatch({ control: form.control, name: "new_role" })

  const roleOptions = (ROLE_TRANSITIONS[currentRole] ?? []).map(r => ({
    value: r,
    label: t(`roles.${r}`),
  }))

  function handleClose() {
    form.reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) handleClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[480px] sm:max-w-[480px] gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle>{t("detail.page.editRole.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(values => onSubmit(values))}>
          {/* dialog-content: gap-6 between Fields and footer sections */}
          <div className="px-4 py-4 flex flex-col gap-6">
            {/* Fields section: gap-4 between current-role row and new-role select */}
            <div className="flex flex-col gap-4">
              {/* Current role row */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {t("detail.page.editRole.currentRole")}
                </span>
                <RoleBadge role={currentRole} />
              </div>

              {/* New role select */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t("detail.page.editRole.newRole")}
                </span>
                <SelectField
                  data-testid="edit-role-new-role-select"
                  value={selectedRole ?? ""}
                  onValueChange={v =>
                    form.setValue("new_role", v as UserRole, {
                      shouldValidate: true,
                    })
                  }
                  options={roleOptions}
                  placeholder={t("modal.placeholders.role")}
                  error={!!form.formState.errors.new_role}
                  renderTriggerContent={opt =>
                    opt ? <RoleBadge role={opt.value as UserRole} /> : undefined
                  }
                  renderOption={opt => (
                    <RoleBadge role={opt.value as UserRole} />
                  )}
                />
              </div>
            </div>

            {/* footer section: gap-2 between the two alert boxes */}
            <div className="flex flex-col gap-2">
              {/* Reason for change — amber alert box */}
              <div className="rounded-xl bg-amber-500/10 px-[10px] py-2 flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t("detail.page.editRole.reasonLabel")}
                </span>
                <Textarea
                  {...form.register("reason")}
                  data-testid="edit-role-reason-input"
                  placeholder={t("detail.page.editRole.reasonPlaceholder")}
                  className="min-h-16 bg-card border-input rounded-xl text-sm resize-none"
                  aria-invalid={!!form.formState.errors.reason || undefined}
                />
                <span className="text-sm text-amber-600/80">
                  {t("detail.page.editRole.reasonMandatory")}
                </span>
              </div>

              {/* Four-Eyes approval notice — amber alert box */}
              <div className="rounded-xl bg-amber-500/10 px-[10px] py-2 flex items-start gap-2">
                <ShieldAlert
                  size={16}
                  className="text-amber-600 mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-amber-600">
                    {t("detail.page.editRole.fourEyes.title")}
                  </span>
                  <span className="text-sm text-amber-600/80">
                    {t("detail.page.editRole.fourEyes.description")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              data-testid="edit-role-cancel-button"
            >
              {t("detail.page.actions.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedRole}
              data-testid="edit-role-submit-button"
            >
              {t("detail.page.editRole.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
