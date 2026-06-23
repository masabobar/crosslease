import type { WizardStep } from "@/features/tenants/components/WizardStepper"
import type { CreateTenantForm } from "@/features/tenants/api/schema"

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

type WizardDraft = {
  step: WizardStep
  formValues: CreateTenantForm
  savedAt: string
}

function draftKey(userId: string): string {
  return `tenant_wizard_draft_${userId}`
}

export function loadWizardDraft(userId: string): WizardDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    if (!raw) return null
    const draft = JSON.parse(raw) as WizardDraft
    if (Date.now() - new Date(draft.savedAt).getTime() > DRAFT_TTL_MS) {
      localStorage.removeItem(draftKey(userId))
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function saveWizardDraft(
  userId: string,
  step: WizardStep,
  formValues: CreateTenantForm
): void {
  try {
    const draft: WizardDraft = {
      step,
      formValues,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(draftKey(userId), JSON.stringify(draft))
  } catch {
    // localStorage full — silently ignore
  }
}

export function clearWizardDraft(userId: string): void {
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {
    // localStorage may be unavailable (private browsing, storage quota)
  }
}
