import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDateTime, formatEventType } from "@/lib/formatters"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { getCaseActivityExportUrl } from "@/features/cases/api/casesApi"
import {
  CASE_ACTIVITY_PER_PAGE,
  useAddCaseComment,
  useCaseActivity,
  useCaseComments,
} from "@/features/cases/hooks/useCaseActivity"

type Props = { caseId: string }

/**
 * The case workspace's **Activity** tab — US 1.28, "follow what happened on the case".
 *
 * ── ORDERED BY `audit_seq`, NOT BY TIME ────────────────────────────────────────────────────────
 * The backend orders on the audit sequence and that ordering is preserved as given. Two events can
 * share a timestamp; a sequence cannot tie, so re-sorting these rows by `recorded_at` would be able
 * to invert two events that happened in a known order.
 *
 * ── WHAT IS SHOWN, AND WHAT IS DELIBERATELY NOT ────────────────────────────────────────────────
 * `old_data` and `new_data` are untyped objects — the before and after of whatever changed — so
 * they are not read by key and not rendered. `changed_fields` names what moved, which is the part
 * that can be shown truthfully. A diff viewer over an undeclared shape would be guesswork.
 *
 * `actor_role_at_time` is rendered rather than the actor's current role: the trail records the
 * authority someone had when they acted, which is the whole point of keeping it.
 */
export function CaseActivityPanel({ caseId }: Props) {
  const { t } = useTranslation("cases")
  const [page, setPage] = useState(1)
  const activity = useCaseActivity(caseId, page)
  const comments = useCaseComments(caseId)
  const addComment = useAddCaseComment()
  const [draft, setDraft] = useState("")

  return (
    <div className="flex flex-col gap-6" data-testid="case-activity-panel">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{t("activity.title")}</h3>
          {/* A plain link: the browser handles the download, and cookie auth makes a top-level
              navigation authenticated — the same pattern as the LC portal's document download. */}
          <a
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href={getCaseActivityExportUrl(caseId)}
            target="_blank"
            rel="noreferrer"
            data-testid="case-activity-export"
          >
            {t("activity.exportCsv")}
          </a>
        </div>

        {activity.isLoading && <Skeleton className="h-48 w-full" />}

        {activity.isError && (
          <p
            className="text-sm text-destructive"
            data-testid="case-activity-error"
          >
            {resolveApiErrorMessage(activity.error, t)}
          </p>
        )}

        {activity.data !== undefined && activity.data.activity.length === 0 && (
          <p
            className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
            data-testid="case-activity-empty"
          >
            {t("activity.empty")}
          </p>
        )}

        <ol className="flex flex-col gap-2">
          {(activity.data?.activity ?? []).map(item => (
            <li
              key={item.id}
              className="rounded-lg border px-4 py-3 text-sm"
              data-testid={`case-activity-row-${item.audit_seq}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">
                  {formatEventType(item.event_type)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDateTime(item.recorded_at)}
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {item.entity_display ?? item.entity_type}
                {" · "}
                {item.actor_display ?? item.actor_type}
                {/* The role at the time, not the actor's role now. */}
                {item.actor_role_at_time !== null && (
                  <>
                    {" · "}
                    <Badge variant="outline">{item.actor_role_at_time}</Badge>
                  </>
                )}
              </p>

              {/* Named fields only. The before/after payloads are untyped objects and are not
                  rendered — see the note on this component. */}
              {item.changed_fields !== null &&
                item.changed_fields.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("activity.changedFields", {
                      fields: item.changed_fields.join(", "),
                    })}
                  </p>
                )}
            </li>
          ))}
        </ol>

        {activity.data !== undefined && activity.data.total_pages > 1 && (
          <div
            className="mt-3 flex items-center justify-between text-sm"
            data-testid="case-activity-pager"
          >
            <span className="text-muted-foreground">
              {t("activity.pageOf", {
                page: activity.data.page,
                total: activity.data.total_pages,
              })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="case-activity-prev"
                disabled={page <= 1 || activity.isFetching}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {t("activity.previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="case-activity-next"
                disabled={
                  page >= activity.data.total_pages || activity.isFetching
                }
                onClick={() => setPage(p => p + 1)}
              >
                {t("activity.next")}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section data-testid="case-comments">
        <h3 className="mb-3 text-sm font-semibold">
          {t("activity.comments.title", {
            count: comments.data?.total ?? 0,
          })}
        </h3>

        {comments.isLoading && <Skeleton className="h-24 w-full" />}

        {comments.isError && (
          <p
            className="text-sm text-destructive"
            data-testid="case-comments-error"
          >
            {resolveApiErrorMessage(comments.error, t)}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {(comments.data?.items ?? []).map(comment => (
            <div
              key={comment.id}
              className="rounded-lg border px-4 py-3 text-sm"
              data-testid={`case-comment-${comment.id}`}
            >
              <p>{comment.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {/* The role the author held when they wrote it, for the same reason the trail
                    keeps `actor_role_at_time`. */}
                {comment.author_role} · {formatDateTime(comment.created_at)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-start gap-2">
          <Input
            value={draft}
            data-testid="case-comment-input"
            placeholder={t("activity.comments.placeholder")}
            onChange={e => setDraft(e.target.value)}
          />
          <Button
            type="button"
            data-testid="case-comment-submit"
            disabled={addComment.isPending || draft.trim().length === 0}
            onClick={() =>
              addComment.mutate(
                { caseId, body: draft.trim() },
                {
                  onSuccess: () => setDraft(""),
                  onError: err => showApiError(err, t),
                }
              )
            }
          >
            {t("activity.comments.add")}
          </Button>
        </div>
      </section>
    </div>
  )
}

export { CASE_ACTIVITY_PER_PAGE }
