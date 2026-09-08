import { describe, expect, it } from "vitest"
import {
  GENERATABLE_KINDS,
  GENERATED_DOCUMENT_KINDS,
  currentBuild,
  documentCodeForKind,
  isGeneratable,
  mergeGeneratedRows,
  producedCount,
} from "@/features/cases/generatedDocuments"
import type { GeneratedDocumentRow } from "@/features/cases/api/schema"

function row(code: string): GeneratedDocumentRow {
  return {
    document_type_code: code,
    media_id: "00000000-0000-4000-8000-00000000ed01",
    file_name: `${code}.pdf`,
    produced_by: "00000000-0000-4000-8000-000000000005",
    produced_at_utc: "2026-09-08T07:12:00Z",
    produced_at_local: "2026-09-08T09:12:00+02:00",
  }
}

describe("mergeGeneratedRows", () => {
  it("lists every expected kind even when nothing has been produced", () => {
    const entries = mergeGeneratedRows([])
    expect(entries).toHaveLength(GENERATED_DOCUMENT_KINDS.length)
    expect(entries.every(e => e.row === null)).toBe(true)
  })

  // The order comes from the kind list, not from the response, so the table does not reshuffle as
  // documents are produced one at a time.
  it("keeps a fixed order regardless of the order documents arrive in", () => {
    const codes = mergeGeneratedRows([
      row("payment_plan"),
      row("cover_sheet"),
    ]).map(e => e.code)
    expect(codes.slice(0, 2)).toEqual(["cover_sheet", "calculation_data_sheet"])
  })

  it("attaches a produced document to its expected kind", () => {
    const entries = mergeGeneratedRows([row("cover_sheet")])
    const cover = entries.find(e => e.code === "cover_sheet")
    expect(cover?.row?.file_name).toBe("cover_sheet.pdf")
    expect(entries.find(e => e.code === "loan_offer")?.row).toBeNull()
  })

  // A document the platform produced is evidence that exists. Dropping it because this build has
  // no label for its code would be the screen misreporting what is on the case.
  it("appends a produced document whose code is not expected", () => {
    const entries = mergeGeneratedRows([row("release_declaration")])
    const extra = entries.at(-1)
    expect(extra?.code).toBe("release_declaration")
    expect(extra?.row).not.toBeNull()
    // No endpoint exists for it, so it carries no kind and gets no generate button.
    expect(extra?.kind).toBeNull()
  })

  it("does not duplicate a kind that also arrives as a produced row", () => {
    const entries = mergeGeneratedRows([row("cover_sheet")])
    expect(entries.filter(e => e.code === "cover_sheet")).toHaveLength(1)
  })
})

describe("producedCount", () => {
  it("counts only produced rows", () => {
    expect(producedCount(mergeGeneratedRows([]))).toBe(0)
    expect(
      producedCount(mergeGeneratedRows([row("cover_sheet"), row("loan_offer")]))
    ).toBe(2)
  })

  it("counts an unexpected produced document too", () => {
    expect(
      producedCount(mergeGeneratedRows([row("release_declaration")]))
    ).toBe(1)
  })
})

describe("isGeneratable", () => {
  it("accepts the five kinds that have a generator endpoint", () => {
    for (const kind of GENERATABLE_KINDS) expect(isGeneratable(kind)).toBe(true)
    expect(GENERATABLE_KINDS).toHaveLength(5)
  })

  // The design draws it, the contract has no `POST .../calculation-data-sheet`, so it is listed as
  // an expected document but never offered as a button.
  it("refuses the calculation data sheet, which has no endpoint", () => {
    expect(isGeneratable("calculation-data-sheet")).toBe(false)
  })

  it("refuses a kind the design draws but the contract does not expose", () => {
    expect(isGeneratable("amortization-schedule")).toBe(false)
    expect(isGeneratable("release-declaration")).toBe(false)
  })
})

describe("documentCodeForKind", () => {
  // The route slug is kebab-case and the wire code is snake_case; conflating them would make every
  // produced row look missing.
  it("maps each endpoint slug to its wire code", () => {
    expect(documentCodeForKind("cover-sheet")).toBe("cover_sheet")
    expect(documentCodeForKind("bank-settlement")).toBe("bank_settlement")
    expect(documentCodeForKind("financing-commitment")).toBe(
      "financing_commitment"
    )
  })
})

describe("currentBuild", () => {
  // Rebuilding supersedes rather than replaces, so the flag is the authority — not recency.
  it("picks the build flagged current, not the first or the newest", () => {
    const builds = [
      { id: "a", is_current: false },
      { id: "b", is_current: true },
      { id: "c", is_current: false },
    ]
    expect(currentBuild(builds)?.id).toBe("b")
  })

  it("returns null when no build is current", () => {
    expect(currentBuild([{ id: "a", is_current: false }])).toBeNull()
    expect(currentBuild([])).toBeNull()
  })
})
