import { z } from "zod"
import { ORDERED_STEPS } from "@/features/tenants/components/WizardStepper"
import type { WizardStep } from "@/features/tenants/components/WizardStepper"
import type { CreateTenantForm } from "@/features/tenants/api/schema"

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

type WizardDraft = {
  step: WizardStep
  formValues: CreateTenantForm
  savedAt: string
}

// A draft is written by an earlier session — possibly an earlier deploy — so its shape
// is not guaranteed. `step` drives STEP_FIELDS lookups and ORDERED_STEPS.indexOf() in
// CreateTenantPage, where an unrecognised value silently yields index -1, so it is
// validated against the live step list rather than trusted. formValues is deliberately
// permissive: a draft is a half-filled form, so CreateTenantFormSchema's min-length
// rules would reject legitimate in-progress values — the zodResolver on the form
// re-validates them at submit, which is the real boundary.
const WizardDraftSchema = z.object({
  step: z
    .string()
    .refine((value): value is WizardStep =>
      ORDERED_STEPS.includes(value as WizardStep)
    ),
  formValues: z.record(z.string(), z.unknown()),
  savedAt: z.string().datetime(),
})

function draftKey(userId: string): string {
  return `tenant_wizard_draft_${userId}`
}

/**
 * `unreadable` is reported separately from `none` so the wizard can say a saved draft was
 * dropped. Expiry is deliberately *not* unreadable: a draft ageing out after the TTL is
 * expected and needs no explanation, whereas corrupt or shape-changed data is a surprise
 * to the user who came back specifically to resume.
 */
export type LoadWizardDraftResult =
  | { status: "none" }
  | { status: "loaded"; draft: WizardDraft }
  | { status: "unreadable" }

export function loadWizardDraft(userId: string): LoadWizardDraftResult {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    if (!raw) return { status: "none" }
    const parsed = WizardDraftSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      localStorage.removeItem(draftKey(userId))
      return { status: "unreadable" }
    }
    const draft = {
      step: parsed.data.step,
      formValues: parsed.data.formValues as CreateTenantForm,
      savedAt: parsed.data.savedAt,
    }
    if (Date.now() - new Date(draft.savedAt).getTime() > DRAFT_TTL_MS) {
      localStorage.removeItem(draftKey(userId))
      return { status: "none" }
    }
    return { status: "loaded", draft }
  } catch {
    return { status: "unreadable" }
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
