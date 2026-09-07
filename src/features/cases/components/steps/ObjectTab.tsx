import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { resolveFormMessage } from "@/lib/formMessages"
import { NewOrUsedSchema } from "@/features/cases/api/schema"
import type { ObjectGroupItem } from "@/features/cases/api/schema"
import {
  useContractObjects,
  useCreateContractObject,
  useObjectClassification,
} from "@/features/cases/hooks/useContractObjects"
import {
  EMPTY_OBJECT_FORM,
  isVehicleGroup,
  objectFormSchema,
  subGroupsFor,
  toObjectPayload,
} from "@/features/cases/objectForm"
import type { ObjectFormValues } from "@/features/cases/objectForm"

type Props = {
  /** Null until the contract exists — the modal creates it on first write. */
  contractId: string | null
  onNeedContract: () => Promise<string | null>
}

/**
 * Manual contract entry → **Object** tab (US 1.8).
 *
 * ── THE VEHICLE FIELDS ARE CONDITIONAL, WHICH IS WHAT THE DESIGN'S INDENT MEANS ────────────────
 * In the frame, `Fuel type` sits indented beneath `Object group`. That is the classification's
 * `is_vehicle` flag: the sub-group picker and the chassis / licence-plate / ZLB II fields belong to
 * a vehicle group and are meaningless for industrial equipment. Read from the flag rather than a
 * hard-coded group list.
 *
 * ── TWO THINGS THE FRAME SHOWS THAT ARE NOT BUILT ──────────────────────────────────────────────
 * **Evidence / "Select File".** The DAT valuation upload needs a document id
 * (`dat_evidence_document_id`), and no endpoint in the contract uploads a *document for an object* —
 * the document endpoints are case- and requirement-scoped. Per `api-first.md` §4 the row is omitted
 * rather than shipped as a picker that cannot persist.
 *
 * **`Object description` as a dropdown.** The frame renders it as `Select`, but the wire types it as
 * free text (`object_description: string | null`) and nothing supplies a list of descriptions. It is
 * a text field here; a dropdown with no source behind it would be decoration.
 *
 * Also: the frame labels the appraised value **"Apprised value"** — a typo, so the UI says
 * "Appraised value".
 */
export function ObjectTab({ contractId, onNeedContract }: Props) {
  const { t } = useTranslation("cases")
  const classification = useObjectClassification()
  const objects = useContractObjects(contractId ?? undefined)
  const createObject = useCreateContractObject()
  const [isAdding, setAdding] = useState(false)

  const groups = classification.data?.groups ?? []
  const existing = objects.data?.objects ?? []

  if (classification.isLoading) return <Skeleton className="h-64 w-full" />

  if (classification.isError) {
    return (
      <p className="text-sm text-destructive" data-testid="object-tab-error">
        {resolveApiErrorMessage(classification.error, t)}
      </p>
    )
  }

  async function handleSubmit(values: ObjectFormValues) {
    const id = contractId ?? (await onNeedContract())
    if (id === null) return

    createObject.mutate(
      {
        contractId: id,
        body: toObjectPayload(
          values,
          isVehicleGroup(groups, values.object_group)
        ),
      },
      {
        onSuccess: () => setAdding(false),
        onError: err => showApiError(err, t),
      }
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="object-tab">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t("wizard.manual.object.heading", { count: existing.length })}
        </h3>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="object-tab-add-button"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} />
            {t("wizard.manual.object.add")}
          </Button>
        )}
      </div>

      {existing.length === 0 && !isAdding && (
        <p
          className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
          data-testid="object-tab-empty"
        >
          {t("wizard.manual.object.empty")}
        </p>
      )}

      {existing.map(object => (
        <div
          key={object.id}
          className="rounded-lg border bg-muted/30 px-4 py-3 text-sm"
          data-testid={`object-tab-saved-${object.id}`}
        >
          <p className="font-medium">
            {t("wizard.manual.object.savedTitle", {
              number: object.object_number,
            })}
          </p>
          <p className="text-muted-foreground">
            {[object.object_group, object.brand, object.registration_plate]
              .filter(part => part !== null && part !== "")
              .join(" · ") || t("wizard.manual.object.savedEmpty")}
          </p>
        </div>
      ))}

      {isAdding && (
        <ObjectForm
          groups={groups}
          isSaving={createObject.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function ObjectForm({
  groups,
  isSaving,
  onCancel,
  onSubmit,
}: {
  groups: readonly ObjectGroupItem[]
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: ObjectFormValues) => void
}) {
  const { t } = useTranslation("cases")
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ObjectFormValues>({
    resolver: zodResolver(objectFormSchema),
    defaultValues: EMPTY_OBJECT_FORM,
  })

  // `useWatch`, not `watch`: choosing a group must reveal or hide the vehicle fields immediately,
  // and `watch` is what the project's own date-inputs rule (§3) rules out for a dependent field —
  // it also trips react-hooks/incompatible-library under the React Compiler.
  const groupCode = useWatch({ control, name: "object_group" })
  const subGroupCode = useWatch({ control, name: "object_sub_group" })
  const newOrUsed = useWatch({ control, name: "new_or_used" })
  const isVehicle = isVehicleGroup(groups, groupCode)
  const subGroups = subGroupsFor(groups, groupCode)

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border p-4"
      data-testid="object-tab-form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Field label={t("wizard.manual.object.fields.description")}>
        <Input
          data-testid="object-description-input"
          {...register("object_description")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("wizard.manual.object.fields.group")}>
          <SelectField
            data-testid="object-group-select"
            value={groupCode}
            onValueChange={value => {
              setValue("object_group", value)
              // A group change invalidates the sub-group: "Hybrid" under Wohnmobil is not a
              // sub-group of machinery, and leaving it would post a mismatched pair.
              setValue("object_sub_group", "")
            }}
            placeholder={t("wizard.manual.object.fields.groupPlaceholder")}
            options={groups.map(group => ({
              value: group.code,
              label: group.name,
            }))}
          />
        </Field>

        <Field label={t("wizard.manual.object.fields.manufacturer")}>
          <Input
            data-testid="object-manufacturer-input"
            {...register("manufacturer")}
          />
        </Field>
      </div>

      {/* Indented exactly as the frame does, because the nesting carries meaning: this belongs to
          the group above it and only exists for a vehicle. */}
      {isVehicle && subGroups.length > 0 && (
        <div className="ml-4 border-l pl-4">
          <Field label={t("wizard.manual.object.fields.subGroup")}>
            <SelectField
              data-testid="object-sub-group-select"
              value={subGroupCode}
              onValueChange={value => setValue("object_sub_group", value)}
              placeholder={t("wizard.manual.object.fields.subGroupPlaceholder")}
              options={subGroups.map(sub => ({
                value: sub.code,
                label: sub.name,
              }))}
            />
          </Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("wizard.manual.object.fields.brand")}>
          <Input data-testid="object-brand-input" {...register("brand")} />
        </Field>
        <Field
          label={t("wizard.manual.object.fields.yearOfManufacture")}
          error={resolveFormMessage(
            errors.year_of_manufacture?.message,
            t,
            "wizard.manual.object.errors"
          )}
        >
          <Input
            inputMode="numeric"
            data-testid="object-year-input"
            {...register("year_of_manufacture")}
          />
        </Field>
      </div>

      {isVehicle && (
        <div
          className="flex flex-col gap-4"
          data-testid="object-vehicle-fields"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("wizard.manual.object.fields.chassis")}>
              <Input
                data-testid="object-chassis-input"
                {...register("chassis_or_serial_number")}
              />
            </Field>
            <Field label={t("wizard.manual.object.fields.plate")}>
              <Input
                data-testid="object-plate-input"
                {...register("registration_plate")}
              />
            </Field>
          </div>
          <Field label={t("wizard.manual.object.fields.zlb")}>
            <Input
              data-testid="object-zlb-input"
              {...register("vehicle_registration_document_number")}
            />
          </Field>
        </div>
      )}

      <Field label={t("wizard.manual.object.fields.newOrUsed")}>
        <RadioGroup
          value={newOrUsed === "" ? undefined : newOrUsed}
          onValueChange={value =>
            setValue("new_or_used", NewOrUsedSchema.parse(value))
          }
          className="flex items-center gap-6"
        >
          {NewOrUsedSchema.options.map(option => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <RadioGroupItem
                value={option}
                data-testid={`object-new-or-used-${option}`}
              />
              {t(
                `wizard.manual.object.newOrUsed.${option}` as "wizard.manual.object.newOrUsed.new"
              )}
            </label>
          ))}
        </RadioGroup>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("wizard.manual.object.fields.acquisitionCost")}>
          <Input
            inputMode="decimal"
            data-testid="object-nac-input"
            {...register("acquisition_cost")}
          />
        </Field>
        <Field label={t("wizard.manual.object.fields.marketValue")}>
          <Input
            inputMode="decimal"
            data-testid="object-market-value-input"
            {...register("market_value")}
          />
        </Field>
        <Field label={t("wizard.manual.object.fields.appraisedValue")}>
          <Input
            inputMode="decimal"
            data-testid="object-appraised-value-input"
            {...register("appraised_value")}
          />
        </Field>
        <Field label={t("wizard.manual.object.fields.specialPayment")}>
          <Input
            inputMode="decimal"
            data-testid="object-special-payment-input"
            {...register("special_payment")}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          data-testid="object-form-cancel"
          onClick={onCancel}
        >
          {t("wizard.actions.cancel")}
        </Button>
        <Button
          type="submit"
          data-testid="object-form-save"
          disabled={isSaving}
        >
          {t("wizard.manual.object.saveObject")}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label error={error !== undefined} className="mb-1.5">
        {label}
      </Label>
      {children}
      {error !== undefined && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
