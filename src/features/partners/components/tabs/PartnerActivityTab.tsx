import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/formatters"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import {
  useAddPartnerComment,
  usePartnerActivity,
  usePartnerComments,
} from "@/features/partners/hooks/usePartnerActivity"

/**
 * Partner detail → **Activity**.
 *
 * Two strands, side by side: what people wrote, and what the system recorded.
 *
 * ── THE COMMENTS HERE ARE BANK-ONLY ────────────────────────────────────────────────────────────
 * A case's thread is the bank↔leasing-company channel and carries a visibility switch. A party's
 * does not: the leasing company has no view of the bank's partner register, so there is no second
 * audience to choose between. The absence of the switch is the rule, and the tag says so rather
 * than leaving a reader to assume the wrong one.
 *
 * ── THE TRAIL IS NOT EDITABLE, AND SAYS SO ─────────────────────────────────────────────────────
 * Every row is system-written and carries who did it, in which role at the time, and the value
 * before and after. That is the point of it — a partner's identifiers and bank accounts change,
 * and the record of who changed them is what makes the change reviewable.
 */
export function PartnerActivityTab({ partnerId }: { partnerId: string }) {
  const { t } = useTranslation("partners")
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState("")

  // Unconstrained on the wire, so an unrecognised role falls back to the raw value rather than
  // to a blank — a role nobody has labelled yet still has to be readable.
  const roleLabel = (role: string) =>
    t(`partnerActivity.roles.${role}` as "partnerActivity.roles.front_office", {
      defaultValue: role,
    })

  const activity = usePartnerActivity(partnerId, page)
  const comments = usePartnerComments(partnerId)
  const addComment = useAddPartnerComment()

  const entries = activity.data?.activity ?? []
  const threads = (comments.data?.items ?? []).filter(item => !item.is_deleted)
  const totalPages = Math.max(1, activity.data?.total_pages ?? 1)

  function submit() {
    const body = draft.trim()
    if (body === "") return
    addComment.mutate(
      { partnerId, body },
      {
        onSuccess: () => {
          setDraft("")
          toast.success(t("partnerActivity.commentAdded"))
        },
        onError: error => showApiError(error, t),
      }
    )
  }

  return (
    <div
      className="grid gap-6 lg:grid-cols-2"
      data-testid="partner-activity-tab"
    >
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">
            {t("partnerActivity.comments")}
          </h3>
          <Badge variant="secondary" className="font-normal">
            <Lock size={12} />
            {t("partnerActivity.bankOnly")}
          </Badge>
        </div>

        <div className="rounded-lg border p-3">
          <Textarea
            rows={3}
            value={draft}
            data-testid="partner-comment-input"
            placeholder={t("partnerActivity.placeholder")}
            onChange={event => setDraft(event.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDraft("")}
            >
              {t("partnerActivity.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={draft.trim() === "" || addComment.isPending}
              data-testid="partner-comment-add"
              onClick={submit}
            >
              {t("partnerActivity.add")}
            </Button>
          </div>
        </div>

        {comments.isLoading && <Skeleton className="mt-3 h-24 w-full" />}

        {comments.isError && (
          <p
            className="mt-3 text-sm text-destructive"
            data-testid="partner-comments-error"
          >
            {resolveApiErrorMessage(comments.error, t)}
          </p>
        )}

        {!comments.isLoading && !comments.isError && threads.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("partnerActivity.noComments")}
          </p>
        )}

        <ul className="mt-3 flex flex-col gap-3">
          {threads.map(comment => (
            <li
              key={comment.id}
              className="border-t pt-3"
              data-testid={`partner-comment-${comment.id}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {comment.author_display ?? comment.author_id}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {roleLabel(comment.author_role)}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(comment.created_at)}
                  {comment.edited_at !== null &&
                    ` · ${t("partnerActivity.edited")}`}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">
            {t("partnerActivity.trail")}
          </h3>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("partnerActivity.notEditable")}
          </span>
        </div>

        {activity.isLoading && <Skeleton className="h-64 w-full" />}

        {activity.isError && (
          <p
            className="text-sm text-destructive"
            data-testid="partner-activity-error"
          >
            {resolveApiErrorMessage(activity.error, t)}
          </p>
        )}

        {!activity.isLoading && !activity.isError && entries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("partnerActivity.noActivity")}
          </p>
        )}

        <ol className="flex flex-col">
          {entries.map(entry => (
            <li
              key={entry.id}
              className="border-b py-3 last:border-b-0"
              data-testid={`partner-activity-${entry.id}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {entry.actor_display ?? entry.actor_id}
                  {/* The role AT THE TIME, not the role the actor holds today — someone who has
                      since changed desks must still read as who they were when they acted. */}
                  {entry.actor_role_at_time !== null && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {roleLabel(entry.actor_role_at_time)}
                    </span>
                  )}
                  {entry.is_system && (
                    <Badge variant="secondary" className="ml-2 font-normal">
                      {t("partnerActivity.system")}
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(entry.recorded_at)}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  `partnerActivity.events.${entry.event_type}` as "partnerActivity.events.partner_created",
                  { defaultValue: entry.event_type }
                )}
                {entry.entity_display !== null && ` · ${entry.entity_display}`}
              </p>

              {/* Before → after is the whole value of a trail on a party record: an identifier or
                  a bank account changed, and this is what it was. */}
              {entry.changes.length > 0 && (
                <ul className="mt-1 flex flex-col gap-0.5">
                  {entry.changes.map((change, index) => (
                    <li
                      key={`${entry.id}-${change.field}-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      <span className="font-medium">{change.field}</span>{" "}
                      {change.masked ? (
                        // Redacted on the way out. Rendering it as an empty value would read as
                        // "cleared", which is a different fact about the record.
                        <span className="italic">
                          {t("partnerActivity.masked")}
                        </span>
                      ) : (
                        <>
                          <span className="line-through">
                            {change.before ?? "—"}
                          </span>{" "}
                          →{" "}
                          <span className="font-medium">
                            {change.after ?? "—"}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {entry.reason !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.reason}
                </p>
              )}
            </li>
          ))}
        </ol>

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={page === 1}
              data-testid="partner-activity-prev"
              onClick={() => setPage(current => Math.max(1, current - 1))}
            >
              {t("partnerActivity.previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("partnerActivity.pageOf", { page, total: totalPages })}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={page === totalPages}
              data-testid="partner-activity-next"
              onClick={() =>
                setPage(current => Math.min(totalPages, current + 1))
              }
            >
              {t("partnerActivity.next")}
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
