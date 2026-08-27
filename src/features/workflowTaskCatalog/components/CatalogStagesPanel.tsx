import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { showApiError } from "@/lib/apiErrorMessage"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { useCatalogPhases } from "@/features/workflowTaskCatalog/hooks/useCatalogPhases"
import {
  useAddCatalogPhase,
  useRemoveCatalogPhase,
  useReorderCatalogPhases,
  useUpdateCatalogPhase,
} from "@/features/workflowTaskCatalog/hooks/useCatalogPhaseMutations"
import type { CataloguePhase } from "@/features/workflowTaskCatalog/api/schema"

type Props = {
  catalogId: string
  versionId: string
  canEdit: boolean
}

// PRD1042-1892 item 2 — "the Bank Admin defines the stages of a catalogue — a name and a position
// for each — and then puts tasks into them. The stages belong to the catalogue, not to the
// platform." This panel is that surface, and it is the reason task authoring can work at all:
// task_service.py refuses a defined/supplement task with no phase_id, so with no stage on the
// catalogue there is nothing valid to submit.
//
// The wire calls these phases and the CR calls them stages; the labels say stage, the payloads say
// phase (enums-and-constants.md §2 — the wire name is never re-spelled).
export function CatalogStagesPanel({ catalogId, versionId, canEdit }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const {
    data: phases = [],
    isError,
    error,
  } = useCatalogPhases(catalogId, versionId)

  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [pendingRemoval, setPendingRemoval] = useState<{
    phase: CataloguePhase
    taskCount: number
  } | null>(null)

  const scope = { catalogId, versionId }
  const addPhase = useAddCatalogPhase(scope)
  const updatePhase = useUpdateCatalogPhase(scope)
  const reorderPhases = useReorderCatalogPhases(scope)
  const removePhase = useRemoveCatalogPhase(scope)

  const ordered = [...phases].sort((a, b) => a.position - b.position)

  // The button stays enabled and reports why it refused, rather than going grey with no
  // explanation — a disabled control tells the user nothing about what is missing.
  function submitNew() {
    if (addPhase.isPending) {
      toast.info(t("detail.stages.addBusy"))
      return
    }
    const name = newName.trim()
    if (!name) {
      toast.info(t("detail.stages.addNeedsName"))
      return
    }
    // `position` is omitted deliberately — the BE appends at max+1, which is what "add a stage"
    // means here. Computing it client-side would race a concurrent add.
    addPhase.mutate(
      { name },
      {
        onSuccess: () => setNewName(""),
        onError: err => showApiError(err, t),
      }
    )
  }

  function submitRename(phase: CataloguePhase) {
    const name = editingName.trim()
    if (!name || name === phase.name) {
      setEditingId(null)
      return
    }
    updatePhase.mutate(
      { phaseId: phase.id, body: { name } },
      {
        onSuccess: () => setEditingId(null),
        onError: err => showApiError(err, t),
      }
    )
  }

  // Reorder sends the whole permutation rather than one position: the BE keeps positions
  // contiguous, so moving one row is expressed as the new full order.
  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= ordered.length) return
    const ids = ordered.map(p => p.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderPhases.mutate(ids, { onError: err => showApiError(err, t) })
  }

  // Two-step by contract: the first call removes nothing and reports how many tasks the stage
  // holds, so the confirmation can name the count instead of guessing at the consequence.
  function requestRemoval(phase: CataloguePhase) {
    removePhase.mutate(
      { phaseId: phase.id, confirm: false },
      {
        onSuccess: result => {
          if (!result.removed && result.tasks_in_phase > 0) {
            setPendingRemoval({ phase, taskCount: result.tasks_in_phase })
          }
        },
        onError: err => showApiError(err, t),
      }
    )
  }

  function confirmRemoval() {
    if (!pendingRemoval) return
    removePhase.mutate(
      { phaseId: pendingRemoval.phase.id, confirm: true },
      {
        onSuccess: () => setPendingRemoval(null),
        onError: err => {
          showApiError(err, t)
          setPendingRemoval(null)
        },
      }
    )
  }

  return (
    <div
      className="border border-border rounded-xl p-4 flex flex-col gap-3"
      data-testid="catalog-stages-panel"
    >
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {t("detail.stages.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("detail.stages.caption")}
        </p>
      </div>

      {isError && (
        <p
          className="text-sm text-destructive"
          data-testid="catalog-stages-error"
        >
          {resolveApiErrorMessage(error, t)}
        </p>
      )}

      {!isError && ordered.length === 0 && (
        <p
          className="text-sm text-muted-foreground"
          data-testid="catalog-stages-empty"
        >
          {t("detail.stages.empty")}
        </p>
      )}

      {ordered.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {ordered.map((phase, index) => (
            <li
              key={phase.id}
              className="flex items-center gap-2"
              data-testid={`catalog-stage-row-${phase.id}`}
            >
              <span className="text-sm text-muted-foreground w-6 tabular-nums">
                {phase.position}
              </span>
              {editingId === phase.id ? (
                <>
                  <Input
                    value={editingName}
                    maxLength={80}
                    onChange={e => setEditingName(e.target.value)}
                    data-testid={`catalog-stage-rename-input-${phase.id}`}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => submitRename(phase)}
                    disabled={updatePhase.isPending}
                    data-testid={`catalog-stage-rename-save-${phase.id}`}
                  >
                    {t("detail.stages.save")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    data-testid={`catalog-stage-rename-cancel-${phase.id}`}
                  >
                    <X size={16} />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-foreground flex-1">
                    {phase.name}
                  </span>
                  {canEdit && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={index === 0 || reorderPhases.isPending}
                        onClick={() => move(index, -1)}
                        aria-label={t("detail.stages.moveUp")}
                        data-testid={`catalog-stage-up-${phase.id}`}
                      >
                        <ChevronUp size={16} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={
                          index === ordered.length - 1 ||
                          reorderPhases.isPending
                        }
                        onClick={() => move(index, 1)}
                        aria-label={t("detail.stages.moveDown")}
                        data-testid={`catalog-stage-down-${phase.id}`}
                      >
                        <ChevronDown size={16} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(phase.id)
                          setEditingName(phase.name)
                        }}
                        aria-label={t("detail.stages.rename")}
                        data-testid={`catalog-stage-rename-${phase.id}`}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={removePhase.isPending}
                        onClick={() => requestRemoval(phase)}
                        aria-label={t("detail.stages.remove")}
                        data-testid={`catalog-stage-remove-${phase.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      {canEdit && (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            maxLength={80}
            placeholder={t("detail.stages.namePlaceholder")}
            onChange={e => setNewName(e.target.value)}
            data-testid="catalog-stage-new-input"
          />
          <Button
            type="button"
            variant="outline"
            onClick={submitNew}
            data-testid="catalog-stage-add-button"
          >
            <Plus size={16} />
            {t("detail.stages.addButton")}
          </Button>
        </div>
      )}

      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={open => {
          if (!open) setPendingRemoval(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("detail.stages.removeConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.stages.removeConfirm.description", {
                name: pendingRemoval?.phase.name ?? "",
                count: pendingRemoval?.taskCount ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="catalog-stage-remove-cancel">
              {t("detail.stages.removeConfirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoval}
              data-testid="catalog-stage-remove-confirm"
            >
              {t("detail.stages.removeConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
