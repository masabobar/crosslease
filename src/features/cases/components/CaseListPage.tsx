import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { caseDetail } from "@/router/paths"
import { CaseTable } from "@/features/cases/components/CaseTable"
import { StartCaseDialog } from "@/features/cases/components/StartCaseDialog"
import { useCases } from "@/features/cases/hooks/useCases"
import { CASE_LIST_LIMIT } from "@/features/cases/api/casesApi"
import { CASE_WRITE_ALLOWED_ROLES } from "@/features/cases/types"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"

// Light work-list scoping, mirroring the backend's `mine` / `unassigned` toggles. Kept to a couple
// of buttons on purpose (the ticket asks for a light filter surface); the two are mutually
// exclusive — a case is either mine or unassigned, never asked for both at once.
type CaseScope = "all" | "mine" | "unassigned"

export default function CaseListPage() {
  const { t } = useTranslation("cases")
  const navigate = useNavigate()
  const [scope, setScope] = useState<CaseScope>("all")
  const [startOpen, setStartOpen] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const canStartCase =
    !!currentUser && CASE_WRITE_ALLOWED_ROLES.includes(currentUser.role)

  const { data, isLoading, isError, error } = useCases({
    limit: CASE_LIST_LIMIT,
    ...(scope === "mine" ? { mine: true } : {}),
    ...(scope === "unassigned" ? { unassigned: true } : {}),
  })

  const rows = data?.items ?? []
  const hasActiveFilters = scope !== "all"

  const scopes = [
    { value: "all", label: t("list.filters.all") },
    { value: "mine", label: t("list.filters.mine") },
    { value: "unassigned", label: t("list.filters.unassigned") },
  ] as const satisfies readonly { value: CaseScope; label: string }[]

  return (
    <div className="p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("list.subtitle")}
          </p>
        </div>
        {canStartCase && (
          <Button
            data-testid="start-case-button"
            onClick={() => setStartOpen(true)}
          >
            <Plus size={16} />
            {t("start.button")}
          </Button>
        )}
      </div>

      {startOpen && <StartCaseDialog onOpenChange={setStartOpen} />}

      <div
        className="mt-6 flex items-center gap-2"
        data-testid="case-list-filters"
      >
        {scopes.map(({ value, label }) => (
          <Button
            key={value}
            variant={scope === value ? "default" : "outline"}
            size="sm"
            data-testid={`case-filter-${value}`}
            onClick={() => setScope(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        {isError && !isLoading && (
          <p
            data-testid="case-list-error"
            className="text-sm text-destructive py-8 text-center"
          >
            {resolveApiErrorMessage(error, t)}
          </p>
        )}
        {!isError && (
          <CaseTable
            rows={rows}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onRowClick={id => navigate(caseDetail(id))}
          />
        )}
      </div>
    </div>
  )
}
