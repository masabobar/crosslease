import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { FieldRequirement, Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import {
  useAssessmentCatalogue,
  useCreateAssessment,
} from "@/features/partners/hooks/useAssessments"
import type { AssessmentAttribute } from "@/features/partners/api/assessmentSchema"

// Free text on the wire, so this is a rendering hint rather than a closed set: anything else
// falls back to a text input, which accepts whatever the agency actually reported.
const NUMERIC_VALUE_TYPE = "number"

type ValueDraft = { value: string; noValue: boolean }

/**
 * Record one assessment against a partner.
 *
 * ── THE CATALOGUE BUILDS THE FORM ──────────────────────────────────────────────────────────────
 * There is no fixed field set. Choosing a source type — CREFO, Schufa, an internal rating — is
 * what produces the inputs, because each source defines its own attributes and the create request
 * carries `attribute_id` + value rows rather than named columns. A source marked `free_text_only`
 * has no attributes at all: the note is the report.
 *
 * ── "NO VALUE SUPPLIED" IS AN ANSWER ───────────────────────────────────────────────────────────
 * `no_value_supplied` is a field of its own on the wire, not the absence of a value. "The agency
 * returned no score" and "nobody filled this in" are different facts, and the tick is how the
 * first one gets recorded.
 */
export function AddAssessmentDialog({
  partnerId,
  onOpenChange,
}: {
  partnerId: string
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("partners")
  const { t: tCommon } = useTranslation("common")
  const catalogue = useAssessmentCatalogue()
  const create = useCreateAssessment()

  const [sourceTypeId, setSourceTypeId] = useState("")
  const [reportDate, setReportDate] = useState("")
  const [sourceReference, setSourceReference] = useState("")
  const [contextNote, setContextNote] = useState("")
  const [values, setValues] = useState<Record<string, ValueDraft>>({})

  const sourceTypes = catalogue.data?.source_types ?? []
  const chosen = sourceTypes.find(type => type.id === sourceTypeId)
  const attributes: AssessmentAttribute[] = chosen?.attributes ?? []

  function draftFor(attributeId: string): ValueDraft {
    return values[attributeId] ?? { value: "", noValue: false }
  }

  function setDraft(attributeId: string, next: Partial<ValueDraft>) {
    setValues(current => ({
      ...current,
      [attributeId]: { ...draftFor(attributeId), ...next },
    }))
  }

  function submit() {
    create.mutate(
      {
        partnerId,
        source_type_id: sourceTypeId,
        report_date: reportDate,
        source_reference:
          sourceReference.trim() === "" ? null : sourceReference.trim(),
        context_note: contextNote.trim() === "" ? null : contextNote.trim(),
        // Only the attributes actually answered are sent. An untouched one is not "no value
        // supplied" — that is a claim about the source, and only the tick makes it.
        values: attributes
          .map(attribute => {
            const draft = draftFor(attribute.id)
            if (draft.noValue) {
              return {
                attribute_id: attribute.id,
                no_value_supplied: true,
                value_number: null,
                value_text: null,
              }
            }
            if (draft.value.trim() === "") return null
            const isNumeric = attribute.value_type === NUMERIC_VALUE_TYPE
            return {
              attribute_id: attribute.id,
              no_value_supplied: false,
              value_number: isNumeric ? draft.value.trim() : null,
              value_text: isNumeric ? null : draft.value.trim(),
            }
          })
          .filter(value => value !== null),
      },
      {
        onSuccess: () => {
          toast.success(t("assessment.added"))
          onOpenChange(false)
        },
        onError: error => showApiError(error, t),
      }
    )
  }

  const canSubmit =
    sourceTypeId !== "" && reportDate !== "" && !create.isPending

  return (
    <DialogModal open size="lg" onOpenChange={onOpenChange}>
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>{t("assessment.addTitle")}</DialogTitle>
        </DialogHeader>
      </div>

      <div className="max-h-[60vh] overflow-y-auto border-t px-4 py-4">
        {catalogue.isLoading && <Skeleton className="h-40 w-full" />}

        {catalogue.isError && (
          <p
            className="text-sm text-destructive"
            data-testid="assessment-catalogue-error"
          >
            {resolveApiErrorMessage(catalogue.error, t)}
          </p>
        )}

        {!catalogue.isLoading && !catalogue.isError && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="assessment-source" className="mb-1.5">
                  {t("assessment.fields.sourceType")}
                  <FieldRequirement
                    requirement="required"
                    optionalLabel={tCommon("form.optional")}
                  />
                </Label>
                <SelectField
                  id="assessment-source"
                  data-testid="assessment-source-select"
                  value={sourceTypeId}
                  placeholder={t("assessment.fields.sourcePlaceholder")}
                  onValueChange={next => {
                    setSourceTypeId(next)
                    // The attributes belong to the source, so the answers cannot outlive a change
                    // of source — keeping them would post one source's values under another's ids.
                    setValues({})
                  }}
                  options={sourceTypes.map(type => ({
                    value: type.id,
                    label: type.name,
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="assessment-date" className="mb-1.5">
                  {t("assessment.fields.reportDate")}
                  <FieldRequirement
                    requirement="required"
                    optionalLabel={tCommon("form.optional")}
                  />
                </Label>
                <Input
                  id="assessment-date"
                  type="date"
                  value={reportDate}
                  data-testid="assessment-date-input"
                  onChange={event => setReportDate(event.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="assessment-reference" className="mb-1.5">
                  {t("assessment.fields.sourceReference")}
                  <FieldRequirement
                    requirement="optional"
                    optionalLabel={tCommon("form.optional")}
                  />
                </Label>
                <Input
                  id="assessment-reference"
                  value={sourceReference}
                  data-testid="assessment-reference-input"
                  onChange={event => setSourceReference(event.target.value)}
                />
              </div>
            </div>

            {/* Built from the chosen source. A `free_text_only` source has none — the note below
                is the whole report — and saying so beats an empty panel. */}
            {chosen !== undefined && attributes.length > 0 && (
              <div className="rounded-lg border p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("assessment.valuesHeading", { source: chosen.name })}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {attributes.map(attribute => {
                    const draft = draftFor(attribute.id)
                    return (
                      <div key={attribute.id}>
                        <Label
                          htmlFor={`assessment-attr-${attribute.id}`}
                          className="mb-1.5"
                        >
                          {attribute.name}
                          {attribute.value_range !== null && (
                            <span className="font-normal text-muted-foreground">
                              ({attribute.value_range})
                            </span>
                          )}
                        </Label>
                        <Input
                          id={`assessment-attr-${attribute.id}`}
                          value={draft.value}
                          disabled={draft.noValue}
                          inputMode={
                            attribute.value_type === NUMERIC_VALUE_TYPE
                              ? "decimal"
                              : "text"
                          }
                          placeholder={attribute.scale_hint ?? undefined}
                          data-testid={`assessment-attr-${attribute.code}`}
                          onChange={event =>
                            setDraft(attribute.id, {
                              value: event.target.value,
                            })
                          }
                        />
                        <label className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={draft.noValue}
                            data-testid={`assessment-attr-none-${attribute.code}`}
                            onCheckedChange={checked =>
                              setDraft(attribute.id, {
                                noValue: checked === true,
                                value: checked === true ? "" : draft.value,
                              })
                            }
                          />
                          {t("assessment.noValueSupplied")}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {chosen?.free_text_only === true && (
              <p
                className="text-sm text-muted-foreground"
                data-testid="assessment-free-text-only"
              >
                {t("assessment.freeTextOnly")}
              </p>
            )}

            <div>
              <Label htmlFor="assessment-note" className="mb-1.5">
                {t("assessment.fields.contextNote")}
                <FieldRequirement
                  requirement="optional"
                  optionalLabel={tCommon("form.optional")}
                />
              </Label>
              <Textarea
                id="assessment-note"
                rows={3}
                value={contextNote}
                data-testid="assessment-note-input"
                onChange={event => setContextNote(event.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          data-testid="assessment-cancel-button"
          onClick={() => onOpenChange(false)}
        >
          {t("assessment.cancelEntry")}
        </Button>
        <Button
          type="button"
          disabled={!canSubmit}
          data-testid="assessment-save-button"
          onClick={submit}
        >
          {t("assessment.save")}
        </Button>
      </div>
    </DialogModal>
  )
}
