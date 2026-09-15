import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { showApiError } from "@/lib/apiErrorMessage"
import { useUsers } from "@/features/users/hooks/useUsers"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useAssignCase } from "@/features/cases/hooks/useAssignCase"
import { UserStatusSchema } from "@/features/users/api/schema"
import type { CaseResponse } from "@/features/cases/api/schema"

// The dummy's panel shows seven people without scrolling. Asking for more would make the menu a
// list to scroll rather than one to read — the search box is how a larger tenant is reached.
const ASSIGNEE_PAGE_SIZE = 10

type Props = {
  caseRecord: CaseResponse
}

/**
 * `Add assignee ▾` — hand the case to a named person.
 *
 * ── THE PLATFORM NEVER PICKS ───────────────────────────────────────────────────────────────────
 * `POST /cases/{id}/assign` describes itself as *"Manual assignment within a role. The platform
 * never picks the person."* That is why there is no auto-assign, no round-robin and no "assign to
 * the role" affordance here: every assignment names somebody, and the menu's whole job is to make
 * naming them quick.
 *
 * ── WHY `Assign to me` IS A SEPARATE ROW AND NOT JUST THE CURRENT USER IN THE LIST ──────────────
 * It is the one assignment a person makes about themselves, it is by far the most common, and it
 * must not depend on the search box having been typed into. Keeping it above the separator means it
 * is always the first thing under the cursor. The current user is filtered out of the list below so
 * the same person cannot appear twice with two different affordances.
 *
 * ── WHO IS OFFERED ─────────────────────────────────────────────────────────────────────────────
 * Active users only. An invited-but-not-activated or suspended account cannot act on a case, so
 * offering it would create an assignment that silently parks the case with nobody. The role is
 * shown beside each name because the endpoint assigns *within* a role — the reader has to be able
 * to see that they are staying inside it.
 */
export function CaseAssigneeMenu({ caseRecord }: Props) {
  const { t } = useTranslation("cases")
  // The role labels live in the users namespace and are not duplicated into cases just to be
  // read here — one source of truth per enum (`enums-and-constants.md` §3).
  const { t: tUsers } = useTranslation("users")
  const [search, setSearch] = useState("")
  const { data: currentUser } = useCurrentUser()
  const assign = useAssignCase(caseRecord.id)

  const users = useUsers({
    search,
    status: [UserStatusSchema.enum.active],
    per_page: ASSIGNEE_PAGE_SIZE,
  })

  const candidates = (users.data?.users ?? []).filter(
    user => user.id !== currentUser?.id
  )

  function assignTo(userId: string, name: string) {
    assign.mutate(userId, {
      onSuccess: () => toast.success(t("assignee.assigned", { name })),
      onError: error => showApiError(error, t),
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "outline", size: "sm" })}
        data-testid="case-assignee-trigger"
        disabled={assign.isPending}
      >
        <UserPlus size={16} />
        {t("assignee.trigger")}
        <ChevronDown size={16} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-0">
        <div className="p-2">
          {/* NOTE: the search box is deliberately not a DropdownMenuItem — typing in it must not
              select or close the menu, which is exactly what an item's keyboard handling does. */}
          <Input
            autoFocus
            value={search}
            placeholder={t("assignee.searchPlaceholder")}
            data-testid="case-assignee-search"
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        {currentUser && (
          <DropdownMenuItem
            data-testid="case-assignee-assign-to-me"
            onClick={() =>
              assignTo(
                currentUser.id,
                `${currentUser.first_name} ${currentUser.last_name}`
              )
            }
          >
            <UserPlus size={16} />
            {t("assignee.assignToMe")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {users.isLoading && (
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        )}

        {users.isError && (
          <p
            className="p-3 text-sm text-destructive"
            data-testid="case-assignee-error"
          >
            {t("assignee.loadFailed")}
          </p>
        )}

        {!users.isLoading && !users.isError && candidates.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">
            {t("assignee.noMatches")}
          </p>
        )}

        {candidates.map(user => {
          const name = `${user.first_name} ${user.last_name}`
          return (
            <DropdownMenuItem
              key={user.id}
              data-testid={`case-assignee-option-${user.id}`}
              onClick={() => assignTo(user.id, name)}
            >
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground">
                · {tUsers(`roles.${user.role}`)}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
