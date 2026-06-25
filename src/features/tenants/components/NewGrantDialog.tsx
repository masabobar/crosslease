import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { addDays, parseISO, format } from "date-fns"
import { ChevronDown, CircleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SelectField } from "@/components/ui/select"
import { useCreateGrant } from "@/features/tenants/hooks/useCreateGrant"
import { useUsers } from "@/features/users/hooks/useUsers"
import { CreateGrantFormSchema } from "@/features/tenants/api/schema"
import type {
  CreateGrantForm,
  AccessReason,
} from "@/features/tenants/api/schema"
import type { UserListItem } from "@/features/users/api/schema"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

const ACCESS_REASONS: AccessReason[] = [
  "user_access_issue",
  "workflow_processing_diagnostic",
  "document_generation_diagnostic",
  "integration_troubleshooting",
  "compliance_query_support",
  "regulatory_assistance",
  "emergency_incident_response",
]

const MAX_GRANT_DAYS = 30

function toISOFromDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  // Construct local midnight; if it's already past (i.e. user picked today), use now
  const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0)
  const now = new Date()
  return (localMidnight < now ? now : localMidnight).toISOString()
}

function toISOUntilDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
}

function userInitials(user: UserListItem): string {
  return `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
}

type GranteePickerProps = {
  value: string
  onChange: (id: string) => void
  users: UserListItem[]
  error?: boolean
}

function GranteePicker({ value, onChange, users, error }: GranteePickerProps) {
  const { t } = useTranslation("tenants")
  const [open, setOpen] = useState(false)
  const selected = users.find(u => u.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-testid="grant-grantee-trigger"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-2.5 py-1.5 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error ? "border-destructive" : "border-input",
          !selected && "text-muted-foreground"
        )}
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <span className="text-xs text-muted-foreground">
                {userInitials(selected)}
              </span>
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-sm font-medium text-foreground truncate">
                {selected.first_name} {selected.last_name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {selected.email}
              </span>
            </div>
          </div>
        ) : (
          <span>{t("detail.grants.newGrantDialog.granteePlaceholder")}</span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="max-h-64 overflow-y-auto py-1">
          {users.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t("detail.grants.newGrantDialog.noSupportUsers")}
            </p>
          )}
          {users.map(user => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onChange(user.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors"
              data-testid={`grant-grantee-option-${user.id}`}
            >
              <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                <span className="text-xs text-muted-foreground">
                  {userInitials(user)}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
}

export function NewGrantDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useCreateGrant(tenantId)

  const today = format(new Date(), "yyyy-MM-dd")

  const { data: usersData } = useUsers({
    role: ["support_user"],
    per_page: 100,
  })
  const supportUsers = usersData?.users ?? []

  const [validFrom, setValidFrom] = useState(today)
  const [accessReason, setAccessReason] = useState("")
  const isEmergency = accessReason === "emergency_incident_response"
  const maxUntilDate = addDays(parseISO(validFrom), MAX_GRANT_DAYS)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGrantForm>({
    resolver: zodResolver(CreateGrantFormSchema),
    defaultValues: {
      grantee_id: "",
      access_reason: undefined,
      valid_from: today,
      valid_until: "",
      additional_context: "",
    },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
    setValidFrom(today)
    setAccessReason("")
  }

  function onSubmit(values: CreateGrantForm) {
    mutation.mutate(
      {
        grantee_id: values.grantee_id,
        access_reason: values.access_reason,
        valid_from: toISOFromDate(values.valid_from),
        valid_until: toISOUntilDate(values.valid_until),
        additional_context: values.additional_context || null,
      },
      {
        onSuccess: grant => {
          const grantee = supportUsers.find(u => u.id === grant.grantee_id)
          const granteeName = grantee
            ? `${grantee.first_name} ${grantee.last_name}`
            : t("detail.grants.newGrantDialog.successToast.unknownGrantee")
          const until = format(parseISO(grant.valid_until), "d MMM yyyy, HH:mm")
          toast.success(t("detail.grants.newGrantDialog.successToast.title"), {
            description: t(
              "detail.grants.newGrantDialog.successToast.description",
              { granteeName, tenantName, until }
            ),
          })
          handleClose()
        },
        onError: err => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("detail.grants.newGrantDialog.title")}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tenantName} · {t("detail.grants.newGrantDialog.subtitle")}
            </p>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-6 px-4 py-4">
          {/* Grantee */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {t("detail.grants.newGrantDialog.fields.grantee")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t("detail.grants.newGrantDialog.fields.granteeHint")}
              </span>
            </div>
            <Controller
              control={control}
              name="grantee_id"
              render={({ field }) => (
                <GranteePicker
                  value={field.value}
                  onChange={field.onChange}
                  users={supportUsers}
                  error={!!errors.grantee_id}
                />
              )}
            />
          </div>

          {/* Access reason */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="grant-access-reason"
              className="text-sm font-medium"
            >
              {t("detail.grants.newGrantDialog.fields.accessReason")}
            </Label>
            <Controller
              control={control}
              name="access_reason"
              render={({ field }) => (
                <SelectField
                  id="grant-access-reason"
                  data-testid="grant-access-reason"
                  value={field.value ?? ""}
                  onValueChange={v => {
                    field.onChange(v)
                    setAccessReason(v)
                  }}
                  options={ACCESS_REASONS.map(reason => ({
                    value: reason,
                    label: t(`detail.grants.accessReasons.${reason}`),
                  }))}
                  placeholder={t(
                    "detail.grants.newGrantDialog.fields.accessReasonPlaceholder"
                  )}
                  error={!!errors.access_reason}
                />
              )}
            />
          </div>

          {/* Valid period */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              {t("detail.grants.newGrantDialog.fields.validPeriod")}
            </Label>
            <div className="flex gap-2">
              <Controller
                control={control}
                name="valid_from"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={v => {
                      field.onChange(v)
                      setValidFrom(v)
                    }}
                    placeholder={t("list.filters.from")}
                    minDate={parseISO(today)}
                    error={!!errors.valid_from}
                    data-testid="grant-valid-from"
                  />
                )}
              />
              <Controller
                control={control}
                name="valid_until"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("list.filters.to")}
                    minDate={validFrom ? parseISO(validFrom) : undefined}
                    maxDate={maxUntilDate}
                    error={!!errors.valid_until}
                    data-testid="grant-valid-until"
                  />
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground/80">
              {t("detail.grants.newGrantDialog.fields.validPeriodHint", {
                days: MAX_GRANT_DAYS,
              })}
            </p>
          </div>

          {/* Additional context */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="grant-additional-context"
              className="text-sm font-medium"
            >
              {t("detail.grants.newGrantDialog.fields.additionalContext")}{" "}
              <span className="text-muted-foreground font-normal">
                ({t("detail.grants.newGrantDialog.fields.optional")})
              </span>
            </Label>
            <Textarea
              id="grant-additional-context"
              data-testid="grant-additional-context"
              rows={3}
              maxLength={500}
              {...register("additional_context")}
            />
          </div>

          {/* Emergency warning */}
          {isEmergency && (
            <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-600">
              <CircleAlert
                size={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-600/80">
                {t("detail.grants.newGrantDialog.emergencyWarning")}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="grant-dialog-cancel"
          >
            {t("detail.grants.newGrantDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            data-testid="grant-dialog-submit"
          >
            {mutation.isPending
              ? t("detail.grants.newGrantDialog.submitting")
              : t("detail.grants.newGrantDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
