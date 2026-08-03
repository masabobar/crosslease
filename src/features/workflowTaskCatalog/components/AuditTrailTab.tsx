import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TableEmptyState } from "@/components/ui/empty"
import { formatDateTime } from "@/lib/formatters"
import { ApiError } from "@/lib/api"
import { useWorkflowTaskCatalogAuditTrail } from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogAuditTrail"
import { deriveFieldDelta } from "@/features/workflowTaskCatalog/utils"
import type { TaskFieldChange } from "@/features/workflowTaskCatalog/utils"

const SKELETON_ROWS = 4

// The task fields an audit payload can carry, mapped onto the labels the task sheet already
// uses so the delta never shows a raw wire field name. `enumBlock` names the value→label block
// for the fields whose value is itself a wire enum — per enums-and-constants.md §5 a wire value
// is never rendered to the user. Fields absent from this map fall back to the raw name.
const AUDIT_FIELDS: Record<string, { labelKey: string; enumBlock?: string }> = {
  task_name: { labelKey: "taskName" },
  task_description: { labelKey: "description" },
  category: { labelKey: "category", enumBlock: "categories" },
  responsible_role: {
    labelKey: "responsibleRole",
    enumBlock: "responsibleRoles",
  },
  is_mandatory: { labelKey: "mandatory" },
  weight: { labelKey: "weight" },
  display_order: { labelKey: "displayOrder" },
  stage_categorization: { labelKey: "stage", enumBlock: "stages" },
  applicable_process_contexts: {
    labelKey: "processContexts",
    enumBlock: "processContexts",
  },
  is_active: { labelKey: "active" },
  conditional_trigger: { labelKey: "conditionalTrigger" },
  // US 15.7 requires the ref + pinning delta to be auditable. The ref is a UUID with no name on
  // the audit payload, so it renders as the raw id — the requirement code is only resolvable
  // against the tenant's active set, which an audit row deliberately does not re-fetch.
  doc_requirement_ref: { labelKey: "documentRequirement" },
  doc_requirement_pin_mode: {
    labelKey: "pinningBehavior",
    enumBlock: "pinModes",
  },
}

function FieldDelta({
  changes,
  emptyLabel,
  renderLabel,
  renderValue,
}: {
  changes: TaskFieldChange[]
  emptyLabel: string
  renderLabel: (field: string) => string
  renderValue: (field: string, value: unknown) => string
}) {
  if (changes.length === 0) return <>{emptyLabel}</>

  return (
    <span className="flex flex-col gap-0.5">
      {changes.map(change => (
        <span key={change.field}>
          <span className="text-muted-foreground">
            {renderLabel(change.field)}:{" "}
          </span>
          {renderValue(change.field, change.before)} →{" "}
          {renderValue(change.field, change.after)}
        </span>
      ))}
    </span>
  )
}

type Props = {
  catalogId: string
}

function AuditTrailTab({ catalogId }: Props) {
  const { t } = useTranslation(["workflowTaskCatalog", "users"])
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWorkflowTaskCatalogAuditTrail(catalogId)

  const events = data?.pages.flatMap(page => page.events) ?? []
  const emptyDelta = t("detail.auditTrail.noDelta")

  // Every lookup below is dynamic — keyed by a wire field name or wire enum value — which the
  // strict i18next key typing cannot express, so each cast names a representative real key. It
  // is the same escape hatch the `errors.<CODE>` lookups use.
  function fieldLabel(field: string): string {
    const known = AUDIT_FIELDS[field]
    if (!known) return field
    return t(
      `detail.taskSheet.fields.${known.labelKey}` as "detail.taskSheet.fields.taskName"
    )
  }

  function formatValue(field: string, value: unknown): string {
    if (value === null || value === undefined) return emptyDelta
    if (typeof value === "boolean") {
      return value
        ? t("detail.taskDefinitions.yes")
        : t("detail.taskDefinitions.no")
    }
    if (Array.isArray(value)) {
      return value.map(item => enumLabel(field, item)).join(", ")
    }
    if (typeof value === "object") return JSON.stringify(value)
    return enumLabel(field, value)
  }

  function enumLabel(field: string, value: unknown): string {
    const raw = String(value)
    const block = AUDIT_FIELDS[field]?.enumBlock
    if (!block) return raw
    return t(
      `detail.taskSheet.${block}.${raw}` as "detail.taskSheet.categories.legal",
      { defaultValue: raw }
    )
  }

  if (isError) {
    return (
      <p
        data-testid="audit-trail-error"
        className="text-sm text-destructive py-8 text-center"
      >
        {error instanceof ApiError
          ? t(`errors.${error.code}` as "errors.generic", {
              defaultValue: t("errors.generic"),
            })
          : t("errors.generic")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3" data-testid="audit-trail-tab">
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("detail.auditTrail.columns.timestamp")}</TableHead>
              <TableHead>{t("detail.auditTrail.columns.actor")}</TableHead>
              <TableHead>{t("detail.auditTrail.columns.action")}</TableHead>
              <TableHead>{t("detail.auditTrail.columns.fieldDelta")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }, (_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading &&
              events.map(event => (
                <TableRow
                  key={event.id}
                  data-testid={`audit-trail-row-${event.id}`}
                >
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(event.recorded_at)}
                  </TableCell>
                  <TableCell>
                    {/* The route now fills actor_display server-side from the actor's current
                        name. It stays null for an actor the resolver cannot look up — a
                        non-UUID system actor, or a deleted user — so the raw id remains the
                        fallback, same as the core audit table. */}
                    <p className="font-medium text-foreground">
                      {event.actor_display ?? event.actor_id}
                    </p>
                    {event.actor_role_at_time && (
                      <p className="text-xs text-muted-foreground">
                        {t(
                          `users:roles.${event.actor_role_at_time}` as "users:roles.system_admin",
                          { defaultValue: event.actor_role_at_time }
                        )}
                      </p>
                    )}
                  </TableCell>
                  {/* event_type is a free-form string with no enum, so this is the same
                      dynamic-lookup-with-fallback shape the error rule uses: a known value gets
                      a translation, an unknown one renders as sent rather than as a missing key.
                      Wire values are dotted (`wtc_catalog.task_added`), which i18next resolves
                      through the nested eventTypes block. */}
                  <TableCell>
                    {t(
                      `detail.auditTrail.eventTypes.${event.event_type}` as "detail.auditTrail.eventTypes.wtc_catalog.created",
                      { defaultValue: event.event_type }
                    )}
                  </TableCell>
                  <TableCell className="max-w-lg break-words">
                    <FieldDelta
                      changes={deriveFieldDelta(event)}
                      emptyLabel={emptyDelta}
                      renderLabel={fieldLabel}
                      renderValue={formatValue}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && events.length === 0 && (
          <TableEmptyState
            title={t("detail.auditTrail.emptyState.title")}
            description={t("detail.auditTrail.emptyState.description")}
          />
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            data-testid="audit-trail-load-more"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {t("detail.auditTrail.loadMore")}
          </Button>
        </div>
      )}
    </div>
  )
}

export { AuditTrailTab }
