import type { GeneratedDocumentRow } from "@/features/cases/api/schema"

/**
 * The case Documents tab's generated-document rules — US 1.24, and the "Generated documents" block
 * of the Details-page design.
 *
 * ── WHY THE KIND LIST IS A CONSTANT AND NOT AN ENUM FROM THE WIRE ──────────────────────────────
 * `document_type_code` has no declared enum in the contract. What *is* declared is the set of
 * **generator endpoints** — five of them — and those are the only kinds this screen can ask the
 * platform to produce. So the list below is the set of buttons, not a claim about what codes may
 * arrive. A code the backend reports that is not in this list still renders as a row (see
 * `mergeGeneratedRows`); it simply has no "Regenerate" button, because there is no endpoint to call.
 *
 * The design also draws an **Amortization Schedule** and a **Release declaration**. Neither has a
 * generator endpoint in the contract, so neither gets a row here — per `api-first.md` §4, the
 * element is omitted rather than drawn as a button that cannot work.
 */
export const GENERATED_DOCUMENT_KINDS = [
  "financing-commitment",
  "total-exposure-sheet",
  "bank-settlement",
  "payment-plan",
  "loan-offer",
  "cover-sheet",
  "calculation-data-sheet",
] as const

export type GeneratedDocumentKind = (typeof GENERATED_DOCUMENT_KINDS)[number]

/**
 * The kinds that actually have a generator endpoint.
 *
 * `calculation-data-sheet` is in the design and in the kind list above so that it appears in the
 * table as an expected document, but there is **no** `POST .../calculation-data-sheet` in the
 * contract — so it can be listed and never generated from here.
 */
export const GENERATABLE_KINDS: readonly GeneratedDocumentKind[] = [
  "cover-sheet",
  "loan-offer",
  "bank-settlement",
  "payment-plan",
  "financing-commitment",
]

export function isGeneratable(kind: string): kind is GeneratedDocumentKind {
  return (GENERATABLE_KINDS as readonly string[]).includes(kind)
}

/**
 * The wire's `document_type_code` and this screen's endpoint slug are not the same string — the
 * backend uses snake_case codes, the routes use kebab-case slugs. Mapping them here keeps the
 * translation in one place instead of at every call site.
 */
const CODE_BY_KIND: Record<GeneratedDocumentKind, string> = {
  "financing-commitment": "financing_commitment",
  "total-exposure-sheet": "total_exposure_sheet",
  "bank-settlement": "bank_settlement",
  "payment-plan": "payment_plan",
  "loan-offer": "loan_offer",
  "cover-sheet": "cover_sheet",
  "calculation-data-sheet": "calculation_data_sheet",
}

/**
 * Where each document arises — the click dummy's "Arises at" column. It is the checklist step that
 * produces the document, not a step that generates it: the dummy is explicit that *"a checklist
 * step never generates a document — it is only a to-do with a link to one"*.
 */
export const ARISES_AT: Record<GeneratedDocumentKind, string> = {
  "financing-commitment": "4 · A",
  "total-exposure-sheet": "2 · A",
  "bank-settlement": "15",
  "payment-plan": "15",
  "loan-offer": "24",
  "cover-sheet": "34",
  // Produced outside the platform, so it is uploaded rather than generated.
  "calculation-data-sheet": "—",
}

/**
 * Documents produced outside the platform: they are **uploaded**, never generated. The dummy shows
 * the calculation data sheet this way ("Uploaded — produced outside").
 */
export const UPLOADED_KINDS: readonly GeneratedDocumentKind[] = [
  "calculation-data-sheet",
]

/**
 * Documents that freeze once produced — the dummy renders a disabled "Cannot be produced again"
 * for these rather than a Regenerate button, because settlement and plan freeze at step 18 and
 * re-producing them would contradict the freeze.
 */
export const FROZEN_ONCE_PRODUCED: readonly GeneratedDocumentKind[] = [
  "bank-settlement",
  "payment-plan",
]

export function isUploadedKind(kind: GeneratedDocumentKind): boolean {
  return UPLOADED_KINDS.includes(kind)
}

export function isFrozenOnceProduced(kind: GeneratedDocumentKind): boolean {
  return FROZEN_ONCE_PRODUCED.includes(kind)
}

export function documentCodeForKind(kind: GeneratedDocumentKind): string {
  return CODE_BY_KIND[kind]
}

export type GeneratedDocumentEntry = {
  /** The endpoint slug when this row is one of the known kinds; null for a code we did not expect. */
  kind: GeneratedDocumentKind | null
  code: string
  /** The produced document, or null when it has not been generated — the design's "Missing". */
  row: GeneratedDocumentRow | null
}

/**
 * Build the table the design draws: every expected kind in a fixed order, each either produced or
 * missing, followed by any produced document whose code this build did not expect.
 *
 * The order is fixed by `GENERATED_DOCUMENT_KINDS` rather than by what the backend happens to
 * return, so the table does not reshuffle as documents are produced one at a time.
 *
 * Unexpected codes are **appended, never dropped**. A document the platform produced is evidence
 * that exists; hiding it because this build has no label for it would be the screen lying about
 * what is on the case.
 */
export function mergeGeneratedRows(
  produced: GeneratedDocumentRow[]
): GeneratedDocumentEntry[] {
  const byCode = new Map(produced.map(row => [row.document_type_code, row]))

  const expected: GeneratedDocumentEntry[] = GENERATED_DOCUMENT_KINDS.map(
    kind => {
      const code = CODE_BY_KIND[kind]
      return { kind, code, row: byCode.get(code) ?? null }
    }
  )

  const expectedCodes = new Set(expected.map(entry => entry.code))
  const extra: GeneratedDocumentEntry[] = produced
    .filter(row => !expectedCodes.has(row.document_type_code))
    .map(row => ({ kind: null, code: row.document_type_code, row }))

  return [...expected, ...extra]
}

/** How many of the expected kinds have been produced — the design's progress read. */
export function producedCount(entries: GeneratedDocumentEntry[]): number {
  return entries.filter(entry => entry.row !== null).length
}

/**
 * The current combined-document build, or null when none is current.
 *
 * Rebuilding supersedes rather than replaces, so the history can hold several builds and exactly
 * one is current. Picking the newest by date instead would show a superseded build whenever the
 * backend's ordering and its `is_current` flag disagreed — and the flag is the authority.
 */
export function currentBuild<T extends { is_current: boolean }>(
  builds: T[]
): T | null {
  return builds.find(build => build.is_current) ?? null
}
