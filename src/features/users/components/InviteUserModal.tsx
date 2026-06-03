import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { AlertCircle } from "lucide-react"
import { DialogModal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import type { SelectOption } from "@/components/ui/select"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import {
  LC_ONLY_ROLES,
  USER_ROLES,
  FOUR_EYES_ROLES,
  TENANT_SCOPED_ROLES,
  AUDITOR_DATE_RANGE_ROLES,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import type { UserResponse } from "@/features/users/api/schema"
import { useInviteUser } from "@/features/users/hooks/useInviteUser"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { ApiError } from "@/lib/api"

type InviteUserModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: (user: UserResponse) => void
}

const formSchema = z
  .object({
    firstName: z.string().min(1, "required"),
    lastName: z.string().min(1, "required"),
    email: z.string().min(1, "required"),
    role: z.enum(USER_ROLES, { error: "required" }),
    tenant: z.string().optional(),
    accessValidFrom: z.string().optional(),
    accessValidUntil: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (TENANT_SCOPED_ROLES.includes(data.role) && !data.tenant) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "required",
        path: ["tenant"],
      })
    }
    if (AUDITOR_DATE_RANGE_ROLES.includes(data.role)) {
      if (!data.accessValidFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "required",
          path: ["accessValidFrom"],
        })
      }
      if (!data.accessValidUntil) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "required",
          path: ["accessValidUntil"],
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

function InviteUserModal({ open, onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useTranslation("users")
  const { t: tCommon } = useTranslation("common")
  const { mutateAsync: invite } = useInviteUser()
  const { data: tenantsData, isLoading: isTenantsLoading } = useTenants()

  const resolveMsg = (msg: string | undefined) =>
    msg === "required" ? tCommon("validation.required") : msg

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: undefined,
      tenant: "",
      accessValidFrom: "",
      accessValidUntil: "",
    },
  })

  const { errors, isSubmitting } = form.formState

  const tenantOptions: SelectOption[] = (tenantsData?.tenants ?? [])
    .filter(t => t.status === "active")
    .map(t => ({ value: t.id, label: t.name }))

  const selectedRole = useWatch({ control: form.control, name: "role" })

  const isTenantScoped =
    !!selectedRole && TENANT_SCOPED_ROLES.includes(selectedRole)
  const isAuditorDateRange =
    !!selectedRole && AUDITOR_DATE_RANGE_ROLES.includes(selectedRole)
  const isFourEyes = !!selectedRole && FOUR_EYES_ROLES.includes(selectedRole)
  const isLeasingUser = !!selectedRole && LC_ONLY_ROLES.includes(selectedRole)

  const tenantLabel = isLeasingUser
    ? t("modal.fields.tenantScope")
    : t("modal.fields.tenant")

  const tenantHint = t("modal.hints.tenantOperational")

  const roleOptions: SelectOption[] = USER_ROLES.map(role => ({
    value: role,
    label: t(`roles.${role}`),
  }))

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  const onSubmit = form.handleSubmit(async data => {
    try {
      const result = await invite({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: data.role,
        tenant_id:
          TENANT_SCOPED_ROLES.includes(data.role) && data.tenant
            ? data.tenant
            : undefined,
        access_valid_until:
          AUDITOR_DATE_RANGE_ROLES.includes(data.role) && data.accessValidUntil
            ? new Date(data.accessValidUntil).toISOString()
            : undefined,
      })
      form.reset()
      onClose()
      onSuccess?.(result.user)
    } catch (err) {
      if (err instanceof ApiError) {
        const errMessage = t(`errors.${err.code}`, {
          defaultValue: t("errors.generic"),
        })
        if (err.code === "EMAIL_ALREADY_EXISTS") {
          form.setError("email", { message: errMessage })
        } else if (err.errors?.length) {
          const fieldMap: Record<string, keyof typeof data> = {
            first_name: "firstName",
            last_name: "lastName",
            email: "email",
            role: "role",
            tenant_id: "tenant",
            access_valid_until: "accessValidUntil",
          }
          for (const e of err.errors) {
            const formField = fieldMap[e.field]
            if (formField) form.setError(formField, { message: errMessage })
          }
        } else {
          form.setError("root", { message: errMessage })
        }
      }
    }
  })

  return (
    <DialogModal open={open} onOpenChange={handleOpenChange}>
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t("modal.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("modal.subtitle")}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        data-testid="invite-user-form"
        className="px-6 py-4 space-y-5"
      >
        {/* First name + Last name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="firstName"
              error={!!errors.firstName}
              className="mb-1.5"
            >
              {t("modal.fields.firstName")}
            </Label>
            <Input
              id="firstName"
              data-testid="invite-first-name-input"
              error={!!errors.firstName}
              placeholder={t("modal.placeholders.firstName")}
              {...form.register("firstName")}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.firstName.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="lastName"
              error={!!errors.lastName}
              className="mb-1.5"
            >
              {t("modal.fields.lastName")}
            </Label>
            <Input
              id="lastName"
              data-testid="invite-last-name-input"
              error={!!errors.lastName}
              placeholder={t("modal.placeholders.lastName")}
              {...form.register("lastName")}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.lastName.message)}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" error={!!errors.email} className="mb-1.5">
            {t("modal.fields.email")}
          </Label>
          <Input
            id="email"
            type="email"
            data-testid="invite-email-input"
            error={!!errors.email}
            placeholder={t("modal.placeholders.email")}
            {...form.register("email")}
          />
          <p className="mt-1 text-sm font-normal leading-5 text-muted-foreground">
            {t("modal.hints.email")}
          </p>
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.email.message)}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <Label htmlFor="role" error={!!errors.role} className="mb-1.5">
            {t("modal.fields.role")}
          </Label>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <SelectField
                id="role"
                data-testid="invite-role-select"
                value={field.value}
                onValueChange={val => {
                  field.onChange(val)
                  // Reset conditional fields when role changes
                  form.setValue("tenant", "")
                  form.setValue("accessValidFrom", "")
                  form.setValue("accessValidUntil", "")
                }}
                options={roleOptions}
                placeholder={t("modal.placeholders.role")}
                error={!!errors.role}
                renderTriggerContent={opt =>
                  opt ? <RoleBadge role={opt.value as UserRole} /> : undefined
                }
                renderOption={opt => <RoleBadge role={opt.value as UserRole} />}
              />
            )}
          />
          {errors.role && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.role.message)}
            </p>
          )}
        </div>

        {/* Four-Eyes warning */}
        {isFourEyes && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium leading-5 align-middle text-amber-800">
                {t("modal.fourEyes.title")}
              </p>
              <p className="mt-0.5 text-sm font-normal leading-5 align-middle text-amber-700">
                {t("modal.fourEyes.description")}
              </p>
            </div>
          </div>
        )}

        {/* Tenant / Tenant scope */}
        {isTenantScoped && (
          <div>
            <Label htmlFor="tenant" error={!!errors.tenant} className="mb-1.5">
              {tenantLabel}
            </Label>
            <Controller
              control={form.control}
              name="tenant"
              render={({ field }) => (
                <SelectField
                  id="tenant"
                  data-testid="invite-tenant-select"
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  options={tenantOptions}
                  placeholder={
                    isTenantsLoading
                      ? tCommon("loading")
                      : t("modal.placeholders.tenant")
                  }
                  error={!!errors.tenant}
                  disabled={isTenantsLoading}
                />
              )}
            />
            <p className="mt-1 text-sm text-muted-foreground">{tenantHint}</p>
            {errors.tenant && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.tenant.message)}
              </p>
            )}
          </div>
        )}

        {/* Access valid from / until (Auditor only) */}
        {isAuditorDateRange && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="accessValidFrom"
                  error={!!errors.accessValidFrom}
                  className="mb-1.5"
                >
                  {t("modal.fields.accessValidFrom")}
                </Label>
                <Controller
                  control={form.control}
                  name="accessValidFrom"
                  render={({ field }) => (
                    <DatePicker
                      id="accessValidFrom"
                      data-testid="invite-access-valid-from"
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.accessValidFrom}
                    />
                  )}
                />
                {errors.accessValidFrom && (
                  <p className="mt-1 text-sm text-destructive">
                    {resolveMsg(errors.accessValidFrom.message)}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="accessValidUntil"
                  error={!!errors.accessValidUntil}
                  className="mb-1.5"
                >
                  {t("modal.fields.accessValidUntil")}
                </Label>
                <Controller
                  control={form.control}
                  name="accessValidUntil"
                  render={({ field }) => (
                    <DatePicker
                      id="accessValidUntil"
                      data-testid="invite-access-valid-until"
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.accessValidUntil}
                    />
                  )}
                />
                {errors.accessValidUntil && (
                  <p className="mt-1 text-sm text-destructive">
                    {resolveMsg(errors.accessValidUntil.message)}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-right">
              {t("modal.hints.accessDates")}
            </p>
          </div>
        )}

        {/* Root error */}
        {errors.root && (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 pb-2">
          <Button
            type="button"
            variant="outline"
            data-testid="invite-cancel-button"
            onClick={() => handleOpenChange(false)}
          >
            {t("modal.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="invite-submit-button"
            disabled={isSubmitting}
          >
            {t("modal.actions.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { InviteUserModal }
