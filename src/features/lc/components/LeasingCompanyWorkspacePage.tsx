import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  FileText,
  BarChart2,
  FolderOpen,
  Send,
  Landmark,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StartCaseDialog } from "@/features/cases/components/StartCaseDialog"
import { PATHS } from "@/router/paths"
import type { WorkspaceSection } from "@/features/lc/types"

export default function LeasingCompanyWorkspacePage() {
  const { t } = useTranslation("lc")
  const [startOpen, setStartOpen] = useState(false)

  const sections: WorkspaceSection[] = [
    {
      key: "requests",
      label: t("workspace.sections.requests"),
      path: PATHS.LC_REQUESTS,
      icon: FileText,
      comingSoon: true,
    },
    {
      key: "status",
      label: t("workspace.sections.status"),
      path: PATHS.LC_STATUS,
      icon: BarChart2,
      comingSoon: true,
    },
    {
      key: "documents",
      label: t("workspace.sections.documents"),
      path: PATHS.LC_DOCUMENTS,
      icon: FolderOpen,
      comingSoon: true,
    },
    {
      key: "proposals",
      label: t("workspace.sections.proposals"),
      path: PATHS.LC_PROPOSALS,
      icon: Send,
    },
    {
      key: "frameworkAgreements",
      label: t("workspace.sections.frameworkAgreements"),
      path: PATHS.LC_FRAMEWORK_AGREEMENTS,
      icon: Landmark,
    },
  ]

  return (
    <div
      data-testid="lc-workspace-page"
      className="flex flex-col gap-6 p-6 max-w-4xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("workspace.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("workspace.subtitle")}
          </p>
        </div>

        {/* The portal's own entry into the wizard. It is here rather than on the bank's case list
            because a portal user cannot read that list at all — and the click dummy is explicit
            that the point of the portal is the leasing company starting the request itself. */}
        <Button
          type="button"
          data-testid="lc-start-request-button"
          onClick={() => setStartOpen(true)}
        >
          <Plus size={16} />
          {t("workspace.startRequest")}
        </Button>
      </div>

      {startOpen && (
        /* The portal lands on the wizard, not on the case detail the bank flow goes to — the
           detail route is closed to a portal user, and the wizard is the point of entry the dummy
           describes. */
        <StartCaseDialog
          onOpenChange={setStartOpen}
          redirectTo={createdId =>
            PATHS.CASE_WIZARD.replace(":caseId", createdId)
          }
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        {sections.map(({ key, label, path, icon: Icon, comingSoon }) => (
          <Link
            key={key}
            to={path}
            data-testid={`lc-workspace-section-${key}`}
            className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-white hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[#dbe9fc]">
              <Icon size={20} className="text-[#1d41a8]" />
            </div>
            <span className="text-sm font-medium text-foreground">{label}</span>
            {comingSoon && (
              <span className="text-xs text-muted-foreground">
                {t("workspace.comingSoon")}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
