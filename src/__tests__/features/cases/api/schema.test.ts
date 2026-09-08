import { describe, it, expect } from "vitest"
import {
  CombinedDocumentListResponseSchema,
  GeneratedDocumentListResponseSchema,
  CaseSchema,
  CaseListItemSchema,
  CaseListResponseSchema,
  CaseResponseSchema,
  CaseTypeSchema,
  CaseStatusSchema,
  CaseDataMetaSchema,
  CaseProgressResponseSchema,
  PhaseProgressResponseSchema,
  CaseContractSchema,
  CaseContractListResponseSchema,
  ContractDeferredStateSchema,
  CaseLeasingCompanyResponseSchema,
  CaseProductTemplateResponseSchema,
} from "@/features/cases/api/schema"

const CASE_UUID = "5c2d8b10-6a4f-4e9b-8c31-7d0a1f2b3c44"
const OWNER_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
const LC_UUID = "11111111-2222-4333-8444-555555555555"

const validCase = {
  id: CASE_UUID,
  case_reference: "CASE-2026-000123",
  case_type: "refinancing_request",
  case_status: "open",
  display_status: "open",
  origin: "front_office",
  owner_user_id: OWNER_UUID,
  lc_partner_id: LC_UUID,
  routing_exception: false,
  created_by: "front.office@bank.example",
  created_at: "2026-06-13T10:00:00Z",
}

describe("cases schemas", () => {
  it("parses a valid case", () => {
    expect(CaseSchema.parse(validCase)).toEqual(validCase)
  })

  it("accepts null owner and lc partner (unclaimed / bank-side case)", () => {
    const unclaimed = {
      ...validCase,
      owner_user_id: null,
      lc_partner_id: null,
    }
    expect(CaseSchema.parse(unclaimed)).toEqual(unclaimed)
  })

  it("CaseListItemSchema shares the case shape", () => {
    expect(CaseListItemSchema.parse(validCase)).toEqual(validCase)
  })

  it("CaseResponseSchema shares the case shape", () => {
    expect(CaseResponseSchema.parse(validCase)).toEqual(validCase)
  })

  // The Cases list carries six display fields the contract does not declare (leasing company name,
  // contract count, phase, last activity). They are optional precisely so the real API's narrower
  // response keeps parsing — these tests are what stop that from regressing into required.
  describe("CaseListItemSchema display-field gaps", () => {
    const withDisplayFields = {
      ...validCase,
      lc_partner_name: "Premium Leasing GmbH",
      contract_count: 3,
      phase_name: "Application & credit review",
      phase_position: 1,
      phase_count: 5,
      last_activity_at: "2026-06-14T08:30:00Z",
      last_activity_by: "Front Office",
    }

    it("parses the real API's row, which carries none of them", () => {
      const parsed = CaseListItemSchema.parse(validCase)
      expect(parsed.lc_partner_name).toBeUndefined()
      expect(parsed.contract_count).toBeUndefined()
      expect(parsed.phase_position).toBeUndefined()
      expect(parsed.last_activity_at).toBeUndefined()
    })

    it("keeps them when the mock layer supplies them", () => {
      expect(CaseListItemSchema.parse(withDisplayFields)).toEqual(
        withDisplayFields
      )
    })

    it("accepts them as explicitly null", () => {
      // A backend that adds the columns but has no value yet would send null, not omit the key.
      const nulled = {
        ...validCase,
        lc_partner_name: null,
        contract_count: null,
        phase_name: null,
        phase_position: null,
        phase_count: null,
        last_activity_at: null,
        last_activity_by: null,
      }
      expect(CaseListItemSchema.parse(nulled)).toEqual(nulled)
    })

    it("still rejects a wrongly-typed display field", () => {
      expect(() =>
        CaseListItemSchema.parse({ ...validCase, contract_count: "3" })
      ).toThrow()
    })

    it("does not widen the detail endpoint — CaseResponseSchema strips them", () => {
      // The detail endpoint promises no more than the contract does, so the display fields must not
      // leak into it just because the list row shares a base schema.
      expect(CaseResponseSchema.parse(withDisplayFields)).toEqual(validCase)
    })
  })

  it("parses a case list response", () => {
    const response = { items: [validCase], total: 1 }
    expect(CaseListResponseSchema.parse(response)).toEqual(response)
  })

  it("parses an empty case list", () => {
    const response = { items: [], total: 0 }
    expect(CaseListResponseSchema.parse(response)).toEqual(response)
  })

  it("rejects an unknown case_type (a backend addition must widen the enum, not slip through)", () => {
    expect(() =>
      CaseSchema.parse({ ...validCase, case_type: "totally_new_type" })
    ).toThrow()
  })

  it("rejects an unknown case_status", () => {
    expect(() =>
      CaseSchema.parse({ ...validCase, case_status: "archived" })
    ).toThrow()
  })

  it("rejects a non-uuid id", () => {
    expect(() => CaseSchema.parse({ ...validCase, id: "not-a-uuid" })).toThrow()
  })

  it("keeps display_status permissive (a widened backend value renders, never fails to parse)", () => {
    const widened = { ...validCase, display_status: "waiting_on_lessee" }
    expect(CaseSchema.parse(widened).display_status).toBe("waiting_on_lessee")
  })

  it("exposes the full case_type enum", () => {
    expect(CaseTypeSchema.options).toEqual([
      "refinancing_request",
      "package_redemption",
      "single_redemption",
      "lessee_change",
      "object_swap",
      "extension",
      "asset_event",
    ])
  })

  it("exposes the full case_status enum", () => {
    expect(CaseStatusSchema.options).toEqual([
      "open",
      "waiting",
      "done",
      "cancelled",
    ])
  })
})

describe("PhaseProgressResponseSchema", () => {
  const validPhase = {
    phase_name: "Application & credit review",
    position: 1,
    steps_done: 3,
    steps_applicable: 4,
    is_complete: false,
    is_current: true,
  }

  it("accepts a phase the wire can fully describe", () => {
    expect(PhaseProgressResponseSchema.parse(validPhase)).toEqual(validPhase)
  })

  // Both are nullable on the wire, so a phase the backend cannot name must still parse — the band
  // falls back to the array index for its letter and to a placeholder for the label.
  it("accepts a null phase_name and a null position", () => {
    const parsed = PhaseProgressResponseSchema.parse({
      ...validPhase,
      phase_name: null,
      position: null,
    })
    expect(parsed.phase_name).toBeNull()
    expect(parsed.position).toBeNull()
  })

  it("rejects a missing steps_applicable", () => {
    const withoutTotal: Record<string, unknown> = { ...validPhase }
    delete withoutTotal.steps_applicable
    expect(() => PhaseProgressResponseSchema.parse(withoutTotal)).toThrow()
  })

  it("rejects a non-integer step count", () => {
    expect(() =>
      PhaseProgressResponseSchema.parse({ ...validPhase, steps_done: 1.5 })
    ).toThrow()
  })

  it("rejects a string where a boolean flag belongs", () => {
    expect(() =>
      PhaseProgressResponseSchema.parse({ ...validPhase, is_current: "yes" })
    ).toThrow()
  })
})

describe("CaseProgressResponseSchema", () => {
  const validProgress = {
    business_object_id: CASE_UUID,
    phases: [
      {
        phase_name: "Application & credit review",
        position: 1,
        steps_done: 3,
        steps_applicable: 4,
        is_complete: false,
        is_current: true,
      },
    ],
    overall_done: 3,
    overall_applicable: 44,
    percent_complete: 7,
    all_complete: false,
  }

  it("accepts the documented shape", () => {
    expect(CaseProgressResponseSchema.parse(validProgress)).toEqual(
      validProgress
    )
  })

  // A case with no phases is legitimate — the band renders nothing rather than an empty stepper.
  it("accepts an empty phases array", () => {
    expect(
      CaseProgressResponseSchema.parse({ ...validProgress, phases: [] }).phases
    ).toEqual([])
  })

  it("rejects a business_object_id that is not a UUID", () => {
    expect(() =>
      CaseProgressResponseSchema.parse({
        ...validProgress,
        business_object_id: "case-1",
      })
    ).toThrow()
  })

  it("rejects a phase array holding a malformed phase", () => {
    expect(() =>
      CaseProgressResponseSchema.parse({
        ...validProgress,
        phases: [{ phase_name: "A" }],
      })
    ).toThrow()
  })
})

describe("CaseDataMetaSchema", () => {
  // Narrowed on purpose: `CaseDataResponse` is a wide aggregate and only the contract count is read.
  // Zod strips the rest, which is what lets the header consume the endpoint without modelling it.
  it("keeps the two fields the header reads and drops the rest", () => {
    const parsed = CaseDataMetaSchema.parse({
      case_id: CASE_UUID,
      contract_count: 134,
      leasing_company: { id: "x", legal_name: "Premium Leasing GmbH" },
      residual_sum: "1200000.00",
      absent_blocks: ["financing"],
    })
    expect(parsed).toEqual({ case_id: CASE_UUID, contract_count: 134 })
  })

  it("rejects a contract_count that is not an integer", () => {
    expect(() =>
      CaseDataMetaSchema.parse({ case_id: CASE_UUID, contract_count: "134" })
    ).toThrow()
  })
})

describe("ContractDeferredStateSchema", () => {
  it("accepts the two values the contract declares", () => {
    expect(ContractDeferredStateSchema.parse("active")).toBe("active")
    expect(ContractDeferredStateSchema.parse("deferred")).toBe("deferred")
  })

  // The design's Contracts tab shows `Active` / `Overdue` / `Ended`. Only the first exists on the
  // wire, so the other two must not parse — if the backend ever sends them the enum should fail
  // loudly rather than let an unmapped badge render.
  it("rejects the design's extra states", () => {
    expect(() => ContractDeferredStateSchema.parse("overdue")).toThrow()
    expect(() => ContractDeferredStateSchema.parse("ended")).toThrow()
  })
})

describe("CaseContractSchema", () => {
  const CONTRACT_UUID = "00000000-0000-4000-8000-0000000000c1"

  const minimalContract = {
    id: CONTRACT_UUID,
    leasing_company_contract_number: null,
    lessee_partner_id: null,
    short_name: null,
    contract_type: null,
    amortisation_type: null,
    term_months: null,
    net_instalment: null,
    residual_value: null,
    contract_start: null,
    deferred_state: "active",
  }

  // A bulk-imported contract can be missing every optional term while still being a real row, so
  // the all-null shape has to parse rather than throw.
  it("parses a contract whose every nullable term is null", () => {
    expect(CaseContractSchema.parse(minimalContract)).toEqual(minimalContract)
  })

  it("drops the ContractRead fields this screen does not read", () => {
    // `lessee_partner_id` was in this list until US 1.17 needed it to count distinct lessees for
    // the wizard summary, so it is now read rather than stripped — see the test below.
    const parsed = CaseContractSchema.parse({
      ...minimalContract,
      missing_fields: ["residual_value"],
      settlement_blockers: [],
      buy_back_agreement: true,
    })
    expect(parsed).toEqual(minimalContract)
  })

  // Read only to count distinct lessees on the summary. The wire carries no lessee NAME here, which
  // is why the Contracts tab still has no lessee column (Q-015) even though the count is possible.
  it("keeps lessee_partner_id", () => {
    const lessee = "00000000-0000-4000-8000-0000000000a1"
    expect(
      CaseContractSchema.parse({
        ...minimalContract,
        lessee_partner_id: lessee,
      }).lessee_partner_id
    ).toBe(lessee)
  })

  it("rejects a non-uuid lessee_partner_id", () => {
    expect(() =>
      CaseContractSchema.parse({
        ...minimalContract,
        lessee_partner_id: "PARTNER-1",
      })
    ).toThrow()
  })

  // Money stays a decimal string end to end; coercing it would turn a null instalment into a
  // convincing 0,00 (see the note in features/financing/api/schema.ts).
  it("rejects a numeric instalment", () => {
    expect(() =>
      CaseContractSchema.parse({ ...minimalContract, net_instalment: 1250 })
    ).toThrow()
  })

  it("rejects a non-integer term", () => {
    expect(() =>
      CaseContractSchema.parse({ ...minimalContract, term_months: "48" })
    ).toThrow()
  })

  it("requires deferred_state", () => {
    const withoutState: Record<string, unknown> = { ...minimalContract }
    delete withoutState.deferred_state
    expect(() => CaseContractSchema.parse(withoutState)).toThrow()
  })

  // `contract_type` is deliberately a string, not an enum: ContractRead does not constrain it, so
  // whatever vocabulary the backend sends must render instead of breaking the page.
  it("accepts a contract_type the spec's enum does not list", () => {
    expect(
      CaseContractSchema.parse({
        ...minimalContract,
        contract_type: "operating_lease",
      }).contract_type
    ).toBe("operating_lease")
  })

  it("parses the list envelope", () => {
    expect(
      CaseContractListResponseSchema.parse({
        items: [minimalContract],
        total: 1,
      })
    ).toEqual({ items: [minimalContract], total: 1 })
  })

  it("rejects a list envelope with no total", () => {
    expect(() => CaseContractListResponseSchema.parse({ items: [] })).toThrow()
  })
})

describe("CaseLeasingCompanyResponseSchema", () => {
  const bound = {
    lc_number: "1234",
    name: "Premium Leasing GmbH",
    address: { city: "Hamburg" },
    contact_person: "Head of refinancing",
    personennummer_os_plus: "OS-99001",
    agreement_reference: "FA-2024-018",
    agreement_active: true,
    vfe_amount_eur: "850.00",
    refinancing_quota: "97.00",
    value_date_rule: "month_end",
    instalment_due_day: 1,
    framework_volume_eur: "2000000.00",
  }

  it("parses a bound leasing company with its agreement", () => {
    expect(CaseLeasingCompanyResponseSchema.parse(bound)).toEqual(bound)
  })

  // A case is unbound between POST /cases and the first bind, and the endpoint answers with the
  // fields null rather than 404. That must parse — it is the wizard's opening state.
  it("parses the unbound shape, every nullable field null", () => {
    const unbound = {
      ...bound,
      lc_number: null,
      name: null,
      address: null,
      contact_person: null,
      personennummer_os_plus: null,
      agreement_reference: null,
      agreement_active: false,
      vfe_amount_eur: null,
      refinancing_quota: null,
      value_date_rule: null,
      instalment_due_day: null,
      framework_volume_eur: null,
    }
    expect(CaseLeasingCompanyResponseSchema.parse(unbound)).toEqual(unbound)
  })

  // The design shows a payout and a collection IBAN on this block; §5.2 says they belong on
  // generated documents instead. The contract carries neither — this asserts the schema does not
  // quietly acquire them.
  it("strips any bank account the response might carry", () => {
    const parsed = CaseLeasingCompanyResponseSchema.parse({
      ...bound,
      payout_iban: "DE44500105170648489807",
      collection_iban: "DE44500105170648489808",
    })
    expect(parsed).not.toHaveProperty("payout_iban")
    expect(parsed).not.toHaveProperty("collection_iban")
  })

  it("keeps money and quotas as decimal strings", () => {
    expect(() =>
      CaseLeasingCompanyResponseSchema.parse({
        ...bound,
        framework_volume_eur: 2000000,
      })
    ).toThrow()
  })

  // `agreement_active` is the only non-nullable field: the badge beside the reference has to render
  // one way or the other, so a missing flag is a parse failure rather than a silent default.
  it("requires agreement_active", () => {
    const withoutFlag: Record<string, unknown> = { ...bound }
    delete withoutFlag.agreement_active
    expect(() => CaseLeasingCompanyResponseSchema.parse(withoutFlag)).toThrow()
  })

  it("rejects a non-integer instalment due day", () => {
    expect(() =>
      CaseLeasingCompanyResponseSchema.parse({
        ...bound,
        instalment_due_day: 1.5,
      })
    ).toThrow()
  })
})

describe("CaseProductTemplateResponseSchema", () => {
  const template = {
    product_template_id: "00000000-0000-4000-8000-0000000000f1",
    template_code: "STD-LEASE",
    template_name: "Standard lease refinancing",
    version_number: "4",
    version_status: "active",
    min_term_months: 12,
    max_term_months: 72,
    refinancing_form: "annuity",
  }

  it("parses the bound template", () => {
    expect(CaseProductTemplateResponseSchema.parse(template)).toEqual(template)
  })

  it("requires the id and the code", () => {
    const withoutCode: Record<string, unknown> = { ...template }
    delete withoutCode.template_code
    expect(() => CaseProductTemplateResponseSchema.parse(withoutCode)).toThrow()
  })

  it("rejects a non-uuid template id", () => {
    expect(() =>
      CaseProductTemplateResponseSchema.parse({
        ...template,
        product_template_id: "STD-LEASE",
      })
    ).toThrow()
  })

  // `version_status` and `refinancing_form` have enum counterparts elsewhere in the registry but
  // are unconstrained strings on THIS response, so a value outside those enums must still parse.
  it("accepts an unconstrained version_status", () => {
    expect(
      CaseProductTemplateResponseSchema.parse({
        ...template,
        version_status: "something_new",
      }).version_status
    ).toBe("something_new")
  })
})

// ── The Documents tab (US 1.24, US 1.27) ─────────────────────────────────────────────────────────

const generatedRow = {
  document_type_code: "cover_sheet",
  media_id: "00000000-0000-4000-8000-00000000ed01",
  file_name: "Deckblatt_RR-2026-104.pdf",
  produced_by: "00000000-0000-4000-8000-000000000005",
  produced_at_utc: "2026-09-08T07:12:00Z",
  produced_at_local: "2026-09-08T09:12:00+02:00",
}

describe("GeneratedDocumentListResponseSchema", () => {
  it("parses an empty list — nothing generated yet is a real state", () => {
    const parsed = GeneratedDocumentListResponseSchema.parse({
      case_id: "00000000-0000-4000-8000-00000000c005",
      documents: [],
    })
    expect(parsed.documents).toEqual([])
  })

  // The code has no declared enum, so an unfamiliar kind must pass through rather than throw and
  // blank the tab.
  it("accepts a document_type_code it has never seen", () => {
    const parsed = GeneratedDocumentListResponseSchema.parse({
      case_id: "00000000-0000-4000-8000-00000000c005",
      documents: [
        { ...generatedRow, document_type_code: "release_declaration" },
      ],
    })
    expect(parsed.documents[0].document_type_code).toBe("release_declaration")
  })

  // Both timestamps are required. The local one is what a person reads, and deriving it from UTC
  // here would re-introduce the timezone guessing the pair exists to avoid.
  it("requires the local timestamp as well as the UTC one", () => {
    const withoutLocal = Object.fromEntries(
      Object.entries(generatedRow).filter(
        ([key]) => key !== "produced_at_local"
      )
    )
    expect(() =>
      GeneratedDocumentListResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        documents: [withoutLocal],
      })
    ).toThrow()
  })

  it("rejects a malformed media id", () => {
    expect(() =>
      GeneratedDocumentListResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        documents: [{ ...generatedRow, media_id: "not-a-uuid" }],
      })
    ).toThrow()
  })
})

describe("CombinedDocumentListResponseSchema", () => {
  const build = {
    id: "00000000-0000-4000-8000-0000000000cb",
    case_id: "00000000-0000-4000-8000-00000000c005",
    media_id: "00000000-0000-4000-8000-000000000cb1",
    file_name: "Gesamtdokument_2026-09-08.pdf",
    is_current: true,
    build_kind: "full",
    document_count: 6,
    built_by: "00000000-0000-4000-8000-000000000005",
    built_at: "2026-09-08T10:26:00Z",
  }

  it("parses a history holding a current build and a superseded one", () => {
    const parsed = CombinedDocumentListResponseSchema.parse({
      case_id: "00000000-0000-4000-8000-00000000c005",
      builds: [
        build,
        {
          ...build,
          id: "00000000-0000-4000-8000-0000000000ca",
          is_current: false,
        },
      ],
    })
    expect(parsed.builds.filter(b => b.is_current)).toHaveLength(1)
  })

  it("parses an empty history — no build yet", () => {
    expect(
      CombinedDocumentListResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        builds: [],
      }).builds
    ).toEqual([])
  })

  // `is_current` is what the panel reads to decide which build to offer, so it must not be
  // defaultable — a missing flag would silently make every build non-current.
  it("requires is_current rather than defaulting it", () => {
    const withoutFlag = Object.fromEntries(
      Object.entries(build).filter(([key]) => key !== "is_current")
    )
    expect(() =>
      CombinedDocumentListResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        builds: [withoutFlag],
      })
    ).toThrow()
  })

  it("rejects a fractional document_count", () => {
    expect(() =>
      CombinedDocumentListResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        builds: [{ ...build, document_count: 2.5 }],
      })
    ).toThrow()
  })
})
