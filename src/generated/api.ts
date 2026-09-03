import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core"
import { z } from "zod"

const LoginRequest = z
  .object({ email: z.string().email(), password: z.string() })
  .passthrough()
const LoginStepResponse = z
  .object({
    next_step: z.enum(["otp", "mfa", "mfa_setup", "session"]),
    token: z.union([z.string(), z.null()]).optional(),
    expires_in: z.union([z.number(), z.null()]).optional(),
  })
  .passthrough()
const ValidationError = z
  .object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
    type: z.string(),
    input: z.unknown().optional(),
    ctx: z.object({}).partial().passthrough().optional(),
  })
  .passthrough()
const HTTPValidationError = z
  .object({ detail: z.array(ValidationError) })
  .partial()
  .passthrough()
const SetPasswordRequest = z
  .object({
    token: z.string(),
    password: z.string().min(8).max(128),
    password_confirm: z.string(),
  })
  .passthrough()
const SetPasswordResponse = z
  .object({
    mfa_enrollment_required: z.boolean().default(false),
    mfa_token: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const MfaEnrollRequest = z.object({ mfa_token: z.string() }).passthrough()
const MfaEnrollResponse = z
  .object({ qr_code: z.string(), secret: z.string(), mfa_token: z.string() })
  .passthrough()
const MfaActivateRequest = z
  .object({ mfa_token: z.string(), code: z.string().min(6).max(6) })
  .passthrough()
const UserRole = z.enum([
  "system_admin",
  "support_user",
  "auditor",
  "bank_power_user",
  "front_office",
  "back_office",
  "leasing_company_user",
])
const UserStatus = z.enum([
  "pending_approval",
  "invited",
  "active",
  "suspended",
  "deactivated",
  "expired",
  "rejected",
])
const UserResponse = z
  .object({
    id: z.string().uuid(),
    user_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    role: UserRole,
    tenant_id: z.union([z.string(), z.null()]),
    status: UserStatus,
    phone_number: z.union([z.string(), z.null()]),
    profile_picture_url: z.union([z.string(), z.null()]).optional(),
    lc_partner_id: z.union([z.string(), z.null()]).optional(),
    access_valid_until: z.union([z.string(), z.null()]),
    invited_by: z.union([z.string(), z.null()]),
    invited_at: z.union([z.string(), z.null()]),
    activated_at: z.union([z.string(), z.null()]),
    last_login: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const MfaActivateResponse = z
  .object({ recovery_codes: z.array(z.string()), user: UserResponse })
  .passthrough()
const MfaVerifyRequest = z
  .object({ mfa_token: z.string(), code: z.string() })
  .passthrough()
const MfaVerifyResponse = z
  .object({
    user: UserResponse,
    new_recovery_codes: z.union([z.array(z.string()), z.null()]).optional(),
  })
  .passthrough()
const VerifyOtpRequest = z
  .object({ verification_token: z.string(), code: z.string().min(6).max(6) })
  .passthrough()
const LoginResponse = z.object({ user: UserResponse }).passthrough()
const ResendOtpRequest = z
  .object({ verification_token: z.string() })
  .passthrough()
const ForgotPasswordRequest = z
  .object({ email: z.string().email() })
  .passthrough()
const ResetPasswordRequest = z
  .object({
    token: z.string(),
    password: z.string().min(8).max(128),
    password_confirm: z.string(),
  })
  .passthrough()
const ResetPasswordResponse = z
  .object({
    mfa_required: z.boolean().default(false),
    mfa_token: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const ResetPasswordVerifyRequest = z
  .object({ mfa_token: z.string(), code: z.string() })
  .passthrough()
const ResetVerifyResponse = z
  .object({
    user: UserResponse,
    new_recovery_codes: z.union([z.array(z.string()), z.null()]).optional(),
  })
  .passthrough()
const FollowUpEvent = z.enum([
  "redemption",
  "lessee_change",
  "object_swap",
  "extension",
  "asset_event",
])
const StartFollowUpRequest = z
  .object({
    event: FollowUpEvent,
    affected_contract_ids: z.array(z.string().uuid()).optional(),
  })
  .passthrough()
const CaseType = z.enum([
  "refinancing_request",
  "package_redemption",
  "single_redemption",
  "lessee_change",
  "object_swap",
  "extension",
  "asset_event",
])
const CaseStatus = z.enum(["open", "waiting", "done", "cancelled"])
const CaseDisplayStatus = z.enum([
  "open",
  "waiting",
  "done",
  "cancelled",
  "draft",
  "submitted",
  "missing_information",
  "rework",
  "committed",
  "rejected",
  "calculating",
  "ready_for_setup",
  "disbursed",
  "active",
  "ended",
])
const CaseOrigin = z.enum(["wizard", "portal", "bulk_file", "migrated"])
const CaseResponse = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    case_status: CaseStatus,
    display_status: CaseDisplayStatus,
    origin: CaseOrigin,
    owner_user_id: z.union([z.string(), z.null()]),
    lc_partner_id: z.union([z.string(), z.null()]),
    routing_exception: z.boolean(),
    origin_financing_id: z.union([z.string(), z.null()]).optional(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const StartCaseRequest = z.object({ case_type: CaseType }).passthrough()
const case_type = z.union([CaseType, z.null()]).optional()
const status = z.union([CaseDisplayStatus, z.null()]).optional()
const CaseListItem = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    case_status: CaseStatus,
    display_status: CaseDisplayStatus,
    origin: CaseOrigin,
    owner_user_id: z.union([z.string(), z.null()]),
    lc_partner_id: z.union([z.string(), z.null()]),
    routing_exception: z.boolean(),
    origin_financing_id: z.union([z.string(), z.null()]).optional(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CaseListResponse = z
  .object({
    items: z.array(CaseListItem),
    total: z.number().int(),
    counts_by_status: z.record(z.string(), z.number().int()),
  })
  .passthrough()
const AssignCaseRequest = z
  .object({ assignee_id: z.string().uuid() })
  .passthrough()
const RequestStatus = z.enum([
  "draft",
  "submitted",
  "missing_information",
  "rework",
  "committed",
  "rejected",
])
const DecideRequestRequest = z
  .object({
    outcome: RequestStatus,
    reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const SubmitResultResponse = z
  .object({
    case: CaseResponse,
    submitted_by: z.union([z.string(), z.null()]),
    submitted_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const CaseLeasingCompanyResponse = z
  .object({
    lc_number: z.union([z.string(), z.null()]),
    name: z.union([z.string(), z.null()]),
    address: z.union([z.object({}).partial().passthrough(), z.null()]),
    contact_person: z.union([z.string(), z.null()]),
    personennummer_os_plus: z.union([z.string(), z.null()]),
    agreement_reference: z.union([z.string(), z.null()]),
    agreement_active: z.boolean(),
    vfe_amount_eur: z.union([z.string(), z.null()]),
    refinancing_quota: z.union([z.string(), z.null()]),
    value_date_rule: z.union([z.string(), z.null()]),
    instalment_due_day: z.union([z.number(), z.null()]),
    framework_volume_eur: z.union([z.string(), z.null()]),
  })
  .passthrough()
const CaseProductTemplateResponse = z
  .object({
    product_template_id: z.string().uuid(),
    template_code: z.string(),
    template_name: z.union([z.string(), z.null()]),
    version_number: z.union([z.string(), z.null()]),
    version_status: z.union([z.string(), z.null()]),
    min_term_months: z.union([z.number(), z.null()]),
    max_term_months: z.union([z.number(), z.null()]),
    refinancing_form: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ReviewContractItem = z
  .object({
    id: z.string().uuid(),
    lessee_partner_id: z.union([z.string(), z.null()]),
    contract_type: z.union([z.string(), z.null()]),
    contract_residual: z.union([z.string(), z.null()]),
    is_complete: z.boolean(),
    missing_fields: z.array(z.string()),
  })
  .passthrough()
const CollateralType = z.enum([
  "chattel_mortgage",
  "assignment_of_receivables",
  "guarantee",
])
const CollateralRecheckState = z.enum([
  "clear",
  "needs_recheck",
  "redetermined",
])
const CollateralValueItem = z
  .object({
    total_eur: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    set_by: z.string().uuid(),
    set_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CollateralResponse = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    collateral_type: z.union([CollateralType, z.null()]),
    current_total_eur: z.union([z.string(), z.null()]),
    evidence_document_id: z.union([z.string(), z.null()]),
    recheck_state: CollateralRecheckState,
    redetermined_by: z.union([z.string(), z.null()]),
    redetermined_at: z.union([z.string(), z.null()]),
    confirmed_by: z.union([z.string(), z.null()]),
    confirmed_at: z.union([z.string(), z.null()]),
    value_history: z.array(CollateralValueItem),
  })
  .passthrough()
const ReviewFinancingSummary = z
  .object({
    refinancing_rate: z.union([z.string(), z.null()]),
    effective_quota: z.union([z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    financing_volume: z.union([z.string(), z.null()]).optional(),
    financing_volume_status: z.string().optional().default("pending"),
  })
  .passthrough()
const CaseReviewResponse = z
  .object({
    case: CaseResponse,
    leasing_company: z.union([CaseLeasingCompanyResponse, z.null()]),
    product_template: z.union([CaseProductTemplateResponse, z.null()]),
    contracts: z.array(ReviewContractItem),
    contract_count: z.number().int(),
    residual_sum: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    collateral: z.union([CollateralResponse, z.null()]),
    financing: z.union([ReviewFinancingSummary, z.null()]),
  })
  .passthrough()
const CaseDataFinancingBlock = z
  .object({
    refinancing_rate: z.union([z.string(), z.null()]),
    effective_quota: z.union([z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    status: z.string(),
    calculation_state: z.string(),
    calculation_version: z.number().int(),
    financing_volume: z.union([z.string(), z.null()]).optional(),
    financing_volume_status: z.string().optional().default("pending"),
  })
  .passthrough()
const CaseDataResponse = z
  .object({
    case_id: z.string().uuid(),
    leasing_company: z.union([CaseLeasingCompanyResponse, z.null()]),
    contracts: z.array(ReviewContractItem),
    contract_count: z.number().int(),
    residual_sum: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    financing: z.union([CaseDataFinancingBlock, z.null()]),
    collateral: z.union([CollateralResponse, z.null()]),
    absent_blocks: z.array(z.string()),
  })
  .passthrough()
const RecordDeviationRequest = z
  .object({
    field: z.string().min(1).max(100),
    requested_value: z.union([z.string(), z.null()]).optional(),
    document_value: z.union([z.string(), z.null()]).optional(),
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const DeviationResponse = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    field: z.string(),
    requested_value: z.union([z.string(), z.null()]),
    document_value: z.union([z.string(), z.null()]),
    note: z.union([z.string(), z.null()]),
    recorded_by: z.string().uuid(),
    recorded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const DeviationListResponse = z
  .object({
    case_id: z.string().uuid(),
    deviations: z.array(DeviationResponse),
  })
  .passthrough()
const DocumentToSendItem = z
  .object({
    document_type_code: z.string(),
    media_id: z.string().uuid(),
    file_name: z.string(),
  })
  .passthrough()
const DocumentsToSendResponse = z
  .object({
    case_id: z.string().uuid(),
    documents: z.array(DocumentToSendItem),
  })
  .passthrough()
const DispatchResponse = z
  .object({
    case_id: z.string().uuid(),
    dispatch_confirmed: z.boolean(),
    confirmed_by: z.union([z.string(), z.null()]),
    confirmed_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const CorrespondenceKind = z.enum([
  "loan_offer_sent",
  "amortisation_schedule_sent",
  "general",
])
const RecordCorrespondenceRequest = z
  .object({
    kind: CorrespondenceKind,
    included_document_type_codes: z.array(z.string()).optional(),
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const CorrespondenceResponse = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    kind: CorrespondenceKind,
    included_document_type_codes: z.array(z.string()),
    note: z.union([z.string(), z.null()]),
    recorded_by: z.string().uuid(),
    recorded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CorrespondenceListResponse = z
  .object({
    case_id: z.string().uuid(),
    correspondence: z.array(CorrespondenceResponse),
  })
  .passthrough()
const BindLeasingCompanyRequest = z
  .object({ lc_number: z.string().regex(/^[0-9]{4}$/) })
  .passthrough()
const BindProductTemplateRequest = z
  .object({ product_template_id: z.string().uuid() })
  .passthrough()
const CaseActivityItem = z
  .object({
    id: z.string().uuid(),
    audit_seq: z.number().int(),
    entity_type: z.string(),
    entity_id: z.union([z.string(), z.null()]),
    entity_display: z.union([z.string(), z.null()]),
    action_type: z.string(),
    event_type: z.string(),
    actor_id: z.string(),
    actor_type: z.string(),
    actor_display: z.union([z.string(), z.null()]),
    actor_role_at_time: z.union([z.string(), z.null()]),
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    changed_fields: z.union([z.array(z.string()), z.null()]),
    recorded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CaseActivityResponse = z
  .object({
    activity: z.array(CaseActivityItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const SetCollateralTypeRequest = z
  .object({ collateral_type: CollateralType })
  .passthrough()
const SetCollateralTotalRequest = z
  .object({ total_eur: z.union([z.number(), z.string()]) })
  .passthrough()
const SetCollateralEvidenceRequest = z
  .object({ evidence_document_id: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const RedetermineCollateralRequest = z
  .object({ total_eur: z.union([z.number(), z.string()]) })
  .passthrough()
const CombinedDocumentResponse = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    media_id: z.string().uuid(),
    file_name: z.string(),
    is_current: z.boolean(),
    build_kind: z.string(),
    document_count: z.number().int(),
    built_by: z.string().uuid(),
    built_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CombinedDocumentListResponse = z
  .object({
    case_id: z.string().uuid(),
    builds: z.array(CombinedDocumentResponse),
  })
  .passthrough()
const PartyMatchItem = z
  .object({
    contract_id: z.string().uuid(),
    party_role: z.string(),
    kind_of_obligation: z.union([z.string(), z.null()]),
    partner_id: z.string().uuid(),
    display_name: z.string(),
    partner_status: z.string(),
    match_outcome: z.string(),
    has_unresolved_duplicate: z.boolean(),
  })
  .passthrough()
const CasePartyMatchResponse = z
  .object({
    case_id: z.string().uuid(),
    submission_blocked: z.boolean(),
    parties: z.array(PartyMatchItem),
  })
  .passthrough()
const LcCaseDetailResponse = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    display_status: CaseDisplayStatus,
    origin: CaseOrigin,
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const FinancingKind = z.enum(["single", "package"])
const FinancingStatus = z.enum([
  "calculating",
  "ready_for_setup",
  "disbursed",
  "active",
  "ended",
  "cancelled",
])
const FinancingRead = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    financing_reference: z.string(),
    framework_agreement_id: z.union([z.string(), z.null()]),
    product_template_id: z.union([z.string(), z.null()]),
    product_template_version: z.union([z.string(), z.null()]),
    kind: FinancingKind,
    refinancing_rate: z.union([z.string(), z.null()]),
    refinancing_quota_override: z.union([z.string(), z.null()]),
    effective_quota: z.union([z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    committed_rate: z.union([z.string(), z.null()]),
    committed_rate_expiry: z.union([z.string(), z.null()]),
    rate_lock_days: z.union([z.number(), z.null()]),
    settlement_ready: z.boolean(),
    calculation_state: z.string(),
    calculation_version: z.number().int(),
    loan_number: z.union([z.string(), z.null()]),
    loan_account: z.union([z.string(), z.null()]),
    status: FinancingStatus,
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const ObjectRef = z
  .object({
    object_id: z.string().uuid(),
    object_number: z.number().int(),
    object_group: z.union([z.string(), z.null()]),
    object_sub_group: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FinancingContractRef = z
  .object({
    contract_id: z.string().uuid(),
    short_name: z.union([z.string(), z.null()]),
    leasing_company_contract_number: z.union([z.string(), z.null()]),
    contract_type: z.union([z.string(), z.null()]),
    status: z.string(),
    financing_amount_share: z.union([z.string(), z.null()]),
    objects: z.array(ObjectRef),
  })
  .passthrough()
const DecisionRef = z
  .object({
    request_status: z.union([z.string(), z.null()]),
    decision_reason: z.union([z.string(), z.null()]),
    decided_by: z.union([z.string(), z.null()]),
    decided_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ApprovalConditionState = z.enum(["open", "met", "waived", "expired"])
const CovenantRef = z
  .object({
    id: z.string().uuid(),
    condition_text: z.string(),
    state: ApprovalConditionState,
    due_date: z.string(),
    step_reference: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FinancingHistoryEntry = z
  .object({
    status: FinancingStatus,
    changed_by: z.union([z.string(), z.null()]),
    changed_at: z.union([z.string(), z.null()]),
    by_system: z.boolean(),
    ended_reason: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FinancingOverviewResponse = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    financing_reference: z.string(),
    status: FinancingStatus,
    kind: FinancingKind,
    framework_agreement_id: z.union([z.string(), z.null()]),
    product_template_id: z.union([z.string(), z.null()]),
    lc_partner_id: z.union([z.string(), z.null()]),
    loan_number: z.union([z.string(), z.null()]),
    loan_account: z.union([z.string(), z.null()]),
    refinancing_rate: z.union([z.string(), z.null()]),
    effective_quota: z.union([z.string(), z.null()]),
    collateral_total: z.union([z.string(), z.null()]),
    contract_count: z.number().int(),
    object_count: z.number().int(),
    nominal_claim: z.union([z.string(), z.null()]),
    present_value: z.union([z.string(), z.null()]),
    financing_amount: z.union([z.string(), z.null()]),
    financing_quote_pct: z.union([z.string(), z.null()]),
    figures_pending: z.boolean(),
    bank_figures_visible: z.boolean(),
    contracts: z.array(FinancingContractRef),
    originating_decision: z.union([DecisionRef, z.null()]),
    covenants: z.array(CovenantRef),
    open_covenant_count: z.number().int(),
    financing_history: z.array(FinancingHistoryEntry),
  })
  .passthrough()
const RecordLoanValuesRequest = z
  .object({
    loan_number: z.union([z.string(), z.null()]),
    loan_account: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const SetRefinancingRateRequest = z
  .object({ rate: z.union([z.number(), z.string()]) })
  .passthrough()
const OverrideQuotaRequest = z
  .object({ quota: z.union([z.number(), z.string()]) })
  .passthrough()
const SetValueDateRequest = z.object({ value_date: z.string() }).passthrough()
const CommitRateRequest = z
  .object({ lock_days: z.number().int().default(7) })
  .partial()
  .passthrough()
const AddApprovalConditionRequest = z
  .object({
    condition_text: z.string().min(1),
    due_date: z.string(),
    step_reference: z.union([z.string(), z.null()]).optional(),
    evidence_document_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ApprovalConditionResponse = z
  .object({
    id: z.string().uuid(),
    financing_id: z.string().uuid(),
    condition_text: z.string(),
    due_date: z.string(),
    state: ApprovalConditionState,
    step_reference: z.union([z.string(), z.null()]),
    evidence_document_id: z.union([z.string(), z.null()]),
    set_by: z.string().uuid(),
    set_at: z.string().datetime({ offset: true }),
    settled_by: z.union([z.string(), z.null()]),
    settled_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ApprovalConditionListResponse = z
  .object({
    conditions: z.array(ApprovalConditionResponse),
    open_count: z.number().int(),
    all_settled: z.boolean(),
  })
  .passthrough()
const WaiveConditionRequest = z
  .object({ reason: z.string().min(1), waiver_expiry: z.string() })
  .passthrough()
const GovernedActionType = z.enum([
  "tenant_create",
  "tenant_suspend",
  "tenant_reactivate",
  "tenant_archive",
  "user_platform_invite",
  "user_role_change",
  "user_auditor_period_update",
  "user_email_change",
  "module_activate",
  "partner_archive",
  "partner_confirm",
  "partner_role_assign",
  "partner_identity_change",
  "partner_merge",
  "financing_approval_condition_waive",
])
const GovernedActionStatus = z.enum([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "expired",
])
const GovernedActionResponse = z
  .object({
    id: z.string().uuid(),
    action_type: GovernedActionType,
    subject_type: z.string(),
    subject_id: z.union([z.string(), z.null()]),
    tenant_id: z.union([z.string(), z.null()]),
    status: GovernedActionStatus,
    initiator_id: z.string().uuid(),
    approver_id: z.union([z.string(), z.null()]),
    display_snapshot: z.object({}).partial().passthrough(),
    initiator_snapshot: z.object({}).partial().passthrough(),
    approver_snapshot: z.union([
      z.object({}).partial().passthrough(),
      z.null(),
    ]),
    execution_params: z.object({}).partial().passthrough(),
    reason: z.union([z.string(), z.null()]),
    approver_comment: z.union([z.string(), z.null()]),
    expires_at: z.union([z.string(), z.null()]),
    resolved_at: z.union([z.string(), z.null()]),
    correlation_id: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const FinancingComponentResponse = z
  .object({
    id: z.string().uuid(),
    contract_id: z.string().uuid(),
    status: z.string(),
    calculated_as_of: z.union([z.string(), z.null()]),
    freeze_timestamp: z.union([z.string(), z.null()]),
    financing_amount_share: z.union([z.string(), z.null()]),
    financed_residual: z.union([z.string(), z.null()]),
    share_running_instalment: z.union([z.string(), z.null()]),
    share_final_instalment: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FinancingComponentListResponse = z
  .object({
    case_id: z.string().uuid(),
    components: z.array(FinancingComponentResponse),
  })
  .passthrough()
const PaymentPlanEntryResponse = z
  .object({
    due_date: z.string(),
    amount: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    is_final: z.boolean(),
    origin: z.string(),
  })
  .passthrough()
const PaymentPlanResponse = z
  .object({
    component: FinancingComponentResponse,
    entries: z.array(PaymentPlanEntryResponse),
  })
  .passthrough()
const ManualPlanRowRequest = z
  .object({
    due_date: z.string(),
    amount: z.union([z.number(), z.string()]),
    is_final: z.boolean().optional().default(false),
  })
  .passthrough()
const SetManualPlanRequest = z
  .object({ rows: z.array(ManualPlanRowRequest).min(1) })
  .passthrough()
const RefinancedCashFlowLine = z
  .object({
    due_date: z.string(),
    amount: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
  })
  .passthrough()
const RefinancedCashFlowResponse = z
  .object({
    contract_id: z.string().uuid(),
    total_instalments: z.number().int(),
    refinanced_instalments: z.number().int(),
    lines: z.array(RefinancedCashFlowLine),
  })
  .passthrough()
const RemainingBalanceResponse = z
  .object({
    contract_id: z.string().uuid(),
    as_of: z.string(),
    remaining_balance: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
  })
  .passthrough()
const ContractContributionItem = z
  .object({
    contract_id: z.string().uuid(),
    status: z.string(),
    financing_amount_share: z.union([z.string(), z.null()]),
    refinanced_instalments: z.number().int(),
  })
  .passthrough()
const ContractContributionListResponse = z
  .object({
    case_id: z.string().uuid(),
    contributions: z.array(ContractContributionItem),
    contract_count: z.number().int(),
    contribution_sum: z.union([z.string(), z.null()]),
    figures_pending: z.boolean(),
  })
  .passthrough()
const PerContractSideResponse = z
  .object({
    contract_id: z.string().uuid(),
    component: FinancingComponentResponse,
    refinanced_side: RefinancedCashFlowResponse,
    lease_side: z.array(PaymentPlanEntryResponse),
    absent_blocks: z.array(z.string()),
  })
  .passthrough()
const FinancingRemainingBalanceResponse = z
  .object({
    case_id: z.string().uuid(),
    as_of: z.string(),
    remaining_balance: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
  })
  .passthrough()
const batch_id = z.union([z.string(), z.null()]).optional()
const ContractDeferredState = z.enum(["active", "deferred"])
const ContractCompleteness = z.enum(["complete", "incomplete"])
const ContractRead = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    lessee_partner_id: z.union([z.string(), z.null()]),
    contract_type: z.union([z.string(), z.null()]),
    contract_residual: z.union([z.string(), z.null()]),
    deferred_state: ContractDeferredState,
    batch_id: z.union([z.string(), z.null()]),
    contract_origin: z.union([z.string(), z.null()]),
    completeness: ContractCompleteness,
    missing_fields: z.array(z.string()),
    removed_at: z.union([z.string(), z.null()]),
    removal_reason: z.union([z.string(), z.null()]),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    short_name: z.union([z.string(), z.null()]).optional(),
    amortisation_type: z.union([z.string(), z.null()]).optional(),
    term_months: z.union([z.number(), z.null()]).optional(),
    net_instalment: z.union([z.string(), z.null()]).optional(),
    target_closing_balance: z.union([z.string(), z.null()]).optional(),
    instalment_frequency: z.union([z.string(), z.null()]).optional(),
    leasing_company_contract_number: z.union([z.string(), z.null()]).optional(),
    deviating_first_due_date: z.union([z.string(), z.null()]).optional(),
    mileage_lease: z.union([z.boolean(), z.null()]).optional(),
    contract_start: z.union([z.string(), z.null()]).optional(),
    non_refinanceable_part: z.union([z.string(), z.null()]).optional(),
    special_payment: z.union([z.string(), z.null()]).optional(),
    residual_value: z.union([z.string(), z.null()]).optional(),
    buy_back_agreement: z.union([z.boolean(), z.null()]).optional(),
    put_option: z.union([z.boolean(), z.null()]).optional(),
    amortisation_warning: z.union([z.string(), z.null()]).optional(),
    settlement_blockers: z.array(z.string()).optional(),
  })
  .passthrough()
const ContractListResponse = z
  .object({ items: z.array(ContractRead), total: z.number().int() })
  .passthrough()
const ContractType = z.enum(["lease", "hire_purchase"])
const AmortisationType = z.enum(["full", "partial"])
const InstalmentFrequency = z.enum([
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
  "custom",
])
const ContractCreate = z
  .object({
    lessee_partner_id: z.union([z.string(), z.null()]),
    contract_type: z.union([ContractType, z.null()]),
    amortisation_type: z.union([AmortisationType, z.null()]),
    term_months: z.union([z.number(), z.null()]),
    net_instalment: z.union([z.number(), z.string(), z.null()]),
    contract_residual: z.union([z.number(), z.string(), z.null()]),
    target_closing_balance: z.union([z.number(), z.string(), z.null()]),
    instalment_frequency: z.union([InstalmentFrequency, z.null()]),
    short_name: z.union([z.string(), z.null()]),
    leasing_company_contract_number: z.union([z.string(), z.null()]),
    deviating_first_due_date: z.union([z.string(), z.null()]),
    mileage_lease: z.union([z.boolean(), z.null()]),
    contract_start: z.union([z.string(), z.null()]),
    non_refinanceable_part: z.union([z.number(), z.string(), z.null()]),
    special_payment: z.union([z.number(), z.string(), z.null()]),
    residual_value: z.union([z.number(), z.string(), z.null()]),
    buy_back_agreement: z.union([z.boolean(), z.null()]),
    put_option: z.union([z.boolean(), z.null()]),
    batch_id: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const PackageTotalsRead = z
  .object({
    contract_count: z.number().int(),
    residual_sum: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    acquisition_cost_sum: z.union([z.string(), z.null()]),
    special_payment_sum: z.union([z.string(), z.null()]),
  })
  .passthrough()
const BulkRemoveRequest = z
  .object({
    contract_ids: z.array(z.string().uuid()).min(1).max(100),
    reason: z.string().min(1).max(255),
  })
  .passthrough()
const BulkRemoveResponse = z.object({ removed: z.number().int() }).passthrough()
const ContractEdit = z
  .object({
    lessee_partner_id: z.union([z.string(), z.null()]),
    contract_type: z.union([ContractType, z.null()]),
    amortisation_type: z.union([AmortisationType, z.null()]),
    term_months: z.union([z.number(), z.null()]),
    net_instalment: z.union([z.number(), z.string(), z.null()]),
    contract_residual: z.union([z.number(), z.string(), z.null()]),
    target_closing_balance: z.union([z.number(), z.string(), z.null()]),
    instalment_frequency: z.union([InstalmentFrequency, z.null()]),
    short_name: z.union([z.string(), z.null()]),
    leasing_company_contract_number: z.union([z.string(), z.null()]),
    deviating_first_due_date: z.union([z.string(), z.null()]),
    mileage_lease: z.union([z.boolean(), z.null()]),
    contract_start: z.union([z.string(), z.null()]),
    non_refinanceable_part: z.union([z.number(), z.string(), z.null()]),
    special_payment: z.union([z.number(), z.string(), z.null()]),
    residual_value: z.union([z.number(), z.string(), z.null()]),
    buy_back_agreement: z.union([z.boolean(), z.null()]),
    put_option: z.union([z.boolean(), z.null()]),
  })
  .partial()
  .passthrough()
const ContractRemove = z
  .object({ reason: z.string().min(1).max(255) })
  .passthrough()
const ObjectSubGroupItem = z
  .object({ code: z.string(), name: z.string() })
  .passthrough()
const ObjectGroupItem = z
  .object({
    code: z.string(),
    name: z.string(),
    is_vehicle: z.boolean(),
    provenance: z.string(),
    sub_groups: z.array(ObjectSubGroupItem),
  })
  .passthrough()
const ObjectClassificationResponse = z
  .object({ groups: z.array(ObjectGroupItem) })
  .passthrough()
const LeaseObjectRead = z
  .object({
    id: z.string().uuid(),
    contract_id: z.string().uuid(),
    object_number: z.number().int(),
    object_group: z.union([z.string(), z.null()]),
    object_sub_group: z.union([z.string(), z.null()]),
    object_description: z.union([z.string(), z.null()]),
    manufacturer: z.union([z.string(), z.null()]),
    brand: z.union([z.string(), z.null()]),
    year_of_manufacture: z.union([z.number(), z.null()]),
    chassis_or_serial_number: z.union([z.string(), z.null()]),
    registration_plate: z.union([z.string(), z.null()]),
    vehicle_registration_document_number: z.union([z.string(), z.null()]),
    new_or_used: z.string(),
    acquisition_cost: z.union([z.string(), z.null()]),
    residual_value: z.union([z.string(), z.null()]),
    special_payment: z.union([z.string(), z.null()]),
    market_value: z.union([z.string(), z.null()]),
    market_value_indicator: z.union([z.string(), z.null()]),
    appraised_value: z.union([z.string(), z.null()]),
    value_as_at: z.union([z.string(), z.null()]),
    dat_evidence_status: z.union([z.string(), z.null()]),
    dat_evidence_document_id: z.union([z.string(), z.null()]),
    removed_at: z.union([z.string(), z.null()]),
    removal_reason: z.union([z.string(), z.null()]),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    residual_warning: z.union([z.string(), z.null()]).optional(),
    capped_collateral_figure: z.union([z.string(), z.null()]).optional(),
    cap_applied: z.boolean().optional().default(false),
    missing_for_vehicle: z.array(z.string()).optional(),
  })
  .passthrough()
const LeaseObjectListResponse = z
  .object({ contract_id: z.string().uuid(), objects: z.array(LeaseObjectRead) })
  .passthrough()
const NewOrUsed = z.enum(["new", "used"])
const MarketValueIndicator = z.literal("i_o")
const DATEvidenceStatus = z.enum(["pending", "uploaded"])
const LeaseObjectCreate = z
  .object({
    object_group: z.union([z.string(), z.null()]),
    object_sub_group: z.union([z.string(), z.null()]),
    object_description: z.union([z.string(), z.null()]),
    manufacturer: z.union([z.string(), z.null()]),
    brand: z.union([z.string(), z.null()]),
    year_of_manufacture: z.union([z.number(), z.null()]),
    chassis_or_serial_number: z.union([z.string(), z.null()]),
    registration_plate: z.union([z.string(), z.null()]),
    vehicle_registration_document_number: z.union([z.string(), z.null()]),
    new_or_used: z.union([NewOrUsed, z.null()]),
    acquisition_cost: z.union([z.number(), z.string(), z.null()]),
    residual_value: z.union([z.number(), z.string(), z.null()]),
    special_payment: z.union([z.number(), z.string(), z.null()]),
    market_value: z.union([z.number(), z.string(), z.null()]),
    market_value_indicator: z.union([MarketValueIndicator, z.null()]),
    appraised_value: z.union([z.number(), z.string(), z.null()]),
    value_as_at: z.union([z.string(), z.null()]),
    dat_evidence_status: z.union([DATEvidenceStatus, z.null()]),
    dat_evidence_document_id: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const LeaseObjectEdit = z
  .object({
    object_group: z.union([z.string(), z.null()]),
    object_sub_group: z.union([z.string(), z.null()]),
    object_description: z.union([z.string(), z.null()]),
    manufacturer: z.union([z.string(), z.null()]),
    brand: z.union([z.string(), z.null()]),
    year_of_manufacture: z.union([z.number(), z.null()]),
    chassis_or_serial_number: z.union([z.string(), z.null()]),
    registration_plate: z.union([z.string(), z.null()]),
    vehicle_registration_document_number: z.union([z.string(), z.null()]),
    new_or_used: z.union([NewOrUsed, z.null()]),
    acquisition_cost: z.union([z.number(), z.string(), z.null()]),
    residual_value: z.union([z.number(), z.string(), z.null()]),
    special_payment: z.union([z.number(), z.string(), z.null()]),
    market_value: z.union([z.number(), z.string(), z.null()]),
    market_value_indicator: z.union([MarketValueIndicator, z.null()]),
    appraised_value: z.union([z.number(), z.string(), z.null()]),
    value_as_at: z.union([z.string(), z.null()]),
    dat_evidence_status: z.union([DATEvidenceStatus, z.null()]),
    dat_evidence_document_id: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const LeaseObjectRemove = z
  .object({ reason: z.string().min(1).max(255) })
  .passthrough()
const RegisteredAddressInput = z
  .object({
    street: z.string().min(1),
    city: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().min(1),
    state_region: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const LegalEntityIdentityInput = z
  .object({
    partner_type: z.string(),
    legal_name: z.string(),
    legal_form: z.union([z.string(), z.null()]).optional(),
    country: z.string().min(2).max(2),
    tax_id_vat: z.union([z.string(), z.null()]).optional(),
    lei: z.union([z.string(), z.null()]).optional(),
    commercial_register_no: z.union([z.string(), z.null()]).optional(),
    registered_address: z.union([RegisteredAddressInput, z.null()]).optional(),
    foreign_identifier: z.union([z.string(), z.null()]).optional(),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
    industry_code: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const NaturalPersonIdentityInput = z
  .object({
    partner_type: z.string(),
    full_name: z.string(),
    date_of_birth: z.string(),
    place_of_birth: z.string(),
    country: z.string().min(2).max(2),
    birth_name: z.union([z.string(), z.null()]).optional(),
    national_id: z.union([z.string(), z.null()]).optional(),
    registered_address: z.union([RegisteredAddressInput, z.null()]).optional(),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const SoleProprietorIdentityInput = z
  .object({
    partner_type: z.string(),
    full_name: z.string(),
    date_of_birth: z.string(),
    country: z.string().min(2).max(2),
    tax_id_vat: z.union([z.string(), z.null()]).optional(),
    commercial_register_no: z.union([z.string(), z.null()]).optional(),
    registered_address: z.union([RegisteredAddressInput, z.null()]).optional(),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const LesseePreviewRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      NaturalPersonIdentityInput,
      SoleProprietorIdentityInput,
    ]),
  })
  .passthrough()
const PartnerType = z.enum([
  "legal_entity",
  "natural_person",
  "registered_sole_trader",
])
const CandidateSummary = z
  .object({
    partner_id: z.string(),
    display_name: z.string(),
    partner_type: PartnerType,
    status: z.string(),
    matched_anchors: z.array(z.string()),
    confidence: z.string(),
  })
  .passthrough()
const PartnerMatchResponse = z
  .object({
    classification: z.string(),
    confidence: z.union([z.string(), z.null()]),
    matched_partner_id: z.union([z.string(), z.null()]),
    candidate_summaries: z.array(CandidateSummary),
    inputs_hash: z.string(),
  })
  .passthrough()
const LesseeCaptureRequest = z
  .object({
    existing_partner_id: z.union([z.string(), z.null()]),
    identity: z.union([
      z.discriminatedUnion("partner_type", [
        LegalEntityIdentityInput,
        NaturalPersonIdentityInput,
        SoleProprietorIdentityInput,
      ]),
      z.null(),
    ]),
  })
  .partial()
  .passthrough()
const LesseeLinkResponse = z
  .object({
    contract_id: z.string().uuid(),
    lessee_partner_id: z.string().uuid(),
    is_new: z.boolean(),
    partner_status: z.string(),
  })
  .passthrough()
const RegisteredAddress = z
  .object({
    street: z.union([z.string(), z.null()]),
    city: z.union([z.string(), z.null()]),
    postal_code: z.union([z.string(), z.null()]),
    country: z.union([z.string(), z.null()]),
    state_region: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const LegalEntityIdentityDetail = z
  .object({
    partner_type: z.string(),
    legal_name: z.string(),
    legal_form: z.union([z.string(), z.null()]),
    country: z.string(),
    tax_id_vat: z.union([z.string(), z.null()]),
    lei: z.union([z.string(), z.null()]),
    commercial_register_no: z.union([z.string(), z.null()]),
    registered_address: z.union([RegisteredAddress, z.null()]),
    foreign_identifier: z.union([z.string(), z.null()]),
  })
  .passthrough()
const NaturalPersonIdentityDetail = z
  .object({
    partner_type: z.string(),
    full_name: z.string(),
    date_of_birth: z.string(),
    place_of_birth: z.string(),
    country: z.string(),
    birth_name: z.union([z.string(), z.null()]),
    national_id: z.union([z.string(), z.null()]),
    registered_address: z.union([RegisteredAddress, z.null()]),
  })
  .passthrough()
const SoleProprietorIdentityDetail = z
  .object({
    partner_type: z.string(),
    full_name: z.string(),
    date_of_birth: z.string(),
    country: z.string(),
    tax_id_vat: z.union([z.string(), z.null()]),
    commercial_register_no: z.union([z.string(), z.null()]),
    registered_address: z.union([RegisteredAddress, z.null()]),
  })
  .passthrough()
const PartnerDetailResponse = z
  .object({
    partner_id: z.string(),
    display_name: z.string(),
    partner_type: PartnerType,
    status: z.string(),
    ubo_completeness_status: z.string(),
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityDetail,
      NaturalPersonIdentityDetail,
      SoleProprietorIdentityDetail,
    ]),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const GuarantorPreviewRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      NaturalPersonIdentityInput,
      SoleProprietorIdentityInput,
    ]),
  })
  .passthrough()
const GuarantorAddRequest = z
  .object({
    existing_partner_id: z.union([z.string(), z.null()]),
    identity: z.union([
      z.discriminatedUnion("partner_type", [
        LegalEntityIdentityInput,
        NaturalPersonIdentityInput,
        SoleProprietorIdentityInput,
      ]),
      z.null(),
    ]),
    kind_of_obligation: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const GuarantorLinkResponse = z
  .object({
    link_id: z.string().uuid(),
    contract_id: z.string().uuid(),
    guarantor_partner_id: z.string().uuid(),
    kind_of_obligation: z.union([z.string(), z.null()]),
    is_new: z.boolean(),
    partner_status: z.string(),
  })
  .passthrough()
const GuarantorListItem = z
  .object({
    link_id: z.string().uuid(),
    guarantor_partner_id: z.string().uuid(),
    kind_of_obligation: z.union([z.string(), z.null()]),
    display_name: z.union([z.string(), z.null()]),
  })
  .passthrough()
const GuarantorListResponse = z
  .object({
    contract_id: z.string().uuid(),
    count: z.number().int(),
    guarantors: z.array(GuarantorListItem),
  })
  .passthrough()
const GuarantorRemoveRequest = z
  .object({ reason: z.string().min(1).max(255) })
  .passthrough()
const Body_upload_contract_import_api_v1_cases__case_id__contracts_import_post =
  z.object({ file: z.string() }).passthrough()
const ImportBatchResponse = z
  .object({
    batch_id: z.string().uuid(),
    case_id: z.string().uuid(),
    file_name: z.string(),
    status: z.string(),
    rows_held: z.number().int(),
    rows_valid: z.number().int(),
    rows_failed: z.number().int(),
    precondition_error: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const ImportRowItem = z
  .object({
    row_number: z.number().int(),
    status: z.string(),
    rejection_kind: z.union([z.string(), z.null()]),
    error_field: z.union([z.string(), z.null()]),
    error_message: z.union([z.string(), z.null()]),
    raw_data: z.object({}).partial().passthrough(),
    contract_id: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ImportBatchPreviewResponse = z
  .object({
    batch_id: z.string().uuid(),
    case_id: z.string().uuid(),
    file_name: z.string(),
    status: z.string(),
    rows_held: z.number().int(),
    rows_valid: z.number().int(),
    rows_failed: z.number().int(),
    rows_committed: z.number().int(),
    precondition_error: z.union([z.string(), z.null()]),
    rows: z.array(ImportRowItem),
  })
  .passthrough()
const ImportCommitResponse = z
  .object({
    batch_id: z.string().uuid(),
    status: z.string(),
    committed: z.number().int(),
    remaining_failed: z.number().int(),
  })
  .passthrough()
const UpdateMeRequest = z
  .object({
    first_name: z.union([z.string(), z.null()]),
    last_name: z.union([z.string(), z.null()]),
    phone_number: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const UserMePermissionsResponse = z
  .object({
    role: z.string(),
    permissions: z.array(z.string()),
    active_modules: z.array(z.string()),
  })
  .passthrough()
const AccessReason = z.enum([
  "user_access_issue",
  "workflow_processing_diagnostic",
  "document_generation_diagnostic",
  "integration_troubleshooting",
  "compliance_query_support",
  "regulatory_assistance",
  "emergency_incident_response",
])
const GrantStatus = z.enum(["active", "expired", "revoked"])
const SupportGrantResponse = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    grantee_id: z.string().uuid(),
    granted_by: z.string().uuid(),
    access_reason: AccessReason,
    valid_from: z.string().datetime({ offset: true }),
    valid_until: z.string().datetime({ offset: true }),
    status: GrantStatus,
    additional_context: z.union([z.string(), z.null()]),
    revocation_reason: z.union([z.string(), z.null()]),
    revoked_by: z.union([z.string(), z.null()]),
    revoked_at: z.union([z.string(), z.null()]),
    is_emergency: z.boolean(),
    review_required_by: z.union([z.string(), z.null()]),
    review_completed_at: z.union([z.string(), z.null()]),
    reviewed_by: z.union([z.string(), z.null()]),
    review_outcome: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const Body_upload_picture_api_v1_users_me_picture_post = z
  .object({ file: z.string() })
  .passthrough()
const UserListItem = z
  .object({
    id: z.string().uuid(),
    user_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    role: UserRole,
    tenant_id: z.union([z.string(), z.null()]),
    tenant_name: z.union([z.string(), z.null()]),
    status: UserStatus,
    phone_number: z.union([z.string(), z.null()]),
    profile_picture_url: z.union([z.string(), z.null()]).optional(),
    last_login: z.union([z.string(), z.null()]),
    access_valid_until: z.union([z.string(), z.null()]),
  })
  .passthrough()
const PaginatedUsersResponse = z
  .object({
    users: z.array(UserListItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const InviteUserRequest = z
  .object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.string().email(),
    role: UserRole,
    tenant_id: z.union([z.string(), z.null()]).optional(),
    access_valid_until: z.union([z.string(), z.null()]).optional(),
    lc_partner_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const app__modules__users__interfaces__http__schemas__user_schemas__UserRef = z
  .object({ id: z.string(), name: z.string() })
  .passthrough()
const UserDetailResponse = z
  .object({
    id: z.string().uuid(),
    user_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    role: UserRole,
    status: UserStatus,
    tenant_id: z.union([z.string(), z.null()]),
    tenant_name: z.union([z.string(), z.null()]),
    lc_partner_id: z.union([z.string(), z.null()]).optional(),
    phone_number: z.union([z.string(), z.null()]),
    pending_email: z.union([z.string(), z.null()]),
    profile_picture_url: z.union([z.string(), z.null()]),
    access_valid_until: z.union([z.string(), z.null()]),
    invited_by: z.union([
      app__modules__users__interfaces__http__schemas__user_schemas__UserRef,
      z.null(),
    ]),
    approved_by: z.union([
      app__modules__users__interfaces__http__schemas__user_schemas__UserRef,
      z.null(),
    ]),
    invited_at: z.union([z.string(), z.null()]),
    activated_at: z.union([z.string(), z.null()]),
    last_login: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const EditUserRequest = z
  .object({
    first_name: z.union([z.string(), z.null()]),
    last_name: z.union([z.string(), z.null()]),
    phone_number: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const ChangeEmailRequest = z
  .object({ new_email: z.string().email() })
  .passthrough()
const ResendReason = z.enum([
  "invitation_expired",
  "not_received",
  "user_request",
  "administrative_action",
  "other",
])
const ResendInvitationRequest = z.object({ reason: ResendReason }).passthrough()
const SuspensionReason = z.enum([
  "temporary_access_restriction",
  "security_concern",
  "organizational_change",
  "compliance_review",
  "administrative_decision",
  "other",
])
const SuspendUserRequest = z
  .object({
    reason: SuspensionReason,
    comment: z.union([z.string(), z.null()]).optional(),
    effective_from: z.string().datetime({ offset: true }),
    effective_until: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ReactivationReason = z.enum([
  "suspension_period_ended",
  "administrative_decision",
  "compliance_clearance",
  "security_clearance",
  "other",
  "suspension_expired",
])
const ReactivateUserRequest = z
  .object({
    reason: ReactivationReason,
    comment: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const DeactivationReason = z.enum([
  "offboarding",
  "organizational_change",
  "compliance_restriction",
  "security_restriction",
  "administrative_decision",
  "other",
])
const DeactivateUserRequest = z
  .object({
    reason: DeactivationReason,
    comment: z.union([z.string(), z.null()]).optional(),
    effective_from: z.string().datetime({ offset: true }),
  })
  .passthrough()
const TenantType = z.enum(["bank", "bank_entity", "bank_branch_group"])
const DefaultCurrency = z.enum(["EUR", "USD"])
const SeedPackage = z.enum(["standard_retail_bank", "minimal_sandbox"])
const CreateTenantRequest = z
  .object({
    name: z.string().min(2).max(200),
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Za-z0-9\-]+$/),
    legal_entity_name: z.string().min(2).max(300),
    country: z.string().min(2).max(2),
    tenant_type: TenantType,
    description: z.union([z.string(), z.null()]).optional(),
    modules: z.array(z.string()).optional(),
    default_currency: DefaultCurrency.optional(),
    seed_package: SeedPackage.optional(),
    core_banking_integration_ref: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const TenantStatus = z.enum([
  "draft",
  "active",
  "suspended",
  "archived",
  "rejected",
  "expired",
])
const module_active = z.union([z.boolean(), z.null()]).optional()
const TenantListResponse = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string(),
    name: z.string(),
    code: z.string(),
    country: z.string(),
    default_currency: z.string(),
    tenant_type: TenantType,
    status: TenantStatus,
    active_module_count: z.number().int(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const PaginatedTenantsResponse = z
  .object({
    tenants: z.array(TenantListResponse),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const TenantResponse = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string(),
    name: z.string(),
    code: z.string(),
    legal_entity_name: z.string(),
    country: z.string(),
    default_currency: z.string(),
    tenant_type: TenantType,
    description: z.union([z.string(), z.null()]),
    seed_package: SeedPackage,
    core_banking_integration_ref: z.union([z.string(), z.null()]),
    status: TenantStatus,
    legal_hold_flag: z.boolean(),
    activated_at: z.union([z.string(), z.null()]),
    mfa_required: z.boolean(),
    max_lc_count: z.number().int(),
    max_bank_user_count: z.number().int(),
    max_users_per_lc: z.number().int(),
    lc_utilisation: z.number().int().optional().default(0),
    bank_user_utilisation: z.number().int().optional().default(0),
    lc_user_highest_active: z.number().int().optional().default(0),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    created_by: z.union([z.string(), z.null()]).optional(),
    approved_by: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const TenantSupportResponse = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    tenant_type: TenantType,
    status: TenantStatus,
    country: z.string(),
    default_currency: z.string(),
    activated_at: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const UpdateTenantRequest = z
  .object({
    name: z.union([z.string(), z.null()]),
    legal_entity_name: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
    legal_hold_flag: z.union([z.boolean(), z.null()]),
    max_lc_count: z.union([z.number(), z.null()]),
    max_bank_user_count: z.union([z.number(), z.null()]),
    max_users_per_lc: z.union([z.number(), z.null()]),
    justification: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const SuspendTenantRequest = z
  .object({
    justification: z.string().min(30),
    effective_from: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ReactivateTenantRequest = z
  .object({ justification: z.string().min(20) })
  .passthrough()
const ArchiveTenantRequest = z
  .object({
    justification: z.string().min(50),
    irreversibility_acknowledgement: z.boolean(),
  })
  .passthrough()
const MfaPolicyRequest = z.object({ mfa_required: z.boolean() }).passthrough()
const GovernanceHistoryEventResponse = z
  .object({
    id: z.string().uuid(),
    event_type: z.string(),
    actor_display: z.union([z.string(), z.null()]),
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    reason: z.union([z.string(), z.null()]),
    recorded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const GovernanceHistoryResponse = z
  .object({
    events: z.array(GovernanceHistoryEventResponse),
    next_cursor: z.union([z.string(), z.null()]),
  })
  .passthrough()
const AccessPolicyFlagRecord = z
  .object({
    enabled: z.boolean(),
    modified_by: z.union([z.string(), z.null()]),
    modified_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const AccessPolicyResponse = z
  .object({
    support_read_only_access: AccessPolicyFlagRecord,
    auditor_access: AccessPolicyFlagRecord,
    lc_portal: AccessPolicyFlagRecord,
  })
  .passthrough()
const AccessPolicyRequest = z
  .object({
    support_read_only_access_allowed: z
      .union([z.boolean(), z.null()])
      .optional(),
    auditor_access_allowed: z.union([z.boolean(), z.null()]).optional(),
    lc_portal_enabled: z.union([z.boolean(), z.null()]).optional(),
    reason: z.string().min(20),
  })
  .passthrough()
const IntegrationBindingResponse = z
  .object({
    id: z.union([z.string(), z.null()]),
    tenant_id: z.union([z.string(), z.null()]),
    endpoint_url: z.union([z.string(), z.null()]),
    integration_active: z.union([z.boolean(), z.null()]),
    credential_scope_identifier: z.union([z.string(), z.null()]),
    disbursement_execution_boundary_note: z.union([z.string(), z.null()]),
    created_by: z.union([z.string(), z.null()]),
    created_at: z.union([z.string(), z.null()]),
    last_modified_by: z.union([z.string(), z.null()]),
    updated_at: z.union([z.string(), z.null()]),
    decommission_timestamp: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const UpsertIntegrationBindingRequest = z
  .object({
    endpoint_url: z.string(),
    integration_active: z.boolean().optional().default(false),
    credential_scope_identifier: z.string(),
    disbursement_execution_boundary_note: z
      .union([z.string(), z.null()])
      .optional(),
    justification: z.string().min(20),
  })
  .passthrough()
const CreateGrantRequest = z
  .object({
    grantee_id: z.string().uuid(),
    access_reason: AccessReason,
    valid_from: z.string().datetime({ offset: true }).optional(),
    valid_until: z.string().datetime({ offset: true }),
    additional_context: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const RevokeGrantRequest = z
  .object({ revocation_reason: z.string().min(10) })
  .passthrough()
const CompleteReviewRequest = z
  .object({ outcome: z.string().min(10).max(500) })
  .passthrough()
const PlatformModuleEntry = z
  .object({
    key: z.string(),
    display_name: z.string(),
    group: z.string(),
    always_on: z.boolean(),
    permissions: z.array(z.string()),
  })
  .passthrough()
const PlatformModulesResponse = z
  .object({ modules: z.array(PlatformModuleEntry) })
  .passthrough()
const TenantModuleEntry = z
  .object({
    key: z.string(),
    display_name: z.string(),
    group: z.string(),
    always_on: z.boolean(),
    status: z.string(),
    activated_at: z.unknown().optional(),
  })
  .passthrough()
const TenantModulesResponse = z
  .object({ modules: z.array(TenantModuleEntry) })
  .passthrough()
const SeedPackageEntry = z
  .object({
    key: z.string(),
    display_name: z.string(),
    description: z.string(),
    includes: z.array(z.string()),
    available: z.boolean(),
  })
  .passthrough()
const SeedPackagesResponse = z
  .object({ packages: z.array(SeedPackageEntry) })
  .passthrough()
const ModuleActionRequest = z
  .object({ justification: z.string().min(10) })
  .passthrough()
const ModuleDeactivateRequest = z
  .object({ justification: z.string().min(20) })
  .passthrough()
const InitiateRoleChangeRequest = z
  .object({
    new_role: UserRole,
    reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const AuditorPeriodUpdateReason = z.enum([
  "regulatory_audit",
  "internal_audit",
  "compliance_review",
  "investigation",
  "temporary_review_access",
  "other",
])
const UpdateAuditorAccessPeriodRequest = z
  .object({
    new_access_valid_until: z.string().datetime({ offset: true }),
    reason: AuditorPeriodUpdateReason,
  })
  .passthrough()
const SubjectType = z.enum([
  "USER",
  "TENANT",
  "PARTNER",
  "FINANCING_APPROVAL_CONDITION",
])
const subject_type = z.union([z.array(SubjectType), z.null()]).optional()
const PaginatedGovernedActionsResponse = z
  .object({
    actions: z.array(GovernedActionResponse),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const ApproveRejectRequest = z
  .object({
    comment: z.union([z.string(), z.null()]),
    extra_params: z.union([z.object({}).partial().passthrough(), z.null()]),
  })
  .partial()
  .passthrough()
const ReInitiateRequest = z
  .object({ reason: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const AuditFilterOptionsResponse = z
  .object({
    entity_types: z.array(z.string()),
    action_types: z.array(z.string()),
    actor_types: z.array(z.string()),
    trigger_sources: z.array(z.string()),
    event_types: z.array(z.string()),
  })
  .passthrough()
const AuditEventListItem = z
  .object({
    id: z.string().uuid(),
    audit_seq: z.number().int(),
    entity_type: z.string(),
    entity_id: z.union([z.string(), z.null()]),
    entity_display: z.union([z.string(), z.null()]),
    action_type: z.string(),
    event_type: z.string(),
    actor_id: z.string(),
    actor_type: z.string(),
    actor_display: z.union([z.string(), z.null()]),
    actor_role_at_time: z.union([z.string(), z.null()]),
    trigger_source: z.union([z.string(), z.null()]),
    sensitive: z.boolean(),
    tenant_id: z.union([z.string(), z.null()]),
    recorded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const PaginatedAuditEventsResponse = z
  .object({
    events: z.array(AuditEventListItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const FieldDiffItem = z
  .object({
    field: z.string(),
    old_value: z.union([z.unknown(), z.null()]),
    new_value: z.union([z.unknown(), z.null()]),
  })
  .passthrough()
const AuditEventResponse = z
  .object({
    id: z.string().uuid(),
    audit_seq: z.number().int(),
    entity_type: z.string(),
    entity_id: z.union([z.string(), z.null()]),
    entity_display: z.union([z.string(), z.null()]),
    action_type: z.string(),
    event_type: z.string(),
    actor_id: z.string(),
    actor_type: z.string(),
    actor_display: z.union([z.string(), z.null()]),
    actor_role_at_time: z.union([z.string(), z.null()]),
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    changed_fields: z.union([z.array(z.string()), z.null()]),
    field_diffs: z.union([z.array(FieldDiffItem), z.null()]).optional(),
    trigger_source: z.union([z.string(), z.null()]),
    reason: z.union([z.string(), z.null()]),
    comment: z.union([z.string(), z.null()]),
    tenant_id: z.union([z.string(), z.null()]),
    correlation_id: z.union([z.string(), z.null()]),
    session_id: z.union([z.string(), z.null()]),
    payload: z.union([z.object({}).partial().passthrough(), z.null()]),
    sensitive: z.boolean(),
    recorded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const DuplicateResolutionReasonCode = z.enum([
  "identical_registry_identifiers",
  "same_legal_entity_different_name",
  "data_entry_error",
  "system_import_error",
  "legal_restructuring",
  "confirmed_different_entities",
  "subsidiary_not_duplicate",
  "insufficient_evidence",
])
const ResolveDuplicatePairRequest = z
  .object({
    decision: z.enum(["confirmed_duplicate", "confirmed_distinct", "deferred"]),
    reason_code: DuplicateResolutionReasonCode,
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ResolveDuplicatePairResponse = z
  .object({ pair_id: z.string(), status: z.string() })
  .passthrough()
const MergeReasonCode = z.enum([
  "same_legal_entity_different_name",
  "identical_registry_identifiers",
  "data_entry_error",
  "system_import_error",
  "legal_restructuring",
])
const MergeInitiateRequest = z
  .object({
    pair_id: z.string().uuid(),
    survivor_partner_id: z.string().uuid(),
    merge_reason_code: MergeReasonCode,
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const MergeInitiateResponse = z
  .object({
    governed_action_id: z.string(),
    source_partner_id: z.string(),
    target_partner_id: z.string(),
    pair_id: z.string(),
    status: z.string(),
  })
  .passthrough()
const PartnerSubmitRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      NaturalPersonIdentityInput,
      SoleProprietorIdentityInput,
    ]),
  })
  .passthrough()
const PartnerSubmitResponse = z
  .object({
    partner_id: z.string(),
    display_name: z.string(),
    partner_type: PartnerType,
    status: z.string(),
    is_new: z.boolean(),
    governed_action_id: z.union([z.string(), z.null()]).optional(),
    country: z.union([z.string(), z.null()]).optional(),
    tax_id_vat: z.union([z.string(), z.null()]).optional(),
    commercial_register_no: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ResolutionEventSummary = z
  .object({
    classification: z.string(),
    confidence: z.union([z.string(), z.null()]),
    matched_anchors: z.object({}).partial().passthrough(),
    candidate_partner_ids: z.array(z.string()),
    inputs_hash: z.string(),
    resolved_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const ResolutionCandidatesResponse = z
  .object({
    partner_id: z.string(),
    status: z.string(),
    resolution: z.union([ResolutionEventSummary, z.null()]),
    candidates: z.array(CandidateSummary),
  })
  .passthrough()
const ActorSummary = z
  .object({ user_id: z.string(), display_name: z.string(), email: z.string() })
  .passthrough()
const RoleAssignmentSummary = z
  .object({
    role_assignment_id: z.string(),
    role: z.string(),
    status: z.string(),
    is_risk_sensitive: z.boolean(),
    assigned_by: ActorSummary,
    assigned_at: z.string().datetime({ offset: true }),
    note: z.union([z.string(), z.null()]),
    governed_action_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const RoleHistoryEntry = z
  .object({
    role_assignment_id: z.string(),
    actor: ActorSummary,
    actor_role: z.string(),
    description_key: z.string(),
    description_params: z.object({}).partial().passthrough(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough()
const PartnerRolesResponse = z
  .object({
    partner_id: z.string(),
    roles: z.array(RoleAssignmentSummary),
    history: z.array(RoleHistoryEntry),
  })
  .passthrough()
const UboOwnershipRequest = z
  .object({
    ubo_partner_id: z.string().uuid(),
    ownership_percentage: z.union([z.number(), z.string()]),
    ownership_type: z.string().optional().default("direct"),
    indirect_ownership_notes: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const UboOwnershipRecordResponse = z
  .object({
    id: z.string().uuid(),
    ubo_partner_id: z.string().uuid(),
    ubo_display_name: z.string(),
    ownership_percentage: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    ownership_type: z.string(),
    indirect_ownership_notes: z.union([z.string(), z.null()]),
    captured_by: ActorSummary,
    captured_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const PartnerUboResponse = z
  .object({
    ubo_completeness_status: z.string(),
    records: z.array(UboOwnershipRecordResponse),
  })
  .passthrough()
const LcNumberResponse = z
  .object({
    id: z.string(),
    partner_id: z.string(),
    lc_number: z.string(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const LcNumberListResponse = z
  .object({ partner_id: z.string(), items: z.array(LcNumberResponse) })
  .passthrough()
const LcNumberCreateRequest = z
  .object({ lc_number: z.string().regex(/^[0-9]{4}$/) })
  .passthrough()
const BankAccountResponse = z
  .object({
    id: z.string(),
    partner_id: z.string(),
    iban: z.string(),
    account_number: z.union([z.string(), z.null()]),
    holder_name: z.union([z.string(), z.null()]),
    bank_name: z.union([z.string(), z.null()]),
    bic: z.union([z.string(), z.null()]),
    status: z.string(),
    created_at: z.string().datetime({ offset: true }),
    closed_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const BankAccountListResponse = z
  .object({ partner_id: z.string(), items: z.array(BankAccountResponse) })
  .passthrough()
const BankAccountCreateRequest = z
  .object({
    iban: z.string(),
    account_number: z.union([z.string(), z.null()]).optional(),
    holder_name: z.union([z.string(), z.null()]).optional(),
    bank_name: z.union([z.string(), z.null()]).optional(),
    bic: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const AffectedAgreementItem = z
  .object({
    framework_agreement_id: z.string(),
    agreement_name: z.string(),
    functions: z.array(z.string()),
  })
  .passthrough()
const BankAccountCloseResponse = z
  .object({
    account: BankAccountResponse,
    affected_agreements: z.array(AffectedAgreementItem),
  })
  .passthrough()
const ConfirmationHistoryEntry = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    captured_by: z.string(),
    captured_on: z.string().datetime({ offset: true }),
    note: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ConfirmationHistoryResponse = z
  .object({
    items: z.array(ConfirmationHistoryEntry),
    next_cursor: z.union([z.string(), z.null()]),
  })
  .passthrough()
const DecisionHistoryEntry = z
  .object({
    event_type: z.string(),
    action_type: z.string(),
    actor_id: z.union([z.string(), z.null()]),
    actor_display: z.union([z.string(), z.null()]),
    actor_type: z.union([z.string(), z.null()]),
    occurred_at: z.string().datetime({ offset: true }),
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    trigger_source: z.union([z.string(), z.null()]),
  })
  .passthrough()
const DecisionHistoryResponse = z
  .object({
    items: z.array(DecisionHistoryEntry),
    next_cursor: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ArchiveEligibilityResponse = z
  .object({
    can_archive: z.boolean(),
    active_references: z.array(z.object({}).partial().passthrough()),
    requires_counter_confirmation: z.boolean(),
    risk_sensitive_roles: z.array(z.string()),
  })
  .passthrough()
const PartnerConfirmRequest = z
  .object({ note: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const PartnerRejectRequest = z
  .object({ note: z.string().min(10).max(2000) })
  .passthrough()
const ArchivePartnerRequest = z
  .object({ reason: z.string().min(20).max(2000) })
  .passthrough()
const ArchivePartnerResponse = z
  .object({
    partner_id: z.string().uuid(),
    status: z.string(),
    is_immediate: z.boolean(),
    governed_action_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const IdentityChangeProposalRequest = z
  .object({
    target_anchors: z.array(z.string()).min(1),
    proposed_values: z.object({}).partial().passthrough(),
    change_reason: z.string().min(1).max(2000),
  })
  .passthrough()
const DownstreamImpact = z
  .object({
    refinancing_requests: z.number().int().default(0),
    contracts: z.number().int().default(0),
    financings: z.number().int().default(0),
  })
  .partial()
  .passthrough()
const IdentityChangeProposeResponse = z
  .object({
    identity_change_id: z.string(),
    partner_id: z.string(),
    status: z.string(),
    is_high_risk: z.boolean(),
    downstream_impact: DownstreamImpact,
  })
  .passthrough()
const IdentityChangeActorSummary = z
  .object({ user_id: z.string(), display_name: z.string(), role: z.string() })
  .passthrough()
const IdentityHistoryItem = z
  .object({
    identity_change_id: z.string(),
    target_anchors: z.array(z.string()),
    pre_change_snapshot: z.object({}).partial().passthrough(),
    proposed_values: z.object({}).partial().passthrough(),
    change_reason: z.string(),
    is_high_risk: z.boolean(),
    status: z.string(),
    proposed_by: IdentityChangeActorSummary,
    proposed_at: z.string().datetime({ offset: true }),
    resolved_at: z.union([z.string(), z.null()]),
    counter_confirmed_by: z.union([IdentityChangeActorSummary, z.null()]),
  })
  .passthrough()
const IdentityHistoryResponse = z
  .object({ partner_id: z.string(), items: z.array(IdentityHistoryItem) })
  .passthrough()
const IdentityChangeDetailResponse = z
  .object({
    identity_change_id: z.string(),
    partner_id: z.string(),
    status: z.string(),
    is_high_risk: z.boolean(),
    target_anchors: z.array(z.string()),
    pre_change_snapshot: z.object({}).partial().passthrough(),
    proposed_values: z.object({}).partial().passthrough(),
    change_reason: z.string(),
    proposed_by: IdentityChangeActorSummary,
    proposed_at: z.string().datetime({ offset: true }),
    resolved_at: z.union([z.string(), z.null()]),
    counter_confirmed_by: z.union([IdentityChangeActorSummary, z.null()]),
    downstream_impact: DownstreamImpact,
  })
  .passthrough()
const MergeLineageRecordResponse = z
  .object({
    record_id: z.string(),
    source_partner_id: z.string(),
    target_partner_id: z.string(),
    governed_action_id: z.string(),
    executed_by: z.string(),
    executed_at: z.string().datetime({ offset: true }),
    merge_reason_code: z.string(),
    reference_manifest: z.object({}).partial().passthrough(),
  })
  .passthrough()
const MergeHistoryResponse = z
  .object({
    partner_id: z.string(),
    items: z.array(MergeLineageRecordResponse),
  })
  .passthrough()
const PartnerMatchRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      NaturalPersonIdentityInput,
      SoleProprietorIdentityInput,
    ]),
  })
  .passthrough()
const PartnerStatus = z.enum([
  "draft",
  "pending_confirmation",
  "confirmed",
  "rejected",
  "merged",
  "archived",
  "pending_archive",
])
const PartnerRole = z.enum(["lessee", "guarantor", "supplier"])
const UboCompletenessStatus = z.enum(["missing", "partial", "complete"])
const PartnerListItem = z
  .object({
    partner_id: z.string(),
    display_name: z.string(),
    partner_type: PartnerType,
    status: z.string(),
    country: z.union([z.string(), z.null()]),
    ubo_completeness_status: z.string(),
    roles: z.array(z.string()),
  })
  .passthrough()
const PartnerListResponse = z
  .object({
    items: z.array(PartnerListItem),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .passthrough()
const MatchingEvidenceItem = z
  .object({
    anchor: z.string(),
    a_value: z.unknown(),
    b_value: z.unknown(),
    match: z.boolean(),
  })
  .passthrough()
const DuplicateCandidatePairResponse = z
  .object({
    pair_id: z.string(),
    tenant_id: z.string(),
    partner_a_id: z.string(),
    partner_b_id: z.string(),
    confidence: z.string(),
    matching_evidence: z.array(MatchingEvidenceItem),
    status: z.string(),
    detected_at: z.string().datetime({ offset: true }),
    resolved_by: z.union([z.string(), z.null()]),
    resolved_at: z.union([z.string(), z.null()]),
    reason_code: z.union([z.string(), z.null()]),
    resolution_note: z.union([z.string(), z.null()]),
  })
  .passthrough()
const DuplicatePairListResponse = z
  .object({
    items: z.array(DuplicateCandidatePairResponse),
    total: z.number().int(),
  })
  .passthrough()
const RefinancingForm = z.enum(["annuity", "fixed_principal", "bullet"])
const refinancing_form = z.union([RefinancingForm, z.null()]).optional()
const SelectableTemplateItem = z
  .object({
    template_id: z.string().uuid(),
    template_code: z.string(),
    template_name: z.string(),
    version_id: z.string().uuid(),
    version_number: z.string(),
    refinancing_form: z.string(),
    legal_structure: z.string(),
    valid_from: z.union([z.string(), z.null()]),
    valid_until: z.union([z.string(), z.null()]),
    allowed_asset_categories: z.union([z.array(z.string()), z.null()]),
  })
  .passthrough()
const SelectableTemplatesResponse = z
  .object({ items: z.array(SelectableTemplateItem) })
  .passthrough()
const LegalStructure = z.enum(["loan_credit", "true_sale"])
const PaymentTiming = z.enum(["advance", "arrears"])
const RateBasis = z.enum(["30_360", "act_360", "act_365", "act_act"])
const RateType = z.enum(["fixed", "floating", "euribor_spread"])
const DisbursementDerivationRule = z.enum(["npv", "npv_ltv", "rv_only"])
const AssetCategory = z.enum([
  "machinery",
  "vehicles",
  "it_equipment",
  "real_estate",
  "energy_assets",
  "other",
])
const app__modules__product_templates__interfaces__http__schemas__product_template__UserRef =
  z.object({ id: z.string().uuid(), display_name: z.string() }).passthrough()
const VersionDetailResponse = z
  .object({
    id: z.string().uuid(),
    template_id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
    referenced: z.boolean(),
    template_name: z.string(),
    template_description: z.union([z.string(), z.null()]),
    valid_from: z.union([z.string(), z.null()]),
    valid_until: z.union([z.string(), z.null()]),
    refinancing_form: RefinancingForm,
    legal_structure: LegalStructure,
    payment_timing: PaymentTiming,
    rate_basis: RateBasis,
    rate_type: z.union([RateType, z.null()]),
    npv_formula_ref: z.union([z.string(), z.null()]),
    disbursement_derivation_rule: z.union([
      DisbursementDerivationRule,
      z.null(),
    ]),
    allowed_asset_categories: z.union([z.array(AssetCategory), z.null()]),
    min_term_months: z.union([z.number(), z.null()]),
    max_term_months: z.union([z.number(), z.null()]),
    min_volume_eur: z.union([z.string(), z.null()]),
    max_volume_eur: z.union([z.string(), z.null()]),
    effective_rate: z.union([z.string(), z.null()]),
    predecessor_version_id: z.union([z.string(), z.null()]),
    snapshot_source_version_id: z.union([z.string(), z.null()]),
    activated_at: z.union([z.string(), z.null()]),
    activated_by: z
      .union([
        app__modules__product_templates__interfaces__http__schemas__product_template__UserRef,
        z.null(),
      ])
      .optional(),
    terminated_at: z.union([z.string(), z.null()]),
    terminated_by: z
      .union([
        app__modules__product_templates__interfaces__http__schemas__product_template__UserRef,
        z.null(),
      ])
      .optional(),
    termination_justification: z.union([z.string(), z.null()]),
    bindings_count: z.number().int().optional().default(0),
    created_at: z.string().datetime({ offset: true }),
    product_status: z.string().optional().default("active"),
  })
  .passthrough()
const UpdateTemplateDraftRequest = z
  .object({
    template_name: z.union([z.string(), z.null()]),
    template_description: z.union([z.string(), z.null()]),
    valid_from: z.union([z.string(), z.null()]),
    valid_until: z.union([z.string(), z.null()]),
    refinancing_form: z.union([RefinancingForm, z.null()]),
    legal_structure: z.union([LegalStructure, z.null()]),
    payment_timing: z.union([PaymentTiming, z.null()]),
    rate_basis: z.union([RateBasis, z.null()]),
    disbursement_derivation_rule: z.union([
      DisbursementDerivationRule,
      z.null(),
    ]),
    allowed_asset_categories: z.union([z.array(AssetCategory), z.null()]),
    min_term_months: z.union([z.number(), z.null()]),
    max_term_months: z.union([z.number(), z.null()]),
    min_volume_eur: z.union([z.number(), z.string(), z.null()]),
    max_volume_eur: z.union([z.number(), z.string(), z.null()]),
    effective_rate: z.union([z.number(), z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const TemplateDraftUpdatedResponse = z
  .object({ version_id: z.string().uuid(), version_status: z.string() })
  .passthrough()
const TemplateDraftDiscardedResponse = z
  .object({ version_id: z.string().uuid(), version_status: z.string() })
  .passthrough()
const UpdateOrchestrationRequest = z
  .object({
    required_workflow_tasks: z.array(z.string().uuid()),
    required_documents: z.array(z.string().uuid()),
    optional_documents: z.array(z.string().uuid()).optional().default([]),
    validation_rule_set_id: z.string().uuid(),
  })
  .passthrough()
const OrchestrationLinkageItem = z
  .object({
    id: z.string().uuid(),
    link_type: z.string(),
    catalog_ref_id: z.string().uuid(),
    catalog_ref_type: z.string(),
  })
  .passthrough()
const OrchestrationResponse = z
  .object({ linkages: z.array(OrchestrationLinkageItem) })
  .passthrough()
const PublishTemplateDraftRequest = z
  .object({ justification: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const PublishTemplateDraftResponse = z
  .object({
    version_id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
    activated_at: z.string().datetime({ offset: true }),
    activated_by: z.string().uuid(),
  })
  .passthrough()
const NewVersionCreatedResponse = z
  .object({
    version_id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
    predecessor_version_id: z.union([z.string(), z.null()]),
    snapshot_source_version_id: z.union([z.string(), z.null()]),
  })
  .passthrough()
const TemplateVersionSummary = z
  .object({
    id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
    activated_at: z.union([z.string(), z.null()]).optional(),
    terminated_at: z.union([z.string(), z.null()]).optional(),
    activated_by: z
      .union([
        app__modules__product_templates__interfaces__http__schemas__product_template__UserRef,
        z.null(),
      ])
      .optional(),
    terminated_by: z
      .union([
        app__modules__product_templates__interfaces__http__schemas__product_template__UserRef,
        z.null(),
      ])
      .optional(),
    predecessor_version_id: z.union([z.string(), z.null()]).optional(),
    superseding_version_id: z.union([z.string(), z.null()]).optional(),
    bindings_count: z.number().int().optional().default(0),
    created_at: z.string().datetime({ offset: true }),
    selectable: z.boolean().optional().default(false),
    is_current: z.boolean().optional().default(false),
    valid_from: z.union([z.string(), z.null()]).optional(),
    valid_until: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const VersionHistoryResponse = z
  .object({ versions: z.array(TemplateVersionSummary) })
  .passthrough()
const TerminateVersionRequest = z
  .object({ justification: z.string().min(10).max(2000) })
  .passthrough()
const TerminateVersionResponse = z
  .object({
    version_id: z.string().uuid(),
    version_status: z.string(),
    terminated_at: z.string().datetime({ offset: true }),
    terminated_by: z.string().uuid(),
    affected_framework_agreements: z.array(z.string()).optional().default([]),
  })
  .passthrough()
const DeactivateProductRequest = z
  .object({ reason: z.string().min(10).max(2000) })
  .passthrough()
const ProductStatusResponse = z
  .object({
    template_id: z.string().uuid(),
    product_status: z.string(),
    affected_framework_agreements: z.array(z.string()).optional().default([]),
  })
  .passthrough()
const SetEffectiveDateRequest = z
  .object({ valid_from: z.string() })
  .passthrough()
const SetEffectiveDateResponse = z
  .object({
    version_id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
    valid_from: z.union([z.string(), z.null()]),
  })
  .passthrough()
const VersionUsageAgreement = z
  .object({ id: z.string().uuid(), name: z.string(), status: z.string() })
  .passthrough()
const VersionUsageItem = z
  .object({
    version_id: z.string().uuid(),
    version_number: z.union([z.string(), z.null()]),
    agreements: z.array(VersionUsageAgreement),
  })
  .passthrough()
const VersionUsageResponse = z
  .object({ items: z.array(VersionUsageItem) })
  .passthrough()
const VersionDiffResponse = z
  .object({
    template_id: z.string().uuid(),
    from_version: z.string(),
    to_version: z.string(),
    behavioral_settings: z.array(FieldDiffItem),
    eligibility: z.array(FieldDiffItem),
    orchestration_linkage: z.array(FieldDiffItem),
  })
  .passthrough()
const TemplateCurrentVersionSummary = z
  .object({
    version_id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
    refinancing_form: RefinancingForm,
    legal_structure: LegalStructure,
    payment_timing: PaymentTiming,
    min_term_months: z.union([z.number(), z.null()]).optional(),
    max_term_months: z.union([z.number(), z.null()]).optional(),
    activated_by: z
      .union([
        app__modules__product_templates__interfaces__http__schemas__product_template__UserRef,
        z.null(),
      ])
      .optional(),
    activated_at: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const TemplateListItem = z
  .object({
    id: z.string().uuid(),
    template_code: z.string(),
    template_name: z.union([z.string(), z.null()]),
    current_version: z.union([TemplateCurrentVersionSummary, z.null()]),
    created_at: z.string().datetime({ offset: true }),
    product_status: z.string().optional().default("active"),
  })
  .passthrough()
const TemplateListResponse = z
  .object({
    items: z.array(TemplateListItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const CreateTemplateDraftRequest = z
  .object({
    template_name: z.string(),
    refinancing_form: RefinancingForm,
    legal_structure: LegalStructure,
    payment_timing: PaymentTiming,
    rate_basis: RateBasis,
    template_description: z.union([z.string(), z.null()]).optional(),
    valid_from: z.union([z.string(), z.null()]).optional(),
    valid_until: z.union([z.string(), z.null()]).optional(),
    disbursement_derivation_rule: z
      .union([DisbursementDerivationRule, z.null()])
      .optional(),
    allowed_asset_categories: z
      .union([z.array(AssetCategory), z.null()])
      .optional(),
    min_term_months: z.union([z.number(), z.null()]).optional(),
    max_term_months: z.union([z.number(), z.null()]).optional(),
    min_volume_eur: z.union([z.number(), z.string(), z.null()]).optional(),
    max_volume_eur: z.union([z.number(), z.string(), z.null()]).optional(),
    effective_rate: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()
const TemplateDraftCreatedResponse = z
  .object({
    id: z.string().uuid(),
    template_code: z.string(),
    version_id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
  })
  .passthrough()
const BankEntity = z.enum([
  "sparkasse",
  "landesbank_1",
  "landesbank_2",
  "other",
])
const RefiLoanValueDateRule = z.enum(["first_of_month", "variable"])
const CreateFARequest = z
  .object({
    agreement_name: z.string().max(200),
    lc_partner_id: z.string().uuid(),
    bank_entity: BankEntity,
    max_volume_eur: z.union([z.number(), z.string()]),
    refi_loan_value_date: z.union([RefiLoanValueDateRule, z.null()]).optional(),
    refi_instalment_due_date: z.union([z.number(), z.null()]).optional(),
    valid_from: z.string(),
    valid_until: z.union([z.string(), z.null()]).optional(),
    special_conditions: z.union([z.string(), z.null()]).optional(),
    special_bank_settlement: z.union([z.string(), z.null()]).optional(),
    vfe_amount_eur: z.union([z.number(), z.string(), z.null()]).optional(),
    payout_account_id: z.union([z.string(), z.null()]).optional(),
    collection_account_id: z.union([z.string(), z.null()]).optional(),
    product_template_ids: z.array(z.string().uuid()).min(1),
    product_template_version_pins: z
      .union([z.record(z.string(), z.string().uuid()), z.null()])
      .optional(),
  })
  .passthrough()
const FALifecycleStatus = z.enum([
  "draft",
  "active",
  "deactivated",
  "terminated",
])
const FAPinnedVersionChangeImpact = z
  .object({
    template_id: z.string().uuid(),
    from_version_id: z.union([z.string(), z.null()]),
    to_version_id: z.string().uuid(),
    affected_active_financings: z.number().int().optional().default(0),
    affected_documents: z.number().int().optional().default(0),
    warning: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const FADraftResponse = z
  .object({
    id: z.string().uuid(),
    agreement_name: z.string(),
    lc_partner_id: z.string().uuid(),
    bank_entity: BankEntity,
    currency: z.string(),
    status: FALifecycleStatus,
    max_volume_eur: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    refi_loan_value_date: z.union([RefiLoanValueDateRule, z.null()]),
    refi_instalment_due_date: z.union([z.number(), z.null()]),
    valid_from: z.string(),
    valid_until: z.union([z.string(), z.null()]),
    special_conditions: z.union([z.string(), z.null()]),
    special_bank_settlement: z.union([z.string(), z.null()]),
    vfe_amount_eur: z.union([z.string(), z.null()]),
    payout_account_id: z.union([z.string(), z.null()]),
    collection_account_id: z.union([z.string(), z.null()]),
    product_template_ids: z.array(z.string().uuid()),
    edit_version_counter: z.number().int(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    pin_changes: z.array(FAPinnedVersionChangeImpact).optional().default([]),
  })
  .passthrough()
const FAAgreementLifecycle = z.enum([
  "draft",
  "active",
  "deactivated",
  "terminated",
  "expired",
])
const FAListItemResponse = z
  .object({
    id: z.string().uuid(),
    agreement_name: z.string(),
    lc_partner_id: z.string().uuid(),
    lc_partner_name: z.union([z.string(), z.null()]),
    bank_entity: z.union([BankEntity, z.null()]),
    status: FALifecycleStatus,
    agreement_lifecycle: FAAgreementLifecycle,
    valid_from: z.string(),
    valid_until: z.union([z.string(), z.null()]),
    is_expired: z.boolean(),
    utilization_pct: z.union([z.string(), z.null()]),
    limit_breach: z.union([z.boolean(), z.null()]),
  })
  .passthrough()
const FAListResponse = z
  .object({
    items: z.array(FAListItemResponse),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const UpdateFARequest = z
  .object({
    agreement_name: z.union([z.string(), z.null()]),
    max_volume_eur: z.union([z.number(), z.string(), z.null()]),
    refi_loan_value_date: z.union([RefiLoanValueDateRule, z.null()]),
    refi_instalment_due_date: z.union([z.number(), z.null()]),
    valid_from: z.union([z.string(), z.null()]),
    valid_until: z.union([z.string(), z.null()]),
    special_conditions: z.union([z.string(), z.null()]),
    special_bank_settlement: z.union([z.string(), z.null()]),
    vfe_amount_eur: z.union([z.number(), z.string(), z.null()]),
    payout_account_id: z.union([z.string(), z.null()]),
    collection_account_id: z.union([z.string(), z.null()]),
    product_template_ids: z.union([z.array(z.string().uuid()), z.null()]),
    product_template_version_pins: z.union([
      z.record(z.string(), z.string().uuid()),
      z.null(),
    ]),
    justification: z.union([z.string(), z.null()]),
    expected_version: z.union([z.number(), z.null()]),
  })
  .partial()
  .passthrough()
const FADetailResponse = z
  .object({
    id: z.string().uuid(),
    agreement_name: z.string(),
    lc_partner_id: z.string().uuid(),
    lc_partner_name: z.union([z.string(), z.null()]),
    status: FALifecycleStatus,
    agreement_lifecycle: FAAgreementLifecycle,
    currency: z.string(),
    max_volume_eur: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    refi_loan_value_date: z.union([RefiLoanValueDateRule, z.null()]),
    refi_instalment_due_date: z.union([z.number(), z.null()]),
    valid_from: z.string(),
    valid_until: z.union([z.string(), z.null()]),
    is_expired: z.boolean(),
    edit_version_counter: z.number().int(),
    product_template_ids: z.array(z.string().uuid()),
    product_template_version_pins: z.record(z.string(), z.union([z.string(), z.null()])),
    document_count: z.number().int(),
    linked_financings_count: z.number().int(),
    utilization_pct: z.union([z.string(), z.null()]),
    limit_available: z.union([z.string(), z.null()]),
    limit_breach: z.union([z.boolean(), z.null()]),
    bank_entity: z.union([z.string(), z.null()]),
    vfe_amount_eur: z.union([z.string(), z.null()]),
    payout_account_id: z.union([z.string(), z.null()]),
    collection_account_id: z.union([z.string(), z.null()]),
    special_conditions: z.union([z.string(), z.null()]),
    special_bank_settlement: z.union([z.string(), z.null()]),
    effective_from: z.union([z.string(), z.null()]),
    activated_at: z.union([z.string(), z.null()]),
    activated_by: z.union([z.string(), z.null()]),
    activated_by_name: z.union([z.string(), z.null()]),
    deactivated_at: z.union([z.string(), z.null()]),
    deactivated_by: z.union([z.string(), z.null()]),
    reactivated_at: z.union([z.string(), z.null()]),
    reactivated_by: z.union([z.string(), z.null()]),
    terminated_at: z.union([z.string(), z.null()]),
    terminated_by: z.union([z.string(), z.null()]),
    created_by: z.union([z.string(), z.null()]),
    created_by_name: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const DocumentOverrideKind = z.enum(["additionally_required", "not_required"])
const DocumentOverrideItem = z
  .object({
    document_type_code: z.string().min(1).max(100),
    override_kind: DocumentOverrideKind,
  })
  .passthrough()
const SetDocumentOverridesRequest = z
  .object({ overrides: z.array(DocumentOverrideItem) })
  .passthrough()
const DocumentOverridesResponse = z
  .object({
    framework_agreement_id: z.string().uuid(),
    overrides: z.array(DocumentOverrideItem),
  })
  .passthrough()
const ActivateFARequest = z
  .object({
    documents_confirmed: z.boolean(),
    justification: z.string().min(20).max(1000),
  })
  .passthrough()
const TerminationReadinessResponse = z
  .object({
    can_terminate: z.boolean(),
    blocking_financing_count: z.number().int(),
    blocking_financings: z.array(z.object({}).partial().passthrough()),
  })
  .passthrough()
const TerminateFARequest = z
  .object({
    justification: z.string().min(30).max(1000),
    irreversibility_confirmed: z.boolean(),
  })
  .passthrough()
const FATerminatedResponse = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    terminated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const DeactivateFARequest = z
  .object({ justification: z.string().min(20).max(1000) })
  .passthrough()
const ReactivateFARequest = z
  .object({ justification: z.string().min(20).max(1000) })
  .passthrough()
const FALCPartnerItem = z
  .object({ id: z.string().uuid(), legal_name: z.string() })
  .passthrough()
const FALCPartnersResponse = z
  .object({ items: z.array(FALCPartnerItem) })
  .passthrough()
const FAUtilizationResponse = z
  .object({
    max_volume_eur: z.union([z.string(), z.null()]),
    disbursed_volume_eur: z.union([z.string(), z.null()]),
    redeemed_volume_eur: z.union([z.string(), z.null()]),
    net_exposure_eur: z.union([z.string(), z.null()]),
    available_volume_eur: z.union([z.string(), z.null()]),
    utilization_pct: z.union([z.string(), z.null()]),
    limit_available_flag: z.union([z.boolean(), z.null()]),
    limit_breach_flag: z.union([z.boolean(), z.null()]),
    last_refreshed_at: z.union([z.string(), z.null()]),
    source: z.string().default("limit_management"),
    available: z.boolean().default(false),
  })
  .partial()
  .passthrough()
const FALinkedFinancingsResponse = z
  .object({ count: z.number().int().default(0), items: z.array(z.unknown()) })
  .partial()
  .passthrough()
const FAPricingSnapshotResponse = z
  .object({
    fa_id: z.string().uuid(),
    agreement_name: z.string(),
    edit_version_counter: z.number().int(),
    vfe_amount_eur: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FAEventTypeFilter = z.enum([
  "draft_created",
  "draft_edited",
  "draft_deleted",
  "document_attached",
  "document_detached",
  "document_downloaded",
  "activation_submitted",
  "activated",
  "activation_rejected",
  "activation_expired",
  "suspended",
  "suspension_blocked",
  "reactivated",
  "terminated",
  "termination_blocked",
  "edited",
  "max_volume_reduced_below_exposure",
  "list_accessed",
  "detail_accessed",
  "pricing_snapshot_accessed",
  "auditor_audit_access",
  "audit_export",
])
const FAAuditEventResponse = z
  .object({
    id: z.string().uuid(),
    event_type: z.string(),
    actor_id: z.union([z.string(), z.null()]),
    actor_first_name: z.union([z.string(), z.null()]).optional(),
    actor_last_name: z.union([z.string(), z.null()]).optional(),
    actor_type: z.string(),
    recorded_at: z.string().datetime({ offset: true }),
    justification: z.union([z.string(), z.null()]),
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    changed_fields: z.union([z.array(z.string()), z.null()]),
    field_diffs: z.union([z.array(FieldDiffItem), z.null()]).optional(),
  })
  .passthrough()
const FAAuditHistoryResponse = z
  .object({
    items: z.array(FAAuditEventResponse),
    next_cursor: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FAReconstructResponse = z
  .object({
    fa_id: z.string().uuid(),
    as_of: z.string().datetime({ offset: true }),
    events_replayed: z.number().int(),
    state: z.object({}).partial().passthrough(),
  })
  .passthrough()
const FADocumentType = z.enum([
  "original_agreement",
  "addendum",
  "side_letter",
  "other",
])
const Body_attach_document_api_v1_framework_agreements__id__documents_post = z
  .object({
    file: z.string(),
    document_type: z.union([FADocumentType, z.null()]).optional(),
    document_label: z.union([z.string(), z.null()]).optional(),
    lc_visible: z.boolean().optional().default(true),
  })
  .passthrough()
const AttachDocumentResponse = z
  .object({
    id: z.string().uuid(),
    framework_agreement_id: z.string().uuid(),
    document_type: z.union([FADocumentType, z.null()]),
    document_label: z.union([z.string(), z.null()]),
    file_name: z.string(),
    file_size_bytes: z.number().int(),
    mime_type: z.string(),
    lc_visible: z.boolean(),
    uploaded_by: z.string().uuid(),
    uploaded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const DocumentListItemResponse = z
  .object({
    id: z.string().uuid(),
    framework_agreement_id: z.string().uuid(),
    document_type: z.union([FADocumentType, z.null()]),
    document_label: z.union([z.string(), z.null()]),
    file_name: z.string(),
    file_size_bytes: z.number().int(),
    mime_type: z.string(),
    lc_visible: z.boolean(),
    uploaded_by: z.string().uuid(),
    uploaded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const DownloadURLResponse = z
  .object({
    url: z.string(),
    expires_in_seconds: z.number().int().optional().default(300),
  })
  .passthrough()
const LCPortalProductTemplateItem = z
  .object({
    id: z.string().uuid(),
    template_name: z.union([z.string(), z.null()]),
  })
  .passthrough()
const LCPortalDocumentItem = z
  .object({
    id: z.string().uuid(),
    file_name: z.string(),
    file_size_bytes: z.number().int(),
    mime_type: z.string(),
    document_type: z.union([z.string(), z.null()]).optional(),
    document_label: z.union([z.string(), z.null()]),
    uploaded_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const LCPortalFAListItem = z
  .object({
    id: z.string().uuid(),
    agreement_name: z.string(),
    status: FALifecycleStatus,
    valid_from: z.string(),
    valid_until: z.union([z.string(), z.null()]),
    max_volume_eur: z.union([z.string(), z.null()]).optional(),
    available_volume_eur: z.union([z.string(), z.null()]).optional(),
    new_financings_available: z.union([z.boolean(), z.null()]).optional(),
    product_templates: z.array(LCPortalProductTemplateItem),
    documents: z.array(LCPortalDocumentItem),
  })
  .passthrough()
const LCPortalFAListResponse = z
  .object({ items: z.array(LCPortalFAListItem), total: z.number().int() })
  .passthrough()
const CatalogLayer = z.enum(["global_default", "product_specific"])
const catalog_layer = z.union([z.array(CatalogLayer), z.null()]).optional()
const CatalogEntityType = z.enum([
  "refinancing_request",
  "financing",
  "redemption_request",
])
const entity_type = z.union([z.array(CatalogEntityType), z.null()]).optional()
const case_type__2 = z.union([z.array(CaseType), z.null()]).optional()
const product_template_id = z
  .union([z.array(z.string().uuid()), z.null()])
  .optional()
const CatalogState = z.enum(["draft", "active", "suspended", "archived"])
const catalog_state = z.union([z.array(CatalogState), z.null()]).optional()
const CatalogListItemResponse = z
  .object({
    id: z.string().uuid(),
    catalog_name: z.string(),
    catalog_layer: CatalogLayer,
    catalog_state: CatalogState,
    entity_type: z.union([CatalogEntityType, z.null()]),
    entity_id: z.union([z.string(), z.null()]),
    case_type: z.union([CaseType, z.null()]).optional(),
    valid_from: z.union([z.string(), z.null()]),
    valid_until: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse =
  z
    .object({
      items: z.array(CatalogListItemResponse),
      total: z.number().int(),
      page: z.number().int(),
      per_page: z.number().int(),
      total_pages: z.number().int(),
    })
    .passthrough()
const app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest =
  z
    .object({
      catalog_name: z.string().min(1).max(120),
      catalog_layer: CatalogLayer,
      valid_from: z.union([z.string(), z.null()]).optional(),
      valid_until: z.union([z.string(), z.null()]).optional(),
      description: z.union([z.string(), z.null()]).optional(),
      entity_id: z.union([z.string(), z.null()]).optional(),
      case_type: CaseType,
    })
    .passthrough()
const app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse =
  z
    .object({
      id: z.string().uuid(),
      tenant_id: z.string().uuid(),
      catalog_name: z.string(),
      catalog_layer: CatalogLayer,
      catalog_state: CatalogState,
      entity_type: z.union([CatalogEntityType, z.null()]),
      entity_id: z.union([z.string(), z.null()]),
      case_type: z.union([CaseType, z.null()]).optional(),
      valid_from: z.union([z.string(), z.null()]),
      valid_until: z.union([z.string(), z.null()]),
      description: z.union([z.string(), z.null()]),
      created_by: z.string().uuid(),
      created_at: z.string().datetime({ offset: true }),
      updated_at: z.string().datetime({ offset: true }),
      current_version_id: z.union([z.string(), z.null()]).optional(),
      warnings: z.array(z.string()).optional().default([]),
    })
    .passthrough()
const SuspendCatalogResponse = z
  .object({
    catalog_id: z.string().uuid(),
    catalog_state: z.string(),
    product_template_id: z.union([z.string(), z.null()]),
    affected_case_ids: z.array(z.string().uuid()),
  })
  .passthrough()
const FieldRegistryItem = z
  .object({
    id: z.string().uuid(),
    field_key: z.string(),
    field_type: z.string(),
    label: z.string(),
    data_available: z.boolean(),
  })
  .passthrough()
const CatalogCaseTypeItem = z
  .object({
    case_type: CaseType,
    entity_type: z.union([CatalogEntityType, z.null()]).optional(),
  })
  .passthrough()
const LayerAction = z.enum(["defined", "override", "deactivated", "supplement"])
const TaskCategory = z.enum([
  "legal",
  "compliance",
  "credit",
  "operations",
  "treasury",
  "documentation",
  "other",
])
const TaskResponsibleRole = z.enum([
  "front_office",
  "back_office_risk",
  "compliance",
  "legal",
  "treasury",
  "support",
  "system",
])
const app__modules__workflow_task_catalog__domain__enums__StageCategorization =
  z.enum([
    "pre_submission",
    "stage_1_review",
    "stage_2_review",
    "pre_disbursement",
    "servicing",
    "redemption",
  ])
const TaskProcessContext = z.enum([
  "rr_submission",
  "request_approval_readiness",
  "financing_approval_readiness",
  "disbursement_readiness",
  "stage_1_review",
  "stage_2_review",
  "conditions_follow_up",
  "servicing",
  "redemption",
])
const StateTransitionOutcome = z.enum([
  "committed",
  "rejected",
  "missing_information",
  "rework",
])
const DocumentCheckItem = z
  .object({
    document_ref: z.string().uuid(),
    position: z.number().int().gte(0),
  })
  .passthrough()
const ConditionOperator = z.enum([
  "is",
  "is_not",
  "greater_than",
  "less_than",
  "at_least",
  "at_most",
])
const ConditionRowItem = z
  .object({
    field_registry_id: z.string().uuid(),
    operator: ConditionOperator,
    value_raw: z.union([z.string(), z.null()]).optional(),
    value_config_ref: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const DocRequirementPinMode = z.enum(["pin_by_id", "pin_by_version"])
const ConditionalTrigger = z.literal("financing_amount_over_threshold")
const TaskType = z.enum([
  "checkbox",
  "typed_upload",
  "generated_document",
  "calculation",
  "external_handover",
  "field_capture",
  "state_transition",
])
const TaskApplicability = z.enum(["always", "rule", "person"])
const InheritedGDValues = z
  .object({
    task_code: z.union([z.string(), z.null()]),
    task_name: z.union([z.string(), z.null()]),
    task_description: z.union([z.string(), z.null()]),
    category: z.union([TaskCategory, z.null()]),
    applicable_process_contexts: z.union([
      z.array(TaskProcessContext),
      z.null(),
    ]),
    is_mandatory: z.union([z.boolean(), z.null()]),
    weight: z.union([z.number(), z.null()]),
    responsible_role: z.union([TaskResponsibleRole, z.null()]),
    responsible_roles: z.union([z.array(z.string()), z.null()]),
    display_order: z.union([z.number(), z.null()]),
    stage_categorization: z.union([
      app__modules__workflow_task_catalog__domain__enums__StageCategorization,
      z.null(),
    ]),
    doc_requirement_ref: z.union([z.string(), z.null()]),
  })
  .passthrough()
const TaskDefinitionItem = z
  .object({
    id: z.string().uuid(),
    catalog_version_id: z.string().uuid(),
    layer_action: LayerAction,
    task_number: z.union([z.number(), z.null()]),
    task_code: z.union([z.string(), z.null()]),
    task_name: z.union([z.string(), z.null()]),
    task_description: z.union([z.string(), z.null()]),
    category: z.union([TaskCategory, z.null()]),
    responsible_role: z.union([TaskResponsibleRole, z.null()]),
    responsible_roles: z.union([z.array(UserRole), z.null()]),
    is_mandatory: z.union([z.boolean(), z.null()]),
    weight: z.union([z.number(), z.null()]),
    display_order: z.union([z.number(), z.null()]),
    stage_categorization: z.union([
      app__modules__workflow_task_catalog__domain__enums__StageCategorization,
      z.null(),
    ]),
    applicable_process_contexts: z.union([
      z.array(TaskProcessContext),
      z.null(),
    ]),
    is_active: z.boolean(),
    parent_task_id: z.union([z.string(), z.null()]),
    phase_id: z.union([z.string(), z.null()]),
    four_eyes: z.boolean(),
    exclusion_task_ids: z.array(z.string().uuid()),
    four_eyes_exclusion_wide: z.boolean(),
    generated_document_ref: z.union([z.string(), z.null()]),
    trigger_event: z.union([z.string(), z.null()]),
    permitted_outcomes: z.union([z.array(StateTransitionOutcome), z.null()]),
    lifecycle_entity: z.union([z.string(), z.null()]),
    capture_section_name: z.union([z.string(), z.null()]),
    document_checks: z.array(DocumentCheckItem),
    condition_rows: z.array(ConditionRowItem),
    doc_requirement_ref: z.union([z.string(), z.null()]),
    doc_requirement_pin_mode: z.union([DocRequirementPinMode, z.null()]),
    conditional_trigger: z.union([ConditionalTrigger, z.null()]),
    task_type: z.union([TaskType, z.null()]),
    applicability: z.union([TaskApplicability, z.null()]),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    inherited: z.union([InheritedGDValues, z.null()]).optional(),
  })
  .passthrough()
const app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogDetailResponse =
  z
    .object({
      id: z.string().uuid(),
      tenant_id: z.string().uuid(),
      catalog_name: z.string(),
      catalog_layer: CatalogLayer,
      case_type: z.union([CaseType, z.null()]).optional(),
      entity_type: z.union([CatalogEntityType, z.null()]),
      entity_id: z.union([z.string(), z.null()]),
      catalog_state: CatalogState,
      valid_from: z.union([z.string(), z.null()]),
      valid_until: z.union([z.string(), z.null()]),
      description: z.union([z.string(), z.null()]),
      created_by: z.string().uuid(),
      created_at: z.string().datetime({ offset: true }),
      updated_at: z.string().datetime({ offset: true }),
      current_version_id: z.union([z.string(), z.null()]),
      tasks: z.array(TaskDefinitionItem),
    })
    .passthrough()
const AuditTrailEventItem = z
  .object({
    id: z.string().uuid(),
    event_type: z.string(),
    action_type: z.string(),
    actor_id: z.string(),
    actor_role_at_time: z.union([z.string(), z.null()]),
    actor_display: z.union([z.string(), z.null()]),
    recorded_at: z.string().datetime({ offset: true }),
    entity_display: z.union([z.string(), z.null()]),
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    changed_fields: z.union([z.array(z.string()), z.null()]),
  })
  .passthrough()
const AuditTrailResponse = z
  .object({
    events: z.array(AuditTrailEventItem),
    next_cursor: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const AddTaskRequest = z
  .object({
    layer_action: LayerAction,
    task_code: z.union([z.string(), z.null()]).optional(),
    task_name: z.union([z.string(), z.null()]).optional(),
    task_description: z.union([z.string(), z.null()]).optional(),
    category: z.union([TaskCategory, z.null()]).optional(),
    responsible_role: z.union([TaskResponsibleRole, z.null()]).optional(),
    responsible_roles: z.union([z.array(UserRole), z.null()]).optional(),
    is_mandatory: z.union([z.boolean(), z.null()]).optional(),
    weight: z.union([z.number(), z.null()]).optional(),
    display_order: z.union([z.number(), z.null()]).optional(),
    stage_categorization: z
      .union([
        app__modules__workflow_task_catalog__domain__enums__StageCategorization,
        z.null(),
      ])
      .optional(),
    applicable_process_contexts: z
      .union([z.array(TaskProcessContext), z.null()])
      .optional(),
    task_type: z.union([TaskType, z.null()]).optional(),
    applicability: z.union([TaskApplicability, z.null()]).optional(),
    generated_document_ref: z.union([z.string(), z.null()]).optional(),
    trigger_event: z.union([z.string(), z.null()]).optional(),
    permitted_outcomes: z
      .union([z.array(StateTransitionOutcome), z.null()])
      .optional(),
    lifecycle_entity: z.union([z.string(), z.null()]).optional(),
    capture_section_name: z.union([z.string(), z.null()]).optional(),
    document_checks: z.union([z.array(DocumentCheckItem), z.null()]).optional(),
    condition_rows: z.union([z.array(ConditionRowItem), z.null()]).optional(),
    is_active: z.boolean().optional().default(true),
    parent_task_id: z.union([z.string(), z.null()]).optional(),
    four_eyes: z.boolean().optional().default(false),
    exclusion_task_ids: z
      .union([z.array(z.string().uuid()), z.null()])
      .optional(),
    four_eyes_exclusion_wide: z.boolean().optional().default(false),
    phase_id: z.union([z.string(), z.null()]).optional(),
    doc_requirement_ref: z.union([z.string(), z.null()]).optional(),
    doc_requirement_pin_mode: z
      .union([DocRequirementPinMode, z.null()])
      .optional(),
    conditional_trigger: z.union([ConditionalTrigger, z.null()]).optional(),
  })
  .passthrough()
const TaskResponseWithWarnings = z
  .object({
    id: z.string().uuid(),
    catalog_version_id: z.string().uuid(),
    layer_action: LayerAction,
    task_number: z.union([z.number(), z.null()]),
    task_code: z.union([z.string(), z.null()]),
    task_name: z.union([z.string(), z.null()]),
    task_description: z.union([z.string(), z.null()]),
    category: z.union([TaskCategory, z.null()]),
    responsible_role: z.union([TaskResponsibleRole, z.null()]),
    responsible_roles: z.union([z.array(UserRole), z.null()]),
    is_mandatory: z.union([z.boolean(), z.null()]),
    weight: z.union([z.number(), z.null()]),
    display_order: z.union([z.number(), z.null()]),
    stage_categorization: z.union([
      app__modules__workflow_task_catalog__domain__enums__StageCategorization,
      z.null(),
    ]),
    applicable_process_contexts: z.union([
      z.array(TaskProcessContext),
      z.null(),
    ]),
    is_active: z.boolean(),
    parent_task_id: z.union([z.string(), z.null()]),
    phase_id: z.union([z.string(), z.null()]),
    four_eyes: z.boolean(),
    exclusion_task_ids: z.array(z.string().uuid()),
    four_eyes_exclusion_wide: z.boolean(),
    generated_document_ref: z.union([z.string(), z.null()]),
    trigger_event: z.union([z.string(), z.null()]),
    permitted_outcomes: z.union([z.array(StateTransitionOutcome), z.null()]),
    lifecycle_entity: z.union([z.string(), z.null()]),
    capture_section_name: z.union([z.string(), z.null()]),
    document_checks: z.array(DocumentCheckItem),
    condition_rows: z.array(ConditionRowItem),
    doc_requirement_ref: z.union([z.string(), z.null()]),
    doc_requirement_pin_mode: z.union([DocRequirementPinMode, z.null()]),
    conditional_trigger: z.union([ConditionalTrigger, z.null()]),
    task_type: z.union([TaskType, z.null()]),
    applicability: z.union([TaskApplicability, z.null()]),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    warnings: z.array(z.string()).optional().default([]),
  })
  .passthrough()
const TaskResponse = z
  .object({
    id: z.string().uuid(),
    catalog_version_id: z.string().uuid(),
    layer_action: LayerAction,
    task_number: z.union([z.number(), z.null()]),
    task_code: z.union([z.string(), z.null()]),
    task_name: z.union([z.string(), z.null()]),
    task_description: z.union([z.string(), z.null()]),
    category: z.union([TaskCategory, z.null()]),
    responsible_role: z.union([TaskResponsibleRole, z.null()]),
    responsible_roles: z.union([z.array(UserRole), z.null()]),
    is_mandatory: z.union([z.boolean(), z.null()]),
    weight: z.union([z.number(), z.null()]),
    display_order: z.union([z.number(), z.null()]),
    stage_categorization: z.union([
      app__modules__workflow_task_catalog__domain__enums__StageCategorization,
      z.null(),
    ]),
    applicable_process_contexts: z.union([
      z.array(TaskProcessContext),
      z.null(),
    ]),
    is_active: z.boolean(),
    parent_task_id: z.union([z.string(), z.null()]),
    phase_id: z.union([z.string(), z.null()]),
    four_eyes: z.boolean(),
    exclusion_task_ids: z.array(z.string().uuid()),
    four_eyes_exclusion_wide: z.boolean(),
    generated_document_ref: z.union([z.string(), z.null()]),
    trigger_event: z.union([z.string(), z.null()]),
    permitted_outcomes: z.union([z.array(StateTransitionOutcome), z.null()]),
    lifecycle_entity: z.union([z.string(), z.null()]),
    capture_section_name: z.union([z.string(), z.null()]),
    document_checks: z.array(DocumentCheckItem),
    condition_rows: z.array(ConditionRowItem),
    doc_requirement_ref: z.union([z.string(), z.null()]),
    doc_requirement_pin_mode: z.union([DocRequirementPinMode, z.null()]),
    conditional_trigger: z.union([ConditionalTrigger, z.null()]),
    task_type: z.union([TaskType, z.null()]),
    applicability: z.union([TaskApplicability, z.null()]),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const UpdateTaskRequest = z
  .object({
    task_name: z.union([z.string(), z.null()]),
    task_description: z.union([z.string(), z.null()]),
    category: z.union([TaskCategory, z.null()]),
    responsible_role: z.union([TaskResponsibleRole, z.null()]),
    responsible_roles: z.union([z.array(UserRole), z.null()]),
    is_mandatory: z.union([z.boolean(), z.null()]),
    weight: z.union([z.number(), z.null()]),
    display_order: z.union([z.number(), z.null()]),
    stage_categorization: z.union([
      app__modules__workflow_task_catalog__domain__enums__StageCategorization,
      z.null(),
    ]),
    applicable_process_contexts: z.union([
      z.array(TaskProcessContext),
      z.null(),
    ]),
    is_active: z.union([z.boolean(), z.null()]),
    doc_requirement_ref: z.union([z.string(), z.null()]),
    doc_requirement_pin_mode: z.union([DocRequirementPinMode, z.null()]),
    conditional_trigger: z.union([ConditionalTrigger, z.null()]),
    task_type: z.union([TaskType, z.null()]),
    applicability: z.union([TaskApplicability, z.null()]),
    phase_id: z.union([z.string(), z.null()]),
    four_eyes: z.union([z.boolean(), z.null()]),
    exclusion_task_ids: z.union([z.array(z.string().uuid()), z.null()]),
    four_eyes_exclusion_wide: z.union([z.boolean(), z.null()]),
    generated_document_ref: z.union([z.string(), z.null()]),
    trigger_event: z.union([z.string(), z.null()]),
    permitted_outcomes: z.union([z.array(StateTransitionOutcome), z.null()]),
    lifecycle_entity: z.union([z.string(), z.null()]),
    capture_section_name: z.union([z.string(), z.null()]),
    document_checks: z.union([z.array(DocumentCheckItem), z.null()]),
    condition_rows: z.union([z.array(ConditionRowItem), z.null()]),
  })
  .partial()
  .passthrough()
const CreatePhaseRequest = z
  .object({
    name: z.string().min(1).max(80),
    position: z.union([z.number(), z.null()]).optional(),
  })
  .passthrough()
const PhaseResponse = z
  .object({
    id: z.string().uuid(),
    catalog_version_id: z.string().uuid(),
    name: z.string(),
    position: z.number().int(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const ReorderPhasesRequest = z
  .object({ ordered_phase_ids: z.array(z.string().uuid()).min(1) })
  .passthrough()
const UpdatePhaseRequest = z
  .object({
    name: z.union([z.string(), z.null()]),
    position: z.union([z.number(), z.null()]),
  })
  .partial()
  .passthrough()
const RemovePhaseResponse = z
  .object({
    phase_id: z.string().uuid(),
    tasks_in_phase: z.number().int(),
    removed: z.boolean(),
  })
  .passthrough()
const MaterializeChecklistRequest = z
  .object({
    case_type: CaseType,
    product_template_id: z.union([z.string(), z.null()]).optional(),
    amount_eur: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()
const ChecklistItemStatus = z.enum(["open", "checked", "not_applicable"])
const ChecklistCloseActor = z.enum(["person", "system"])
const DocumentCheckMark = z.enum(["in_order", "not_in_order", "not_applicable"])
const ChecklistItemCheckResponse = z
  .object({
    id: z.string().uuid(),
    source_document_check_id: z.string().uuid(),
    document_ref: z.string().uuid(),
    position: z.number().int(),
    mark: z.union([DocumentCheckMark, z.null()]),
    note: z.union([z.string(), z.null()]),
    marked_by: z.union([z.string(), z.null()]),
    marked_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ChecklistItemResponse = z
  .object({
    id: z.string().uuid(),
    business_object_id: z.string().uuid(),
    source_catalog_task_id: z.string().uuid(),
    task_code: z.union([z.string(), z.null()]),
    task_name: z.union([z.string(), z.null()]),
    is_mandatory: z.boolean(),
    weight: z.union([z.string(), z.null()]),
    display_order: z.union([z.number(), z.null()]).optional(),
    stage_categorization: z
      .union([
        app__modules__workflow_task_catalog__domain__enums__StageCategorization,
        z.null(),
      ])
      .optional(),
    task_type: z.union([TaskType, z.null()]).optional(),
    applicability: z.union([TaskApplicability, z.null()]).optional(),
    responsible_role: z.union([TaskResponsibleRole, z.null()]).optional(),
    responsible_roles: z.union([z.array(UserRole), z.null()]).optional(),
    doc_requirement_ref: z.union([z.string(), z.null()]).optional(),
    four_eyes: z.boolean().optional().default(false),
    status: ChecklistItemStatus,
    note: z.union([z.string(), z.null()]),
    checked_by: z.union([z.string(), z.null()]),
    checked_by_type: z.union([ChecklistCloseActor, z.null()]).optional(),
    checked_at: z.union([z.string(), z.null()]),
    checks: z.array(ChecklistItemCheckResponse).optional().default([]),
  })
  .passthrough()
const SetItemStatusRequest = z
  .object({
    status: ChecklistItemStatus,
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const SetItemCheckMarkRequest = z
  .object({
    mark: DocumentCheckMark,
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const RequiredProjectionResponse = z
  .object({
    business_object_id: z.string().uuid(),
    all_required_done: z.boolean(),
    required_items: z.array(ChecklistItemResponse),
  })
  .passthrough()
const PhaseProgressResponse = z
  .object({
    phase_name: z.union([z.string(), z.null()]),
    position: z.union([z.number(), z.null()]),
    steps_done: z.number().int(),
    steps_applicable: z.number().int(),
    is_complete: z.boolean(),
    is_current: z.boolean(),
  })
  .passthrough()
const CaseProgressResponse = z
  .object({
    business_object_id: z.string().uuid(),
    phases: z.array(PhaseProgressResponse),
    overall_done: z.number().int(),
    overall_applicable: z.number().int(),
    percent_complete: z.number().int(),
    all_complete: z.boolean(),
  })
  .passthrough()
const PhaseGateStatus = z.enum(["open", "in_review", "approved", "rejected"])
const PhaseGateResponse = z
  .object({
    phase:
      app__modules__workflow_task_catalog__domain__enums__StageCategorization,
    status: PhaseGateStatus,
    gate_approver: z.union([z.string(), z.null()]),
    decided_at: z.union([z.string(), z.null()]),
    note: z.union([z.string(), z.null()]),
  })
  .passthrough()
const SetPhaseGateRequest = z
  .object({
    status: PhaseGateStatus,
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const VfeRateResponse = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    lc_partner_id: z.string().uuid(),
    vfe_amount_eur: z.union([z.string(), z.null()]),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const VfeRateListResponse = z
  .object({ items: z.array(VfeRateResponse) })
  .passthrough()
const VfeRateCreateRequest = z
  .object({
    lc_partner_id: z.string().uuid(),
    vfe_amount_eur: z.union([z.number(), z.string()]),
  })
  .passthrough()
const VfeRateUpdateRequest = z
  .object({ vfe_amount_eur: z.union([z.number(), z.string()]) })
  .passthrough()
const UpdateCatalogRequest = z
  .object({
    catalog_name: z.union([z.string(), z.null()]),
    valid_from: z.union([z.string(), z.null()]),
    valid_to: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse =
  z
    .object({
      id: z.string().uuid(),
      catalog_name: z.string(),
      valid_from: z.union([z.string(), z.null()]),
      valid_to: z.union([z.string(), z.null()]),
      created_by: z.string().uuid(),
      created_at: z.string().datetime({ offset: true }),
      updated_at: z.string().datetime({ offset: true }),
    })
    .passthrough()
const RequirementClassification = z.enum(["mandatory", "optional"])
const app__modules__document_requirement_catalog__domain__enums__StageCategorization =
  z.enum(["submission", "approval", "disbursement_readiness"])
const DocumentOrigin = z.enum(["uploaded", "generated"])
const RequirementResponse = z
  .object({
    id: z.string().uuid(),
    catalog_id: z.string().uuid(),
    requirement_code: z.string(),
    document_type_code: z.string(),
    document_type_name: z.string(),
    description: z.union([z.string(), z.null()]),
    classification: RequirementClassification,
    applicable_case_types: z.array(z.string()),
    stage_categorization: z.union([
      app__modules__document_requirement_catalog__domain__enums__StageCategorization,
      z.null(),
    ]),
    document_origin: DocumentOrigin,
    is_active: z.boolean(),
    sort_order: z.number().int(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogDetailResponse =
  z
    .object({
      id: z.string().uuid(),
      catalog_name: z.string(),
      valid_from: z.union([z.string(), z.null()]),
      valid_to: z.union([z.string(), z.null()]),
      created_by: z.string().uuid(),
      created_at: z.string().datetime({ offset: true }),
      updated_at: z.string().datetime({ offset: true }),
      requirements: z.array(RequirementResponse).optional(),
    })
    .passthrough()
const app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest =
  z
    .object({
      catalog_name: z.string().min(1).max(200),
      valid_from: z.union([z.string(), z.null()]).optional(),
      valid_to: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough()
const CatalogListItem = z
  .object({
    id: z.string().uuid(),
    catalog_name: z.string(),
    valid_from: z.union([z.string(), z.null()]),
    valid_to: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse =
  z
    .object({
      items: z.array(CatalogListItem),
      total: z.number().int(),
      page: z.number().int(),
      per_page: z.number().int(),
      total_pages: z.number().int(),
    })
    .passthrough()
const AddRequirementRequest = z
  .object({
    requirement_code: z.string().min(1).max(100),
    document_type_code: z.string().min(1).max(100),
    document_type_name: z.string().min(1).max(255),
    description: z.union([z.string(), z.null()]).optional(),
    classification: RequirementClassification.optional(),
    applicable_case_types: z.array(z.string()).min(1),
    stage_categorization: z
      .union([
        app__modules__document_requirement_catalog__domain__enums__StageCategorization,
        z.null(),
      ])
      .optional(),
    document_origin: DocumentOrigin.optional(),
    sort_order: z.number().int().optional().default(0),
  })
  .passthrough()
const RequirementListResponse = z
  .object({
    items: z.array(RequirementResponse),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const UpdateRequirementRequest = z
  .object({
    document_type_name: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
    classification: z.union([RequirementClassification, z.null()]),
    applicable_case_types: z.union([z.array(z.string()), z.null()]),
    stage_categorization: z.union([
      app__modules__document_requirement_catalog__domain__enums__StageCategorization,
      z.null(),
    ]),
    document_origin: z.union([DocumentOrigin, z.null()]),
    sort_order: z.union([z.number(), z.null()]),
  })
  .partial()
  .passthrough()
const RuntimeRequirementItem = z
  .object({
    requirement_definition_id: z.union([z.string(), z.null()]).optional(),
    requirement_code: z.string(),
    document_type_name: z.string(),
    classification: z.string(),
    stage_categorization: z.union([z.string(), z.null()]),
    fulfilment_status: z.string(),
    is_blocking: z.boolean(),
    document_origin: z.string(),
    applicable_case_types: z.array(z.string()).optional().default([]),
    linked_document_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const RuntimeRequirementSurfaceResponse = z
  .object({
    catalog_id: z.string().uuid(),
    business_object_id: z.string().uuid(),
    case_type: z.union([z.string(), z.null()]).optional(),
    completeness_summary: z.string(),
    requirements: z.array(RuntimeRequirementItem),
  })
  .passthrough()
const StartableCaseTypesResponse = z
  .object({ startable_case_types: z.array(z.string()) })
  .passthrough()
const MaterializeRequest = z
  .object({
    case_type: z.union([z.string(), z.null()]),
    framework_agreement_id: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const MaterializedRequirementResponse = z
  .object({
    requirement_definition_id: z.union([z.string(), z.null()]),
    requirement_code: z.string(),
    document_type_code: z.string(),
    document_type_name: z.string(),
    classification: z.string(),
    stage_categorization: z.union([z.string(), z.null()]),
    applicable_case_types: z.array(z.string()),
    document_origin: z.string(),
  })
  .passthrough()
const MaterializationResponse = z
  .object({
    catalog_id: z.string().uuid(),
    case_type: z.union([z.string(), z.null()]).optional(),
    effective_requirements: z.array(MaterializedRequirementResponse),
    total: z.number().int(),
  })
  .passthrough()
const LCObligationItem = z
  .object({
    requirement_definition_id: z.union([z.string(), z.null()]).optional(),
    document_type_name: z.string(),
    is_mandatory: z.boolean(),
    fulfilment_status: z.string(),
    action_needed: z.boolean(),
    document_origin: z.string().optional().default(""),
    linked_document_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const LCObligationResponse = z
  .object({
    business_object_id: z.string().uuid(),
    case_type: z.union([z.string(), z.null()]).optional(),
    documents_status_summary: z.string(),
    obligations: z.array(LCObligationItem),
  })
  .passthrough()
const LinkDocumentRequest = z
  .object({
    requirement_definition_id: z.string().uuid(),
    business_object_id: z.string().uuid(),
    business_object_type: z.string(),
    linked_document_id: z.string().uuid(),
    linked_document_type_code: z.string(),
  })
  .passthrough()
const FulfilmentResponse = z
  .object({
    id: z.string().uuid(),
    requirement_definition_id: z.string().uuid(),
    business_object_id: z.string().uuid(),
    business_object_type: z.string(),
    status: z.string(),
    linked_document_id: z.union([z.string(), z.null()]),
    linked_document_type_code: z.union([z.string(), z.null()]),
    transition_reason: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const TransitionStatusRequest = z
  .object({
    requirement_definition_id: z.string().uuid(),
    business_object_id: z.string().uuid(),
    business_object_type: z.string(),
    new_status: z.string(),
    transition_reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const PerRequirementStatusResponse = z
  .object({
    requirement_definition_id: z.union([z.string(), z.null()]).optional(),
    requirement_code: z.string(),
    classification: z.string(),
    status: z.string(),
    linked_document_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const CompletenessResponse = z
  .object({
    catalog_id: z.string().uuid(),
    case_type: z.union([z.string(), z.null()]).optional(),
    business_object_id: z.string().uuid(),
    summary: z.string(),
    mandatory_total: z.number().int(),
    mandatory_fulfilled: z.number().int(),
    mandatory_pending: z.number().int(),
    mandatory_missing: z.number().int(),
    per_requirement: z.array(PerRequirementStatusResponse),
  })
  .passthrough()
const Body_upload_case_document_api_v1_cases__case_id__documents_post = z
  .object({ requirement_definition_id: z.string().uuid(), file: z.string() })
  .passthrough()
const CaseDocumentFile = z
  .object({
    document_id: z.string().uuid(),
    file_name: z.union([z.string(), z.null()]),
    uploaded_at_utc: z.string().datetime({ offset: true }),
    uploaded_at_local: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CaseDocumentRow = z
  .object({
    requirement_definition_id: z.union([z.string(), z.null()]),
    requirement_code: z.string(),
    document_type_code: z.string(),
    document_type_name: z.string(),
    role_scope: z.union([z.string(), z.null()]),
    classification: z.string(),
    status: z.string(),
    files: z.array(CaseDocumentFile),
  })
  .passthrough()
const CaseDocumentListResponse = z
  .object({ case_id: z.string().uuid(), documents: z.array(CaseDocumentRow) })
  .passthrough()
const RejectDocumentRequest = z
  .object({ reason: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const GeneratedDocumentRow = z
  .object({
    document_type_code: z.string(),
    media_id: z.string().uuid(),
    file_name: z.string(),
    produced_by: z.string().uuid(),
    produced_at_utc: z.string().datetime({ offset: true }),
    produced_at_local: z.string().datetime({ offset: true }),
  })
  .passthrough()
const GeneratedDocumentListResponse = z
  .object({
    case_id: z.string().uuid(),
    documents: z.array(GeneratedDocumentRow),
  })
  .passthrough()
const DocumentRoleScope = z.enum(["lessee", "guarantor", "case"])
const DocumentTypeOrigin = z.enum(["requested", "generated"])
const CreateDocumentTypeRequest = z
  .object({
    type_code: z.string().min(1).max(100),
    type_name: z.string().min(1).max(255),
    role_scope: DocumentRoleScope,
    origin: DocumentTypeOrigin.optional(),
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const DocumentTypeResponse = z
  .object({
    id: z.string().uuid(),
    type_code: z.string(),
    type_name: z.string(),
    role_scope: DocumentRoleScope,
    origin: DocumentTypeOrigin,
    note: z.union([z.string(), z.null()]),
    is_active: z.boolean(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const origin = z.union([DocumentTypeOrigin, z.null()]).optional()
const role_scope = z.union([DocumentRoleScope, z.null()]).optional()
const DocumentTypeListResponse = z
  .object({ items: z.array(DocumentTypeResponse), total: z.number().int() })
  .passthrough()
const UpdateDocumentTypeRequest = z
  .object({
    type_name: z.union([z.string(), z.null()]),
    role_scope: z.union([DocumentRoleScope, z.null()]),
    note: z.union([z.string(), z.null()]),
    is_active: z.union([z.boolean(), z.null()]),
  })
  .partial()
  .passthrough()
const DocumentTypeMatrixRow = z
  .object({
    type_code: z.string(),
    type_name: z.string(),
    role_scope: DocumentRoleScope,
    origin: DocumentTypeOrigin,
  })
  .passthrough()
const DocumentTypeMatrixResponse = z
  .object({ rows: z.array(DocumentTypeMatrixRow), total: z.number().int() })
  .passthrough()
const TestSessionRequest = z.object({ email: z.string().email() }).passthrough()
const OTPResponse = z
  .object({
    code: z.string(),
    expires_at: z.string().datetime({ offset: true }),
  })
  .passthrough()

export const schemas = {
  LoginRequest,
  LoginStepResponse,
  ValidationError,
  HTTPValidationError,
  SetPasswordRequest,
  SetPasswordResponse,
  MfaEnrollRequest,
  MfaEnrollResponse,
  MfaActivateRequest,
  UserRole,
  UserStatus,
  UserResponse,
  MfaActivateResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  VerifyOtpRequest,
  LoginResponse,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResetPasswordVerifyRequest,
  ResetVerifyResponse,
  FollowUpEvent,
  StartFollowUpRequest,
  CaseType,
  CaseStatus,
  CaseDisplayStatus,
  CaseOrigin,
  CaseResponse,
  StartCaseRequest,
  case_type,
  status,
  CaseListItem,
  CaseListResponse,
  AssignCaseRequest,
  RequestStatus,
  DecideRequestRequest,
  SubmitResultResponse,
  CaseLeasingCompanyResponse,
  CaseProductTemplateResponse,
  ReviewContractItem,
  CollateralType,
  CollateralRecheckState,
  CollateralValueItem,
  CollateralResponse,
  ReviewFinancingSummary,
  CaseReviewResponse,
  CaseDataFinancingBlock,
  CaseDataResponse,
  RecordDeviationRequest,
  DeviationResponse,
  DeviationListResponse,
  DocumentToSendItem,
  DocumentsToSendResponse,
  DispatchResponse,
  CorrespondenceKind,
  RecordCorrespondenceRequest,
  CorrespondenceResponse,
  CorrespondenceListResponse,
  BindLeasingCompanyRequest,
  BindProductTemplateRequest,
  CaseActivityItem,
  CaseActivityResponse,
  SetCollateralTypeRequest,
  SetCollateralTotalRequest,
  SetCollateralEvidenceRequest,
  RedetermineCollateralRequest,
  CombinedDocumentResponse,
  CombinedDocumentListResponse,
  PartyMatchItem,
  CasePartyMatchResponse,
  LcCaseDetailResponse,
  FinancingKind,
  FinancingStatus,
  FinancingRead,
  ObjectRef,
  FinancingContractRef,
  DecisionRef,
  ApprovalConditionState,
  CovenantRef,
  FinancingHistoryEntry,
  FinancingOverviewResponse,
  RecordLoanValuesRequest,
  SetRefinancingRateRequest,
  OverrideQuotaRequest,
  SetValueDateRequest,
  CommitRateRequest,
  AddApprovalConditionRequest,
  ApprovalConditionResponse,
  ApprovalConditionListResponse,
  WaiveConditionRequest,
  GovernedActionType,
  GovernedActionStatus,
  GovernedActionResponse,
  FinancingComponentResponse,
  FinancingComponentListResponse,
  PaymentPlanEntryResponse,
  PaymentPlanResponse,
  ManualPlanRowRequest,
  SetManualPlanRequest,
  RefinancedCashFlowLine,
  RefinancedCashFlowResponse,
  RemainingBalanceResponse,
  ContractContributionItem,
  ContractContributionListResponse,
  PerContractSideResponse,
  FinancingRemainingBalanceResponse,
  batch_id,
  ContractDeferredState,
  ContractCompleteness,
  ContractRead,
  ContractListResponse,
  ContractType,
  AmortisationType,
  InstalmentFrequency,
  ContractCreate,
  PackageTotalsRead,
  BulkRemoveRequest,
  BulkRemoveResponse,
  ContractEdit,
  ContractRemove,
  ObjectSubGroupItem,
  ObjectGroupItem,
  ObjectClassificationResponse,
  LeaseObjectRead,
  LeaseObjectListResponse,
  NewOrUsed,
  MarketValueIndicator,
  DATEvidenceStatus,
  LeaseObjectCreate,
  LeaseObjectEdit,
  LeaseObjectRemove,
  RegisteredAddressInput,
  LegalEntityIdentityInput,
  NaturalPersonIdentityInput,
  SoleProprietorIdentityInput,
  LesseePreviewRequest,
  PartnerType,
  CandidateSummary,
  PartnerMatchResponse,
  LesseeCaptureRequest,
  LesseeLinkResponse,
  RegisteredAddress,
  LegalEntityIdentityDetail,
  NaturalPersonIdentityDetail,
  SoleProprietorIdentityDetail,
  PartnerDetailResponse,
  GuarantorPreviewRequest,
  GuarantorAddRequest,
  GuarantorLinkResponse,
  GuarantorListItem,
  GuarantorListResponse,
  GuarantorRemoveRequest,
  Body_upload_contract_import_api_v1_cases__case_id__contracts_import_post,
  ImportBatchResponse,
  ImportRowItem,
  ImportBatchPreviewResponse,
  ImportCommitResponse,
  UpdateMeRequest,
  UserMePermissionsResponse,
  AccessReason,
  GrantStatus,
  SupportGrantResponse,
  Body_upload_picture_api_v1_users_me_picture_post,
  UserListItem,
  PaginatedUsersResponse,
  InviteUserRequest,
  app__modules__users__interfaces__http__schemas__user_schemas__UserRef,
  UserDetailResponse,
  EditUserRequest,
  ChangeEmailRequest,
  ResendReason,
  ResendInvitationRequest,
  SuspensionReason,
  SuspendUserRequest,
  ReactivationReason,
  ReactivateUserRequest,
  DeactivationReason,
  DeactivateUserRequest,
  TenantType,
  DefaultCurrency,
  SeedPackage,
  CreateTenantRequest,
  TenantStatus,
  module_active,
  TenantListResponse,
  PaginatedTenantsResponse,
  TenantResponse,
  TenantSupportResponse,
  UpdateTenantRequest,
  SuspendTenantRequest,
  ReactivateTenantRequest,
  ArchiveTenantRequest,
  MfaPolicyRequest,
  GovernanceHistoryEventResponse,
  GovernanceHistoryResponse,
  AccessPolicyFlagRecord,
  AccessPolicyResponse,
  AccessPolicyRequest,
  IntegrationBindingResponse,
  UpsertIntegrationBindingRequest,
  CreateGrantRequest,
  RevokeGrantRequest,
  CompleteReviewRequest,
  PlatformModuleEntry,
  PlatformModulesResponse,
  TenantModuleEntry,
  TenantModulesResponse,
  SeedPackageEntry,
  SeedPackagesResponse,
  ModuleActionRequest,
  ModuleDeactivateRequest,
  InitiateRoleChangeRequest,
  AuditorPeriodUpdateReason,
  UpdateAuditorAccessPeriodRequest,
  SubjectType,
  subject_type,
  PaginatedGovernedActionsResponse,
  ApproveRejectRequest,
  ReInitiateRequest,
  AuditFilterOptionsResponse,
  AuditEventListItem,
  PaginatedAuditEventsResponse,
  FieldDiffItem,
  AuditEventResponse,
  DuplicateResolutionReasonCode,
  ResolveDuplicatePairRequest,
  ResolveDuplicatePairResponse,
  MergeReasonCode,
  MergeInitiateRequest,
  MergeInitiateResponse,
  PartnerSubmitRequest,
  PartnerSubmitResponse,
  ResolutionEventSummary,
  ResolutionCandidatesResponse,
  ActorSummary,
  RoleAssignmentSummary,
  RoleHistoryEntry,
  PartnerRolesResponse,
  UboOwnershipRequest,
  UboOwnershipRecordResponse,
  PartnerUboResponse,
  LcNumberResponse,
  LcNumberListResponse,
  LcNumberCreateRequest,
  BankAccountResponse,
  BankAccountListResponse,
  BankAccountCreateRequest,
  AffectedAgreementItem,
  BankAccountCloseResponse,
  ConfirmationHistoryEntry,
  ConfirmationHistoryResponse,
  DecisionHistoryEntry,
  DecisionHistoryResponse,
  ArchiveEligibilityResponse,
  PartnerConfirmRequest,
  PartnerRejectRequest,
  ArchivePartnerRequest,
  ArchivePartnerResponse,
  IdentityChangeProposalRequest,
  DownstreamImpact,
  IdentityChangeProposeResponse,
  IdentityChangeActorSummary,
  IdentityHistoryItem,
  IdentityHistoryResponse,
  IdentityChangeDetailResponse,
  MergeLineageRecordResponse,
  MergeHistoryResponse,
  PartnerMatchRequest,
  PartnerStatus,
  PartnerRole,
  UboCompletenessStatus,
  PartnerListItem,
  PartnerListResponse,
  MatchingEvidenceItem,
  DuplicateCandidatePairResponse,
  DuplicatePairListResponse,
  RefinancingForm,
  refinancing_form,
  SelectableTemplateItem,
  SelectableTemplatesResponse,
  LegalStructure,
  PaymentTiming,
  RateBasis,
  RateType,
  DisbursementDerivationRule,
  AssetCategory,
  app__modules__product_templates__interfaces__http__schemas__product_template__UserRef,
  VersionDetailResponse,
  UpdateTemplateDraftRequest,
  TemplateDraftUpdatedResponse,
  TemplateDraftDiscardedResponse,
  UpdateOrchestrationRequest,
  OrchestrationLinkageItem,
  OrchestrationResponse,
  PublishTemplateDraftRequest,
  PublishTemplateDraftResponse,
  NewVersionCreatedResponse,
  TemplateVersionSummary,
  VersionHistoryResponse,
  TerminateVersionRequest,
  TerminateVersionResponse,
  DeactivateProductRequest,
  ProductStatusResponse,
  SetEffectiveDateRequest,
  SetEffectiveDateResponse,
  VersionUsageAgreement,
  VersionUsageItem,
  VersionUsageResponse,
  VersionDiffResponse,
  TemplateCurrentVersionSummary,
  TemplateListItem,
  TemplateListResponse,
  CreateTemplateDraftRequest,
  TemplateDraftCreatedResponse,
  BankEntity,
  RefiLoanValueDateRule,
  CreateFARequest,
  FALifecycleStatus,
  FAPinnedVersionChangeImpact,
  FADraftResponse,
  FAAgreementLifecycle,
  FAListItemResponse,
  FAListResponse,
  UpdateFARequest,
  FADetailResponse,
  DocumentOverrideKind,
  DocumentOverrideItem,
  SetDocumentOverridesRequest,
  DocumentOverridesResponse,
  ActivateFARequest,
  TerminationReadinessResponse,
  TerminateFARequest,
  FATerminatedResponse,
  DeactivateFARequest,
  ReactivateFARequest,
  FALCPartnerItem,
  FALCPartnersResponse,
  FAUtilizationResponse,
  FALinkedFinancingsResponse,
  FAPricingSnapshotResponse,
  FAEventTypeFilter,
  FAAuditEventResponse,
  FAAuditHistoryResponse,
  FAReconstructResponse,
  FADocumentType,
  Body_attach_document_api_v1_framework_agreements__id__documents_post,
  AttachDocumentResponse,
  DocumentListItemResponse,
  DownloadURLResponse,
  LCPortalProductTemplateItem,
  LCPortalDocumentItem,
  LCPortalFAListItem,
  LCPortalFAListResponse,
  CatalogLayer,
  catalog_layer,
  CatalogEntityType,
  entity_type,
  case_type__2,
  product_template_id,
  CatalogState,
  catalog_state,
  CatalogListItemResponse,
  app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse,
  app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest,
  app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
  SuspendCatalogResponse,
  FieldRegistryItem,
  CatalogCaseTypeItem,
  LayerAction,
  TaskCategory,
  TaskResponsibleRole,
  app__modules__workflow_task_catalog__domain__enums__StageCategorization,
  TaskProcessContext,
  StateTransitionOutcome,
  DocumentCheckItem,
  ConditionOperator,
  ConditionRowItem,
  DocRequirementPinMode,
  ConditionalTrigger,
  TaskType,
  TaskApplicability,
  InheritedGDValues,
  TaskDefinitionItem,
  app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogDetailResponse,
  AuditTrailEventItem,
  AuditTrailResponse,
  AddTaskRequest,
  TaskResponseWithWarnings,
  TaskResponse,
  UpdateTaskRequest,
  CreatePhaseRequest,
  PhaseResponse,
  ReorderPhasesRequest,
  UpdatePhaseRequest,
  RemovePhaseResponse,
  MaterializeChecklistRequest,
  ChecklistItemStatus,
  ChecklistCloseActor,
  DocumentCheckMark,
  ChecklistItemCheckResponse,
  ChecklistItemResponse,
  SetItemStatusRequest,
  SetItemCheckMarkRequest,
  RequiredProjectionResponse,
  PhaseProgressResponse,
  CaseProgressResponse,
  PhaseGateStatus,
  PhaseGateResponse,
  SetPhaseGateRequest,
  VfeRateResponse,
  VfeRateListResponse,
  VfeRateCreateRequest,
  VfeRateUpdateRequest,
  UpdateCatalogRequest,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
  RequirementClassification,
  app__modules__document_requirement_catalog__domain__enums__StageCategorization,
  DocumentOrigin,
  RequirementResponse,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogDetailResponse,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest,
  CatalogListItem,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse,
  AddRequirementRequest,
  RequirementListResponse,
  UpdateRequirementRequest,
  RuntimeRequirementItem,
  RuntimeRequirementSurfaceResponse,
  StartableCaseTypesResponse,
  MaterializeRequest,
  MaterializedRequirementResponse,
  MaterializationResponse,
  LCObligationItem,
  LCObligationResponse,
  LinkDocumentRequest,
  FulfilmentResponse,
  TransitionStatusRequest,
  PerRequirementStatusResponse,
  CompletenessResponse,
  Body_upload_case_document_api_v1_cases__case_id__documents_post,
  CaseDocumentFile,
  CaseDocumentRow,
  CaseDocumentListResponse,
  RejectDocumentRequest,
  GeneratedDocumentRow,
  GeneratedDocumentListResponse,
  DocumentRoleScope,
  DocumentTypeOrigin,
  CreateDocumentTypeRequest,
  DocumentTypeResponse,
  origin,
  role_scope,
  DocumentTypeListResponse,
  UpdateDocumentTypeRequest,
  DocumentTypeMatrixRow,
  DocumentTypeMatrixResponse,
  TestSessionRequest,
  OTPResponse,
}

const endpoints = makeApi([
  {
    method: "get",
    path: "/",
    alias: "root__get",
    requestFormat: "json",
    response: z.unknown(),
  },
  {
    method: "get",
    path: "/api/v1/audit/events",
    alias: "list_audit_events_api_v1_audit_events_get",
    requestFormat: "json",
    parameters: [
      {
        name: "entity_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "action_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "event_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "entity_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "actor_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "actor_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "trigger_source",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "sensitive",
        type: "Query",
        schema: module_active,
      },
      {
        name: "from_dt",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "to_dt",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(200).optional().default(50),
      },
    ],
    response: PaginatedAuditEventsResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/audit/events/:event_id",
    alias: "get_audit_event_api_v1_audit_events__event_id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "event_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: AuditEventResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/audit/events/entity/:entity_type/:entity_id",
    alias:
      "list_entity_audit_events_api_v1_audit_events_entity__entity_type___entity_id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "entity_type",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "entity_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "action_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "event_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "actor_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "actor_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "trigger_source",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "sensitive",
        type: "Query",
        schema: module_active,
      },
      {
        name: "from_dt",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "to_dt",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(200).optional().default(50),
      },
    ],
    response: PaginatedAuditEventsResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/audit/filters/options",
    alias: "get_audit_filter_options_api_v1_audit_filters_options_get",
    requestFormat: "json",
    response: AuditFilterOptionsResponse,
  },
  {
    method: "post",
    path: "/api/v1/auth/invite/set-password",
    alias: "set_password_api_v1_auth_invite_set_password_post",
    description: `Complete account activation by setting the initial password.

**Requirements:**
- Valid, unexpired invitation token
- Password min 8 chars, at least 1 uppercase letter and 1 number
- &#x60;password&#x60; and &#x60;password_confirm&#x60; must match

**Effect:** Sets password hash, changes status to &#x60;active&#x60;, records &#x60;activated_at&#x60;, clears &#x60;invite_token_hash&#x60;.

**Returns:**
- &#x60;mfa_enrollment_required&#x3D;False&#x60; — user can now log in normally
- &#x60;mfa_enrollment_required&#x3D;True&#x60; + &#x60;mfa_token&#x60; — FE must redirect to &#x60;/auth/mfa/enroll&#x60; before login`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetPasswordRequest,
      },
    ],
    response: SetPasswordResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/auth/invite/validate-token",
    alias: "validate_activation_token_api_v1_auth_invite_validate_token_get",
    description: `Pre-validate the invitation token before the user fills in the activation form.

**Checks:** JWT signature, expiry, and SHA-256 hash match against &#x60;invite_token_hash&#x60; in the database.

**Returns:** &#x60;TOKEN_VALID&#x60; success — frontend can safely display the set-password form`,
    requestFormat: "json",
    parameters: [
      {
        name: "token",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/login",
    alias: "login_api_v1_auth_login_post",
    description: `First step of the login flow. Returns &#x60;next_step&#x60; to tell the FE which screen to show.

| &#x60;next_step&#x60; | Meaning | Next call |
|---|---|---|
| &#x60;otp&#x60; | Email OTP sent | &#x60;POST /auth/otp/verify&#x60; |
| &#x60;mfa&#x60; | User has TOTP enrolled | &#x60;POST /auth/mfa/verify&#x60; |
| &#x60;mfa_setup&#x60; | MFA required but not enrolled yet | &#x60;POST /auth/mfa/enroll&#x60; |
| &#x60;session&#x60; | MFA freshness bypass — cookies already set, redirect to dashboard | — |

**Rate limiting:** 5 failed user attempts → 15-min lock; 20 failed IP attempts per 10 min → IP throttle.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginRequest,
      },
    ],
    response: LoginStepResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/logout",
    alias: "logout_api_v1_auth_logout_post",
    description: `Invalidate the current session.

**Requirements:** Valid &#x60;access_token&#x60; cookie.

**Effect:** Blacklists the current access JTI and its paired refresh JTI; removes the refresh JTI from the active sessions set. Clears both auth cookies.

**Returns:** Generic success`,
    requestFormat: "json",
    response: z.unknown(),
  },
  {
    method: "post",
    path: "/api/v1/auth/logout-all",
    alias: "logout_all_api_v1_auth_logout_all_post",
    description: `Invalidate all active sessions for the current user.

**Requirements:** Valid &#x60;access_token&#x60; cookie.

**Effect:** Sets a &#x60;logout_all&#x60; timestamp in Redis; all tokens issued before this timestamp are rejected on next request. Clears the entire active sessions set. Clears both auth cookies.

**Returns:** Generic success`,
    requestFormat: "json",
    response: z.unknown(),
  },
  {
    method: "post",
    path: "/api/v1/auth/mfa/activate",
    alias: "activate_api_v1_auth_mfa_activate_post",
    description: `Step 2 of MFA enrollment — verify first TOTP code and activate MFA.

On success:
- Sets &#x60;mfa_enabled &#x3D; True&#x60;
- Generates 10 single-use recovery codes (shown once — user must save them)
- Creates session and sets HTTP-only auth cookies

Conscious decision: no OTP step before enrollment. The &#x60;mfa_token&#x60; (issued after
password is set) + successful TOTP verify is a stronger proof than email OTP.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MfaActivateRequest,
      },
    ],
    response: MfaActivateResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/mfa/enroll",
    alias: "enroll_api_v1_auth_mfa_enroll_post",
    description: `Step 1 of MFA enrollment — generate TOTP secret and QR code.

Requires &#x60;mfa_token&#x60; with &#x60;purpose&#x3D;setup&#x60;, obtained from:
- &#x60;POST /auth/set-password&#x60; (activation flow, when MFA is required)
- &#x60;POST /auth/otp/verify&#x60; (retroactive enforcement, when tenant enables MFA)

Returns a QR code PNG (base64) + manual entry key. Pass the refreshed
&#x60;mfa_token&#x60; to &#x60;/mfa/activate&#x60; to complete enrollment.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ mfa_token: z.string() }).passthrough(),
      },
    ],
    response: MfaEnrollResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/mfa/verify",
    alias: "verify_api_v1_auth_mfa_verify_post",
    description: `MFA verification on login — accepts TOTP code or recovery code.

&#x60;mfa_token&#x60; (purpose&#x3D;verify) is obtained from &#x60;POST /auth/login&#x60; when the
user has &#x60;mfa_enabled &#x3D; True&#x60;.

On recovery code use: the used code is invalidated and 10 new codes are
generated immediately. The new codes are returned in &#x60;new_recovery_codes&#x60; in
the response body — FE must show them to the user immediately.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MfaVerifyRequest,
      },
    ],
    response: MfaVerifyResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/otp/resend",
    alias: "resend_otp_api_v1_auth_otp_resend_post",
    description: `Resend the email OTP for an in-progress login.

**Requirements:**
- &#x60;verification_token&#x60; from &#x60;/login&#x60; must still be valid
- 60-second cooldown between resend requests

**Returns:** Generic success — new OTP sent to email`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ verification_token: z.string() }).passthrough(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/otp/verify",
    alias: "verify_otp_api_v1_auth_otp_verify_post",
    description: `Verify the email OTP code (used when &#x60;next_step&#x3D;otp&#x60; from &#x60;/auth/login&#x60;).

1. Validates &#x60;token&#x60; (must not be expired)
2. Verifies the 6-digit OTP code (max 3 attempts)
3. Issues &#x60;access_token&#x60; + &#x60;refresh_token&#x60; as HTTP-only cookies

**Returns:** Full user object. Tokens delivered via HTTP-only Secure cookies.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: VerifyOtpRequest,
      },
    ],
    response: LoginResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/password/forgot",
    alias: "forgot_password_api_v1_auth_password_forgot_post",
    description: `Send a password reset link to the given email address.

**Security:** Always returns 200 regardless of whether the email exists — prevents user enumeration.

**Rate limiting:** 300s cooldown per email, max 3 requests/hour per email, IP throttle shared with login.

**Effect (if user exists):** Generates a JWT reset token (1h TTL), stores its SHA-256 hash, sends an email with the reset link.

**Returns:** Generic success regardless of outcome`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ email: z.string().email() }).passthrough(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/password/reset",
    alias: "reset_password_api_v1_auth_password_reset_post",
    description: `Complete the password reset flow by setting a new password.

**Requirements:**
- Valid, unexpired reset token (1h TTL)
- Password min 8 chars, at least 1 uppercase letter and 1 number
- &#x60;password&#x60; and &#x60;password_confirm&#x60; must match

**Non-MFA path:** Password updated immediately. All active sessions invalidated. Returns &#x60;mfa_required&#x3D;false&#x60;.

**MFA path (privileged roles with MFA enabled):** Password staged in &#x60;pending_password_hash&#x60;, sessions NOT yet invalidated.
Returns &#x60;mfa_required&#x3D;true, mfa_token&#x3D;&lt;5-min JWT&gt;&#x60;. FE must call &#x60;POST /auth/password/reset/verify&#x60;.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResetPasswordRequest,
      },
    ],
    response: ResetPasswordResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/password/reset/verify",
    alias: "reset_password_verify_api_v1_auth_password_reset_verify_post",
    description: `Complete MFA-gated password reset by verifying a TOTP or recovery code.

**Triggered when:** &#x60;POST /auth/password/reset&#x60; returned &#x60;mfa_required&#x3D;true&#x60;.

**Code auto-detection:**
- 6-digit numeric → TOTP
- 20-char hex (&#x60;[0-9a-f]{20}&#x60;) → recovery code

**On success:**
- &#x60;pending_password_hash&#x60; promoted to &#x60;password&#x60;
- All previous sessions invalidated
- New session created immediately (no separate login needed)
- Auth cookies set in response

**Recovery code path:** Used code invalidated, 10 new codes generated and returned in &#x60;new_recovery_codes&#x60;. Show to user once.

**Rate limit on recovery codes:** 3 attempts / 24h per user → 429 &#x60;MFA_RECOVERY_RATE_LIMITED&#x60;.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResetPasswordVerifyRequest,
      },
    ],
    response: ResetVerifyResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/auth/password/validate-token",
    alias: "validate_reset_token_api_v1_auth_password_validate_token_get",
    description: `Pre-validate the reset token before the user fills in the new password form.

**Checks:** JWT signature, expiry, and SHA-256 hash match against &#x60;password_reset_token_hash&#x60; in the database.

**Returns:** &#x60;TOKEN_VALID&#x60; success — frontend can safely display the reset-password form`,
    requestFormat: "json",
    parameters: [
      {
        name: "token",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/auth/refresh-token",
    alias: "refresh_token_api_v1_auth_refresh_token_post",
    description: `Exchange a valid refresh token for a new access + refresh token pair.

**Requirements:** Valid &#x60;refresh_token&#x60; HTTP-only cookie.

**Validations (in order):**
1. JWT signature + not expired
2. Token type must be &#x60;refresh&#x60;
3. Not blacklisted (&#x60;token:blacklist:{jti}&#x60;)
4. Not invalidated by &#x60;logout_all&#x60; timestamp
5. Server-side session exists (Redis Sorted Set)
6. Absolute session timeout not exceeded (&#x60;session_iat&#x60;, 8h max)
7. User exists and is active

**Effect:** Old refresh JTI blacklisted, new token pair issued with the same &#x60;session_iat&#x60; (preserves absolute timeout). New tokens delivered via HTTP-only Secure cookies.

**Returns:** Full user object. All failures return 401 &#x60;SESSION_EXPIRED&#x60;.`,
    requestFormat: "json",
    response: LoginResponse,
  },
  {
    method: "post",
    path: "/api/v1/auth/verify-email-change",
    alias: "verify_email_change_api_v1_auth_verify_email_change_post",
    description: `Verify and apply an email address change. No authentication required — called via link in email.

Validates the token, updates user.email to pending_email, clears pending state,
and invalidates all active sessions.`,
    requestFormat: "json",
    parameters: [
      {
        name: "token",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases",
    alias: "start_case_api_v1_cases_post",
    description: `Start a case. The platform sets the reference, the creator and the creation time.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: StartCaseRequest,
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases",
    alias: "list_cases_api_v1_cases_get",
    description: `The case list.

&#x60;&#x60;status&#x60;&#x60; takes one displayed value, because a user picks &quot;waiting&quot; rather than filling in
three fields. The query resolves that choice onto the stored sets and never runs on the derived
value. &#x60;&#x60;unclaimed&#x60;&#x60; is the view for cases that came in from a leasing company and have not been
picked up by the bank — whether the interface renders it as a tab, a saved view or a filter is a
design decision and not a scope one.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_type",
        type: "Query",
        schema: case_type,
      },
      {
        name: "status",
        type: "Query",
        schema: status,
      },
      {
        name: "unclaimed",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "mine",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "unassigned",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "my_work_list",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "oldest_first",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(200).optional().default(50),
      },
      {
        name: "offset",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
    ],
    response: CaseListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:business_object_id/checklist",
    alias:
      "materialize_checklist_api_v1_cases__business_object_id__checklist_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MaterializeChecklistRequest,
      },
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(ChecklistItemResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:business_object_id/checklist",
    alias: "get_checklist_api_v1_cases__business_object_id__checklist_get",
    requestFormat: "json",
    parameters: [
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(ChecklistItemResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/cases/:business_object_id/checklist/items/:item_id",
    alias:
      "set_item_status_api_v1_cases__business_object_id__checklist_items__item_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetItemStatusRequest,
      },
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "item_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ChecklistItemResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/cases/:business_object_id/checklist/items/:item_id/checks/:check_id",
    alias:
      "set_item_check_mark_api_v1_cases__business_object_id__checklist_items__item_id__checks__check_id__patch",
    description: `PRD1042-1892 items 11/12 — record the mark on one document check of a checklist item.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetItemCheckMarkRequest,
      },
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "item_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "check_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ChecklistItemCheckResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:business_object_id/checklist/required",
    alias:
      "get_required_projection_api_v1_cases__business_object_id__checklist_required_get",
    requestFormat: "json",
    parameters: [
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RequiredProjectionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:business_object_id/phase-gates",
    alias: "get_phase_gates_api_v1_cases__business_object_id__phase_gates_get",
    requestFormat: "json",
    parameters: [
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(PhaseGateResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/cases/:business_object_id/phase-gates/:phase",
    alias:
      "set_phase_gate_api_v1_cases__business_object_id__phase_gates__phase__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetPhaseGateRequest,
      },
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "phase",
        type: "Path",
        schema: z.enum([
          "pre_submission",
          "stage_1_review",
          "stage_2_review",
          "pre_disbursement",
          "servicing",
          "redemption",
        ]),
      },
    ],
    response: PhaseGateResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:business_object_id/progress",
    alias: "get_case_progress_api_v1_cases__business_object_id__progress_get",
    description: `US 1.18 (PRD1042-1934) — the case&#x27;s progress figure: each phase&#x27;s steps done out of steps that
apply, plus the overall roll-up. Front Office and Back Office only (a Power User works no case, so
it is refused here even though it may read the raw checklist); the Auditor, Support, System Admin
and the Leasing Company are all non-disclosure 404s. &#x60;business_object_id&#x60; is the case id.`,
    requestFormat: "json",
    parameters: [
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseProgressResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id",
    alias: "get_case_api_v1_cases__case_id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/activity",
    alias: "get_case_activity_api_v1_cases__case_id__activity_get",
    description: `US 1.28 (PRD1042-1944) — the case&#x27;s Activity trail, newest first.

Read through the case (no separate history surface): every action on the case — case-level and
checklist/four-eyes runtime alike — in one chronological stream. A missing or cross-tenant case
is 404 (non-disclosure, in the service); a role with no path to the Activity area is 404 (the
gate). Actor display names are resolved onto the response only — the stored audit rows are never
touched.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(200).optional().default(50),
      },
    ],
    response: CaseActivityResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/activity/export-csv",
    alias:
      "export_case_activity_csv_api_v1_cases__case_id__activity_export_csv_get",
    description: `US 1.28 (PRD1042-1944) — export the case&#x27;s full Activity trail as CSV.

Same guard as the read (missing/cross-tenant → 404, disallowed role → 404). The export access is
itself audited (&#x60;CASE_ACTIVITY_EXPORTED&#x60;, sensitive) so pulling the whole trail out is on the
record.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/assign",
    alias: "assign_case_api_v1_cases__case_id__assign_post",
    description: `Assign, or reassign — the same operation seen before and after the case has an owner.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ assignee_id: z.string().uuid() }).passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/cancel",
    alias: "cancel_case_api_v1_cases__case_id__cancel_post",
    description: `Stop a case (PRD1042-1947, US 1.31). NO-DELETE: the case moves to &#x60;&#x60;cancelled&#x60;&#x60; and stays
readable — nothing is ever removed. There is deliberately no generic state-set endpoint; cancel is
a first-class user action, so it gets one, while ordinary case_status moves are driven by other
business actions.

Thin wrapper: role-gated (bank owner-role only — a non-owner is refused as not-found),
tenant-scoped (a cross-tenant or unknown case is 404), then hands off to the service, which
enforces the four-eyes rule when the case has a financing and drives the CANCELLED transition
through the engine. A case already done, or already cancelled, cannot be cancelled again (the state
machine refuses the move → 409).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/claim",
    alias: "claim_case_api_v1_cases__case_id__claim_post",
    description: `Pull work manually: take an unassigned case from the queue into your own name.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/collateral",
    alias: "get_case_collateral_api_v1_cases__case_id__collateral_get",
    description: `The package collateral for a case (US 1.14 / PRD1042-1930) — kind, current total, evidence,
re-check state, and the full value history (every value kept). Front + back office see it; a role
with no path (Power User, Auditor, LC, ...) and a cross-tenant/other-company case answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/collateral/confirm",
    alias:
      "confirm_case_collateral_api_v1_cases__case_id__collateral_confirm_post",
    description: `The releasing role confirms the re-determined figure under four eyes (act 3 of 3). Back office.

Requires the &#x60;&#x60;redetermined&#x60;&#x60; state (409 otherwise — confirming the old figure confirms nothing),
and the confirmer must differ from the re-determiner (403). Clears the re-check.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/collateral/evidence",
    alias:
      "set_case_collateral_evidence_api_v1_cases__case_id__collateral_evidence_put",
    description: `Record the evidence document reference (a bare id; the document is DRC-owned). Front office only.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetCollateralEvidenceRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/collateral/recheck",
    alias:
      "raise_case_collateral_recheck_api_v1_cases__case_id__collateral_recheck_post",
    description: `Raise the re-check — the package composition changed, so the figure must be set again (US 1.14).

Front office. (Manual raiser; the auto-raiser on a composition-change event and the consumer at
step 3 of the object-swap / lessee-change catalogues are not built yet — deferred wiring.)`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/collateral/redetermine",
    alias:
      "redetermine_case_collateral_api_v1_cases__case_id__collateral_redetermine_post",
    description: `The preparing role re-determines a NEW figure under an open re-check (act 2 of 3). Front office.

Requires a pending re-check (409 if none). Writes a fresh value and moves the state to
&#x60;&#x60;redetermined&#x60;&#x60;; the releasing role must still confirm.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RedetermineCollateralRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/collateral/total",
    alias:
      "set_case_collateral_total_api_v1_cases__case_id__collateral_total_put",
    description: `Enter or correct the package total — a new history row (every value kept); above the
per-vehicle cap it is stored capped. Front office only.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetCollateralTotalRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/collateral/type",
    alias:
      "set_case_collateral_type_api_v1_cases__case_id__collateral_type_put",
    description: `Set the kind of security (single selection). Front office (the preparing role) only.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetCollateralTypeRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/combined-document",
    alias:
      "build_combined_document_api_v1_cases__case_id__combined_document_post",
    description: `Build (or rebuild) the combined document for a case (PRD1042-1943, US 1.27).

Merges every generated and uploaded document, plus a checklist and correspondence summary, into one
PDF with a table of contents; stores it and records the build. A rebuild keeps the history of earlier
builds (R3) and becomes the current one. A case with nothing to merge is refused (422). Front Office
only (the clerk owns step 42); a case the caller cannot see, or a disallowed role, answers 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CombinedDocumentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/combined-document",
    alias:
      "read_combined_document_api_v1_cases__case_id__combined_document_get",
    description: `The current combined document&#x27;s metadata (PRD1042-1943), or 404 if none has been built.

FO + BO + Bank Power User (read-only view); auditor / leasing company / system admin → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CombinedDocumentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/combined-document/download",
    alias:
      "download_combined_document_api_v1_cases__case_id__combined_document_download_get",
    description: `Stream the current combined document PDF for filing (PRD1042-1943). 404 if none has been built.

The bank files it in its own archive by hand — the platform offers the download and never
auto-files or transfers it anywhere.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/combined-document/history",
    alias:
      "list_combined_document_builds_api_v1_cases__case_id__combined_document_history_get",
    description: `Every build on the case, newest first — the build history, never destroyed by a rebuild (R3).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CombinedDocumentListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts",
    alias: "list_contracts_api_v1_cases__case_id__contracts_get",
    description: `The contracts of a request (paged, optionally filtered to one import run).

Tenant-scoped, and a leasing-company caller sees only its own request&#x27;s contracts. Removed contracts
are excluded. Each row carries its derived completeness for the badge.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "batch_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(50),
      },
      {
        name: "offset",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
    ],
    response: ContractListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/contracts",
    alias: "add_contract_api_v1_cases__case_id__contracts_post",
    description: `Add a contract to a request&#x27;s set. Only while the request is in its write window (409 otherwise).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ContractCreate,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts/:contract_id/payment-plan",
    alias:
      "read_payment_plan_api_v1_cases__case_id__contracts__contract_id__payment_plan_get",
    description: `A contract&#x27;s Financing Component + its ordered payment plan (PRD1042-1927, US 1.11).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PaymentPlanResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/contracts/:contract_id/payment-plan",
    alias:
      "set_manual_payment_plan_api_v1_cases__case_id__contracts__contract_id__payment_plan_put",
    description: `Replace a contract&#x27;s plan with hand-entered rows (PRD1042-1927, US 1.11).

The catch-all for irregular structures; a MANUAL plan is never regenerated from terms (R2). Refused
(409) once the financing is frozen. FO + BO; tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetManualPlanRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PaymentPlanResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/contracts/:contract_id/payment-plan/generate",
    alias:
      "generate_payment_plan_api_v1_cases__case_id__contracts__contract_id__payment_plan_generate_post",
    description: `Lay out a contract&#x27;s plan from its terms (PRD1042-1927, US 1.11).

The instalment repeated at the frequency over the term, the residual as the final entry. Refused
(409) when the terms are missing and no manual rows exist — the platform never guesses a plan.
Refused (409) once the financing is frozen. FO + BO; tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PaymentPlanResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts/:contract_id/payment-plan/refinanced-cash-flow",
    alias:
      "read_refinanced_cash_flow_api_v1_cases__case_id__contracts__contract_id__payment_plan_refinanced_cash_flow_get",
    description: `The refinanced cash flow derived from a contract&#x27;s plan (PRD1042-1927, US 1.11).

Instalments after the value date included, one on it excluded; quota applied per line rounded to the
cent; both counts reported. Derived over the plan rows — never a second maintained plan.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RefinancedCashFlowResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts/:contract_id/payment-plan/remaining-balance",
    alias:
      "read_remaining_balance_api_v1_cases__case_id__contracts__contract_id__payment_plan_remaining_balance_get",
    description: `The remaining balance read over a contract&#x27;s plan at &#x60;&#x60;as_of&#x60;&#x60; (PRD1042-1927, US 1.11 R4).

&#x60;&#x60;as_of&#x60;&#x60; is a query parameter, never persisted — the sum of plan amounts due after it. FO + BO;
tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "as_of",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: RemainingBalanceResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts/:contract_id/per-contract-side",
    alias:
      "read_per_contract_side_api_v1_cases__case_id__contracts__contract_id__per_contract_side_get",
    description: `The bank&#x27;s side of one contract (PRD1042-1950, US 1.34).

The component figures + the refinanced cash flow, shown DISTINCT from the lease payment plan the
lessee pays (the two are different — both parties earn on the deal). Objects are named as an absent
block (US-1.8 unbuilt), not faked. Reads stored values, never recomputes (R1). Clerk + approver;
tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PerContractSideResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/contracts/bulk-remove",
    alias: "bulk_remove_api_v1_cases__case_id__contracts_bulk_remove_post",
    description: `Soft-remove several of a request&#x27;s contracts in one call (the 500-of-which-20 case).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BulkRemoveRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ removed: z.number().int() }).passthrough(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/contracts/import",
    alias:
      "upload_contract_import_api_v1_cases__case_id__contracts_import_post",
    description: `Upload one structured contract delivery into the request (PRD1042-1921, US 1.5).

CSV or XLSX (the accepted format is CrossLease&#x27;s to define — both are supported, neither foreclosed).
The file is checked in two passes — shape first, then the SAME business validation manual entry uses —
and staged: nothing is committed here. A row that does not pass is not imported at all and comes back
in the correction file with the line, the field and the reason. Configuration comes before the run:
the request&#x27;s leasing company must resolve to an active framework agreement carrying a refinancing
quota, or the RUN is refused per file (recorded as a failed batch naming what is missing). Capped at
1,000 rows per run; a request may be filled by several runs. FO + BO (on the company&#x27;s behalf) + the
LC user for its own company.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ file: z.string() }).passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ImportBatchResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts/import/:batch_id",
    alias:
      "preview_contract_import_api_v1_cases__case_id__contracts_import__batch_id__get",
    description: `The staged run: how many rows the file held / are valid / failed, and the rows (paged).

The result screen the uploader works from — the valid rows can be committed without waiting for the
rest. No duplicate count is shown (repeat detection is undecided — 1920-OQ-02).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "batch_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "offset",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(100),
      },
    ],
    response: ImportBatchPreviewResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/contracts/import/:batch_id/commit",
    alias:
      "commit_contract_import_api_v1_cases__case_id__contracts_import__batch_id__commit_post",
    description: `Commit the run&#x27;s valid rows into the request as contracts (PRD1042-1921, US 1.5).

Each row resolves its party on the Creditreform/Schufa number through the canonical partner mechanism
(matched, never created blind — an unresolved definite duplicate rejects the row) and becomes a
contract stamped with the batch id and the bulk-file origin. Partial import is the normal case; the
remaining rejected rows stay for the correction file. A batch commits exactly once (409 otherwise).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "batch_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ImportCommitResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts/import/:batch_id/correction-file",
    alias:
      "download_correction_file_api_v1_cases__case_id__contracts_import__batch_id__correction_file_get",
    description: `The correction file: ONLY the rejected rows, each with the line, the field and the reason
(PRD1042-1921). A correctable rejection comes back as an editable row; a factual one comes back with
the reason and no editable column. Access follows the case and the role, never who uploaded the file
(R2). Re-uploading the corrected file is the normal path (a new run; the contract-number key keeps it
from duplicating).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "batch_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/contracts/totals",
    alias: "read_totals_api_v1_cases__case_id__contracts_totals_get",
    description: `DISPLAY sums for the request&#x27;s active contract set — never a calculation input (PRD1042-1928).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PackageTotalsRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/correspondence",
    alias:
      "record_case_correspondence_api_v1_cases__case_id__correspondence_post",
    description: `Record a piece of correspondence on a case (PRD1042-1942, US 1.26).

Independent of any dispatch: what kind it was, which documents were included (references into the
case&#x27;s resolved document set — the documents produced on the case, not a second local list, R3),
and a free-text note. An included code that is not a document produced on the case → 400. Clerk
(front office) only; tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RecordCorrespondenceRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CorrespondenceResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/correspondence",
    alias: "list_case_correspondence_api_v1_cases__case_id__correspondence_get",
    description: `The correspondence recorded on a case, newest first (PRD1042-1942, US 1.26); empty when none.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CorrespondenceListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/data",
    alias: "read_case_data_api_v1_cases__case_id__data_get",
    description: `The case Data area — the captured data grouped by field block (PRD1042-1938, US 1.22).

The wizard is intake; this is where the data lives and is corrected. Only the blocks whose capture
exists today are populated (leasing company, lessee + contracts, financing, collateral); the unbuilt
blocks (objects, credit assessment, guarantor) are named in &#x60;&#x60;absent_blocks&#x60;&#x60;. Credit exposure /
the financing amount are a pending figure, never a group. The financing block carries the
calculation state (a correction devalues it until recalculation). Bank-side surface: front + back
office read; the leasing company never sees the case Data blocks. Tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseDataResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/decide",
    alias: "decide_request_api_v1_cases__case_id__decide_post",
    description: `The approver decides a submitted refinancing request (PRD1042-1945, US 1.29).

One endpoint, the outcome in the body — commit / reject / missing-information / rework — rather
than four routes. Approver-role gated (back office only; any other role, including front office,
is refused as not-found — object non-disclosure), tenant-scoped (a cross-tenant or unknown case
is 404). The service enforces the state precondition (submitted only → else 409), the
reason-required rule for reject + missing-information (→ 422), and the four-eyes rule (the decider
must differ from the request&#x27;s preparers → 403). On a committed decision the case comes into
existence as a financing (the same reuse the WTC-triggered commit performs — no second COMMITTED
path). An unknown outcome value is rejected as a 422 validation error before the service is called.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DecideRequestRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/deviations",
    alias: "record_case_deviation_api_v1_cases__case_id__deviations_post",
    description: `Record a hand-compared document-vs-request deviation (PRD1042-1938, US 1.22).

Where a document shows a residual / instalment / term differing from the request, the user compares
the two by hand and records the difference — the platform never reads the value out of the document
(no OCR). Feeds the step-16 content review; recorded here. Front + back office; tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RecordDeviationRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DeviationResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/deviations",
    alias: "list_case_deviations_api_v1_cases__case_id__deviations_get",
    description: `The deviations recorded on a case, newest first (PRD1042-1938, US 1.22).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DeviationListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/dispatch",
    alias: "read_case_dispatch_api_v1_cases__case_id__dispatch_get",
    description: `The dispatch state of a case (PRD1042-1942, US 1.26) — resting-false until confirmed.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DispatchResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/dispatch/confirm",
    alias: "confirm_case_dispatch_api_v1_cases__case_id__dispatch_confirm_post",
    description: `Confirm that the documents were dispatched externally (PRD1042-1942, US 1.26).

The platform never performs the send — the clerk dispatches by the bank&#x27;s encrypted-email process
and confirms it here; that confirmation completes the step. &#x60;&#x60;dispatch_confirmed&#x60;&#x60; moves from its
resting false to true, with the confirming actor + time. Idempotent — a second confirm keeps the
first confirmation. Clerk (front office) only; tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DispatchResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/documents",
    alias: "upload_case_document_api_v1_cases__case_id__documents_post",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: Body_upload_case_document_api_v1_cases__case_id__documents_post,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FulfilmentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/documents",
    alias: "list_case_documents_api_v1_cases__case_id__documents_get",
    description: `The case&#x27;s document list — the resolved requirement set with each row&#x27;s canonical state, its
party role scope and its files (PRD1042-1939, US 1.23).

Both the bank (front + back office) and the leasing company (its own obligations) read this one
list; the leasing company sees whether the bank has checked what it sent. The resolved set is
consumed from the case&#x27;s frozen snapshot, never re-derived (R3). Tenant + LC scope resolves the
case (a case the caller cannot see → 404). File arrival dates are given in UTC and in the tenant
business timezone (Europe/Berlin, no zone label, R6).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseDocumentListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/documents-to-send",
    alias:
      "list_documents_to_send_api_v1_cases__case_id__documents_to_send_get",
    description: `The documents that go to the leasing company, as one download set (PRD1042-1942, US 1.26).

Limited to the generated types marked externally dispatchable — the financing commitment, the loan
offer and the payment/amortisation plan — never an unrestricted list of case files, and never an
internal-only generated document (cover sheet, total-exposure sheet, bank settlement, calculation
data sheet): those cannot be selected for external dispatch by construction (R2). The platform does
NOT send them — the bank dispatches by its own encrypted-email process. Bank-side; tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentsToSendResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/documents/:requirement_definition_id/check",
    alias:
      "check_case_document_api_v1_cases__case_id__documents__requirement_definition_id__check_post",
    description: `The bank confirms an uploaded document is the right one → CHECKED (PRD1042-1939, US 1.23).

A bank-side review action available to both bank roles (front and back office), with no four eyes
on the single file — the whole-set sign-off at step 16 keeps its four eyes as a separate gate. The
leasing company never checks (refused as not-found). Thin wrapper over the review service.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "requirement_definition_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FulfilmentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/documents/:requirement_definition_id/reject",
    alias:
      "reject_case_document_api_v1_cases__case_id__documents__requirement_definition_id__reject_post",
    description: `The bank rejects an uploaded document → INVALID, and the requirement goes back to outstanding
(PRD1042-1939, US 1.23; PRD1042-1794 A7). Both bank roles, no four eyes on the single file; the LC
never rejects. The reason is recorded on the transition. Thin wrapper over the review service.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RejectDocumentRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "requirement_definition_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FulfilmentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/financing",
    alias: "read_case_financing_api_v1_cases__case_id__financing_get",
    description: `The financing a case has come into existence as.

Read-only: there is no create endpoint, because a financing is never created by hand — it exists
only as the outcome of committing the request. Tenant-scoped: a financing of another tenant, or a
case that has no financing yet, both answer 404 (existence is never leaked across the boundary).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/cancel",
    alias: "cancel_case_financing_api_v1_cases__case_id__financing_cancel_post",
    description: `Cancel the financing a case came into existence as (PRD1042-1952, US 1.36).

Cancel is a first-class user action, so it gets an endpoint — unlike the derived transitions, which
are caused by other business actions and have none. There is deliberately no generic state-set
endpoint. Thin wrapper: role-gated (approver only — a non-approver is refused as not-found), it
resolves the financing by case (tenant-scoped, so a cross-tenant or unknown case is 404), then
hands off to the service, which enforces four-eyes and drives the CANCELLED transition through the
engine. A financing already ended or cancelled cannot be cancelled again (the state machine refuses
the move → 409).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/commit-rate",
    alias:
      "commit_case_financing_rate_api_v1_cases__case_id__financing_commit_rate_post",
    description: `Commit the rate and freeze its expiry — the first freeze point, step 4 (PRD1042-1931, US 1.15).

The committed rate + its expiry freeze together and are immutable thereafter (409 on a re-commit):
they are the fixed reference the settlement rate is compared against. The lock is 7 or 14 days (a
value outside is a 400); the expiry is the value date + the lock, or today + the lock when no value
date is set. A rate must already be entered to commit it (else 422, naming the missing rate).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ lock_days: z.number().int().default(7) })
          .partial()
          .passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/financing/components",
    alias:
      "list_financing_components_api_v1_cases__case_id__financing_components_get",
    description: `The per-contract Financing Components of a case&#x27;s financing (PRD1042-1927, US 1.11).

Materialises one component per active contract if not yet present, then lists them. The share
figures are deferred (null) — the components carry the plan + the calculation date. FO + BO;
tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingComponentListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/conditions",
    alias:
      "add_financing_condition_api_v1_cases__case_id__financing_conditions_post",
    description: `Add an approval condition to the financing (PRD1042-1937, US 1.21).

A condition is free text with a due date, OPEN until settled, and blocks the financing&#x27;s
disbursement. Front office and back office add; a role outside that set is refused as not-found
(object non-disclosure), and a cross-tenant or unknown case is 404. Conditions are never deleted.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddApprovalConditionRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApprovalConditionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/financing/conditions",
    alias:
      "list_financing_conditions_api_v1_cases__case_id__financing_conditions_get",
    description: `List the financing&#x27;s approval conditions (full history — never deleted) + the block summary.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApprovalConditionListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/conditions/:condition_id/settle",
    alias:
      "settle_financing_condition_api_v1_cases__case_id__financing_conditions__condition_id__settle_post",
    description: `Settle an approval condition — a factual entry, OPEN → MET, no dual control (PRD1042-1937).

Front office and back office settle. A non-open condition (already met/waived/expired) is a 409;
an unknown condition, or a cross-tenant / unknown financing, is 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "condition_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApprovalConditionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/conditions/:condition_id/waive",
    alias:
      "waive_financing_condition_api_v1_cases__case_id__financing_conditions__condition_id__waive_post",
    description: `Request a waiver of an approval condition — the governed override (PRD1042-1937 R2, US 1.21).

Front or back office initiates with a mandatory reason + expiry; a SECOND bank user (back office)
then approves via &#x60;POST /governed-actions/{id}/approve&#x60; (the engine enforces initiator ≠ approver).
Initiation does NOT change the condition — it stays OPEN, so the disbursement block holds until the
waiver is approved. A cross-tenant / unknown case is 404; an unknown condition on the financing is
404; a non-OPEN condition is 409 (a settled/already-waived condition cannot be waived).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: WaiveConditionRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "condition_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/follow-ups",
    alias: "start_follow_up_api_v1_cases__case_id__financing_follow_ups_post",
    description: `Start a follow-up case on a live deal&#x27;s financing (PRD1042-1953, US 1.37).

&#x60;&#x60;case_id&#x60;&#x60; is the case the financing came from (the financing surface is keyed on it). The clerk
names the event (redemption / lessee change / object swap / extension / asset event); a redemption
derives single vs package from the affected contracts. Thin wrapper: role-gated (clerk or approver;
others 404), then the service resolves the financing (tenant-scoped → 404), refuses a terminal
financing (409), validates the redemption selection (422), and creates the linked case. Both this
route and the case-list route converge on the same service method.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: StartFollowUpRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/financing/overview",
    alias:
      "read_financing_overview_api_v1_cases__case_id__financing_overview_get",
    description: `The single financing-overview page (PRD1042-1949, US 1.33) — one page that says what a live
financing is and what it is worth, without opening the case.

A pure DISPLAY assembly: identity (reference / state / LC / framework agreement / product template /
loan), the real figures available now (refinancing rate, effective quota, collateral total, contract
+ object counts), a navigable contracts→objects reference tree, and the originating decision, the
covenants (approval conditions) and the financing&#x27;s own state history as navigable references. The
deal FIGURES (nominal claim, present value, financing amount, quote %) are DEFERRED behind the calc
engine (1931-OQ-03) — surfaced null with &#x60;&#x60;figures_pending&#x60;&#x60;, never fabricated.

Access (R1): clerk (FO) / approver (BO) / read-only (support) / administrator (bank power user) see
the financing and its figures; the leasing company sees its OWN financing scoped, but never the
bank-side figures (&#x60;&#x60;bank_figures_visible&#x3D;false&#x60;&#x60; and the figures are null); auditor and system-admin
have no path in → 404 (object non-disclosure). A case with no financing yet also answers 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingOverviewResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/financing/per-contract",
    alias:
      "list_per_contract_contributions_api_v1_cases__case_id__financing_per_contract_get",
    description: `The contracts in the financing, each with its contribution + status, plus the package totals
(PRD1042-1950, US 1.34).

A package loan is one loan made of the refinanced side of each contract. Each contribution figure
is READ from the stored component (nullable → pending until the calc engine lands, 1931-OQ-03),
never recomputed here (R1). A removed contract&#x27;s component drops out and the total is worked out
again. Clerk + approver (front + back office); tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractContributionListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/plan/recalculate",
    alias:
      "recalculate_payment_plans_api_v1_cases__case_id__financing_plan_recalculate_post",
    description: `Regenerate the GENERATED plans of a case from current terms (PRD1042-1927, US 1.11 R2).

A MANUAL plan is left untouched — a recalculation must not erase a hand-entered irregular plan.
Refused (409) once the financing is frozen. FO + BO; tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingComponentListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/financing/quota",
    alias:
      "override_case_financing_quota_api_v1_cases__case_id__financing_quota_put",
    description: `Override the refinancing quota on the case&#x27;s financing (PRD1042-1931, US 1.15).

The framework agreement holds the default; the financing may depart from it per deal, and the
override is logged. The effective quota (override ?? agreement) is resolved on read — this stores
only the departure, never a second maintained copy. Never validated as a business rule; zero on the
residual is legitimate. Editable up to the bank settlement.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OverrideQuotaRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/financing/rate",
    alias: "set_case_financing_rate_api_v1_cases__case_id__financing_rate_put",
    description: `Enter or change the refinancing rate in the case&#x27;s Calculation area (PRD1042-1931, US 1.15).

Typed per deal, no default, carried at three decimals (a fourth is a 400). Editable up to the bank
settlement (step 15) — once the financing is disbursed the field is closed (409). On the first rate
capture the product-template version is pinned onto the financing (the calculation carrier). The
preparing role enters it, without four eyes — the control is the audit trail + the settlement
deadline.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetRefinancingRateRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/recalculate",
    alias:
      "recalculate_case_financing_api_v1_cases__case_id__financing_recalculate_post",
    description: `Recalculate a case&#x27;s financing after a correction (PRD1042-1938, US 1.22).

A correction to a calculation input marks the result out of date; recalculating is the preparing
role&#x27;s explicit action — it returns the state to CURRENT and creates a NEW calculation version
(never an overwrite). Refused once the plan is frozen (steps 15/18). The figure computation itself
is deferred (US-1.11 + 1931-OQ-03); this records the recalculation + the version bump.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/financing/record-loan-values",
    alias:
      "record_case_financing_loan_values_api_v1_cases__case_id__financing_record_loan_values_post",
    description: `Record the loan number and loan account the bank&#x27;s core system returns (PRD1042-1941, US 1.25).

There is no live connection — a person types the two values in after the core system sets the loan
up. They share one lifecycle: editable while the financing is open and not disbursed, fixed after
payout (a later attempt is 409). Thin wrapper: role-gated (front office only — the preparing role;
a non-preparer, incl. back office, is refused as not-found), it resolves the financing by case
(tenant-scoped → 404 for a cross-tenant or unknown case), then hands off to the service, which locks
the row, enforces the editable-status precondition, and audits the change.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RecordLoanValuesRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/financing/remaining-balance",
    alias:
      "read_financing_remaining_balance_api_v1_cases__case_id__financing_remaining_balance_get",
    description: `The financing&#x27;s remaining balance at &#x60;&#x60;as_of&#x60;&#x60; — the sum of its components&#x27; remaining balances
(PRD1042-1950, US 1.34 R4). &#x60;&#x60;as_of&#x60;&#x60; is a query parameter, never persisted. Clerk + approver;
tenant-scoped → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "as_of",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: FinancingRemainingBalanceResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/financing/value-date",
    alias:
      "set_case_financing_value_date_api_v1_cases__case_id__financing_value_date_put",
    description: `Set the refinancing start / value date on the case&#x27;s financing (PRD1042-1931, US 1.15).

One fact — the date from which the refinancing runs and the instalment boundary. Editable up to the
bank settlement.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ value_date: z.string() }).passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/generated-documents",
    alias:
      "list_generated_documents_api_v1_cases__case_id__generated_documents_get",
    description: `The case&#x27;s produced documents — the generated tab (PRD1042-1940, US 1.24).

Kept apart from the uploaded tab (&#x60;GET /cases/{id}/documents&#x60;). Read follows case access — both
bank roles (Front + Back Office) see it; the leasing company never receives a produced document
(no portal delivery), so it is not on the read gate. Each row points at the rendered file via the
authenticated media endpoint.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GeneratedDocumentListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/generated-documents/financing-commitment",
    alias:
      "produce_financing_commitment_api_v1_cases__case_id__generated_documents_financing_commitment_post",
    description: `Produce (or re-produce) the financing commitment on demand (PRD1042-1940, US 1.24).

The commitment is normally produced automatically when the rate is committed at step 4 (it comes
out of the state transition), but the preparing role (Front Office alone) can re-produce it here —
it is reproducible until nothing about it changes. Refused with a message naming the missing rate if
the rate has not been committed yet. Returns the refreshed generated-document list.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GeneratedDocumentListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/leasing-company",
    alias: "bind_leasing_company_api_v1_cases__case_id__leasing_company_put",
    description: `Step 1 of the wizard: resolve the leasing company from its Händlernummer.

PUT rather than POST because it is settable more than once — the bank may change the company
until the bank settlement, which is where the quota, the dates and the accounts freeze anyway.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ lc_number: z.string().regex(/^[0-9]{4}$/) })
          .passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/leasing-company",
    alias: "read_leasing_company_api_v1_cases__case_id__leasing_company_get",
    description: `The company and the terms already agreed with it, read onto the case and never retyped.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.union([CaseLeasingCompanyResponse, z.null()]),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/party-matches",
    alias: "read_case_party_matches_api_v1_cases__case_id__party_matches_get",
    description: `The match outcome for every party on the case&#x27;s contracts (PRD1042-1929, US 1.13).

For each party — the lessee and every guarantor (the co-obligor is a guarantor with a kind of
obligation, not a separate category) — surfaces the computed match outcome (recognised / new /
candidate; no strength grades), the partner&#x27;s status and display name, and whether an unresolved
duplicate exists. &#x60;&#x60;submission_blocked&#x60;&#x60; reflects the submission hard-stop condition; the submit gate
(US-1.17) enforces it, this read only shows it. A pure display over the matching mechanism owned by
PRD1042-1922. FO + BO + the leasing company on its own case; the response carries no bank records, so
an LC caller sees the warning on its own party without seeing the register. Others → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CasePartyMatchResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/cases/:case_id/product-template",
    alias: "bind_product_template_api_v1_cases__case_id__product_template_put",
    description: `Step 2: choose the product template the request will be judged against.

Chosen from the templates the agreement allows — a template outside that list cannot be used
even if it exists. Changeable by the bank until the bank settlement, hence PUT.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ product_template_id: z.string().uuid() })
          .passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/product-template",
    alias: "read_product_template_api_v1_cases__case_id__product_template_get",
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.union([CaseProductTemplateResponse, z.null()]),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/reactivate",
    alias: "reactivate_case_api_v1_cases__case_id__reactivate_post",
    description: `Bring a cancelled case back to &#x60;&#x60;open&#x60;&#x60; (PRD1042-1947, US 1.31).

Role-gated (bank owner-role only — a non-owner is refused as not-found), tenant-scoped (404 for a
cross-tenant or unknown case). Reactivate flows through the same transition engine as every other
move; a case that is not &#x60;&#x60;cancelled&#x60;&#x60; is refused by the state machine → 409.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/reject",
    alias: "reject_case_proposal_api_v1_cases__case_id__reject_post",
    description: `Decline an unclaimed leasing-company proposal. The request moves to rejected and the leasing
company sees it on its own case. A bank owner-role only (an LC caller is refused in the service).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/resubmit",
    alias: "resubmit_request_api_v1_cases__case_id__resubmit_post",
    description: `The clerk resubmits a returned refinancing request (PRD1042-1946, US 1.30).

The RESUBMIT half of the return→correct→resubmit loop — the return half is &#x60;&#x60;POST /decide&#x60;&#x60; from
US-1.29 (an approver decides missing-information / rework), so there is no new return endpoint here.
After correcting what the approver flagged, the front-office clerk sends the case back to the bank:
the request moves &#x60;&#x60;{missing-information | rework} → submitted&#x60;&#x60; and its round counter increments.

Thin wrapper: clerk-role gated (front office only; any other role — including back office — is
refused as not-found, object non-disclosure), tenant-scoped (a cross-tenant or unknown case is
404), then hands off to the service, which enforces the returned-state precondition (a request not
in a returned state → 409) and records who resubmitted and the new round. There is deliberately no
body: resubmit carries no input of its own; the correction happened on the case beforehand.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/return-to-queue",
    alias: "return_case_to_queue_api_v1_cases__case_id__return_to_queue_post",
    description: `Give the case back to the role work list. Unassigned is a legitimate state.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/cases/:case_id/review",
    alias: "review_request_api_v1_cases__case_id__review_get",
    description: `The one-page review of a refinancing request before submission (PRD1042-1933, US 1.17).

Everything entered, on one page: the case, the leasing company + agreement values, every contract
with its lessee / type / residual and completeness, the collateral, and the financing figures —
the financing volume shown as PENDING (it is the derived payout amount, deferred with US-1.15&#x27;s
calculation). A read composing the existing per-concern reads; each block keeps its own visibility
rule (an LC user reads its own case with the bank figures blanked). Tenant + LC scoped → 404 for a
case the caller cannot see.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseReviewResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/cases/:case_id/submit",
    alias: "submit_request_api_v1_cases__case_id__submit_post",
    description: `Submit a refinancing request for the bank&#x27;s decision (PRD1042-1933, US 1.17).

Submission is the DRAFT → SUBMITTED transition and the moment the checks bite. Thin wrapper:
role-gated (front / back office, or the LC for its own request; any other role is refused as
not-found), tenant + LC-own scoped (a cross-tenant or unknown case is 404), then the service locks
the row, runs the submission gates (collecting every failure, not stopping at the first — a failed
submission answers 422 with the typed &#x60;&#x60;failed_checks&#x60;&#x60; list), and on success records the
submission audit (submitted_by / submitted_at). A request not in draft → 409. After submission the
work continues in the case workspace, not the wizard.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: SubmitResultResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/contracts/:contract_id",
    alias: "edit_contract_api_v1_contracts__contract_id__patch",
    description: `Edit a contract&#x27;s captured fields. Guarded by the request&#x27;s write window.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ContractEdit,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/defer",
    alias: "defer_contract_api_v1_contracts__contract_id__defer_post",
    description: `Hold a contract back within the request — reactivatable, not rejected (PRD1042-1928).`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/guarantors",
    alias: "add_guarantor_api_v1_contracts__contract_id__guarantors_post",
    description: `Add a guarantor to a contract (PRD1042-1923, US 1.7).

Links an existing partner (&#x60;&#x60;existing_partner_id&#x60;&#x60; — any status; a Partner is live from creation) or
creates one confirmed (&#x60;&#x60;identity&#x60;&#x60;) and links it; an unresolved definite duplicate is a hard stop.
Any number of distinct guarantors may be added; the same party twice (live) is refused. Optional
kind of obligation (guarantee / co-obligation, open set). FO + LC-own only — Back Office cannot
attach; only while the financing set is open (before the bank settlement).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GuarantorAddRequest,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GuarantorLinkResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/contracts/:contract_id/guarantors",
    alias: "list_guarantors_api_v1_contracts__contract_id__guarantors_get",
    description: `The live guarantors on a contract with each one&#x27;s kind of obligation (PRD1042-1923, US 1.7).

A contract with no guarantor returns an empty list — normal, not incomplete. FO + BO + LC-own.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GuarantorListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/guarantors/:link_id/remove",
    alias:
      "remove_guarantor_api_v1_contracts__contract_id__guarantors__link_id__remove_post",
    description: `Soft-remove a guarantor from a contract (PRD1042-1923, US 1.7) — history preserved.

Sets removed-at + removal-reason; the link leaves the live set but is never deleted, and documents
already uploaded for the guarantor stay on the case. FO + LC-own; only while the financing set is
open. Removing a guarantor is not deleting or archiving the Partner.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1).max(255) }).passthrough(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "link_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GuarantorLinkResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/guarantors/preview",
    alias:
      "preview_guarantor_api_v1_contracts__contract_id__guarantors_preview_post",
    description: `Search the partner register for a guarantor before anything is created (PRD1042-1923, US 1.7).

Search-before-typing: returns the match candidates so the caller can link an existing partner rather
than create a duplicate. Creates nothing.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GuarantorPreviewRequest,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerMatchResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/lessee",
    alias: "capture_lessee_api_v1_contracts__contract_id__lessee_post",
    description: `Capture the lessee on a contract (PRD1042-1922, US 1.6).

Either links an existing confirmed partner (&#x60;&#x60;existing_partner_id&#x60;&#x60;) or creates a new one confirmed
(&#x60;&#x60;identity&#x60;&#x60;) and links it. Matched on the identity anchors incl. the Creditreform/Schufa number
(a probable-match queues a duplicate pair for BO; an unresolved definite duplicate is a hard stop).
Sets the contract&#x27;s lessee. FO + BO + LC-own; only in the request&#x27;s write window.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LesseeCaptureRequest,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LesseeLinkResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/contracts/:contract_id/lessee",
    alias: "read_lessee_api_v1_contracts__contract_id__lessee_get",
    description: `The lessee linked to the contract (PRD1042-1922, US 1.6), or null if none is set.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.union([PartnerDetailResponse, z.null()]),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/lessee/preview",
    alias: "preview_lessee_api_v1_contracts__contract_id__lessee_preview_post",
    description: `Search the partner register for the lessee before anything is created (PRD1042-1922, US 1.6).

Search-before-typing: returns the match candidates (existing partners) for the given identity so
the caller can link one rather than create a duplicate. Creates nothing.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LesseePreviewRequest,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerMatchResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/contracts/:contract_id/objects",
    alias: "list_lease_objects_api_v1_contracts__contract_id__objects_get",
    description: `A contract&#x27;s lease objects, in stable object-number order (PRD1042-1924, US 1.8).`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LeaseObjectListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/objects",
    alias: "add_lease_object_api_v1_contracts__contract_id__objects_post",
    description: `Add a lease object to a contract (PRD1042-1924, US 1.8).

Assigns a stable object number. Acquisition cost, if present, must be above zero (hard refusal).
A residual exceeding the acquisition cost is a quittable warning on the response, never a refusal.
Only while the request is in its write window (409 otherwise). FO + BO + LC-own.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LeaseObjectCreate,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LeaseObjectRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/reactivate",
    alias: "reactivate_contract_api_v1_contracts__contract_id__reactivate_post",
    description: `Bring a deferred contract back into the active set (PRD1042-1928).`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/contracts/:contract_id/remove",
    alias: "remove_contract_api_v1_contracts__contract_id__remove_post",
    description: `Soft-remove a contract with a reason — history preserved, not a delete (PRD1042-1928).

POST (not DELETE) because a reason is mandatory in the body and the row is preserved rather than
destroyed; the response returns the now-removed contract with its &#x60;&#x60;removed_at&#x60;&#x60; and reason.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1).max(255) }).passthrough(),
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/document-requirement-catalogs/:catalog_id",
    alias:
      "update_catalog_api_v1_document_requirement_catalogs__catalog_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateCatalogRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/document-requirement-catalogs/:catalog_id",
    alias:
      "get_catalog_detail_api_v1_document_requirement_catalogs__catalog_id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/completeness",
    alias:
      "get_completeness_api_v1_document_requirement_catalogs__catalog_id__completeness_get",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "business_object_id",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "case_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "business_object_type",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: CompletenessResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/fulfilments/link",
    alias:
      "link_document_api_v1_document_requirement_catalogs__catalog_id__fulfilments_link_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LinkDocumentRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FulfilmentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/fulfilments/transition",
    alias:
      "transition_status_api_v1_document_requirement_catalogs__catalog_id__fulfilments_transition_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TransitionStatusRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FulfilmentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/materialize",
    alias:
      "materialize_catalog_api_v1_document_requirement_catalogs__catalog_id__materialize_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MaterializeRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MaterializationResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/objects/:object_id/requirements",
    alias:
      "get_runtime_requirements_api_v1_document_requirement_catalogs__catalog_id__objects__object_id__requirements_get",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "object_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "case_type",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: RuntimeRequirementSurfaceResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/preview",
    alias:
      "preview_catalog_api_v1_document_requirement_catalogs__catalog_id__preview_get",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "case_type",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: MaterializationResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/requirements",
    alias:
      "add_requirement_api_v1_document_requirement_catalogs__catalog_id__requirements_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddRequirementRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RequirementResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/document-requirement-catalogs/:catalog_id/requirements",
    alias:
      "list_requirements_api_v1_document_requirement_catalogs__catalog_id__requirements_get",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "include_inactive",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(50),
      },
    ],
    response: RequirementListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/document-requirement-catalogs/case-types/startable",
    alias:
      "startable_case_types_api_v1_document_requirement_catalogs_case_types_startable_get",
    requestFormat: "json",
    response: StartableCaseTypesResponse,
  },
  {
    method: "patch",
    path: "/api/v1/document-requirements/:requirement_id",
    alias:
      "update_requirement_api_v1_document_requirements__requirement_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateRequirementRequest,
      },
      {
        name: "requirement_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RequirementResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/document-requirements/:requirement_id/deactivate",
    alias:
      "deactivate_requirement_api_v1_document_requirements__requirement_id__deactivate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "requirement_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RequirementResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/framework-agreements",
    alias: "create_fa_draft_api_v1_framework_agreements_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateFARequest,
      },
    ],
    response: FADraftResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements",
    alias: "list_framework_agreements_api_v1_framework_agreements_get",
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(FALifecycleStatus).optional().default([]),
      },
      {
        name: "lc_partner_id",
        type: "Query",
        schema: z.array(z.string().uuid()).optional().default([]),
      },
      {
        name: "bank_entity",
        type: "Query",
        schema: z.array(BankEntity).optional().default([]),
      },
      {
        name: "valid_from",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "valid_until",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(25),
      },
    ],
    response: FAListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/framework-agreements/:id",
    alias: "update_fa_api_v1_framework_agreements__id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateFARequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FADraftResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/framework-agreements/:id",
    alias: "delete_fa_draft_api_v1_framework_agreements__id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id",
    alias: "get_framework_agreement_api_v1_framework_agreements__id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FADetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/framework-agreements/:id/activate",
    alias: "activate_fa_api_v1_framework_agreements__id__activate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ActivateFARequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FADraftResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/audit-history",
    alias:
      "get_fa_audit_history_api_v1_framework_agreements__id__audit_history_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "type",
        type: "Query",
        schema: z.array(FAEventTypeFilter).optional().default([]),
      },
      {
        name: "from",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "to",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(50),
      },
      {
        name: "cursor",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: FAAuditHistoryResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/audit-history/export-csv",
    alias:
      "export_fa_audit_history_csv_api_v1_framework_agreements__id__audit_history_export_csv_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "reason",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "type",
        type: "Query",
        schema: z.array(FAEventTypeFilter).optional().default([]),
      },
      {
        name: "from",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "to",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/framework-agreements/:id/deactivate",
    alias: "deactivate_fa_api_v1_framework_agreements__id__deactivate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ justification: z.string().min(20).max(1000) })
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FADraftResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/framework-agreements/:id/document-overrides",
    alias:
      "set_fa_document_overrides_api_v1_framework_agreements__id__document_overrides_put",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetDocumentOverridesRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentOverridesResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/document-overrides",
    alias:
      "get_fa_document_overrides_api_v1_framework_agreements__id__document_overrides_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentOverridesResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/framework-agreements/:id/documents",
    alias: "attach_document_api_v1_framework_agreements__id__documents_post",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          Body_attach_document_api_v1_framework_agreements__id__documents_post,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: AttachDocumentResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/documents",
    alias: "list_documents_api_v1_framework_agreements__id__documents_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(DocumentListItemResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/framework-agreements/:id/documents/:doc_id",
    alias:
      "detach_document_api_v1_framework_agreements__id__documents__doc_id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "doc_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/documents/:doc_id/download-url",
    alias:
      "get_download_url_api_v1_framework_agreements__id__documents__doc_id__download_url_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "doc_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DownloadURLResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/financings",
    alias: "get_fa_financings_api_v1_framework_agreements__id__financings_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FALinkedFinancingsResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/pricing-snapshot",
    alias:
      "get_fa_pricing_snapshot_api_v1_framework_agreements__id__pricing_snapshot_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FAPricingSnapshotResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/framework-agreements/:id/reactivate",
    alias: "reactivate_fa_api_v1_framework_agreements__id__reactivate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ justification: z.string().min(20).max(1000) })
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FADraftResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/reconstruct",
    alias: "reconstruct_fa_api_v1_framework_agreements__id__reconstruct_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "as_of",
        type: "Query",
        schema: z.string().datetime({ offset: true }),
      },
    ],
    response: FAReconstructResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/framework-agreements/:id/terminate",
    alias: "terminate_fa_api_v1_framework_agreements__id__terminate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TerminateFARequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FATerminatedResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/termination-readiness",
    alias:
      "get_termination_readiness_api_v1_framework_agreements__id__termination_readiness_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: TerminationReadinessResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/:id/utilization",
    alias:
      "get_fa_utilization_api_v1_framework_agreements__id__utilization_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FAUtilizationResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/export-csv",
    alias:
      "export_framework_agreements_csv_api_v1_framework_agreements_export_csv_get",
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(FALifecycleStatus).optional().default([]),
      },
      {
        name: "lc_partner_id",
        type: "Query",
        schema: z.array(z.string().uuid()).optional().default([]),
      },
      {
        name: "bank_entity",
        type: "Query",
        schema: z.array(BankEntity).optional().default([]),
      },
      {
        name: "valid_from",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "valid_until",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/framework-agreements/lc-partners",
    alias: "list_lc_partners_api_v1_framework_agreements_lc_partners_get",
    requestFormat: "json",
    response: FALCPartnersResponse,
  },
  {
    method: "get",
    path: "/api/v1/governed-actions",
    alias: "list_governed_actions_api_v1_governed_actions_get",
    description: `List governed actions. Requires &#x60;governed_action:list&#x60; permission.

Auditors see only actions scoped to their tenant.`,
    requestFormat: "json",
    parameters: [
      {
        name: "status",
        type: "Query",
        schema: z.array(GovernedActionStatus).optional().default([]),
      },
      {
        name: "action_type",
        type: "Query",
        schema: z.array(GovernedActionType).optional().default([]),
      },
      {
        name: "subject_type",
        type: "Query",
        schema: subject_type,
      },
      {
        name: "initiator_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response: PaginatedGovernedActionsResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/governed-actions/:id",
    alias: "get_governed_action_api_v1_governed_actions__id__get",
    description: `Get a single governed action by ID. Requires &#x60;governed_action:read&#x60; permission.

Auditors can only read actions belonging to their tenant.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/governed-actions/:id/approve",
    alias: "approve_governed_action_api_v1_governed_actions__id__approve_post",
    description: `Approve a pending governed action and execute it. Requires &#x60;governed_action:approve&#x60; permission.

Initiator cannot approve their own action (Four-Eyes principle).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ApproveRejectRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/governed-actions/:id/re-initiate",
    alias:
      "re_initiate_governed_action_api_v1_governed_actions__id__re_initiate_post",
    description: `Re-initiate an expired governed action. Creates a new pending governed action with a fresh TTL.
The expired record remains unchanged. New action shares the same &#x60;correlation_id&#x60;.

**Primary path:** Only the original initiator can re-initiate. Reason is optional.

**Secondary path:** If the original initiator is inactive (suspended/deactivated),
any &#x60;system_admin&#x60; may re-initiate. Reason is mandatory in this case.

Returns 404 if the caller is not the original initiator and the original initiator is still active.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ReInitiateRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 404,
        description: `Action not found or caller is not the original initiator`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/governed-actions/:id/reject",
    alias: "reject_governed_action_api_v1_governed_actions__id__reject_post",
    description: `Reject a pending governed action. Requires &#x60;governed_action:approve&#x60; permission.

Initiator cannot reject their own action (Four-Eyes principle).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ApproveRejectRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/governed-actions/:id/withdraw",
    alias:
      "withdraw_governed_action_api_v1_governed_actions__id__withdraw_post",
    description: `Withdraw a pending governed action. Only the initiator can withdraw.
Returns 404 if the action does not exist or the caller is not the initiator (no information leak).`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 404,
        description: `Action not found or caller is not the initiator`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/lc-portal/framework-agreements",
    alias: "lc_portal_list_fas_api_v1_lc_portal_framework_agreements_get",
    requestFormat: "json",
    response: LCPortalFAListResponse,
  },
  {
    method: "get",
    path: "/api/v1/lc-portal/framework-agreements/:id/documents/:doc_id/download",
    alias:
      "lc_portal_download_document_api_v1_lc_portal_framework_agreements__id__documents__doc_id__download_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "doc_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 302,
        description: `Successful Response`,
        schema: z.unknown(),
      },
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/lc/cases",
    alias: "list_lc_cases_api_v1_lc_cases_get",
    description: `The leasing company&#x27;s own cases (its raised proposals and any the bank has since taken over).

Defaults to newest-first (&#x60;&#x60;oldest_first&#x3D;False&#x60;&#x60;), unlike the bank&#x27;s queue-oriented &#x60;&#x60;/cases&#x60;&#x60;.`,
    requestFormat: "json",
    parameters: [
      {
        name: "oldest_first",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(200).optional().default(50),
      },
      {
        name: "offset",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
    ],
    response: CaseListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/lc/cases/:case_id",
    alias: "read_lc_case_api_v1_lc_cases__case_id__get",
    description: `The leasing company&#x27;s restricted view of one of its own cases (US 1.35 / PRD1042-1951).

The same record the bank sees, through a narrower window. The leasing company sees only its own
company&#x27;s cases (a case of another company — or another tenant, or an unknown id — answers 404,
never forbidden): the scope is enforced at query level by &#x60;&#x60;CaseRepository._scoped&#x60;&#x60; on
&#x60;&#x60;lc_partner_id&#x60;&#x60;, inherited through &#x60;&#x60;get_case&#x60;&#x60;. The response carries only the least-privilege
field set (reference, type, derived status, origin, created-at); every bank-internal figure —
pricing, calculation, rate, present value, covenants, exposure, credit assessment, the checklist,
the generated documents — is absent by construction, not hidden in the UI. The financing STATE is
folded into the derived status; its figures never reach here. Outstanding documents come from the
separate &#x60;&#x60;GET /lc/obligations/{case_id}&#x60;&#x60;; the bank↔LC comment thread is not built yet
(PRD1042-1893) and is not part of this read.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LcCaseDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/lc/obligations/:business_object_id",
    alias: "get_lc_obligations_api_v1_lc_obligations__business_object_id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "business_object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "catalog_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "object_type",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "case_type",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: LCObligationResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/media/:id",
    alias: "serve_media_api_v1_media__id__get",
    description: `Stream a media file from S3. Requires valid session.

Access is granted if the caller owns the file, is a system_admin, or — for a case document —
can see the case the document belongs to. Returns 404 for non-existent or unauthorized files
(non-disclosing).`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/notification-config",
    alias: "get_notification_config_api_v1_notification_config_get",
    description: `Return the registered notification event catalogue.

Non-functional in November — used by the admin configuration stub (US 31.5)
to populate placeholder channel-activation and template-assignment lists.
Post-November: this endpoint will reflect live channel configuration.`,
    requestFormat: "json",
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/object-classification",
    alias: "read_object_classification_api_v1_object_classification_get",
    description: `The lease-object classification config — groups + sub-groups + the fahrzeug flag (PRD1042-1924).

A read of the configuration file (no admin screen); the FE uses it for the group / sub-group picker
and to know which groups are vehicles (fuel sub-groups). The set is open — a missing value is a line
of config, not a release.`,
    requestFormat: "json",
    response: ObjectClassificationResponse,
  },
  {
    method: "patch",
    path: "/api/v1/objects/:object_id",
    alias: "edit_lease_object_api_v1_objects__object_id__patch",
    description: `Edit a lease object&#x27;s captured fields (PRD1042-1924, US 1.8). Write-window + role gated.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LeaseObjectEdit,
      },
      {
        name: "object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LeaseObjectRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/objects/:object_id/remove",
    alias: "remove_lease_object_api_v1_objects__object_id__remove_post",
    description: `Soft-remove a lease object — history preserved, the object number never reused (PRD1042-1924).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1).max(255) }).passthrough(),
      },
      {
        name: "object_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LeaseObjectRead,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id",
    alias: "get_partner_api_v1_partners__id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/partners/:id",
    alias: "delete_partner_api_v1_partners__id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/partners/:id",
    alias: "edit_partner_draft_api_v1_partners__id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerSubmitRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerSubmitResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/archive",
    alias: "archive_partner_api_v1_partners__id__archive_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ reason: z.string().min(20).max(2000) })
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ArchivePartnerResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/archive-eligibility",
    alias:
      "get_archive_eligibility_api_v1_partners__id__archive_eligibility_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ArchiveEligibilityResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/bank-accounts",
    alias: "list_bank_accounts_api_v1_partners__id__bank_accounts_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: BankAccountListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/bank-accounts",
    alias: "add_bank_account_api_v1_partners__id__bank_accounts_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BankAccountCreateRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: BankAccountResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/bank-accounts/:account_id/close",
    alias:
      "close_bank_account_api_v1_partners__id__bank_accounts__account_id__close_post",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "account_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: BankAccountCloseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/confirm",
    alias: "confirm_partner_api_v1_partners__id__confirm_post",
    description: `Confirm a draft/pending-confirmation partner — single-actor FO action per
US 13.5 (Sys Admin ✓, FO ✓, BO/Risk ✗). No Four-Eyes approval (PRD1042-1449);
risk-sensitive roles are governed separately via partner_role_assign.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerConfirmRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/confirmation-history",
    alias:
      "get_confirmation_history_api_v1_partners__id__confirmation_history_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "cursor",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(50),
      },
    ],
    response: ConfirmationHistoryResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/decision-history",
    alias: "get_decision_history_api_v1_partners__id__decision_history_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "cursor",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(50),
      },
    ],
    response: DecisionHistoryResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/identity-changes",
    alias: "propose_identity_change_api_v1_partners__id__identity_changes_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: IdentityChangeProposalRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: IdentityChangeProposeResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/identity-changes",
    alias: "get_identity_history_api_v1_partners__id__identity_changes_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: IdentityHistoryResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/identity-changes/:change_id",
    alias:
      "get_identity_change_detail_api_v1_partners__id__identity_changes__change_id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "change_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: IdentityChangeDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/lc-numbers",
    alias: "list_lc_numbers_api_v1_partners__id__lc_numbers_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LcNumberListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/lc-numbers",
    alias: "add_lc_number_api_v1_partners__id__lc_numbers_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ lc_number: z.string().regex(/^[0-9]{4}$/) })
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LcNumberResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/partners/:id/lc-numbers/:lc_id",
    alias: "delete_lc_number_api_v1_partners__id__lc_numbers__lc_id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "lc_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/merge-history",
    alias: "get_merge_history_api_v1_partners__id__merge_history_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MergeHistoryResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/reject",
    alias: "reject_partner_api_v1_partners__id__reject_post",
    description: `Reject a draft/pending-confirmation partner — single-actor FO action (US 13.5).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ note: z.string().min(10).max(2000) }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/resolution-candidates",
    alias:
      "get_resolution_candidates_api_v1_partners__id__resolution_candidates_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ResolutionCandidatesResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/roles",
    alias: "get_partner_roles_api_v1_partners__id__roles_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerRolesResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/:id/ubo",
    alias: "capture_ubo_ownership_api_v1_partners__id__ubo_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UboOwnershipRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: UboOwnershipRecordResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/partners/:id/ubo",
    alias: "get_ubo_ownership_api_v1_partners__id__ubo_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerUboResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/duplicates/:id/resolve",
    alias: "resolve_duplicate_api_v1_partners_duplicates__id__resolve_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResolveDuplicatePairRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ResolveDuplicatePairResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/partners/merge",
    alias: "initiate_merge_api_v1_partners_merge_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MergeInitiateRequest,
      },
    ],
    response: MergeInitiateResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/platform/modules",
    alias: "list_platform_modules_api_v1_platform_modules_get",
    description: `Return the full platform module catalogue.
Used by the tenant creation wizard (Step 2 — Module Selection).
Accessible to all authenticated users.`,
    requestFormat: "json",
    response: PlatformModulesResponse,
  },
  {
    method: "get",
    path: "/api/v1/platform/seed-packages",
    alias: "list_seed_packages_api_v1_platform_seed_packages_get",
    description: `Return the full seed package catalogue.
Used by the tenant creation wizard (Step 3 — Seed package).
Accessible to all authenticated users.`,
    requestFormat: "json",
    response: SeedPackagesResponse,
  },
  {
    method: "post",
    path: "/api/v1/product-templates/:template_id/deactivate",
    alias:
      "deactivate_product_api_v1_product_templates__template_id__deactivate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ reason: z.string().min(10).max(2000) })
          .passthrough(),
      },
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ProductStatusResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/product-templates/:template_id/diff",
    alias:
      "diff_template_versions_api_v1_product_templates__template_id__diff_get",
    requestFormat: "json",
    parameters: [
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "from_version",
        type: "Query",
        schema: z.string().min(1),
      },
      {
        name: "to_version",
        type: "Query",
        schema: z.string().min(1),
      },
    ],
    response: VersionDiffResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/product-templates/:template_id/reactivate",
    alias:
      "reactivate_product_api_v1_product_templates__template_id__reactivate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ProductStatusResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/product-templates/:template_id/version-usage",
    alias:
      "get_version_usage_api_v1_product_templates__template_id__version_usage_get",
    requestFormat: "json",
    parameters: [
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: VersionUsageResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/product-templates/:template_id/versions",
    alias:
      "create_new_version_api_v1_product_templates__template_id__versions_post",
    requestFormat: "json",
    parameters: [
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: NewVersionCreatedResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/product-templates/:template_id/versions",
    alias:
      "list_template_versions_api_v1_product_templates__template_id__versions_get",
    requestFormat: "json",
    parameters: [
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: VersionHistoryResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/product-templates/:template_id/versions/:version_number",
    alias:
      "get_template_version_api_v1_product_templates__template_id__versions__version_number__get",
    requestFormat: "json",
    parameters: [
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_number",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VersionDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/product-templates/:template_id/versions/:version_number",
    alias:
      "update_template_draft_api_v1_product_templates__template_id__versions__version_number__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateTemplateDraftRequest,
      },
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_number",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: TemplateDraftUpdatedResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/product-templates/:template_id/versions/:version_number/discard",
    alias:
      "discard_template_draft_api_v1_product_templates__template_id__versions__version_number__discard_post",
    requestFormat: "json",
    parameters: [
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_number",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: TemplateDraftDiscardedResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/product-templates/:template_id/versions/:version_number/effective-date",
    alias:
      "set_version_effective_date_api_v1_product_templates__template_id__versions__version_number__effective_date_patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ valid_from: z.string() }).passthrough(),
      },
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_number",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: SetEffectiveDateResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/product-templates/:template_id/versions/:version_number/orchestration",
    alias:
      "update_orchestration_api_v1_product_templates__template_id__versions__version_number__orchestration_patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateOrchestrationRequest,
      },
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_number",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: OrchestrationResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/product-templates/:template_id/versions/:version_number/publish",
    alias:
      "publish_template_draft_api_v1_product_templates__template_id__versions__version_number__publish_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PublishTemplateDraftRequest,
      },
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_number",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: PublishTemplateDraftResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/product-templates/:template_id/versions/:version_number/terminate",
    alias:
      "terminate_template_version_api_v1_product_templates__template_id__versions__version_number__terminate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ justification: z.string().min(10).max(2000) })
          .passthrough(),
      },
      {
        name: "template_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_number",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: TerminateVersionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/product-templates/selectable",
    alias: "get_selectable_templates_api_v1_product_templates_selectable_get",
    requestFormat: "json",
    parameters: [
      {
        name: "refinancing_form",
        type: "Query",
        schema: refinancing_form,
      },
      {
        name: "framework_agreement_id",
        type: "Query",
        schema: batch_id,
      },
    ],
    response: SelectableTemplatesResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants",
    alias: "create_tenant_api_v1_tenants_post",
    description: `Initiate a Four-Eyes tenant creation request. Requires &#x60;system_admin&#x60; role.

Tenant is pre-created in &#x60;draft&#x60; status. The governed action remains pending
until a different system_admin approves it. On approval the tenant transitions
to active.
On reject/withdraw/expire the tenant is archived.

**Returns:** &#x60;GovernedActionResponse&#x60; with &#x60;status&#x3D;pending&#x60;`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTenantRequest,
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants",
    alias: "list_tenants_api_v1_tenants_get",
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(TenantStatus).optional().default([]),
      },
      {
        name: "tenant_type",
        type: "Query",
        schema: z.array(TenantType).optional().default([]),
      },
      {
        name: "country",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "from_date",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "to_date",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "module_key",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "module_active",
        type: "Query",
        schema: module_active,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response: PaginatedTenantsResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:id",
    alias: "get_tenant_api_v1_tenants__id__get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.union([TenantResponse, TenantSupportResponse]),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/tenants/:id",
    alias: "update_tenant_api_v1_tenants__id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateTenantRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: TenantResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:id/access-policy",
    alias: "get_access_policy_api_v1_tenants__id__access_policy_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: AccessPolicyResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/tenants/:id/access-policy",
    alias: "update_access_policy_api_v1_tenants__id__access_policy_patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AccessPolicyRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:id/archive",
    alias: "archive_tenant_api_v1_tenants__id__archive_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ArchiveTenantRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:id/governance-history",
    alias: "get_governance_history_api_v1_tenants__id__governance_history_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "event_types",
        type: "Query",
        schema: z.array(z.string()).optional().default([]),
      },
      {
        name: "from_date",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "to_date",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "cursor",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(50),
      },
    ],
    response: GovernanceHistoryResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:id/grants",
    alias: "create_grant_api_v1_tenants__id__grants_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateGrantRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: SupportGrantResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:id/grants",
    alias: "list_grants_api_v1_tenants__id__grants_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(SupportGrantResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/tenants/:id/grants/:grant_id",
    alias: "revoke_grant_api_v1_tenants__id__grants__grant_id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ revocation_reason: z.string().min(10) })
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "grant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: SupportGrantResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:id/grants/:grant_id/review",
    alias:
      "complete_emergency_review_api_v1_tenants__id__grants__grant_id__review_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ outcome: z.string().min(10).max(500) })
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "grant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: SupportGrantResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:id/integration-binding",
    alias:
      "get_integration_binding_api_v1_tenants__id__integration_binding_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: IntegrationBindingResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/tenants/:id/integration-binding",
    alias:
      "upsert_integration_binding_api_v1_tenants__id__integration_binding_patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpsertIntegrationBindingRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: IntegrationBindingResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/tenants/:id/mfa-policy",
    alias: "update_mfa_policy_api_v1_tenants__id__mfa_policy_patch",
    description: `Update the MFA policy for a tenant. Requires &#x60;system_admin&#x60; role.

When &#x60;mfa_required&#x60; is set to &#x60;true&#x60;, all tenant-level users without MFA will
be forced to enroll on their next login (Scenario C — retroactive enforcement).
No existing sessions are invalidated immediately.

**Returns:** Updated tenant object.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ mfa_required: z.boolean() }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:id/reactivate",
    alias: "reactivate_tenant_api_v1_tenants__id__reactivate_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ justification: z.string().min(20) }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:id/suspend",
    alias: "suspend_tenant_api_v1_tenants__id__suspend_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SuspendTenantRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/document-requirement-catalogs",
    alias:
      "create_catalog_api_v1_tenants__tenant_id__document_requirement_catalogs_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest,
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:tenant_id/document-requirement-catalogs",
    alias:
      "list_catalogs_api_v1_tenants__tenant_id__document_requirement_catalogs_get",
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response:
      app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/document-types",
    alias:
      "create_document_type_api_v1_tenants__tenant_id__document_types_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDocumentTypeRequest,
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentTypeResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:tenant_id/document-types",
    alias: "list_document_types_api_v1_tenants__tenant_id__document_types_get",
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "origin",
        type: "Query",
        schema: origin,
      },
      {
        name: "role_scope",
        type: "Query",
        schema: role_scope,
      },
      {
        name: "include_inactive",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
    ],
    response: DocumentTypeListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/tenants/:tenant_id/document-types/:document_type_id",
    alias:
      "update_document_type_api_v1_tenants__tenant_id__document_types__document_type_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDocumentTypeRequest,
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "document_type_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentTypeResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:tenant_id/document-types/matrix",
    alias:
      "get_document_type_matrix_api_v1_tenants__tenant_id__document_types_matrix_get",
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentTypeMatrixResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/document-types/seed-generated",
    alias:
      "seed_generated_document_types_api_v1_tenants__tenant_id__document_types_seed_generated_post",
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentTypeListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:tenant_id/modules",
    alias: "get_tenant_modules_api_v1_tenants__tenant_id__modules_get",
    description: `Return all modules for a tenant with their activation status.
Requires &#x60;system_admin&#x60; role.`,
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: TenantModulesResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/modules/:module_key/activate",
    alias:
      "activate_tenant_module_api_v1_tenants__tenant_id__modules__module_key__activate_post",
    description: `Initiate a Four-Eyes module activation request for an active tenant.
Returns a GovernedActionResponse with status&#x3D;pending.
A second System Admin must approve via POST /governed-actions/{id}/approve.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ justification: z.string().min(10) }).passthrough(),
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "module_key",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/modules/:module_key/deactivate",
    alias:
      "deactivate_tenant_module_api_v1_tenants__tenant_id__modules__module_key__deactivate_post",
    description: `Deactivate a module for an active tenant immediately (no approval required).
Requires &#x60;system_admin&#x60; role.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ justification: z.string().min(20) }).passthrough(),
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "module_key",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/partners",
    alias: "submit_partner_api_v1_tenants__tenant_id__partners_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerSubmitRequest,
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerSubmitResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:tenant_id/partners",
    alias: "list_partners_api_v1_tenants__tenant_id__partners_get",
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(PartnerStatus).optional().default([]),
      },
      {
        name: "role",
        type: "Query",
        schema: z.array(PartnerRole).optional().default([]),
      },
      {
        name: "country",
        type: "Query",
        schema: z.array(z.string()).optional().default([]),
      },
      {
        name: "ubo_status",
        type: "Query",
        schema: z.array(UboCompletenessStatus).optional().default([]),
      },
      {
        name: "lc_eligible",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
      {
        name: "offset",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
    ],
    response: PartnerListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:tenant_id/partners/duplicates",
    alias: "list_duplicates_api_v1_tenants__tenant_id__partners_duplicates_get",
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DuplicatePairListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/partners/match",
    alias: "match_partner_api_v1_tenants__tenant_id__partners_match_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerMatchRequest,
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerMatchResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/tenants/:tenant_id/product-templates",
    alias: "list_templates_api_v1_tenants__tenant_id__product_templates_get",
    requestFormat: "json",
    parameters: [
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "status",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response: TemplateListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/tenants/:tenant_id/product-templates",
    alias:
      "create_template_draft_api_v1_tenants__tenant_id__product_templates_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTemplateDraftRequest,
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: TemplateDraftCreatedResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/users",
    alias: "list_users_api_v1_users_get",
    description: `Paginated, filterable list of all users. Requires &#x60;user:list&#x60; permission.

**Returns:** &#x60;PaginatedUsersResponse&#x60; with &#x60;tenant_name&#x60; resolved via JOIN`,
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "role",
        type: "Query",
        schema: z.array(UserRole).optional().default([]),
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(UserStatus).optional().default([]),
      },
      {
        name: "tenant_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "last_login_from",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "last_login_to",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response: PaginatedUsersResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users",
    alias: "invite_user_api_v1_users_post",
    description: `Create and invite a new user. Requires &#x60;system_admin&#x60; role.

**Role constraints:**
- Platform roles (&#x60;system_admin&#x60;, &#x60;support_user&#x60;, &#x60;auditor&#x60;) — &#x60;tenant_id&#x60; must be null.
  Initiates a Four-Eyes governed action; returns &#x60;GovernedActionResponse&#x60; with &#x60;status&#x3D;pending&#x60;.
  A second admin must approve before the user is created.
- Tenant roles (&#x60;front_office&#x60;, &#x60;back_office&#x60;, &#x60;leasing_company_user&#x60;) — &#x60;tenant_id&#x60; required, tenant must be active.
  Immediate execution; returns &#x60;UserResponse&#x60; with status &#x60;invited&#x60;.
- &#x60;auditor&#x60; — &#x60;access_valid_until&#x60; required.
- &#x60;leasing_company_user&#x60; — &#x60;lc_partner_id&#x60; required; must be a confirmed partner within the same
  tenant that is the leasing-company party of at least one non-terminated framework agreement.
  All other roles must omit &#x60;lc_partner_id&#x60; (or send &#x60;null&#x60;).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: InviteUserRequest,
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/users/:id",
    alias: "get_user_api_v1_users__id__get",
    description: `Return full detail for a single user. Requires &#x60;system_admin&#x60; role.

**Returns:** &#x60;UserDetailResponse&#x60; including &#x60;tenant_name&#x60;, &#x60;invited_by&#x60; and &#x60;approved_by&#x60; objects (id + name)`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: UserDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/users/:id",
    alias: "edit_user_api_v1_users__id__patch",
    description: `Update first_name, last_name and/or phone_number. Requires &#x60;user:edit&#x60; permission.

Allowed statuses: active, invited, pending_approval, suspended.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: EditUserRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: UserDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/change-email",
    alias: "change_email_api_v1_users__id__change_email_post",
    description: `Initiate a Four-Eyes email change request. Requires &#x60;user:edit&#x60; permission.

Allowed statuses: active, invited, pending_approval.
After approval: verification email sent for active users; invite resent for invited users.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ new_email: z.string().email() }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/change-role",
    alias: "initiate_role_change_api_v1_users__id__change_role_post",
    description: `Initiate a Four-Eyes role change request for a user. Requires &#x60;user:change_role&#x60; permission.

User must be in &#x60;active&#x60; status. The request remains pending until a different
system_admin approves it. Only one pending role-change request is allowed per user at a time.

**Supported transitions:**
- &#x60;system_admin&#x60; ↔ &#x60;support_user&#x60;
- &#x60;front_office&#x60; ↔ &#x60;back_office&#x60;

All other transitions (including to/from &#x60;auditor&#x60; and &#x60;leasing_company_user&#x60;) are rejected with &#x60;422 INVALID_ROLE_TRANSITION&#x60;.

**Returns:** &#x60;GovernedActionResponse&#x60; with &#x60;status&#x3D;pending&#x60;`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: InitiateRoleChangeRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/deactivate",
    alias: "deactivate_user_api_v1_users__id__deactivate_post",
    description: `Permanently deactivate a user. Requires &#x60;system_admin&#x60; role.

**Scheduling:**
- &#x60;effective_from &lt;&#x3D; now&#x60; — immediate deactivation, logs &#x60;DEACTIVATED&#x60; event
- &#x60;effective_from &gt; now&#x60; — schedules Celery task, logs &#x60;DEACTIVATION_SCHEDULED&#x60; event

**Guard:** Cannot deactivate the last active &#x60;system_admin&#x60;.

**Note:** Deactivation is permanent — deactivated users cannot be reactivated.

**Returns:** Updated &#x60;UserResponse&#x60; with status &#x60;deactivated&#x60;`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DeactivateUserRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/mfa/reset",
    alias: "reset_mfa_api_v1_users__id__mfa_reset_post",
    description: `Reset MFA for a user. Only system_admin.

Clears mfa_secret, mfa_enabled, mfa_last_verified_at, deletes all recovery
codes, and invalidates all active sessions. User must re-enroll on next login.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/reactivate",
    alias: "reactivate_user_api_v1_users__id__reactivate_post",
    description: `Reactivate a suspended user. Requires &#x60;system_admin&#x60; role.

**Requirements:** User must be in &#x60;suspended&#x60; status (deactivated users cannot be reactivated).

**Returns:** Updated &#x60;UserResponse&#x60; with status &#x60;active&#x60;`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ReactivateUserRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/resend-invitation",
    alias: "resend_invitation_api_v1_users__id__resend_invitation_post",
    description: `Resend the invitation email to a user in &#x60;invited&#x60; status. Requires &#x60;system_admin&#x60; role.

**Rate limiting:** 300s cooldown per user, max 3 resends/hour per user.

**Returns:** Updated &#x60;UserResponse&#x60; with refreshed invite token`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResendInvitationRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/suspend",
    alias: "suspend_user_api_v1_users__id__suspend_post",
    description: `Suspend an active user. Requires &#x60;system_admin&#x60; role.

**Scheduling:**
- &#x60;effective_from &lt;&#x3D; now&#x60; — immediate suspension, logs &#x60;SUSPENDED&#x60; event
- &#x60;effective_from &gt; now&#x60; — schedules Celery task, logs &#x60;SUSPENSION_SCHEDULED&#x60; event
- &#x60;effective_until&#x60; provided — schedules auto-reactivation via Celery

**Guard:** Cannot suspend the last active &#x60;system_admin&#x60;.

**Returns:** Updated &#x60;UserResponse&#x60; with status &#x60;suspended&#x60;`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SuspendUserRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/users/:id/update-access-period",
    alias:
      "initiate_auditor_period_update_api_v1_users__id__update_access_period_post",
    description: `Initiate a Four-Eyes access period update for an auditor user. Requires &#x60;user:update_access_period&#x60; permission.

User must be an active auditor. New period must be in the future.
The request remains pending until a different system_admin approves it.
Only one pending period-update request is allowed per user at a time.

**Returns:** &#x60;GovernedActionResponse&#x60; with &#x60;status&#x3D;pending&#x60;`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateAuditorAccessPeriodRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: GovernedActionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/users/export",
    alias: "initiate_export_api_v1_users_export_get",
    description: `Initiate user list export. Requires &#x60;user:export&#x60; permission.

Always async — returns &#x60;202 { job_id, status, poll_url }&#x60; immediately.
Poll &#x60;/export/status/{job_id}&#x60;, download via &#x60;/export/download/{job_id}&#x60; when ready.
Max 3 concurrent jobs per user → &#x60;429&#x60; if exceeded.

# TODO: PRD1042-37 — add audit event USER_LIST_EXPORTED when AuditService is available`,
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "role",
        type: "Query",
        schema: z.array(UserRole).optional().default([]),
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(UserStatus).optional().default([]),
      },
      {
        name: "tenant_id",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "last_login_from",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "last_login_to",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "format",
        type: "Query",
        schema: z
          .string()
          .regex(/^(csv|xlsx)$/)
          .optional()
          .default("csv"),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/users/export/download/:job_id",
    alias: "export_download_api_v1_users_export_download__job_id__get",
    description: `Download a completed export file. Non-disclosing 404 for non-existent or not-owned jobs.
Returns 409 if still processing, 422 if failed.
If the file has expired (job TTL passed), automatically re-generates with the same filters
and returns 202 with a new job_id.`,
    requestFormat: "json",
    parameters: [
      {
        name: "job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/users/export/status/:job_id",
    alias: "export_status_api_v1_users_export_status__job_id__get",
    description: `Poll export job status. Returns 404 for non-existent or not-owned jobs (non-disclosing).`,
    requestFormat: "json",
    parameters: [
      {
        name: "job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/users/me",
    alias: "get_me_api_v1_users_me_get",
    description: `Return the profile of the currently authenticated user.

**Requirements:** Valid &#x60;access_token&#x60; HTTP-only cookie.

**Returns:** Full &#x60;UserResponse&#x60; for the token owner. For permissions and active modules use &#x60;GET /me/permissions&#x60;.`,
    requestFormat: "json",
    response: UserResponse,
  },
  {
    method: "patch",
    path: "/api/v1/users/me",
    alias: "update_me_api_v1_users_me_patch",
    description: `Update the current user&#x27;s own profile. Requires valid &#x60;access_token&#x60; cookie.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateMeRequest,
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/users/me/grants",
    alias: "list_own_grants_api_v1_users_me_grants_get",
    requestFormat: "json",
    response: z.array(SupportGrantResponse),
  },
  {
    method: "get",
    path: "/api/v1/users/me/permissions",
    alias: "get_me_permissions_api_v1_users_me_permissions_get",
    description: `Return the authorization contract for the current user.

- &#x60;permissions&#x60; — flat list of permission keys derived from the user&#x27;s role
- &#x60;active_modules&#x60; — platform modules active for the user&#x27;s tenant (always-on + tenant-activated)

Refresh this endpoint independently after role changes without re-fetching the full profile.`,
    requestFormat: "json",
    response: UserMePermissionsResponse,
  },
  {
    method: "post",
    path: "/api/v1/users/me/picture",
    alias: "upload_picture_api_v1_users_me_picture_post",
    description: `Upload or replace the current user&#x27;s profile picture.

Accepts JPEG, PNG or WebP — max 5 MB. Converted to JPEG and stored in S3.
Creates a &#x60;MediaObject&#x60; record. File is served via &#x60;GET /api/v1/media/{id}&#x60; (authenticated).`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ file: z.string() }).passthrough(),
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/users/me/picture",
    alias: "delete_picture_endpoint_api_v1_users_me_picture_delete",
    description: `Delete the current user&#x27;s profile picture. Idempotent — returns 204 even if none exists.`,
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/vfe-rates",
    alias: "list_vfe_rates_api_v1_vfe_rates_get",
    requestFormat: "json",
    response: VfeRateListResponse,
  },
  {
    method: "post",
    path: "/api/v1/vfe-rates",
    alias: "create_vfe_rate_api_v1_vfe_rates_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: VfeRateCreateRequest,
      },
    ],
    response: VfeRateResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/vfe-rates/:rate_id",
    alias: "update_vfe_rate_api_v1_vfe_rates__rate_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: VfeRateUpdateRequest,
      },
      {
        name: "rate_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: VfeRateResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/vfe-rates/:rate_id",
    alias: "delete_vfe_rate_api_v1_vfe_rates__rate_id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "rate_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs",
    alias: "list_catalogs_api_v1_workflow_task_catalogs_get",
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "catalog_layer",
        type: "Query",
        schema: catalog_layer,
      },
      {
        name: "entity_type",
        type: "Query",
        schema: entity_type,
      },
      {
        name: "case_type",
        type: "Query",
        schema: case_type__2,
      },
      {
        name: "product_template_id",
        type: "Query",
        schema: product_template_id,
      },
      {
        name: "catalog_state",
        type: "Query",
        schema: catalog_state,
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response:
      app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/workflow-task-catalogs",
    alias: "create_catalog_api_v1_workflow_task_catalogs_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest,
      },
    ],
    response:
      app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs/:catalog_id",
    alias: "get_catalog_detail_api_v1_workflow_task_catalogs__catalog_id__get",
    description: `US 15.23 — Catalog Detail (Identity &amp; Scope + Task Definitions).

BPU + Support + Auditor (read). Not found / cross-tenant / non-authorized → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/activate",
    alias:
      "activate_catalog_api_v1_workflow_task_catalogs__catalog_id__activate_post",
    description: `PRD1042-1894 Block 8 (AC §7) — activate a draft. Runs the validator; on failure returns 422
with the named reasons and leaves the catalogue a draft.`,
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/audit-trail",
    alias:
      "get_catalog_audit_trail_api_v1_workflow_task_catalogs__catalog_id__audit_trail_get",
    description: `US 15.23 — Audit Trail tab: append-only change log for this catalog.

BPU + Support + Auditor (read). Cursor-paginated, newest first.`,
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "cursor",
        type: "Query",
        schema: batch_id,
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(50),
      },
    ],
    response: AuditTrailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/audit-trail/export-csv",
    alias:
      "export_catalog_audit_trail_api_v1_workflow_task_catalogs__catalog_id__audit_trail_export_csv_get",
    description: `PRD1042-1894 Block 10 — the auditor (and Bank Admin) exports the full change log as CSV.

No version history in the MVP → this append-only log is the history. BPU + Support + Auditor;
others/cross-tenant → 404. The export access is itself audited (WTC_AUDIT_TRAIL_EXPORTED).`,
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/reactivate",
    alias:
      "reactivate_catalog_api_v1_workflow_task_catalogs__catalog_id__reactivate_post",
    description: `PRD1042-1894 Block 8 (AC §7) — reactivate a suspended catalogue (back to resolving for new cases).`,
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/suspend",
    alias:
      "suspend_catalog_api_v1_workflow_task_catalogs__catalog_id__suspend_post",
    description: `PRD1042-1894 Block 8 (AC §7) — suspend an active catalogue. Not silent: returns the affected
cases + product, then proceeds (never blocked).`,
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: SuspendCatalogResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/phases",
    alias:
      "add_phase_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__phases_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePhaseRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PhaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/phases",
    alias:
      "list_phases_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__phases_get",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(PhaseResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/phases/:phase_id",
    alias:
      "update_phase_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__phases__phase_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdatePhaseRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "phase_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PhaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/phases/:phase_id",
    alias:
      "remove_phase_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__phases__phase_id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "phase_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "confirm",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
    ],
    response: RemovePhaseResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/phases/reorder",
    alias:
      "reorder_phases_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__phases_reorder_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ReorderPhasesRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(PhaseResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/tasks",
    alias:
      "add_task_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__tasks_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddTaskRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: TaskResponseWithWarnings,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/tasks",
    alias:
      "list_tasks_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__tasks_get",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(TaskResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/tasks/:task_id",
    alias:
      "update_task_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__tasks__task_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateTaskRequest,
      },
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "task_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: TaskResponseWithWarnings,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/workflow-task-catalogs/:catalog_id/versions/:version_id/tasks/:task_id",
    alias:
      "remove_task_api_v1_workflow_task_catalogs__catalog_id__versions__version_id__tasks__task_id__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "catalog_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "version_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "task_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs/case-types",
    alias:
      "list_catalog_case_types_api_v1_workflow_task_catalogs_case_types_get",
    description: `PRD1042-1790 item 1 — the case types a catalogue may be scoped to.

Declared before &#x60;/{catalog_id}&#x60; so the literal path wins over the UUID route, the same ordering
&#x60;/field-registry&#x60; above relies on.

Returns every case type in the enum&#x27;s own order, each with the entity type it derives (null for
those that derive none). Since PRD1042-1917 all seven case types carry a catalogue, so there is
no longer a &quot;typed&quot; subset to gate on — the client reads the full set from here rather than
re-listing it (AC-94 fails an implementation wired to a fixed count of case types).`,
    requestFormat: "json",
    response: z.array(CatalogCaseTypeItem),
  },
  {
    method: "get",
    path: "/api/v1/workflow-task-catalogs/field-registry",
    alias:
      "list_field_registry_api_v1_workflow_task_catalogs_field_registry_get",
    description: `PRD1042-1894 Block 7 (AC §6) — the registered fields a display condition may reference. Declared
before &#x60;/{catalog_id}&#x60; so the literal path wins over the UUID route.`,
    requestFormat: "json",
    response: z.array(FieldRegistryItem),
  },
  {
    method: "get",
    path: "/health",
    alias: "health_check_health_get",
    requestFormat: "json",
    response: z.unknown(),
  },
  {
    method: "get",
    path: "/internal/test/otp",
    alias: "test_get_otp_internal_test_otp_get",
    description: `Return the current valid OTP code for a user.

Use after POST /api/v1/auth/login to retrieve the generated OTP without
needing email access. Returns 404 if no active (non-expired, non-used) OTP
exists for the given email.`,
    requestFormat: "json",
    parameters: [
      {
        name: "email",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: OTPResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/internal/test/session",
    alias: "test_session_internal_test_session_post",
    description: `Create a real authenticated session for any user without going through 2FA.

Replicates the tail of verify_otp: evicts oldest session if needed, issues
access + refresh tokens as HTTP-only cookies.

User status is NOT checked — QA can obtain a session for suspended or
deactivated users to test authenticated edge-case scenarios.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ email: z.string().email() }).passthrough(),
      },
    ],
    response: LoginResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
])

export const api = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
