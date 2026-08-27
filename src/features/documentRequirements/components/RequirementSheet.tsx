import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { resolveFormMessage } from "@/lib/formMessages"
import { useAddRequirement } from "@/features/documentRequirements/hooks/useAddRequirement"
import { useTenantDocumentTypes } from "@/features/documentRequirements/hooks/useTenantDocumentTypes"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUpdateRequirement } from "@/features/documentRequirements/hooks/useUpdateRequirement"
import { CaseTypeCheckboxGroup } from "@/features/documentRequirements/components/CaseTypeCheckboxGroup"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import {
  DocumentOriginSchema,
  RequirementClassificationSchema,
  StageCategorizationSchema,
} from "@/features/documentRequirements/api/schema"
import type { RequirementResponse } from "@/features/documentRequirements/api/schema"

type SheetMode = "view" | "edit" | "add"

const STAGE_OPTIONS = [
  { value: "", labelKey: "requirement.fields.stageNone" as const },
  ...StageCategorizationSchema.options.map(value => ({
    value,
    labelKey: `requirement.stages.${value}` as const,
  })),
]

const CLASSIFICATION_OPTIONS = RequirementClassificationSchema.options.map(
  value => ({
    value,
    labelKey: `requirement.classifications.${value}` as const,
  })
)

const DOCUMENT_ORIGIN_OPTIONS = DocumentOriginSchema.options.map(value => ({
  value,
  labelKey: `requirement.documentOrigins.${value}` as const,
}))

// requirement_code and document_type_code are immutable once created (UpdateRequirementRequest
// has neither field), so the edit form hides them — but the resolver stays a single schema
// (rather than an edit-mode variant that omits them) so useForm's generic type doesn't have to
// vary by mode. Pre-filled and hidden, they always validate trivially in edit mode.
// Mirrors AddRequirementRequest's own Field(max_length=…) bounds. Every rule carries a message
// *code*, never bare prose: an unannotated `.max()` would surface Zod's own English text to the
// user (see resolveFormMessage).
const CODE_MAX_LENGTH = 100
const DOCUMENT_TYPE_NAME_MAX_LENGTH = 255

// Manual ordering is not part of this screen; the backend defaults to the same value.
const DEFAULT_SORT_ORDER = 0

const requirementFieldsSchema = z.object({
  requirementCode: z
    .string()
    .trim()
    .min(1, "required")
    .max(CODE_MAX_LENGTH, "tooLong"),
  documentTypeCode: z
    .string()
    .trim()
    .min(1, "required")
    .max(CODE_MAX_LENGTH, "tooLong"),
  documentTypeName: z
    .string()
    .trim()
    .min(1, "required")
    .max(DOCUMENT_TYPE_NAME_MAX_LENGTH, "tooLong"),
  description: z.string(),
  classification: z.string().min(1, "required"),
  caseTypes: z.array(z.string()).min(1, "required"),
  stageCategorization: z.string(),
  documentOrigin: z.string().min(1, "required"),
})

type RequirementFormValues = z.infer<typeof requirementFieldsSchema>

function toFormValues(
  requirement?: RequirementResponse
): RequirementFormValues {
  return {
    requirementCode: requirement?.requirement_code ?? "",
    documentTypeCode: requirement?.document_type_code ?? "",
    documentTypeName: requirement?.document_type_name ?? "",
    description: requirement?.description ?? "",
    classification:
      requirement?.classification ??
      RequirementClassificationSchema.enum.mandatory,
    caseTypes: requirement?.applicable_case_types ?? [],
    stageCategorization: requirement?.stage_categorization ?? "",
    documentOrigin:
      requirement?.document_origin ?? DocumentOriginSchema.enum.uploaded,
  }
}

type Props = {
  catalogId: string
  mode: SheetMode
  requirement?: RequirementResponse
  onOpenChange: (open: boolean) => void
}

function RequirementSheet({
  catalogId,
  mode,
  requirement,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("documentRequirements")
  const isEdit = mode === "edit"
  // PRD1042-1794 Block 10 — the document types this requirement may name. Scoped to the acting
  // user's own bank: item 3 of the CR forbids a bank selector anywhere, so the tenant is never a
  // parameter of this screen.
  const { data: currentUser } = useCurrentUser()
  const {
    data: documentTypesResponse,
    isError: isDocumentTypesError,
    isPending: isDocumentTypesLoading,
  } = useTenantDocumentTypes(currentUser?.tenant_id ?? undefined)
  const documentTypes = documentTypesResponse?.items ?? []
  // Show the human name; the code is an internal identifier, not something to surface as the label.
  const documentTypeOptions = documentTypes.map(type => ({
    value: type.type_code,
    label: type.type_name,
  }))

  const addRequirement = useAddRequirement(catalogId)
  const updateRequirement = useUpdateRequirement(catalogId)

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    setValue,
    formState: { errors },
  } = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFieldsSchema),
    defaultValues: toFormValues(requirement),
  })

  function resolveMessage(message: string | undefined): string | undefined {
    return resolveFormMessage(message, t, "requirement.errors")
  }

  function handleClose() {
    onOpenChange(false)
  }

  function onSubmit(values: RequirementFormValues) {
    const shared = {
      document_type_name: values.documentTypeName.trim(),
      description: values.description.trim() || null,
      classification: RequirementClassificationSchema.parse(
        values.classification
      ),
      applicable_case_types: values.caseTypes,
      stage_categorization: values.stageCategorization
        ? StageCategorizationSchema.parse(values.stageCategorization)
        : null,
      document_origin: DocumentOriginSchema.parse(values.documentOrigin),
    }

    const onError = (err: unknown) => {
      if (
        applyApiFieldErrors({
          error: err,
          fields: Object.keys(getValues()),
          setError,
        })
      )
        return

      toast.error(resolveApiErrorMessage(err, t))
    }

    if (isEdit && requirement) {
      updateRequirement.mutate(
        { requirementId: requirement.id, body: shared },
        {
          onSuccess: () => {
            toast.success(t("requirement.editSuccess"))
            handleClose()
          },
          onError,
        }
      )
      return
    }

    addRequirement.mutate(
      {
        requirement_code: values.requirementCode.trim(),
        document_type_code: values.documentTypeCode.trim(),
        sort_order: DEFAULT_SORT_ORDER,
        ...shared,
      },
      {
        onSuccess: () => {
          toast.success(t("requirement.addSuccess"))
          handleClose()
        },
        onError,
      }
    )
  }

  const isPending = addRequirement.isPending || updateRequirement.isPending

  if (mode === "view" && requirement) {
    return (
      <Sheet open onOpenChange={o => !o && handleClose()}>
        <SheetContent data-testid="requirement-view-sheet">
          <SheetHeader>
            <SheetTitle>{requirement.requirement_code}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto">
            {!requirement.is_active && (
              <div>
                <Badge variant="outline">{t("requirement.inactive")}</Badge>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-3">
              {[
                [
                  "requirement.fields.documentTypeCode",
                  requirement.document_type_code,
                ],
                [
                  "requirement.fields.documentTypeName",
                  requirement.document_type_name,
                ],
                [
                  "requirement.fields.description",
                  requirement.description ?? t("detail.identity.notApplicable"),
                ],
                [
                  "requirement.fields.classification",
                  t(
                    `requirement.classifications.${requirement.classification}` as "requirement.classifications.mandatory"
                  ),
                ],
                [
                  "requirement.fields.caseTypes",
                  requirement.applicable_case_types
                    .map(v =>
                      t(`caseTypes.${v}` as "caseTypes.refinancing_request", {
                        defaultValue: v,
                      })
                    )
                    .join(", "),
                ],
                [
                  "requirement.fields.stageCategorization",
                  requirement.stage_categorization
                    ? t(
                        `requirement.stages.${requirement.stage_categorization}` as "requirement.stages.submission"
                      )
                    : t("requirement.fields.stageNone"),
                ],
                [
                  "requirement.fields.documentOrigin",
                  t(
                    `requirement.documentOrigins.${requirement.document_origin}` as "requirement.documentOrigins.uploaded"
                  ),
                ],
              ].map(([labelKey, value]) => (
                <div key={labelKey}>
                  <dt className="text-sm text-muted-foreground">
                    {t(labelKey as "requirement.fields.documentTypeCode")}
                  </dt>
                  <dd className="text-sm text-foreground mt-1">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="requirement-view-close"
              onClick={handleClose}
            >
              {t("create.actions.cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open onOpenChange={o => !o && handleClose()}>
      <SheetContent data-testid="requirement-form-sheet">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full"
        >
          <SheetHeader>
            <SheetTitle>
              {isEdit ? t("requirement.editTitle") : t("requirement.addTitle")}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
            {!isEdit && (
              <>
                <div>
                  <Label
                    htmlFor="requirement-code"
                    error={!!errors.requirementCode}
                    className="mb-2"
                  >
                    {t("requirement.fields.requirementCode")}
                  </Label>
                  <Input
                    id="requirement-code"
                    data-testid="requirement-code-input"
                    error={!!errors.requirementCode}
                    {...register("requirementCode")}
                  />
                  {errors.requirementCode && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.requirementCode.message)}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="requirement-document-type-code"
                    error={!!errors.documentTypeCode}
                    className="mb-2"
                  >
                    {t("requirement.fields.documentTypeCode")}
                  </Label>
                  {/* PRD1042-1794 Block 10 — picked from the tenant's registry, not typed. The
                      fulfilment service matches an arriving document against this exact code, so a
                      code that is not in the registry creates a requirement nothing can fulfil. */}
                  {isDocumentTypesError ? (
                    <p
                      data-testid="requirement-document-types-error"
                      className="text-sm text-destructive"
                    >
                      {t("requirement.documentTypesUnavailable")}
                    </p>
                  ) : isDocumentTypesLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : documentTypeOptions.length === 0 ? (
                    <p
                      data-testid="requirement-no-document-types"
                      className="text-sm text-muted-foreground"
                    >
                      {t("requirement.noDocumentTypes")}
                    </p>
                  ) : (
                    <Controller
                      control={control}
                      name="documentTypeCode"
                      render={({ field }) => (
                        <SelectField
                          id="requirement-document-type-code"
                          data-testid="requirement-document-type-code-select"
                          value={field.value}
                          onValueChange={code => {
                            field.onChange(code)
                            // The registry holds the canonical name; it stays editable below
                            // because the backend allows a per-requirement name.
                            const picked = documentTypes.find(
                              type => type.type_code === code
                            )
                            if (picked) {
                              setValue("documentTypeName", picked.type_name, {
                                shouldValidate: true,
                              })
                            }
                          }}
                          options={documentTypeOptions}
                          placeholder={t("requirement.selectDocumentType")}
                          error={!!errors.documentTypeCode}
                        />
                      )}
                    />
                  )}
                  {errors.documentTypeCode && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.documentTypeCode.message)}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <Label
                htmlFor="requirement-document-type-name"
                error={!!errors.documentTypeName}
                className="mb-2"
              >
                {t("requirement.fields.documentTypeName")}
              </Label>
              <Input
                id="requirement-document-type-name"
                data-testid="requirement-document-type-name-input"
                error={!!errors.documentTypeName}
                {...register("documentTypeName")}
              />
              {errors.documentTypeName && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.documentTypeName.message)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="requirement-description" className="mb-2">
                {t("requirement.fields.description")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("create.fields.optional")}
                </span>
              </Label>
              <Textarea
                id="requirement-description"
                data-testid="requirement-description-input"
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.description.message)}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="requirement-classification"
                error={!!errors.classification}
                className="mb-2"
              >
                {t("requirement.fields.classification")}
              </Label>
              <Controller
                control={control}
                name="classification"
                render={({ field }) => (
                  <SelectField
                    id="requirement-classification"
                    data-testid="requirement-classification-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={CLASSIFICATION_OPTIONS.map(o => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                    error={!!errors.classification}
                  />
                )}
              />
              {errors.classification && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.classification.message)}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-2" error={!!errors.caseTypes}>
                {t("requirement.fields.caseTypes")}
              </Label>
              <Controller
                control={control}
                name="caseTypes"
                render={({ field }) => (
                  <CaseTypeCheckboxGroup
                    value={field.value}
                    onChange={field.onChange}
                    testIdPrefix="requirement"
                  />
                )}
              />
              {errors.caseTypes && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.caseTypes.message)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="requirement-stage" className="mb-2">
                {t("requirement.fields.stageCategorization")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("create.fields.optional")}
                </span>
              </Label>
              <Controller
                control={control}
                name="stageCategorization"
                render={({ field }) => (
                  <SelectField
                    id="requirement-stage"
                    data-testid="requirement-stage-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={STAGE_OPTIONS.map(o => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                    error={!!errors.stageCategorization}
                  />
                )}
              />
              {errors.stageCategorization && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.stageCategorization.message)}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="requirement-document-origin"
                error={!!errors.documentOrigin}
                className="mb-2"
              >
                {t("requirement.fields.documentOrigin")}
              </Label>
              <Controller
                control={control}
                name="documentOrigin"
                render={({ field }) => (
                  <SelectField
                    id="requirement-document-origin"
                    data-testid="requirement-document-origin-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={DOCUMENT_ORIGIN_OPTIONS.map(o => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                    error={!!errors.documentOrigin}
                  />
                )}
              />
              {errors.documentOrigin && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.documentOrigin.message)}
                </p>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="requirement-form-cancel"
              onClick={handleClose}
            >
              {t("create.actions.cancel")}
            </Button>
            <Button
              type="submit"
              data-testid="requirement-form-submit"
              disabled={isPending}
            >
              {isEdit
                ? t("requirement.editSubmit")
                : t("requirement.addSubmit")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export { RequirementSheet }
