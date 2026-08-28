import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { lcCaseDocuments } from "@/router/paths"
import { CaseTable } from "@/features/cases/components/CaseTable"
import { StartCaseDialog } from "@/features/cases/components/StartCaseDialog"
import { useLcCases } from "@/features/cases/hooks/useLcCases"

// The leasing company's own Proposals surface (PRD1042-1794 / 1917). Lists the LC's raised cases and
// offers "Raise a proposal", which creates a refinancing case (origin=portal, unowned) and drops the
// user on the LC documents page to upload what the bank needs. CaseTable uses the `cases` namespace
// for its case-type/status/empty copy; the page chrome uses the `lc` namespace.
export default function LcProposalsPage() {
  const { t } = useTranslation("lc")
  const navigate = useNavigate()
  const [raiseOpen, setRaiseOpen] = useState(false)

  const { data, isLoading, isError, error } = useLcCases()

  return (
    <div className="p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("proposals.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("proposals.subtitle")}
          </p>
        </div>
        <Button
          data-testid="lc-raise-proposal-button"
          onClick={() => setRaiseOpen(true)}
        >
          <Plus size={16} />
          {t("proposals.raiseButton")}
        </Button>
      </div>

      {raiseOpen && (
        <StartCaseDialog
          onOpenChange={setRaiseOpen}
          redirectTo={lcCaseDocuments}
        />
      )}

      <div className="mt-6">
        {isError && !isLoading && (
          <p
            data-testid="lc-proposals-error"
            className="text-sm text-destructive py-8 text-center"
          >
            {resolveApiErrorMessage(error, t)}
          </p>
        )}
        {!isError && (
          <CaseTable
            rows={data?.items ?? []}
            isLoading={isLoading}
            hasActiveFilters={false}
            onRowClick={id => navigate(lcCaseDocuments(id))}
          />
        )}
      </div>
    </div>
  )
}
