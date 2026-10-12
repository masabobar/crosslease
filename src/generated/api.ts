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
const RequestStatus = z.enum([
  "draft",
  "submitted",
  "missing_information",
  "rework",
  "committed",
  "rejected",
  "cancelled",
])
const FinancingStatus = z.enum([
  "draft",
  "calculating",
  "ready_for_setup",
  "set_up",
  "disbursed",
  "active",
  "ended",
  "run_out",
  "cancelled",
])
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
  "set_up",
  "disbursed",
  "active",
  "ended",
  "run_out",
])
const CasePrimaryEntity = z.enum(["financing", "refinancing_request", "case"])
const CaseOrigin = z.enum(["wizard", "portal", "bulk_file", "migrated"])
const CaseListItem = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    case_status: CaseStatus,
    request_status: z.union([RequestStatus, z.null()]).optional(),
    financing_status: z.union([FinancingStatus, z.null()]).optional(),
    display_status: CaseDisplayStatus,
    primary_entity: CasePrimaryEntity,
    origin: CaseOrigin,
    owner_user_id: z.union([z.string(), z.null()]),
    lc_partner_id: z.union([z.string(), z.null()]),
    routing_exception: z.boolean(),
    origin_financing_id: z.union([z.string(), z.null()]).optional(),
    decision_round: z.number().int().optional().default(0),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    contract_count: z.number().int().optional().default(0),
    lessee_count: z.number().int().optional().default(0),
    lessee_name: z.union([z.string(), z.null()]).optional(),
    lc_partner_name: z.union([z.string(), z.null()]).optional(),
    initiated_by_role: z.union([UserRole, z.null()]).optional(),
    waiting_on_roles: z.union([z.array(z.string()), z.null()]).optional(),
    phase: z.union([z.string(), z.null()]).optional(),
    step_order: z.union([z.number(), z.null()]).optional(),
    step_total: z.number().int().optional().default(0),
    rate_due_date: z.union([z.string(), z.null()]).optional(),
    last_activity_at: z.union([z.string(), z.null()]).optional(),
    last_activity_by_name: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const DashboardResponse = z
  .object({
    open_case_count: z.number().int(),
    live_financing_count: z.number().int(),
    financed_volume_eur: z.union([z.string(), z.null()]),
    cases_needing_attention: z.array(CaseListItem),
    portal_cases: z.array(CaseListItem),
  })
  .passthrough()
const CaseLeasingCompanyOption = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    city: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const CaseLeasingCompaniesResponse = z
  .object({ items: z.array(CaseLeasingCompanyOption) })
  .passthrough()
const LeasingCompanyResolutionResponse = z
  .object({
    lc_partner_id: z.string().uuid(),
    agreement_id: z.union([z.string(), z.null()]),
    agreement_name: z.union([z.string(), z.null()]),
    currency: z.union([z.string(), z.null()]),
    vfe_amount_eur: z.union([z.string(), z.null()]),
    payout_account_iban: z.union([z.string(), z.null()]),
    collection_account_iban: z.union([z.string(), z.null()]),
    bank_side_visible: z.boolean(),
    refinancing_quota: z.union([z.string(), z.null()]),
    framework_volume_eur: z.union([z.string(), z.null()]),
    product_template_id: z.union([z.string(), z.null()]),
    template_name: z.union([z.string(), z.null()]),
    template_version: z.union([z.string(), z.null()]),
    has_usable_template: z.boolean(),
    lc_numbers: z.array(z.string()),
  })
  .passthrough()
const StartCaseRequest = z.object({ case_type: CaseType }).passthrough()
const CaseResponse = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    case_status: CaseStatus,
    request_status: z.union([RequestStatus, z.null()]).optional(),
    financing_status: z.union([FinancingStatus, z.null()]).optional(),
    display_status: CaseDisplayStatus,
    primary_entity: CasePrimaryEntity,
    origin: CaseOrigin,
    owner_user_id: z.union([z.string(), z.null()]),
    lc_partner_id: z.union([z.string(), z.null()]),
    routing_exception: z.boolean(),
    origin_financing_id: z.union([z.string(), z.null()]).optional(),
    decision_round: z.number().int().optional().default(0),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const case_type = z.union([CaseType, z.null()]).optional()
const status = z.union([CaseDisplayStatus, z.null()]).optional()
const assignee_id = z.union([z.string(), z.null()]).optional()
const waiting_on_role = z.union([UserRole, z.null()]).optional()
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
    agreement_id: z.union([z.string(), z.null()]),
    agreement_reference: z.union([z.string(), z.null()]),
    agreement_active: z.boolean(),
    bank_side_visible: z.boolean(),
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
    lessee_count: z.number().int(),
    object_count: z.number().int(),
    earliest_contract_start: z.union([z.string(), z.null()]),
    latest_contract_start: z.union([z.string(), z.null()]),
    average_term_months: z.union([z.number(), z.null()]),
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
const CancelCaseRequest = z
  .object({ reason: z.string().min(1).max(255) })
  .passthrough()
const GovernedActionStatus = z.enum([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "expired",
])
const PendingApprovalResponse = z
  .object({
    governed_action_id: z.string().uuid(),
    status: GovernedActionStatus,
  })
  .passthrough()
const BindLeasingCompanyRequest = z
  .object({
    lc_number: z.string().regex(/^[0-9]{4}$/),
    lc_partner_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const BindProductTemplateRequest = z
  .object({ product_template_id: z.string().uuid() })
  .passthrough()
const CaseDetailResponse = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    case_status: CaseStatus,
    request_status: z.union([RequestStatus, z.null()]).optional(),
    financing_status: z.union([FinancingStatus, z.null()]).optional(),
    display_status: CaseDisplayStatus,
    primary_entity: CasePrimaryEntity,
    origin: CaseOrigin,
    owner_user_id: z.union([z.string(), z.null()]),
    lc_partner_id: z.union([z.string(), z.null()]),
    routing_exception: z.boolean(),
    origin_financing_id: z.union([z.string(), z.null()]).optional(),
    decision_round: z.number().int().optional().default(0),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    financing_reference: z.union([z.string(), z.null()]).optional(),
    rate_due_date: z.union([z.string(), z.null()]).optional(),
    waiting_on_roles: z.union([z.array(z.string()), z.null()]).optional(),
  })
  .passthrough()
const CaseActivityChange = z
  .object({
    field: z.string(),
    before: z.union([z.string(), z.null()]),
    after: z.union([z.string(), z.null()]),
    masked: z.boolean(),
  })
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
    is_system: z.boolean(),
    reason: z.union([z.string(), z.null()]),
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    changed_fields: z.union([z.array(z.string()), z.null()]),
    changes: z.array(CaseActivityChange),
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
const RedemptionStatus = z.enum(["pending", "settled"])
const RedemptionListItem = z
  .object({
    case_id: z.string().uuid(),
    case_reference: z.string(),
    kind: CaseType,
    contract_numbers: z.array(z.string()),
    amount: z.union([z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    status: z.union([RedemptionStatus, z.null()]),
  })
  .passthrough()
const RedemptionListResponse = z
  .object({
    redemptions: z.array(RedemptionListItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const RedemptionCaptureRequest = z
  .object({ amount: z.union([z.number(), z.string()]), value_date: z.string() })
  .passthrough()
const RedemptionResponse = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    amount: z.union([z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    status: RedemptionStatus,
    settled_by: z.union([z.string(), z.null()]),
    settled_at: z.union([z.string(), z.null()]),
    captured_by: z.union([z.string(), z.null()]),
    captured_at: z.union([z.string(), z.null()]),
  })
  .passthrough()
const CaseDuplicateFlagParty = z
  .object({
    partner_id: z.string().uuid(),
    display_name: z.string(),
    partner_status: z.string(),
    roles: z.array(z.string()),
  })
  .passthrough()
const CaseDuplicateFlag = z
  .object({
    pair_id: z.string().uuid(),
    status: z.string(),
    confidence: z.string(),
    matching_evidence: z.array(z.unknown()),
    parties: z.array(CaseDuplicateFlagParty),
  })
  .passthrough()
const CaseDuplicateFlagsResponse = z
  .object({ case_id: z.string().uuid(), flags: z.array(CaseDuplicateFlag) })
  .passthrough()
const KeepBothRequest = z
  .object({ note: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const DuplicateResolutionResponse = z
  .object({ pair_id: z.string().uuid(), status: z.string() })
  .passthrough()
const MergeDuplicateRequest = z
  .object({
    survivor_partner_id: z.string().uuid(),
    note: z.union([z.string(), z.null()]).optional(),
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
  .object({ case_id: z.string().uuid(), parties: z.array(PartyMatchItem) })
  .passthrough()
const CommentRefType = z.enum(["case", "financing", "party", "contract"])
const CommentVisibility = z.enum(["internal", "external"])
const CaseCommentItem = z
  .object({
    id: z.string().uuid(),
    ref_type: CommentRefType,
    ref_id: z.string().uuid(),
    case_id: z.union([z.string(), z.null()]).optional(),
    author_id: z.string().uuid(),
    author_role: z.string(),
    author_display: z.union([z.string(), z.null()]).optional(),
    body: z.string(),
    visibility: CommentVisibility,
    created_at: z.string().datetime({ offset: true }),
    edited_at: z.union([z.string(), z.null()]).optional(),
    deleted_at: z.union([z.string(), z.null()]).optional(),
    is_deleted: z.boolean(),
  })
  .passthrough()
const CaseCommentListResponse = z
  .object({
    items: z.array(CaseCommentItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    has_unseen_bank_comment: z.boolean().optional().default(false),
  })
  .passthrough()
const AddCaseCommentRequest = z
  .object({
    body: z.string().min(1).max(2000),
    visibility: CommentVisibility.optional(),
  })
  .passthrough()
const EditCaseCommentRequest = z
  .object({ body: z.string().min(1).max(2000) })
  .passthrough()
const status__2 = z.union([RequestStatus, z.null()]).optional()
const LcCaseListItem = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    case_status: CaseStatus,
    display_status: CaseDisplayStatus,
    primary_entity: CasePrimaryEntity,
    agreement_reference: z.union([z.string(), z.null()]).optional(),
    contract_count: z.number().int().optional().default(0),
    origin: CaseOrigin,
    created_at: z.string().datetime({ offset: true }),
    lessee_name: z.union([z.string(), z.null()]).optional(),
    lessee_count: z.number().int().optional().default(0),
    submitted_at: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const LcCaseListResponse = z
  .object({ items: z.array(LcCaseListItem), total: z.number().int() })
  .passthrough()
const LcCaseDetailResponse = z
  .object({
    id: z.string().uuid(),
    case_reference: z.string(),
    case_type: CaseType,
    case_status: CaseStatus,
    display_status: CaseDisplayStatus,
    agreement_reference: z.union([z.string(), z.null()]).optional(),
    origin: CaseOrigin,
    created_at: z.string().datetime({ offset: true }),
    request_status: z.union([RequestStatus, z.null()]).optional(),
    started_by_lc_name: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const LcCommentNotificationItem = z
  .object({
    case_id: z.string().uuid(),
    case_reference: z.string(),
    author_display: z.union([z.string(), z.null()]).optional(),
    commented_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const LcCommentNotificationListResponse = z
  .object({ items: z.array(LcCommentNotificationItem) })
  .passthrough()
const LcPortalSummaryResponse = z
  .object({ open_requests: z.number().int(), drafts: z.number().int() })
  .passthrough()
const LcCaseReviewResponse = z
  .object({
    case: LcCaseDetailResponse,
    leasing_company: z.union([CaseLeasingCompanyResponse, z.null()]),
    contracts: z.array(ReviewContractItem),
    contract_count: z.number().int(),
    residual_sum: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    lessee_count: z.number().int(),
    object_count: z.number().int(),
    earliest_contract_start: z.union([z.string(), z.null()]),
    latest_contract_start: z.union([z.string(), z.null()]),
    average_term_months: z.union([z.number(), z.null()]),
  })
  .passthrough()
const LcWithdrawalNoticeRequest = z
  .object({ message: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const FinancingKind = z.enum(["single", "package"])
const CalculationBlocker = z.enum([
  "no_contracts",
  "contract_start_missing",
  "instalment_amount_missing",
  "term_missing",
  "repayment_terms_missing",
  "agreed_loan_amount_missing",
])
const CalculationBlockerRead = z
  .object({
    code: CalculationBlocker,
    contract_id: z.union([z.string(), z.null()]).optional(),
    contract_number: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const CalculationStaleCause = z.enum([
  "terms",
  "product_template",
  "settlement_correction",
  "contract_set",
  "framework_agreement",
])
const MeasurementBasis = z.enum([
  "present_value",
  "ratio_on_acquisition_cost",
  "agreed_amount",
])
const RefinancingForm = z.enum(["annuity", "fixed_principal", "bullet"])
const ScheduleLineResponse = z
  .object({
    period_index: z.number().int(),
    due_date: z.union([z.string(), z.null()]).optional(),
    opening_balance: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    interest: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    principal: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    payment: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    closing_balance: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
  })
  .passthrough()
const ExcludedPaymentResponse = z
  .object({
    due_date: z.string(),
    amount: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    reason: z.string(),
  })
  .passthrough()
const DiscountingRowResponse = z
  .object({
    period_index: z.number().int(),
    due_date: z.union([z.string(), z.null()]).optional(),
    kind: z.enum(["instalment", "residual"]),
    lease_payment: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    loan_payment: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    factor: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    present_value: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
  })
  .passthrough()
const CalculationResultResponse = z
  .object({
    basis: MeasurementBasis,
    model: RefinancingForm,
    disbursement: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    aggregate_instalment: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    balloon: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    final_maturity: z.string(),
    first_due_date: z.union([z.string(), z.null()]).optional(),
    first_period_days: z.union([z.number(), z.null()]).optional(),
    instalment_count: z.union([z.number(), z.null()]).optional(),
    period_count: z.number().int(),
    pv_instalments: z.union([z.string(), z.null()]).optional(),
    pv_residual: z.union([z.string(), z.null()]).optional(),
    total_interest: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    rate_used: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    payout_to_nac: z.union([z.string(), z.null()]).optional(),
    schedule: z.array(ScheduleLineResponse),
    excluded_payments: z.array(ExcludedPaymentResponse),
    lease_instalment: z.union([z.string(), z.null()]).optional(),
    lease_residual: z.union([z.string(), z.null()]).optional(),
    period_rate: z.union([z.string(), z.null()]).optional(),
    discounting: z.array(DiscountingRowResponse).optional().default([]),
    excluded_total: z.union([z.string(), z.null()]).optional(),
    lease_payments_total: z.union([z.string(), z.null()]).optional(),
    acquisition_cost: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const FinancingEndedReason = z.enum([
  "term_ran_out",
  "terminated",
  "redeemed_early",
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
    first_instalment_date: z.union([z.string(), z.null()]),
    instalment_day: z.union([z.number(), z.null()]),
    default_instalment_day: z.number().int().optional().default(1),
    rate_quoted_on: z.union([z.string(), z.null()]),
    agreed_loan_amount: z.union([z.string(), z.null()]),
    committed_rate: z.union([z.string(), z.null()]),
    committed_rate_expiry: z.union([z.string(), z.null()]),
    rate_lock_days: z.union([z.number(), z.null()]),
    settlement_ready: z.boolean(),
    calculation_blockers: z
      .array(CalculationBlockerRead)
      .optional()
      .default([]),
    calculation_state: z.string(),
    calculation_version: z.number().int(),
    calculation_invalidated_by: z
      .union([CalculationStaleCause, z.null()])
      .optional(),
    calculation_result: z
      .union([CalculationResultResponse, z.null()])
      .optional(),
    calculated_at: z.union([z.string(), z.null()]).optional(),
    loan_number: z.union([z.string(), z.null()]),
    loan_account: z.union([z.string(), z.null()]),
    status: FinancingStatus,
    ended_reason: z.union([FinancingEndedReason, z.null()]).optional(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CalculatePreviewRequest = z
  .object({
    refinancing_rate: z.union([z.number(), z.string(), z.null()]),
    refinancing_quota_override: z.union([z.number(), z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    first_instalment_date: z.union([z.string(), z.null()]),
    instalment_day: z.union([z.number(), z.null()]),
    rate_quoted_on: z.union([z.string(), z.null()]).optional(),
    rate_lock_days: z.union([z.number(), z.null()]).optional(),
    agreed_loan_amount: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()
const calculate_case_financing_api_v1_cases__case_id__financing_calculate_post_Body =
  z.union([CalculatePreviewRequest, z.null()])
const RunOutRequest = z
  .object({ reason: z.string().min(1).max(500) })
  .passthrough()
const RecordLoanValuesRequest = z
  .object({
    loan_number: z.union([z.string(), z.null()]),
    loan_account: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const UpdateTermsRequest = z
  .object({
    refinancing_rate: z.union([z.number(), z.string(), z.null()]),
    refinancing_quota_override: z.union([z.number(), z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    first_instalment_date: z.union([z.string(), z.null()]),
    instalment_day: z.union([z.number(), z.null()]),
    rate_quoted_on: z.union([z.string(), z.null()]),
    rate_lock_days: z.union([z.number(), z.null()]),
    agreed_loan_amount: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()
const CorrectSettlementRequest = z
  .object({ reason: z.string().min(1) })
  .passthrough()
const AddApprovalConditionRequest = z
  .object({
    condition_text: z.string().min(1),
    due_date: z.string(),
    step_reference: z.union([z.string(), z.null()]).optional(),
    evidence_document_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ApprovalConditionState = z.enum(["open", "met", "waived", "expired"])
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
  .object({ comment: z.union([z.string(), z.null()]) })
  .partial()
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
const PaymentPlanRowType = z.enum([
  "down_payment",
  "instalment",
  "final_payment",
])
const PaymentPlanEntryResponse = z
  .object({
    period: z.number().int(),
    due_date: z.string(),
    amount: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    row_type: PaymentPlanRowType,
    is_final: z.boolean(),
    origin: z.string(),
  })
  .passthrough()
const PlanCoverageResponse = z
  .object({
    covered_months: z.number().int(),
    term_months: z.number().int(),
    covers_term: z.boolean(),
  })
  .passthrough()
const PaymentPlanResponse = z
  .object({
    component: z.union([FinancingComponentResponse, z.null()]),
    entries: z.array(PaymentPlanEntryResponse),
    coverage: z.union([PlanCoverageResponse, z.null()]).optional(),
  })
  .passthrough()
const ManualPlanRowRequest = z
  .object({
    due_date: z.string(),
    amount: z.union([z.number(), z.string()]),
    row_type: PaymentPlanRowType.optional(),
  })
  .passthrough()
const SetManualPlanRequest = z
  .object({ rows: z.array(ManualPlanRowRequest).min(1) })
  .passthrough()
const FinancingFilterOption = z
  .object({ value: z.string(), label: z.string() })
  .passthrough()
const FinancingFilterOptionsResponse = z
  .object({ items: z.array(FinancingFilterOption) })
  .passthrough()
const FinancingListItem = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    financing_reference: z.string(),
    case_reference: z.string(),
    lc_number: z.union([z.string(), z.null()]),
    status: FinancingStatus,
    ended_reason: z.union([FinancingEndedReason, z.null()]).optional(),
    kind: FinancingKind,
    refinancing_rate: z.union([z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    calculation_state: z.string(),
    loan_number: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
    lc_partner_name: z.union([z.string(), z.null()]).optional(),
    contract_count: z.number().int().optional().default(0),
    loan_account: z.union([z.string(), z.null()]).optional(),
    soll_amount: z.union([z.string(), z.null()]).optional(),
    haben_amount: z.union([z.string(), z.null()]).optional(),
    outstanding: z.boolean().optional().default(false),
    payout_amount: z.union([z.string(), z.null()]).optional(),
    account_no: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const FinancingListResponse = z
  .object({
    items: z.array(FinancingListItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const FinancingTabCounts = z
  .object({
    contracts: z.number().int(),
    collaterals: z.number().int(),
    covenants: z.number().int(),
    redemptions: z.number().int(),
  })
  .passthrough()
const FinancingBalanceRead = z
  .object({
    outstanding: z.union([z.string(), z.null()]),
    as_of: z.string(),
    payout: z.union([z.string(), z.null()]),
    approved_loan_amount: z.union([z.string(), z.null()]).optional(),
    provisional: z.boolean(),
  })
  .passthrough()
const RepaymentRowRead = z
  .object({
    due_date: z.union([z.string(), z.null()]),
    payment: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    principal: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    interest: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    closing_balance: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    kind: z.union([z.enum(["payout", "redemption"]), z.null()]),
    is_current: z.boolean(),
    is_future: z.boolean(),
  })
  .passthrough()
const RepaymentRead = z
  .object({
    rows: z.array(RepaymentRowRead),
    instalment: z.union([z.string(), z.null()]),
    instalments_due: z.number().int(),
    instalment_count: z.number().int(),
    repayment_start: z.union([z.string(), z.null()]),
    final_instalment: z.union([z.string(), z.null()]),
    residual: z.union([z.string(), z.null()]),
    maturity: z.union([z.string(), z.null()]),
    total_interest: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    outstanding: z.union([z.string(), z.null()]),
    adjusted_for_redemptions: z.boolean().optional().default(false),
    early_redemption_case_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ContractShareRead = z
  .object({
    contract_id: z.string().uuid(),
    amount: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    percent: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
  })
  .passthrough()
const FinancingDetailRead = z
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
    first_instalment_date: z.union([z.string(), z.null()]),
    instalment_day: z.union([z.number(), z.null()]),
    default_instalment_day: z.number().int().optional().default(1),
    rate_quoted_on: z.union([z.string(), z.null()]),
    agreed_loan_amount: z.union([z.string(), z.null()]),
    committed_rate: z.union([z.string(), z.null()]),
    committed_rate_expiry: z.union([z.string(), z.null()]),
    rate_lock_days: z.union([z.number(), z.null()]),
    settlement_ready: z.boolean(),
    calculation_blockers: z
      .array(CalculationBlockerRead)
      .optional()
      .default([]),
    calculation_state: z.string(),
    calculation_version: z.number().int(),
    calculation_invalidated_by: z
      .union([CalculationStaleCause, z.null()])
      .optional(),
    calculation_result: z
      .union([CalculationResultResponse, z.null()])
      .optional(),
    calculated_at: z.union([z.string(), z.null()]).optional(),
    loan_number: z.union([z.string(), z.null()]),
    loan_account: z.union([z.string(), z.null()]),
    status: FinancingStatus,
    ended_reason: z.union([FinancingEndedReason, z.null()]).optional(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    case_reference: z.string(),
    lc_partner_id: z.union([z.string(), z.null()]),
    lc_partner_name: z.union([z.string(), z.null()]),
    framework_agreement_name: z.union([z.string(), z.null()]),
    product_template_name: z.union([z.string(), z.null()]),
    product_template_version_number: z.union([z.string(), z.null()]).optional(),
    soll_amount: z.union([z.string(), z.null()]),
    soll_date: z.union([z.string(), z.null()]),
    haben_amount: z.union([z.string(), z.null()]),
    haben_date: z.union([z.string(), z.null()]),
    loan_values_editable: z.boolean(),
    updated_at: z.string().datetime({ offset: true }),
    counts: FinancingTabCounts,
    balance: FinancingBalanceRead,
    repayment: z.union([RepaymentRead, z.null()]),
    contract_shares: z.array(ContractShareRead).optional().default([]),
  })
  .passthrough()
const UpdateMaintainedValuesRequest = z.object({
  expected_updated_at: z.string().datetime({ offset: true }),
  loan_number: z.union([z.string(), z.null()]).optional(),
  loan_account: z.union([z.string(), z.null()]).optional(),
  soll_amount: z.union([z.number(), z.string(), z.null()]).optional(),
  soll_date: z.union([z.string(), z.null()]).optional(),
  haben_amount: z.union([z.number(), z.string(), z.null()]).optional(),
  haben_date: z.union([z.string(), z.null()]).optional(),
})
const MiscDocumentResponse = z
  .object({
    id: z.string().uuid(),
    document_id: z.string().uuid(),
    file_name: z.union([z.string(), z.null()]),
    size: z.union([z.number(), z.null()]),
    document_type_code: z.union([z.string(), z.null()]),
    document_label: z.union([z.string(), z.null()]),
    uploaded_at_utc: z.string().datetime({ offset: true }),
    uploaded_at_local: z.string().datetime({ offset: true }),
  })
  .passthrough()
const FinancingDocumentListResponse = z
  .object({
    financing_id: z.string().uuid(),
    documents: z.array(MiscDocumentResponse),
  })
  .passthrough()
const FinancingDocumentType = z.enum([
  "original_agreement",
  "addendum",
  "correspondence",
  "other",
])
const Body_add_financing_document_api_v1_financings__financing_id__documents_post =
  z
    .object({
      file: z.string(),
      document_type: z.union([FinancingDocumentType, z.null()]).optional(),
      document_label: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough()
const DocumentRowType = z.enum([
  "DAT_REPORT",
  "LEASE_CONTRACT",
  "MISCELLANEOUS",
  "CALCULATION_DATA_SHEET",
])
const DocumentRowSource = z.enum(["uploaded", "generated"])
const DocumentOwnerKind = z.enum(["financing", "contract", "object"])
const DocumentOwnerRead = z
  .object({
    kind: DocumentOwnerKind,
    id: z.string().uuid(),
    reference: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
  })
  .passthrough()
const DocumentManagedOn = z.literal("collateral_card")
const DocumentRowRead = z
  .object({
    document_id: z.string().uuid(),
    entry_id: z.union([z.string(), z.null()]),
    file_name: z.union([z.string(), z.null()]),
    size: z.union([z.number(), z.null()]),
    type: DocumentRowType,
    source: DocumentRowSource,
    owner: DocumentOwnerRead,
    date_utc: z.string().datetime({ offset: true }),
    date_local: z.string().datetime({ offset: true }),
    label: z.union([z.string(), z.null()]),
    removable: z.boolean(),
    managed_on: z.union([DocumentManagedOn, z.null()]),
  })
  .passthrough()
const DocumentRowListResponse = z
  .object({ rows: z.array(DocumentRowRead) })
  .passthrough()
const Body_upload_financing_document_row_api_v1_financings__financing_id__document_rows_post =
  z
    .object({
      file: z.string(),
      document_type: z.string(),
      document_label: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough()
const UpdateFinancingDocumentRequest = z
  .object({
    document_type: z.union([FinancingDocumentType, z.null()]),
    document_label: z.union([z.string(), z.null()]),
  })
  .partial()
const CollateralProvider = z
  .object({
    name: z.string(),
    street: z.union([z.string(), z.null()]),
    house_number: z.union([z.string(), z.null()]),
    postal_code: z.union([z.string(), z.null()]),
    city: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FinancingSecurityItem = z
  .object({
    collateral_id: z.string().uuid(),
    collateral_type: z.string(),
    value: z.union([z.string(), z.null()]),
    guarantor_partner_id: z.union([z.string(), z.null()]),
    guarantor_display_name: z.union([z.string(), z.null()]),
    evidence_document_id: z.union([z.string(), z.null()]),
    evidence_document_name: z.union([z.string(), z.null()]),
    evidence_document_date: z.union([z.string(), z.null()]),
    provider: z.union([CollateralProvider, z.null()]),
    kind_of_obligation: z.union([z.string(), z.null()]),
    contract_id: z.string().uuid(),
    contract_number: z.union([z.string(), z.null()]),
  })
  .passthrough()
const FinancingSecuritiesResponse = z
  .object({
    financing_id: z.string().uuid(),
    items: z.array(FinancingSecurityItem),
  })
  .passthrough()
const CollateralType = z.enum([
  "chattel_mortgage",
  "assignment_of_receivables",
  "guarantee",
])
const CollateralEvidenceItem = z
  .object({
    document_id: z.string().uuid(),
    file_name: z.union([z.string(), z.null()]),
    size: z.union([z.number(), z.null()]),
    uploaded_at_utc: z.string().datetime({ offset: true }),
    uploaded_at_local: z.string().datetime({ offset: true }),
  })
  .passthrough()
const CollateralRecheckState = z.enum(["clear", "needs_recheck"])
const CollateralDecisionBlock = z.enum([
  "not_back_office",
  "proposer",
  "step_35_resolver",
])
const CollateralValueItem = z
  .object({
    total_eur: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    set_by: z.string().uuid(),
    set_by_name: z.union([z.string(), z.null()]),
    set_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse =
  z
    .object({
      id: z.string().uuid(),
      financing_id: z.string().uuid(),
      collateral_type: z.union([CollateralType, z.null()]),
      current_total_eur: z.union([z.string(), z.null()]),
      proposed_total_eur: z.union([z.string(), z.null()]),
      evidence: z.array(CollateralEvidenceItem),
      recheck_state: CollateralRecheckState,
      redetermined_by: z.union([z.string(), z.null()]),
      redetermined_by_name: z.union([z.string(), z.null()]),
      redetermined_at: z.union([z.string(), z.null()]),
      confirmed_by: z.union([z.string(), z.null()]),
      confirmed_by_name: z.union([z.string(), z.null()]),
      confirmed_at: z.union([z.string(), z.null()]),
      decision_block: z.union([CollateralDecisionBlock, z.null()]),
      value_history: z.array(CollateralValueItem),
    })
    .passthrough()
const SetCollateralTypeRequest = z
  .object({ collateral_type: CollateralType })
  .passthrough()
const SetCollateralTotalRequest = z
  .object({ total_eur: z.union([z.number(), z.string()]) })
  .passthrough()
const Body_add_financing_collateral_evidence_api_v1_financings__financing_id__collateral_evidence_post =
  z.object({ file: z.string() }).passthrough()
const RedetermineCollateralRequest = z
  .object({ total_eur: z.union([z.number(), z.string()]) })
  .passthrough()
const PortalFinancingStatus = z.enum([
  "in_progress",
  "committed",
  "paid_out",
  "running",
  "ended",
  "cancelled",
])
const LcFinancingListItem = z
  .object({
    id: z.string().uuid(),
    financing_reference: z.string(),
    kind: FinancingKind,
    framework_agreement_reference: z.union([z.string(), z.null()]),
    contract_count: z.number().int(),
    portal_status: PortalFinancingStatus,
    value_date: z.union([z.string(), z.null()]),
    payout_amount: z.union([z.string(), z.null()]),
    outstanding_balance: z.union([z.string(), z.null()]),
  })
  .passthrough()
const LcFinancingListResponse = z
  .object({
    items: z.array(LcFinancingListItem),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const LcFinancingAgreementOption = z
  .object({ id: z.string().uuid(), name: z.string() })
  .passthrough()
const LcFinancingAgreementOptionsResponse = z
  .object({ items: z.array(LcFinancingAgreementOption) })
  .passthrough()
const PortalDocumentTypeItem = z
  .object({ type_code: z.string(), type_name: z.string() })
  .passthrough()
const PortalDocumentTypesResponse = z
  .object({ items: z.array(PortalDocumentTypeItem) })
  .passthrough()
const Body_upload_portal_partner_document_api_v1_lc_partners__id__documents_post =
  z
    .object({
      document_type_code: z.string(),
      file: z.string(),
      document_date: z.union([z.string(), z.null()]).optional(),
      label: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough()
const PartnerDocumentItem = z
  .object({
    id: z.string(),
    media_object_id: z.string(),
    file_name: z.union([z.string(), z.null()]),
    document_type_code: z.union([z.string(), z.null()]),
    document_type_name: z.union([z.string(), z.null()]),
    document_date: z.union([z.string(), z.null()]),
    label: z.union([z.string(), z.null()]),
    uploaded_at: z.string().datetime({ offset: true }),
    uploaded_by_name: z.union([z.string(), z.null()]),
  })
  .passthrough()
const ContractDeferredState = z.enum(["active", "deferred"])
const deferred_state = z.union([ContractDeferredState, z.null()]).optional()
const ContractStatus = z.enum([
  "active",
  "financed",
  "cancelled",
  "draft",
  "submitted",
  "committed",
  "rejected",
  "deferred",
  "redeemed",
  "closed",
])
const PerformanceStatus = z.enum(["performing", "non_performing"])
const ContractCompleteness = z.enum(["complete", "incomplete"])
const ContractListItem = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    lessee_partner_id: z.union([z.string(), z.null()]),
    contract_type: z.union([z.string(), z.null()]),
    contract_residual: z.union([z.string(), z.null()]),
    deferred_state: ContractDeferredState,
    contract_status: ContractStatus,
    performance_status: PerformanceStatus,
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
    sale_and_lease_back: z.union([z.boolean(), z.null()]).optional(),
    sublease: z.union([z.boolean(), z.null()]).optional(),
    contract_end: z.union([z.string(), z.null()]).optional(),
    residual_value_due_on: z.union([z.string(), z.null()]).optional(),
    residual_value_due_basis: z.union([z.string(), z.null()]).optional(),
    remarks: z.union([z.string(), z.null()]).optional(),
    net_acquisition_costs: z.union([z.string(), z.null()]).optional(),
    lease_interest_rate: z.union([z.string(), z.null()]).optional(),
    refinancing_number: z.union([z.string(), z.null()]).optional(),
    payment_method: z.union([z.string(), z.null()]).optional(),
    payment_mode: z.union([z.string(), z.null()]).optional(),
    due_date_last_instalment: z.union([z.string(), z.null()]).optional(),
    amortisation_warning: z.union([z.string(), z.null()]).optional(),
    settlement_blockers: z.array(z.string()).optional(),
    lessee_name: z.union([z.string(), z.null()]).optional(),
    object_count: z.number().int().optional().default(0),
    first_object_description: z.union([z.string(), z.null()]).optional(),
    first_object_plate: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ContractListResponse = z
  .object({ items: z.array(ContractListItem), total: z.number().int() })
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
const PaymentMethod = z.enum(["sepa_direct_debit", "self_payer"])
const PaymentMode = z.enum(["in_advance", "in_arrears"])
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
    sale_and_lease_back: z.union([z.boolean(), z.null()]),
    sublease: z.union([z.boolean(), z.null()]),
    contract_end: z.union([z.string(), z.null()]),
    residual_value_due_on: z.union([z.string(), z.null()]),
    remarks: z.union([z.string(), z.null()]),
    net_acquisition_costs: z.union([z.number(), z.string(), z.null()]),
    lease_interest_rate: z.union([z.number(), z.string(), z.null()]),
    refinancing_number: z.union([z.string(), z.null()]),
    payment_method: z.union([PaymentMethod, z.null()]),
    payment_mode: z.union([PaymentMode, z.null()]),
    batch_id: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough()
const ContractRead = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    lessee_partner_id: z.union([z.string(), z.null()]),
    contract_type: z.union([z.string(), z.null()]),
    contract_residual: z.union([z.string(), z.null()]),
    deferred_state: ContractDeferredState,
    contract_status: ContractStatus,
    performance_status: PerformanceStatus,
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
    sale_and_lease_back: z.union([z.boolean(), z.null()]).optional(),
    sublease: z.union([z.boolean(), z.null()]).optional(),
    contract_end: z.union([z.string(), z.null()]).optional(),
    residual_value_due_on: z.union([z.string(), z.null()]).optional(),
    residual_value_due_basis: z.union([z.string(), z.null()]).optional(),
    remarks: z.union([z.string(), z.null()]).optional(),
    net_acquisition_costs: z.union([z.string(), z.null()]).optional(),
    lease_interest_rate: z.union([z.string(), z.null()]).optional(),
    refinancing_number: z.union([z.string(), z.null()]).optional(),
    payment_method: z.union([z.string(), z.null()]).optional(),
    payment_mode: z.union([z.string(), z.null()]).optional(),
    due_date_last_instalment: z.union([z.string(), z.null()]).optional(),
    amortisation_warning: z.union([z.string(), z.null()]).optional(),
    settlement_blockers: z.array(z.string()).optional(),
  })
  .passthrough()
const PackageTotalsRead = z
  .object({
    contract_count: z.number().int(),
    residual_sum: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    acquisition_cost_sum: z.union([z.string(), z.null()]),
    special_payment_sum: z.union([z.string(), z.null()]),
    lessee_name: z.union([z.string(), z.null()]).optional(),
    lessee_count: z.number().int().optional().default(0),
    object_count: z.number().int().optional().default(0),
  })
  .passthrough()
const BulkRemoveRequest = z
  .object({
    contract_ids: z.array(z.string().uuid()).min(1).max(100),
    reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const BulkRemoveResponse = z.object({ removed: z.number().int() }).passthrough()
const ContractFilterOption = z
  .object({ value: z.string(), label: z.string() })
  .passthrough()
const ContractFilterOptionsResponse = z
  .object({ items: z.array(ContractFilterOption) })
  .passthrough()
const ContractRecordRef = z
  .object({ id: z.string().uuid(), name: z.union([z.string(), z.null()]) })
  .passthrough()
const ContractRecordFinancing = z
  .object({
    id: z.string().uuid(),
    reference: z.string(),
    status: FinancingStatus,
    kind: FinancingKind,
  })
  .passthrough()
const ContractRecordState = z.enum(["draft", "financed", "redeemed", "other"])
const ContractRecordFigures = z
  .object({
    object_count: z.number().int(),
    special_payment_sum: z.union([z.string(), z.null()]),
    collaterals_total: z.number().int(),
    collaterals_in_place: z.number().int(),
    open_return_count: z.number().int().optional().default(0),
  })
  .passthrough()
const ContractEditLock = z.enum([
  "not_refinancing",
  "contract_ended",
  "closed_case",
  "portal_window",
  "settlement",
  "set_up",
  "paid_out",
])
const ContractRecordEditable = z
  .object({
    calculation_values: z.boolean(),
    other_values: z.boolean(),
    lock: z.union([ContractEditLock, z.null()]),
    locked_fields: z.array(z.string()),
    objects: z.boolean(),
    objects_lock: z.union([ContractEditLock, z.null()]),
  })
  .passthrough()
const ContractRecordRead = z
  .object({
    contract: ContractRead,
    lessee: z.union([ContractRecordRef, z.null()]),
    leasing_company: z.union([ContractRecordRef, z.null()]),
    case: ContractRecordRef,
    framework_agreement: z.union([ContractRecordRef, z.null()]),
    financing: z.union([ContractRecordFinancing, z.null()]),
    state: ContractRecordState,
    servicing_actions_available: z.boolean(),
    figures: ContractRecordFigures,
    editable: ContractRecordEditable,
  })
  .passthrough()
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
    sale_and_lease_back: z.union([z.boolean(), z.null()]),
    sublease: z.union([z.boolean(), z.null()]),
    contract_end: z.union([z.string(), z.null()]),
    residual_value_due_on: z.union([z.string(), z.null()]),
    remarks: z.union([z.string(), z.null()]),
    net_acquisition_costs: z.union([z.number(), z.string(), z.null()]),
    lease_interest_rate: z.union([z.number(), z.string(), z.null()]),
    refinancing_number: z.union([z.string(), z.null()]),
    payment_method: z.union([PaymentMethod, z.null()]),
    payment_mode: z.union([PaymentMode, z.null()]),
  })
  .partial()
  .passthrough()
const MarkNonPerforming = z
  .object({ note: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const ContractRemove = z
  .object({ reason: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const ContractDefer = z
  .object({ reason: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const defer_contract_api_v1_contracts__contract_id__defer_post_Body = z.union([
  ContractDefer,
  z.null(),
])
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
const LeaseCashFlowUnavailable = z.enum([
  "no_financing",
  "no_value_date",
  "no_quota",
  "no_lease_plan",
])
const LeasePaymentStatus = z.enum(["paid", "open", "upcoming"])
const LeaseCashFlowRowRead = z
  .object({
    number: z.number().int(),
    due_date: z.string(),
    lease_payment: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    refinanced: z.boolean(),
    loan_payment: z.union([z.string(), z.null()]),
    status: LeasePaymentStatus,
    returned_on: z.union([z.string(), z.null()]).optional(),
    resolved_returns: z.number().int().optional().default(0),
  })
  .passthrough()
const LeaseCashFlowRead = z
  .object({
    unavailable: z.union([LeaseCashFlowUnavailable, z.null()]),
    as_of: z.union([z.string(), z.null()]),
    value_date: z.union([z.string(), z.null()]),
    quota: z.union([z.string(), z.null()]),
    refinanced_count: z.number().int(),
    sum_refinanced: z.union([z.string(), z.null()]),
    applied_quota: z.union([z.string(), z.null()]),
    payout: z.union([z.string(), z.null()]),
    payout_recorded: z.boolean(),
    residual_value: z.union([z.string(), z.null()]),
    residual_due_date: z.union([z.string(), z.null()]),
    residual_refinanced: z.union([z.string(), z.null()]),
    rows: z.array(LeaseCashFlowRowRead),
  })
  .passthrough()
const LoanPaymentPlanUnavailable = z.enum([
  "no_financing",
  "not_calculated",
  "not_available",
])
const LoanPlanFinancingRead = z
  .object({
    id: z.string().uuid(),
    reference: z.string(),
    kind: FinancingKind,
    contract_count: z.number().int(),
  })
  .passthrough()
const LoanPlanBankDetailsRead = z
  .object({
    product_template_name: z.union([z.string(), z.null()]),
    set_up_in_core_system: z.boolean(),
  })
  .passthrough()
const LoanPaymentPlanRead = z
  .object({
    unavailable: z.union([LoanPaymentPlanUnavailable, z.null()]),
    financing: z.union([LoanPlanFinancingRead, z.null()]),
    bank: z.union([LoanPlanBankDetailsRead, z.null()]),
    adjusted_for_redemptions: z.boolean(),
    rows: z.array(RepaymentRowRead),
    total_payment: z.union([z.string(), z.null()]),
    total_principal: z.union([z.string(), z.null()]),
    total_interest: z.union([z.string(), z.null()]),
  })
  .passthrough()
const DirectDebitReturnReason = z.enum([
  "insufficient_funds",
  "account_closed_or_blocked",
  "no_valid_mandate",
  "disputed_by_debtor",
  "other",
])
const DirectDebitReturnStatus = z.enum(["open", "resolved"])
const DirectDebitReturnRead = z
  .object({
    id: z.string().uuid(),
    due_date: z.string(),
    returned_on: z.string(),
    reason: DirectDebitReturnReason,
    reason_other: z.union([z.string(), z.null()]),
    status: DirectDebitReturnStatus,
    reported_on: z.string(),
    reported_by: z.union([z.string(), z.null()]),
    recorded_at: z.string().datetime({ offset: true }),
    recorded_by: z.union([z.string(), z.null()]),
    resolved_on: z.union([z.string(), z.null()]),
    resolution_note: z.union([z.string(), z.null()]),
    resolved_at: z.union([z.string(), z.null()]),
    resolved_by: z.union([z.string(), z.null()]),
  })
  .passthrough()
const DirectDebitReturnListResponse = z
  .object({ items: z.array(DirectDebitReturnRead) })
  .passthrough()
const DirectDebitReturnCreate = z
  .object({
    due_date: z.string(),
    returned_on: z.string(),
    reported_on: z.string(),
    reason: DirectDebitReturnReason,
    reason_other: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const DirectDebitReturnResolve = z
  .object({
    resolved_on: z.string(),
    note: z.union([z.string(), z.null()]).optional(),
  })
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
    replacement_value: z.union([z.string(), z.null()]),
    value_as_at: z.union([z.string(), z.null()]),
    market_value_as_at: z.union([z.string(), z.null()]),
    dat_evidence_status: z.union([z.string(), z.null()]),
    dat_evidence_document_id: z.union([z.string(), z.null()]),
    location_and_region: z.union([z.string(), z.null()]),
    object_location: z.union([z.string(), z.null()]).optional(),
    supplier_name: z.union([z.string(), z.null()]).optional(),
    registration_part_two_status: z.union([z.string(), z.null()]).optional(),
    insurance_proof_status: z.union([z.string(), z.null()]).optional(),
    duplicate_check_status: z.union([z.string(), z.null()]).optional(),
    removed_at: z.union([z.string(), z.null()]),
    removal_reason: z.union([z.string(), z.null()]),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    residual_warning: z.union([z.string(), z.null()]).optional(),
    missing_for_vehicle: z.array(z.string()).optional(),
    missing_fields: z.array(z.string()).optional(),
  })
  .passthrough()
const LeaseObjectListResponse = z
  .object({ contract_id: z.string().uuid(), objects: z.array(LeaseObjectRead) })
  .passthrough()
const NewOrUsed = z.enum(["new", "used"])
const MarketValueIndicator = z.literal("i_o")
const DATEvidenceStatus = z.enum(["pending", "uploaded"])
const ObjectLocation = z.enum(["domestic", "foreign"])
const RegistrationPartTwoStatus = z.literal("checked")
const InsuranceProofStatus = z.enum(["in_place", "missing"])
const DuplicateCheckStatus = z.enum(["clear", "duplicate_found"])
const LeaseObjectCreate = z
  .object({
    object_group: z.union([z.string(), z.null()]).optional(),
    object_sub_group: z.union([z.string(), z.null()]).optional(),
    object_description: z.union([z.string(), z.null()]).optional(),
    manufacturer: z.union([z.string(), z.null()]).optional(),
    brand: z.union([z.string(), z.null()]).optional(),
    year_of_manufacture: z.union([z.number(), z.null()]).optional(),
    chassis_or_serial_number: z.union([z.string(), z.null()]).optional(),
    registration_plate: z.union([z.string(), z.null()]).optional(),
    vehicle_registration_document_number: z
      .union([z.string(), z.null()])
      .optional(),
    new_or_used: z.union([NewOrUsed, z.null()]).optional(),
    acquisition_cost: z.union([z.number(), z.string()]),
    residual_value: z.union([z.number(), z.string(), z.null()]).optional(),
    special_payment: z.union([z.number(), z.string(), z.null()]).optional(),
    market_value: z.union([z.number(), z.string(), z.null()]).optional(),
    market_value_indicator: z
      .union([MarketValueIndicator, z.null()])
      .optional(),
    appraised_value: z.union([z.number(), z.string(), z.null()]).optional(),
    replacement_value: z.union([z.number(), z.string(), z.null()]).optional(),
    value_as_at: z.union([z.string(), z.null()]).optional(),
    market_value_as_at: z.union([z.string(), z.null()]).optional(),
    dat_evidence_status: z.union([DATEvidenceStatus, z.null()]).optional(),
    dat_evidence_document_id: z.union([z.string(), z.null()]).optional(),
    location_and_region: z.union([z.string(), z.null()]).optional(),
    object_location: z.union([ObjectLocation, z.null()]).optional(),
    supplier_name: z.union([z.string(), z.null()]).optional(),
    registration_part_two_status: z
      .union([RegistrationPartTwoStatus, z.null()])
      .optional(),
    insurance_proof_status: z
      .union([InsuranceProofStatus, z.null()])
      .optional(),
    duplicate_check_status: z
      .union([DuplicateCheckStatus, z.null()])
      .optional(),
  })
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
    replacement_value: z.union([z.number(), z.string(), z.null()]),
    value_as_at: z.union([z.string(), z.null()]),
    market_value_as_at: z.union([z.string(), z.null()]),
    dat_evidence_status: z.union([DATEvidenceStatus, z.null()]),
    dat_evidence_document_id: z.union([z.string(), z.null()]),
    location_and_region: z.union([z.string(), z.null()]),
    object_location: z.union([ObjectLocation, z.null()]),
    supplier_name: z.union([z.string(), z.null()]),
    registration_part_two_status: z.union([
      RegistrationPartTwoStatus,
      z.null(),
    ]),
    insurance_proof_status: z.union([InsuranceProofStatus, z.null()]),
    duplicate_check_status: z.union([DuplicateCheckStatus, z.null()]),
  })
  .partial()
  .passthrough()
const LeaseObjectRemove = z
  .object({ reason: z.string().min(1).max(255) })
  .passthrough()
const RegisteredAddressInput = z
  .object({
    street: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    country: z.string().min(1),
    postal_code: z.string().min(1),
    state_region: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const LegalEntityIdentityInput = z
  .object({
    partner_type: z.string(),
    legal_name: z.string().min(2).max(100),
    additional_name: z.union([z.string(), z.null()]).optional(),
    legal_form: z.union([z.string(), z.null()]).optional(),
    date_of_incorporation: z.union([z.string(), z.null()]).optional(),
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
const PersonIdentityInput = z
  .object({
    partner_type: z.enum(["person_commercial", "person_private"]),
    full_name: z.string(),
    first_name: z.union([z.string(), z.null()]).optional(),
    last_name: z.union([z.string(), z.null()]).optional(),
    date_of_birth: z.string(),
    place_of_birth: z.union([z.string(), z.null()]).optional(),
    country: z.string().min(2).max(2),
    birth_name: z.union([z.string(), z.null()]).optional(),
    national_id: z.union([z.string(), z.null()]).optional(),
    registered_address: z.union([RegisteredAddressInput, z.null()]).optional(),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
    industry_code: z.union([z.string(), z.null()]).optional(),
    tax_id_vat: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const SoleTraderIdentityInput = z
  .object({
    partner_type: z.string(),
    legal_name: z.union([z.string(), z.null()]).optional(),
    legal_form: z.union([z.string(), z.null()]).optional(),
    first_name: z.union([z.string(), z.null()]).optional(),
    last_name: z.union([z.string(), z.null()]).optional(),
    full_name: z.union([z.string(), z.null()]).optional(),
    date_of_birth: z.union([z.string(), z.null()]).optional(),
    additional_name: z.union([z.string(), z.null()]).optional(),
    date_of_incorporation: z.union([z.string(), z.null()]).optional(),
    industry_code: z.union([z.string(), z.null()]).optional(),
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
      PersonIdentityInput,
      SoleTraderIdentityInput,
    ]),
  })
  .passthrough()
const PartnerType = z.enum([
  "legal_entity",
  "person_commercial",
  "person_private",
  "sole_trader",
])
const CandidateSummary = z
  .object({
    partner_id: z.string(),
    display_name: z.string(),
    partner_type: PartnerType,
    status: z.string(),
    matched_anchors: z.array(z.string()),
    confidence: z.string(),
    country: z.union([z.string(), z.null()]).optional(),
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
const PartnerAddressInput = z
  .object({
    label: z.string().min(1),
    street: z.string().min(2).max(50),
    house_number: z.union([z.string(), z.null()]).optional(),
    address_line_2: z.union([z.string(), z.null()]).optional(),
    country: z.string().min(2).max(2),
    postal_code: z.string().min(1),
    city: z.string().min(2).max(50),
    state_region: z.union([z.string(), z.null()]).optional(),
    is_default: z.boolean().optional().default(false),
  })
  .passthrough()
const LesseeCaptureRequest = z
  .object({
    addresses: z.array(PartnerAddressInput).max(20),
    dealer_numbers: z.array(z.string().regex(/^[0-9]{4}$/)).max(20),
    existing_partner_id: z.union([z.string(), z.null()]),
    identity: z.union([
      z.discriminatedUnion("partner_type", [
        LegalEntityIdentityInput,
        PersonIdentityInput,
        SoleTraderIdentityInput,
      ]),
      z.null(),
    ]),
    personennummer_os_plus: z.union([z.string(), z.null()]),
    keep_both: z.boolean().default(false),
    duplicate_note: z.union([z.string(), z.null()]),
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
const UboCompletenessStatus = z.enum(["missing", "partial", "complete"])
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
    additional_name: z.union([z.string(), z.null()]),
    legal_form: z.union([z.string(), z.null()]),
    date_of_incorporation: z.union([z.string(), z.null()]),
    country: z.string(),
    tax_id_vat: z.union([z.string(), z.null()]),
    lei: z.union([z.string(), z.null()]),
    commercial_register_no: z.union([z.string(), z.null()]),
    industry_code: z.union([z.string(), z.null()]),
    registered_address: z.union([RegisteredAddress, z.null()]),
    foreign_identifier: z.union([z.string(), z.null()]),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const PersonIdentityDetail = z
  .object({
    partner_type: z.enum(["person_commercial", "person_private"]),
    full_name: z.string(),
    first_name: z.union([z.string(), z.null()]),
    last_name: z.union([z.string(), z.null()]),
    date_of_birth: z.union([z.string(), z.null()]),
    place_of_birth: z.union([z.string(), z.null()]),
    country: z.string(),
    birth_name: z.union([z.string(), z.null()]),
    national_id: z.union([z.string(), z.null()]),
    industry_code: z.union([z.string(), z.null()]),
    registered_address: z.union([RegisteredAddress, z.null()]),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
    tax_id_vat: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const SoleTraderIdentityDetail = z
  .object({
    partner_type: z.string(),
    full_name: z.string(),
    date_of_birth: z.union([z.string(), z.null()]),
    legal_name: z.union([z.string(), z.null()]),
    additional_name: z.union([z.string(), z.null()]),
    legal_form: z.union([z.string(), z.null()]),
    date_of_incorporation: z.union([z.string(), z.null()]),
    industry_code: z.union([z.string(), z.null()]),
    country: z.string(),
    tax_id_vat: z.union([z.string(), z.null()]),
    commercial_register_no: z.union([z.string(), z.null()]),
    registered_address: z.union([RegisteredAddress, z.null()]),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
    first_name: z.union([z.string(), z.null()]).optional(),
    last_name: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const PartyDuplicateState = z.enum(["pending", "merged", "kept_apart", "none"])
const PartnerDetailResponse = z
  .object({
    partner_id: z.string(),
    display_name: z.string(),
    partner_type: PartnerType,
    status: z.string(),
    ubo_completeness_status: UboCompletenessStatus,
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityDetail,
      PersonIdentityDetail,
      SoleTraderIdentityDetail,
    ]),
    personennummer_os_plus: z.union([z.string(), z.null()]).optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    version: z.number().int(),
    duplicate_state: z.union([PartyDuplicateState, z.null()]).optional(),
    duplicate_pair_id: z.union([z.string(), z.null()]).optional(),
    open_case_count: z.union([z.number(), z.null()]).optional(),
    non_performing_contract_count: z.union([z.number(), z.null()]).optional(),
  })
  .passthrough()
const LesseeUnlinkResponse = z
  .object({
    contract_id: z.string().uuid(),
    lessee_partner_id: z.null().optional(),
  })
  .passthrough()
const GuarantorPreviewRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      PersonIdentityInput,
      SoleTraderIdentityInput,
    ]),
  })
  .passthrough()
const GuarantorAddRequest = z
  .object({
    existing_partner_id: z.union([z.string(), z.null()]),
    identity: z.union([
      z.discriminatedUnion("partner_type", [
        LegalEntityIdentityInput,
        PersonIdentityInput,
        SoleTraderIdentityInput,
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
const CollateralPreviewRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      PersonIdentityInput,
      SoleTraderIdentityInput,
    ]),
  })
  .passthrough()
const ContractCollateralType = z.enum([
  "GUARANTEE",
  "SECURITY_DEPOSIT",
  "BUY_BACK_AGREEMENT",
  "BANK_GUARANTEE",
  "CHATTEL_MORTGAGE",
  "RESIDUAL_VALUE_GUARANTEE",
  "LAND_CHARGE",
  "OTHER",
])
const CollateralAddRequest = z
  .object({
    addresses: z.array(PartnerAddressInput).max(20).optional(),
    dealer_numbers: z
      .array(z.string().regex(/^[0-9]{4}$/))
      .max(20)
      .optional(),
    collateral_type: ContractCollateralType,
    value: z.union([z.number(), z.string()]),
    evidence_document_id: z.union([z.string(), z.null()]).optional(),
    existing_partner_id: z.union([z.string(), z.null()]).optional(),
    identity: z
      .union([
        z.discriminatedUnion("partner_type", [
          LegalEntityIdentityInput,
          PersonIdentityInput,
          SoleTraderIdentityInput,
        ]),
        z.null(),
      ])
      .optional(),
    provider_name: z.union([z.string(), z.null()]).optional(),
    provider_street: z.union([z.string(), z.null()]).optional(),
    provider_house_number: z.union([z.string(), z.null()]).optional(),
    provider_postal_code: z.union([z.string(), z.null()]).optional(),
    provider_city: z.union([z.string(), z.null()]).optional(),
    keep_both: z.boolean().optional().default(false),
    duplicate_note: z.union([z.string(), z.null()]).optional(),
    personennummer_os_plus: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const app__modules__contracts__interfaces__http__schemas__collateral_schemas__CollateralResponse =
  z
    .object({
      collateral_id: z.string().uuid(),
      contract_id: z.string().uuid(),
      collateral_type: z.string(),
      value: z.union([z.string(), z.null()]),
      guarantor_partner_id: z.union([z.string(), z.null()]),
      evidence_document_id: z.union([z.string(), z.null()]),
      kind_of_obligation: z.union([z.string(), z.null()]),
      provider: z.union([CollateralProvider, z.null()]),
    })
    .passthrough()
const CollateralListItem = z
  .object({
    collateral_id: z.string().uuid(),
    collateral_type: z.string(),
    value: z.union([z.string(), z.null()]),
    guarantor_partner_id: z.union([z.string(), z.null()]),
    guarantor_display_name: z.union([z.string(), z.null()]),
    evidence_document_id: z.union([z.string(), z.null()]),
    evidence_document_name: z.union([z.string(), z.null()]),
    evidence_document_date: z.union([z.string(), z.null()]),
    provider: z.union([CollateralProvider, z.null()]),
    kind_of_obligation: z.union([z.string(), z.null()]),
  })
  .passthrough()
const CollateralListResponse = z
  .object({
    contract_id: z.string().uuid(),
    count: z.number().int(),
    collaterals: z.array(CollateralListItem),
  })
  .passthrough()
const CollateralRemoveRequest = z
  .object({ reason: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const Body_download_milk_error_report_api_v1_cases__case_id__contracts_milk_error_report_post =
  z.object({ file: z.string() }).passthrough()
const Body_validate_milk_delivery_api_v1_cases__case_id__contracts_milk_validate_post =
  z.object({ file: z.string() }).passthrough()
const MilkFindingItem = z
  .object({
    severity: z.string(),
    layer: z.string(),
    rule_reference: z.string(),
    sheet: z.string(),
    row: z.union([z.number(), z.null()]),
    field_heading: z.string(),
    delivered: z.string(),
    message: z.string(),
    accepted: z.array(z.string()),
    contract_number: z.string(),
  })
  .passthrough()
const MilkContractItem = z
  .object({
    row: z.number().int(),
    contract_number: z.string(),
    lessee_name: z.string(),
    contract_type: z.string(),
    term_months: z.union([z.number(), z.null()]),
    object_count: z.number().int(),
  })
  .passthrough()
const MilkValidationResponse = z
  .object({
    accepted: z.boolean(),
    rows_checked: z.number().int(),
    contracts_delivered: z.number().int(),
    error_count: z.number().int(),
    warning_count: z.number().int(),
    failed_row_count: z.number().int(),
    rows_that_passed: z.number().int(),
    errors: z.array(MilkFindingItem),
    warnings: z.array(MilkFindingItem),
    contracts: z.array(MilkContractItem),
  })
  .passthrough()
const Body_import_milk_delivery_api_v1_cases__case_id__contracts_milk_import_post =
  z.object({ file: z.string() }).passthrough()
const MilkImportResponse = z
  .object({
    contracts_created: z.number().int(),
    objects_created: z.number().int(),
    plans_created: z.number().int(),
    collaterals_created: z.number().int(),
    guarantees_not_written: z.number().int(),
  })
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
const ImportRowStatus = z.enum(["valid", "rejected", "committed"])
const status__3 = z.union([z.array(ImportRowStatus), z.null()]).optional()
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
const contract_status = z.union([ContractStatus, z.null()]).optional()
const ContractWorkSurfaceItem = z
  .object({
    id: z.string().uuid(),
    case_id: z.string().uuid(),
    case_reference: z.union([z.string(), z.null()]),
    leasing_company_contract_number: z.union([z.string(), z.null()]),
    short_name: z.union([z.string(), z.null()]),
    contract_type: z.union([z.string(), z.null()]),
    amortisation_type: z.union([z.string(), z.null()]),
    lessee_name: z.union([z.string(), z.null()]),
    contract_start: z.union([z.string(), z.null()]),
    term_months: z.union([z.number(), z.null()]),
    net_instalment: z.union([z.string(), z.null()]),
    contract_residual: z.union([z.string(), z.null()]),
    deferred_state: ContractDeferredState,
    contract_status: ContractStatus,
    first_object_description: z.union([z.string(), z.null()]).optional(),
    first_object_plate: z.union([z.string(), z.null()]).optional(),
    financing_reference: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const ContractWorkSurfaceResponse = z
  .object({ items: z.array(ContractWorkSurfaceItem), total: z.number().int() })
  .passthrough()
const UpdateMeRequest = z
  .object({
    first_name: z.union([z.string(), z.null()]),
    last_name: z.union([z.string(), z.null()]),
    phone_number: z.union([z.string(), z.null()]),
  })
  .partial()
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
  "financing_run_out",
  "case_reactivate",
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
const ModuleActivationResponse = z
  .object({
    action: GovernedActionResponse,
    module_key: z.string(),
    module_status: z.string(),
    pending_approval_note: z
      .string()
      .optional()
      .default(
        "Module activation is pending a second System Admin's approval (POST /governed-actions/{id}/approve). The module stays in 'pending_enforcement' and its routes answer 404 until approved. Track pending approvals at GET /governed-actions?status=pending."
      ),
  })
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
  "FINANCING",
  "CASE",
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
    matched_anchor: z.union([z.string(), z.null()]).optional(),
    matched_value: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const PairSideRoleResponse = z
  .object({
    role: z.string(),
    case_id: z.string().uuid(),
    case_reference: z.string(),
  })
  .passthrough()
const PairSideResponse = z
  .object({
    partner_id: z.string().uuid(),
    display_name: z.string(),
    partner_status: z.string(),
    roles: z.array(PairSideRoleResponse),
  })
  .passthrough()
const DuplicatePairResolutionResponse = z
  .object({
    pair: DuplicateCandidatePairResponse,
    sides: z.array(PairSideResponse),
  })
  .passthrough()
const DuplicateKeepApartRequest = z
  .object({ note: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const DuplicateResolutionResultResponse = z
  .object({ pair_id: z.string().uuid(), status: z.string() })
  .passthrough()
const DuplicateMergeRequest = z
  .object({
    survivor_partner_id: z.string().uuid(),
    note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const AssessmentAttributeResponse = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    value_type: z.string(),
    value_range: z.union([z.string(), z.null()]),
    scale_hint: z.union([z.string(), z.null()]),
  })
  .passthrough()
const AssessmentSourceTypeResponse = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    free_text_only: z.boolean(),
    attributes: z.array(AssessmentAttributeResponse),
  })
  .passthrough()
const AssessmentCatalogueResponse = z
  .object({ source_types: z.array(AssessmentSourceTypeResponse) })
  .passthrough()
const PartnerSubmitRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      PersonIdentityInput,
      SoleTraderIdentityInput,
    ]),
    personennummer_os_plus: z.union([z.string(), z.null()]).optional(),
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
const PartyAddressUpdate = z
  .object({
    label: z.string().min(1),
    street: z.string().min(2).max(50),
    house_number: z.union([z.string(), z.null()]).optional(),
    address_line_2: z.union([z.string(), z.null()]).optional(),
    country: z.string().min(2).max(2),
    postal_code: z.string().min(1),
    city: z.string().min(2).max(50),
    state_region: z.union([z.string(), z.null()]).optional(),
    is_default: z.boolean().optional().default(false),
    id: z.string().uuid(),
  })
  .passthrough()
const PartyEditRequest = z
  .object({
    version: z.number().int().gte(1),
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      PersonIdentityInput,
      SoleTraderIdentityInput,
    ]),
    personennummer_os_plus: z.union([z.string(), z.null()]).optional(),
    dealer_numbers: z
      .array(z.string().regex(/^[0-9]{4}$/))
      .max(20)
      .optional(),
    addresses_added: z.array(PartnerAddressInput).max(20).optional(),
    addresses_updated: z.array(PartyAddressUpdate).max(20).optional(),
    addresses_retired: z.array(z.string().uuid()).max(20).optional(),
  })
  .passthrough()
const OsPlusEditRequest = z
  .object({
    version: z.number().int().gte(1),
    personennummer_os_plus: z.union([z.string(), z.null()]).optional(),
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
const PartnerConnectionItem = z
  .object({
    object_type: z.string(),
    object_id: z.string(),
    label: z.string(),
    role: z.string(),
    case_id: z.string(),
    leasing_company_partner_id: z.union([z.string(), z.null()]),
    leasing_company_name: z.union([z.string(), z.null()]),
    status: z.string(),
  })
  .passthrough()
const PartnerConnectionsResponse = z
  .object({ partner_id: z.string(), items: z.array(PartnerConnectionItem) })
  .passthrough()
const PartnerRelationshipItem = z
  .object({
    id: z.string(),
    relationship_type: z.string(),
    direction: z.enum(["outgoing", "incoming"]),
    other_partner_id: z.string(),
    other_display_name: z.string(),
    share_percentage: z.union([z.string(), z.null()]),
    valid_from: z.union([z.string(), z.null()]),
    valid_to: z.union([z.string(), z.null()]),
    is_editable: z.boolean(),
  })
  .passthrough()
const PartnerRelationshipsResponse = z
  .object({ partner_id: z.string(), items: z.array(PartnerRelationshipItem) })
  .passthrough()
const PartnerRelationshipType = z.enum([
  "managing_director",
  "parent",
  "subsidiary",
  "shareholder",
])
const PartnerRelationshipCreateRequest = z
  .object({
    other_partner_id: z.string().uuid(),
    relationship_type: PartnerRelationshipType,
    direction: z.enum(["outgoing", "incoming"]).optional().default("incoming"),
    share_percentage: z.union([z.number(), z.string(), z.null()]).optional(),
    valid_from: z.union([z.string(), z.null()]).optional(),
    valid_to: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const PartnerDocumentsResponse = z
  .object({ partner_id: z.string(), items: z.array(PartnerDocumentItem) })
  .passthrough()
const Body_upload_partner_document_api_v1_partners__id__documents_post = z
  .object({
    document_type_code: z.string(),
    file: z.string(),
    document_date: z.union([z.string(), z.null()]).optional(),
    label: z.union([z.string(), z.null()]).optional(),
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
    ubo_completeness_status: UboCompletenessStatus,
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
const AffectedAgreementItem = z
  .object({
    framework_agreement_id: z.string(),
    agreement_name: z.string(),
    functions: z.array(z.string()),
  })
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
    used_by: z.array(AffectedAgreementItem).optional(),
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
const BankAccountCloseResponse = z
  .object({
    account: BankAccountResponse,
    affected_agreements: z.array(AffectedAgreementItem),
  })
  .passthrough()
const PartnerAddressResponse = z
  .object({
    id: z.string(),
    label: z.string(),
    street: z.union([z.string(), z.null()]),
    house_number: z.union([z.string(), z.null()]),
    address_line_2: z.union([z.string(), z.null()]),
    postal_code: z.union([z.string(), z.null()]),
    city: z.union([z.string(), z.null()]),
    state_region: z.union([z.string(), z.null()]),
    country: z.union([z.string(), z.null()]),
    is_default: z.boolean(),
    status: z.string(),
    created_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const PartnerAddressListResponse = z
  .object({ items: z.array(PartnerAddressResponse) })
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
    governed_action_id: z.union([z.string(), z.null()]),
    executed_by: z.string(),
    executed_at: z.string().datetime({ offset: true }),
    merge_reason_code: z.union([z.string(), z.null()]),
    reference_manifest: z.object({}).partial().passthrough(),
  })
  .passthrough()
const MergeHistoryResponse = z
  .object({
    partner_id: z.string(),
    items: z.array(MergeLineageRecordResponse),
  })
  .passthrough()
const AssessmentValueResponse = z
  .object({
    attribute_id: z.string(),
    attribute_code: z.string(),
    attribute_name: z.string(),
    value_number: z.union([z.string(), z.null()]),
    value_text: z.union([z.string(), z.null()]),
    no_value_supplied: z.boolean(),
  })
  .passthrough()
const AssessmentResponse = z
  .object({
    id: z.string(),
    partner_id: z.string(),
    source_type_id: z.string(),
    source_type_code: z.string(),
    source_type_name: z.string(),
    report_date: z.string(),
    source_reference: z.union([z.string(), z.null()]),
    case_id: z.union([z.string(), z.null()]),
    contract_id: z.union([z.string(), z.null()]),
    role: z.union([z.string(), z.null()]),
    context_note: z.union([z.string(), z.null()]),
    cancelled_at: z.union([z.string(), z.null()]),
    cancel_reason: z.union([z.string(), z.null()]),
    created_by: z.string(),
    created_by_name: z.union([z.string(), z.null()]).optional(),
    created_at: z.string().datetime({ offset: true }),
    values: z.array(AssessmentValueResponse),
  })
  .passthrough()
const AssessmentListResponse = z
  .object({ partner_id: z.string(), items: z.array(AssessmentResponse) })
  .passthrough()
const AssessmentValueInput = z
  .object({
    attribute_id: z.string(),
    value_number: z.union([z.number(), z.string(), z.null()]).optional(),
    value_text: z.union([z.string(), z.null()]).optional(),
    no_value_supplied: z.boolean().optional().default(false),
  })
  .passthrough()
const AssessmentCreateRequest = z
  .object({
    source_type_id: z.string(),
    report_date: z.string(),
    source_reference: z.union([z.string(), z.null()]).optional(),
    case_id: z.union([z.string(), z.null()]).optional(),
    contract_id: z.union([z.string(), z.null()]).optional(),
    role: z.union([z.string(), z.null()]).optional(),
    context_note: z.union([z.string(), z.null()]).optional(),
    values: z.array(AssessmentValueInput).optional(),
  })
  .passthrough()
const AssessmentCancelRequest = z
  .object({ reason: z.string().min(1).max(500) })
  .passthrough()
const PartnerMatchRequest = z
  .object({
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      PersonIdentityInput,
      SoleTraderIdentityInput,
    ]),
  })
  .passthrough()
const PartnerCaptureRequest = z
  .object({
    addresses: z.array(PartnerAddressInput).max(20).optional(),
    dealer_numbers: z
      .array(z.string().regex(/^[0-9]{4}$/))
      .max(20)
      .optional(),
    identity: z.discriminatedUnion("partner_type", [
      LegalEntityIdentityInput,
      PersonIdentityInput,
      SoleTraderIdentityInput,
    ]),
    personennummer_os_plus: z.union([z.string(), z.null()]).optional(),
    keep_both: z.boolean().optional().default(false),
    duplicate_note: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const PartnerCaptureResponse = z
  .object({
    partner_id: z.string().uuid(),
    is_new: z.boolean(),
    partner_status: z.string(),
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
const RegistryRole = z.enum([
  "leasing_company",
  "lessee",
  "guarantor",
  "supplier",
])
const PartnerListItem = z
  .object({
    partner_id: z.string(),
    display_name: z.string(),
    partner_type: PartnerType,
    status: z.string(),
    country: z.union([z.string(), z.null()]),
    ubo_completeness_status: UboCompletenessStatus,
    roles: z.array(z.string()),
    registered_address: z.union([RegisteredAddress, z.null()]).optional(),
    registry_id: z.string(),
    legal_form: z.union([z.string(), z.null()]).optional(),
    creditreform_no: z.union([z.string(), z.null()]).optional(),
    schufa_no: z.union([z.string(), z.null()]).optional(),
    os_plus_no: z.union([z.string(), z.null()]).optional(),
    dealer_numbers: z.array(z.string()).optional(),
    contracts_count: z.number().int().optional().default(0),
    registry_roles: z.array(RegistryRole).optional(),
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
const DuplicatePairListResponse = z
  .object({
    items: z.array(DuplicateCandidatePairResponse),
    total: z.number().int(),
  })
  .passthrough()
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
    measurement_basis: MeasurementBasis,
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
    measurement_basis: z.union([MeasurementBasis, z.null()]),
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
    measurement_basis: MeasurementBasis,
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
    refinancing_quota: z.union([z.string(), z.null()]).optional(),
    vfe_amount_eur: z.union([z.string(), z.null()]).optional(),
    max_volume_eur: z.union([z.string(), z.null()]).optional(),
    template_count: z.number().int().optional().default(0),
    committed_eur: z.union([z.string(), z.null()]).optional(),
    committed_request_count: z.union([z.number(), z.null()]).optional(),
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
    max_volume_eur: z.union([z.string(), z.null()]),
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
    refinancing_quota: z.union([z.string(), z.null()]),
    payout_account_id: z.union([z.string(), z.null()]),
    collection_account_id: z.union([z.string(), z.null()]),
    payout_account_iban: z.union([z.string(), z.null()]),
    collection_account_iban: z.union([z.string(), z.null()]),
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
  .object({
    id: z.string().uuid(),
    legal_name: z.string(),
    registered_address: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
  })
  .passthrough()
const FALCPartnersResponse = z
  .object({ items: z.array(FALCPartnerItem) })
  .passthrough()
const FAUtilizationResponse = z
  .object({
    max_volume_eur: z.union([z.string(), z.null()]),
    committed_eur: z.union([z.string(), z.null()]),
    committed_request_count: z.union([z.number(), z.null()]),
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
const FALinkedFinancingItem = z
  .object({
    id: z.string().uuid(),
    financing_reference: z.string(),
    kind: FinancingKind,
    contract_count: z.number().int(),
    payout_amount: z.union([z.string(), z.null()]),
    status: FinancingStatus,
    ended_reason: z.union([FinancingEndedReason, z.null()]).optional(),
  })
  .passthrough()
const FALinkedFinancingsResponse = z
  .object({
    count: z.number().int().default(0),
    items: z.array(FALinkedFinancingItem),
    page: z.number().int().default(1),
    per_page: z.number().int().default(25),
  })
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
    task_number_suffix: z.union([z.string(), z.null()]).optional(),
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
    is_decision_step: z.boolean(),
    is_no_way_back: z.boolean(),
    lists_open_duplicates: z.boolean(),
    blocked_by_open_duplicates: z.boolean(),
    completion_case_status_target: z.union([z.string(), z.null()]),
    completion_entity_targets: z.union([
      z.object({}).partial().passthrough(),
      z.null(),
    ]),
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
    is_decision_step: z.boolean().optional().default(false),
    is_no_way_back: z.boolean().optional().default(false),
    lists_open_duplicates: z.boolean().optional().default(false),
    blocked_by_open_duplicates: z.boolean().optional().default(false),
    completion_case_status_target: z.union([z.string(), z.null()]).optional(),
    completion_entity_targets: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
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
    task_number_suffix: z.union([z.string(), z.null()]).optional(),
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
    is_decision_step: z.boolean(),
    is_no_way_back: z.boolean(),
    lists_open_duplicates: z.boolean(),
    blocked_by_open_duplicates: z.boolean(),
    completion_case_status_target: z.union([z.string(), z.null()]),
    completion_entity_targets: z.union([
      z.object({}).partial().passthrough(),
      z.null(),
    ]),
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
    task_number_suffix: z.union([z.string(), z.null()]).optional(),
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
    is_decision_step: z.boolean(),
    is_no_way_back: z.boolean(),
    lists_open_duplicates: z.boolean(),
    blocked_by_open_duplicates: z.boolean(),
    completion_case_status_target: z.union([z.string(), z.null()]),
    completion_entity_targets: z.union([
      z.object({}).partial().passthrough(),
      z.null(),
    ]),
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
    is_decision_step: z.union([z.boolean(), z.null()]),
    is_no_way_back: z.union([z.boolean(), z.null()]),
    lists_open_duplicates: z.union([z.boolean(), z.null()]),
    blocked_by_open_duplicates: z.union([z.boolean(), z.null()]),
    completion_case_status_target: z.union([z.string(), z.null()]),
    completion_entity_targets: z.union([
      z.object({}).partial().passthrough(),
      z.null(),
    ]),
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
const ChecklistItemStatus = z.enum([
  "open",
  "done",
  "not_required",
  "not_available",
])
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
    phase_name: z.union([z.string(), z.null()]).optional(),
    phase_position: z.union([z.number(), z.null()]).optional(),
    task_number: z.union([z.number(), z.null()]).optional(),
    task_number_suffix: z.union([z.string(), z.null()]).optional(),
    stage_categorization: z
      .union([
        app__modules__workflow_task_catalog__domain__enums__StageCategorization,
        z.null(),
      ])
      .optional(),
    task_type: z.union([TaskType, z.null()]).optional(),
    applicability: z.union([TaskApplicability, z.null()]).optional(),
    condition_text: z.union([z.string(), z.null()]).optional(),
    responsible_role: z.union([TaskResponsibleRole, z.null()]).optional(),
    responsible_roles: z.union([z.array(UserRole), z.null()]).optional(),
    doc_requirement_ref: z.union([z.string(), z.null()]).optional(),
    four_eyes: z.boolean().optional().default(false),
    exclusion_source_task_ids: z
      .union([z.array(z.string()), z.null()])
      .optional(),
    is_decision_step: z.boolean().optional().default(false),
    is_no_way_back: z.boolean().optional().default(false),
    lists_open_duplicates: z.boolean().optional().default(false),
    blocked_by_open_duplicates: z.boolean().optional().default(false),
    completion_case_status_target: z.union([z.string(), z.null()]).optional(),
    completion_entity_targets: z
      .union([z.record(z.string(), z.string()), z.null()])
      .optional(),
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
const DocumentRoleScope = z.enum(["lessee", "guarantor", "case"])
const LcFileUploader = z.enum(["leasing_company", "bank"])
const LCObligationFile = z
  .object({
    file_name: z.union([z.string(), z.null()]).optional(),
    uploaded_at_utc: z.string().datetime({ offset: true }),
    uploaded_at_local: z.string().datetime({ offset: true }),
    uploaded_by: LcFileUploader,
    rejection_reason: z.union([z.string(), z.null()]).optional(),
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
    party: DocumentRoleScope.optional(),
    files: z.array(LCObligationFile).optional().default([]),
    file_count: z.number().int().optional().default(0),
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
    set_confirmed: z.boolean().optional().default(false),
    created_at: z.string().datetime({ offset: true }),
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
    review_status: z.string(),
    rejection_reason: z.union([z.string(), z.null()]).optional(),
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
    set_confirmed: z.boolean(),
    files: z.array(CaseDocumentFile),
  })
  .passthrough()
const CaseDocumentListResponse = z
  .object({ case_id: z.string().uuid(), documents: z.array(CaseDocumentRow) })
  .passthrough()
const RejectDocumentRequest = z
  .object({ reason: z.string().min(1).max(255) })
  .passthrough()
const MergeSourceResponse = z
  .object({
    document_id: z.string().uuid(),
    file_name: z.union([z.string(), z.null()]),
    group: z.string(),
    label: z.union([z.string(), z.null()]),
    is_pdf: z.boolean(),
  })
  .passthrough()
const MergeSourcesResponse = z
  .object({ case_id: z.string().uuid(), sources: z.array(MergeSourceResponse) })
  .passthrough()
const MergeDocumentsRequest = z
  .object({ document_ids: z.array(z.string().uuid()).max(500) })
  .partial()
  .passthrough()
const MiscDocumentListResponse = z
  .object({
    case_id: z.string().uuid(),
    documents: z.array(MiscDocumentResponse),
  })
  .passthrough()
const Body_add_case_misc_document_api_v1_cases__case_id__documents_misc_post = z
  .object({
    file: z.string(),
    document_type_code: z.union([z.string(), z.null()]).optional(),
    document_label: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const UpdateMiscDocumentRequest = z
  .object({
    document_type_code: z.union([z.string(), z.null()]),
    document_label: z.union([z.string(), z.null()]),
  })
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
    locked_type_codes: z.array(z.string()).optional().default([]),
  })
  .passthrough()
const Body_upload_calculation_data_sheet_api_v1_cases__case_id__generated_documents_calculation_data_sheet_post =
  z.object({ file: z.string() }).passthrough()
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
const IndustryClassResponse = z
  .object({ code: z.string(), de: z.string(), en: z.string() })
  .passthrough()
const Wz2008Response = z
  .object({ items: z.array(IndustryClassResponse) })
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
  CaseType,
  CaseStatus,
  RequestStatus,
  FinancingStatus,
  CaseDisplayStatus,
  CasePrimaryEntity,
  CaseOrigin,
  CaseListItem,
  DashboardResponse,
  CaseLeasingCompanyOption,
  CaseLeasingCompaniesResponse,
  LeasingCompanyResolutionResponse,
  StartCaseRequest,
  CaseResponse,
  case_type,
  status,
  assignee_id,
  waiting_on_role,
  CaseListResponse,
  AssignCaseRequest,
  DecideRequestRequest,
  SubmitResultResponse,
  CaseLeasingCompanyResponse,
  CaseProductTemplateResponse,
  ReviewContractItem,
  ReviewFinancingSummary,
  CaseReviewResponse,
  CaseDataFinancingBlock,
  CaseDataResponse,
  RecordDeviationRequest,
  DeviationResponse,
  DeviationListResponse,
  CancelCaseRequest,
  GovernedActionStatus,
  PendingApprovalResponse,
  BindLeasingCompanyRequest,
  BindProductTemplateRequest,
  CaseDetailResponse,
  CaseActivityChange,
  CaseActivityItem,
  CaseActivityResponse,
  RedemptionStatus,
  RedemptionListItem,
  RedemptionListResponse,
  RedemptionCaptureRequest,
  RedemptionResponse,
  CaseDuplicateFlagParty,
  CaseDuplicateFlag,
  CaseDuplicateFlagsResponse,
  KeepBothRequest,
  DuplicateResolutionResponse,
  MergeDuplicateRequest,
  PartyMatchItem,
  CasePartyMatchResponse,
  CommentRefType,
  CommentVisibility,
  CaseCommentItem,
  CaseCommentListResponse,
  AddCaseCommentRequest,
  EditCaseCommentRequest,
  status__2,
  LcCaseListItem,
  LcCaseListResponse,
  LcCaseDetailResponse,
  LcCommentNotificationItem,
  LcCommentNotificationListResponse,
  LcPortalSummaryResponse,
  LcCaseReviewResponse,
  LcWithdrawalNoticeRequest,
  FinancingKind,
  CalculationBlocker,
  CalculationBlockerRead,
  CalculationStaleCause,
  MeasurementBasis,
  RefinancingForm,
  ScheduleLineResponse,
  ExcludedPaymentResponse,
  DiscountingRowResponse,
  CalculationResultResponse,
  FinancingEndedReason,
  FinancingRead,
  CalculatePreviewRequest,
  calculate_case_financing_api_v1_cases__case_id__financing_calculate_post_Body,
  RunOutRequest,
  RecordLoanValuesRequest,
  UpdateTermsRequest,
  CorrectSettlementRequest,
  AddApprovalConditionRequest,
  ApprovalConditionState,
  ApprovalConditionResponse,
  ApprovalConditionListResponse,
  WaiveConditionRequest,
  FinancingComponentResponse,
  FinancingComponentListResponse,
  PaymentPlanRowType,
  PaymentPlanEntryResponse,
  PlanCoverageResponse,
  PaymentPlanResponse,
  ManualPlanRowRequest,
  SetManualPlanRequest,
  FinancingFilterOption,
  FinancingFilterOptionsResponse,
  FinancingListItem,
  FinancingListResponse,
  FinancingTabCounts,
  FinancingBalanceRead,
  RepaymentRowRead,
  RepaymentRead,
  ContractShareRead,
  FinancingDetailRead,
  UpdateMaintainedValuesRequest,
  MiscDocumentResponse,
  FinancingDocumentListResponse,
  FinancingDocumentType,
  Body_add_financing_document_api_v1_financings__financing_id__documents_post,
  DocumentRowType,
  DocumentRowSource,
  DocumentOwnerKind,
  DocumentOwnerRead,
  DocumentManagedOn,
  DocumentRowRead,
  DocumentRowListResponse,
  Body_upload_financing_document_row_api_v1_financings__financing_id__document_rows_post,
  UpdateFinancingDocumentRequest,
  CollateralProvider,
  FinancingSecurityItem,
  FinancingSecuritiesResponse,
  CollateralType,
  CollateralEvidenceItem,
  CollateralRecheckState,
  CollateralDecisionBlock,
  CollateralValueItem,
  app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
  SetCollateralTypeRequest,
  SetCollateralTotalRequest,
  Body_add_financing_collateral_evidence_api_v1_financings__financing_id__collateral_evidence_post,
  RedetermineCollateralRequest,
  PortalFinancingStatus,
  LcFinancingListItem,
  LcFinancingListResponse,
  LcFinancingAgreementOption,
  LcFinancingAgreementOptionsResponse,
  PortalDocumentTypeItem,
  PortalDocumentTypesResponse,
  Body_upload_portal_partner_document_api_v1_lc_partners__id__documents_post,
  PartnerDocumentItem,
  ContractDeferredState,
  deferred_state,
  ContractStatus,
  PerformanceStatus,
  ContractCompleteness,
  ContractListItem,
  ContractListResponse,
  ContractType,
  AmortisationType,
  InstalmentFrequency,
  PaymentMethod,
  PaymentMode,
  ContractCreate,
  ContractRead,
  PackageTotalsRead,
  BulkRemoveRequest,
  BulkRemoveResponse,
  ContractFilterOption,
  ContractFilterOptionsResponse,
  ContractRecordRef,
  ContractRecordFinancing,
  ContractRecordState,
  ContractRecordFigures,
  ContractEditLock,
  ContractRecordEditable,
  ContractRecordRead,
  ContractEdit,
  MarkNonPerforming,
  ContractRemove,
  ContractDefer,
  defer_contract_api_v1_contracts__contract_id__defer_post_Body,
  ObjectSubGroupItem,
  ObjectGroupItem,
  ObjectClassificationResponse,
  LeaseCashFlowUnavailable,
  LeasePaymentStatus,
  LeaseCashFlowRowRead,
  LeaseCashFlowRead,
  LoanPaymentPlanUnavailable,
  LoanPlanFinancingRead,
  LoanPlanBankDetailsRead,
  LoanPaymentPlanRead,
  DirectDebitReturnReason,
  DirectDebitReturnStatus,
  DirectDebitReturnRead,
  DirectDebitReturnListResponse,
  DirectDebitReturnCreate,
  DirectDebitReturnResolve,
  LeaseObjectRead,
  LeaseObjectListResponse,
  NewOrUsed,
  MarketValueIndicator,
  DATEvidenceStatus,
  ObjectLocation,
  RegistrationPartTwoStatus,
  InsuranceProofStatus,
  DuplicateCheckStatus,
  LeaseObjectCreate,
  LeaseObjectEdit,
  LeaseObjectRemove,
  RegisteredAddressInput,
  LegalEntityIdentityInput,
  PersonIdentityInput,
  SoleTraderIdentityInput,
  LesseePreviewRequest,
  PartnerType,
  CandidateSummary,
  PartnerMatchResponse,
  PartnerAddressInput,
  LesseeCaptureRequest,
  LesseeLinkResponse,
  UboCompletenessStatus,
  RegisteredAddress,
  LegalEntityIdentityDetail,
  PersonIdentityDetail,
  SoleTraderIdentityDetail,
  PartyDuplicateState,
  PartnerDetailResponse,
  LesseeUnlinkResponse,
  GuarantorPreviewRequest,
  GuarantorAddRequest,
  GuarantorLinkResponse,
  GuarantorListItem,
  GuarantorListResponse,
  GuarantorRemoveRequest,
  CollateralPreviewRequest,
  ContractCollateralType,
  CollateralAddRequest,
  app__modules__contracts__interfaces__http__schemas__collateral_schemas__CollateralResponse,
  CollateralListItem,
  CollateralListResponse,
  CollateralRemoveRequest,
  Body_download_milk_error_report_api_v1_cases__case_id__contracts_milk_error_report_post,
  Body_validate_milk_delivery_api_v1_cases__case_id__contracts_milk_validate_post,
  MilkFindingItem,
  MilkContractItem,
  MilkValidationResponse,
  Body_import_milk_delivery_api_v1_cases__case_id__contracts_milk_import_post,
  MilkImportResponse,
  Body_upload_contract_import_api_v1_cases__case_id__contracts_import_post,
  ImportBatchResponse,
  ImportRowStatus,
  status__3,
  ImportRowItem,
  ImportBatchPreviewResponse,
  ImportCommitResponse,
  contract_status,
  ContractWorkSurfaceItem,
  ContractWorkSurfaceResponse,
  UpdateMeRequest,
  app__modules__users__interfaces__http__schemas__user_schemas__UserRef,
  UserDetailResponse,
  UserMePermissionsResponse,
  AccessReason,
  GrantStatus,
  SupportGrantResponse,
  Body_upload_picture_api_v1_users_me_picture_post,
  UserListItem,
  PaginatedUsersResponse,
  InviteUserRequest,
  EditUserRequest,
  ChangeEmailRequest,
  GovernedActionType,
  GovernedActionResponse,
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
  ModuleActivationResponse,
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
  MatchingEvidenceItem,
  DuplicateCandidatePairResponse,
  PairSideRoleResponse,
  PairSideResponse,
  DuplicatePairResolutionResponse,
  DuplicateKeepApartRequest,
  DuplicateResolutionResultResponse,
  DuplicateMergeRequest,
  AssessmentAttributeResponse,
  AssessmentSourceTypeResponse,
  AssessmentCatalogueResponse,
  PartnerSubmitRequest,
  PartnerSubmitResponse,
  PartyAddressUpdate,
  PartyEditRequest,
  OsPlusEditRequest,
  ResolutionEventSummary,
  ResolutionCandidatesResponse,
  ActorSummary,
  RoleAssignmentSummary,
  RoleHistoryEntry,
  PartnerRolesResponse,
  PartnerConnectionItem,
  PartnerConnectionsResponse,
  PartnerRelationshipItem,
  PartnerRelationshipsResponse,
  PartnerRelationshipType,
  PartnerRelationshipCreateRequest,
  PartnerDocumentsResponse,
  Body_upload_partner_document_api_v1_partners__id__documents_post,
  UboOwnershipRequest,
  UboOwnershipRecordResponse,
  PartnerUboResponse,
  LcNumberResponse,
  LcNumberListResponse,
  LcNumberCreateRequest,
  AffectedAgreementItem,
  BankAccountResponse,
  BankAccountListResponse,
  BankAccountCreateRequest,
  BankAccountCloseResponse,
  PartnerAddressResponse,
  PartnerAddressListResponse,
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
  AssessmentValueResponse,
  AssessmentResponse,
  AssessmentListResponse,
  AssessmentValueInput,
  AssessmentCreateRequest,
  AssessmentCancelRequest,
  PartnerMatchRequest,
  PartnerCaptureRequest,
  PartnerCaptureResponse,
  PartnerStatus,
  RegistryRole,
  PartnerListItem,
  PartnerListResponse,
  DuplicatePairListResponse,
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
  FALinkedFinancingItem,
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
  DocumentRoleScope,
  LcFileUploader,
  LCObligationFile,
  LCObligationItem,
  LCObligationResponse,
  LinkDocumentRequest,
  FulfilmentResponse,
  PerRequirementStatusResponse,
  CompletenessResponse,
  Body_upload_case_document_api_v1_cases__case_id__documents_post,
  CaseDocumentFile,
  CaseDocumentRow,
  CaseDocumentListResponse,
  RejectDocumentRequest,
  MergeSourceResponse,
  MergeSourcesResponse,
  MergeDocumentsRequest,
  MiscDocumentListResponse,
  Body_add_case_misc_document_api_v1_cases__case_id__documents_misc_post,
  UpdateMiscDocumentRequest,
  GeneratedDocumentRow,
  GeneratedDocumentListResponse,
  Body_upload_calculation_data_sheet_api_v1_cases__case_id__generated_documents_calculation_data_sheet_post,
  DocumentTypeOrigin,
  CreateDocumentTypeRequest,
  DocumentTypeResponse,
  origin,
  role_scope,
  DocumentTypeListResponse,
  UpdateDocumentTypeRequest,
  DocumentTypeMatrixRow,
  DocumentTypeMatrixResponse,
  IndustryClassResponse,
  Wz2008Response,
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
        schema: assignee_id,
      },
      {
        name: "action_type",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "event_type",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "entity_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "actor_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "actor_type",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "trigger_source",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "sensitive",
        type: "Query",
        schema: module_active,
      },
      {
        name: "from_dt",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "to_dt",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "event_type",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "actor_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "actor_type",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "trigger_source",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "sensitive",
        type: "Query",
        schema: module_active,
      },
      {
        name: "from_dt",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "to_dt",
        type: "Query",
        schema: assignee_id,
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
design decision and not a scope one.

&#x60;&#x60;assignee_id&#x60;&#x60; filters to one colleague&#x27;s cases (US 1.52). It is the explicit form of &#x60;&#x60;mine&#x60;&#x60;
(which is the caller&#x27;s own id); an explicit &#x60;&#x60;assignee_id&#x60;&#x60; wins over &#x60;&#x60;mine&#x60;&#x60;. The tenant scope
is enforced in the repository query, so an id from another tenant simply matches nothing.

&#x60;&#x60;waiting_on_role&#x60;&#x60; answers &quot;whose action is this case waiting for&quot; — the responsible-role set
of the case&#x27;s currently-open checklist step (US 1.52). It is a different question from
&#x60;&#x60;domain/waiting.py&#x60;&#x60;&#x27;s &#x60;&#x60;WaitingOn&#x60;&#x60;, which is bank-vs-leasing-company and derived from the
request status; this one is front-office-vs-back-office and reads the checklist. A case with no
open step, or whose open step carries no role set, matches neither role.`,
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
        name: "assignee_id",
        type: "Query",
        schema: assignee_id,
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
        name: "waiting_on_role",
        type: "Query",
        schema: waiting_on_role,
      },
      {
        name: "search",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "lc_partner_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "initiated_by",
        type: "Query",
        schema: waiting_on_role,
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
    method: "post",
    path: "/api/v1/cases/:business_object_id/checklist/items/:item_id/undo",
    alias:
      "undo_item_api_v1_cases__business_object_id__checklist_items__item_id__undo_post",
    description: `US 1.46 — Take back the last resolved checklist step (return it to OPEN). One step at a time,
blocked past a no-way-back step, and refused on a closed case (409). A step that closed DONE has
its status moves reversed with it (US-1.115); a carrier that moved on since refuses the undo (409
&#x60;WTC_CHECKLIST_UNDO_MOVES_DIVERGED&#x60;). FO/BO, non-disclosure 404 like the rest of the runtime.`,
    requestFormat: "json",
    parameters: [
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
    response: CaseDetailResponse,
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
    description: `US 1.28 (PRD1042-1944), US-1.114 — the case&#x27;s Activity trail, newest first.

Read through the case (no separate history surface): every action on the case — case-level,
checklist runtime, DAT data, redemption, the case&#x27;s contracts and its financing — in one
chronological stream. Sensitive values arrive masked (AC5). A missing or cross-tenant case is
404 (non-disclosure, in the service); a role with no path to the Activity area is 404 (the
gate). An actor name missing from an older audit row is resolved onto the response only — the
stored audit rows are never touched.`,
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

Thin wrapper: role-gated (Front / Back Office — anyone else is refused as not-found; the leasing
company does not cancel, it discards its own draft — &#x60;&#x60;POST /lc/cases/{id}/discard&#x60;&#x60;, P30-33),
tenant-scoped (a cross-tenant or unknown case is
404), then hands off to the service. The reason is mandatory, 1–255 (422 otherwise; US-1.90, D1,
F3) and goes into the audit entry. A closed case — cancelled, or its request rejected or cancelled
— is refused (409 &#x60;&#x60;CASE_NOT_CANCELLABLE&#x60;&#x60;, F4), as is a done one (the state machine refuses the
move). No four-eyes.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1).max(255) }).passthrough(),
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
    path: "/api/v1/cases/:case_id/comments",
    alias: "list_case_comments_api_v1_cases__case_id__comments_get",
    description: `The case&#x27;s comment thread, newest first (PRD1042-1893 item 18; US-1.113, rule 06 AC3).

Correspondence lives as a comment thread on the case: the channel through which the bank tells
the leasing company what is missing, and the LC answers — in the manner of a ticketing tool. The
LC reads (and writes) on its OWN case only (tenant + company scoping through the case itself);
every other role answers 404. An LC reader never receives an internal comment.
&#x60;&#x60;has_unseen_bank_comment&#x60;&#x60; tells a leasing-company reader that the bank left it a comment it
has not marked as seen (US-1.113, AC1); it is always false for the bank.`,
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
        schema: z.number().int().gte(1).lte(200).optional().default(100),
      },
    ],
    response: CaseCommentListResponse,
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
    path: "/api/v1/cases/:case_id/comments",
    alias: "add_case_comment_api_v1_cases__case_id__comments_post",
    description: `Add a comment to the case thread (PRD1042-1893 item 18).

Both sides write: the bank (front / back office) and the leasing company on its own case. Each
comment records the author&#x27;s role at the time, so the reader sees which side spoke. Audited
(&#x60;&#x60;CASE_COMMENT_ADDED&#x60;&#x60;).

**Visibility (US 1.53 part 1, PO answer A4):** &#x60;visibility&#x60; defaults to &#x60;INTERNAL&#x60; — bank-only,
never served to a leasing-company user. Making a comment &#x60;EXTERNAL&#x60; is an explicit choice. An LC
author is pinned to &#x60;EXTERNAL&#x60; in the service whatever it sends, so the customer cannot write a
comment its own side would never see.

**Notification (US-1.113, AC1):** a bank comment addressed to the leasing company notifies it in
app (&#x60;&#x60;GET /lc/comment-notifications&#x60;&#x60; and the thread&#x27;s &#x60;&#x60;has_unseen_bank_comment&#x60;&#x60;) and records a
System entry &#x60;&#x60;CASE_LC_NOTIFIED_OF_COMMENT&#x60;&#x60;. No e-mail. An LC comment notifies nobody.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddCaseCommentRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/cases/:case_id/comments/:comment_id",
    alias:
      "edit_case_comment_api_v1_cases__case_id__comments__comment_id__patch",
    description: `Edit a comment on the case thread (US-1.61) — **author only**.

Only the comment&#x27;s own author may edit it; a non-owner (even one who may read the case) is
refused with 403. The body is rewritten and an &#x60;&#x60;edited_at&#x60;&#x60; marker is stamped; visibility and
authorship never change. A soft-deleted comment cannot be edited (409). Audited
(&#x60;&#x60;CASE_COMMENT_EDITED&#x60;&#x60;).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ body: z.string().min(1).max(2000) }).passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/cases/:case_id/comments/:comment_id",
    alias:
      "delete_case_comment_api_v1_cases__case_id__comments__comment_id__delete",
    description: `Soft-delete a comment on the case thread (US-1.61) — **author only**.

A delete does NOT remove the comment from the thread. The row stays in place and in order as a
tombstone (&#x60;&#x60;body&#x60;&#x60; cleared, &#x60;&#x60;deleted_at&#x60;&#x60; / &#x60;&#x60;deleted_by&#x60;&#x60; stamped) so the trace survives —
a GDPR-safe record that a comment existed and was removed, never a hole. Only the author may
delete; a non-owner is refused (403); a second delete is refused (409). The tombstoned item is
returned (200, not 204) because the FE keeps rendering the row. Audited
(&#x60;&#x60;CASE_COMMENT_DELETED&#x60;&#x60;).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/cases/:case_id/comments/seen",
    alias: "mark_case_comments_seen_api_v1_cases__case_id__comments_seen_post",
    description: `**Mark as seen** (US-1.113, rule 06 §4.4.1, AC1) — leasing company only.

The user has read the bank&#x27;s comments on its own case: the Comments-tab banner and the bell
entry go until the bank addresses a newer comment to it. Per user, so a colleague&#x27;s notification
stays. Idempotent. Any bank role, or another company&#x27;s case, answers 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
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
    path: "/api/v1/cases/:case_id/contracts",
    alias: "list_contracts_api_v1_cases__case_id__contracts_get",
    description: `The contracts of a request (paged, optionally filtered to one import run or deferred state).

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
        schema: assignee_id,
      },
      {
        name: "deferred_state",
        type: "Query",
        schema: deferred_state,
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
      {
        name: "sort",
        type: "Query",
        schema: assignee_id,
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
    description: `A contract&#x27;s ordered payment plan, and its Financing Component when the case has one
(PRD1042-1927, US 1.11; readable during intake since PRD1042-2262, when &#x60;component&#x60; is null).`,
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

The catch-all for irregular structures; a MANUAL plan is never regenerated from terms (R2).

**Writable during case intake** (PRD1042-2262) — this is what the wizard&#x27;s Payment plan tab calls,
before the case is committed and a financing exists. Refused (409) once the financing is frozen,
or, before there is one, once the request has left DRAFT. FO + BO; tenant-scoped → 404.`,
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
rest. No duplicate count is shown (repeat detection is undecided — 1920-OQ-02). &#x60;&#x60;status&#x60;&#x60; filters the
paged rows server-side, so a tab of the dialog pages through every row of its kind (BUG-140).`,
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
      {
        name: "status",
        type: "Query",
        schema: status__3,
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
(matched, never created blind — a duplicate hit flags the party and never rejects the row) and becomes a
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
    method: "post",
    path: "/api/v1/cases/:case_id/contracts/milk/error-report",
    alias:
      "download_milk_error_report_api_v1_cases__case_id__contracts_milk_error_report_post",
    description: `The error report for a MILK delivery, as a print-ready PDF.

On rejection the submitter receives an error report as a **separate file**, not a message on the
screen (§6). Per finding it carries the sheet, the row as it appears in the submitter&#x27;s own
workbook, the field under its workbook heading, the delivered value, a reason written for the
person correcting the file, the rule reference and the severity — and, for a value-list finding,
what would have been accepted, so nobody has to open the template to find out.

Findings are grouped by sheet, then by row, because that is how a file is corrected: the row is
opened once and everything in it is fixed at once. Warnings are reported in their own section
and the report states they did not cause the rejection.

The workbook is posted again rather than referenced, because nothing was kept from the check
(§7). That is what the prototype does — it holds the file client-side and sends it when the
download is clicked — and it is the only option that does not create the trace §7 denies.`,
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
    path: "/api/v1/cases/:case_id/contracts/milk/import",
    alias:
      "import_milk_delivery_api_v1_cases__case_id__contracts_milk_import_post",
    description: `Import an accepted MILK workbook into the request as contracts (MILK Phase 6).

The commit half of the upload. The delivery is **re-validated here** rather than trusted: the
check stores no trace (§7), so there is no server-side verdict to carry forward, and a caller
asserting that its file passed would make the check advisory. A delivery that does not pass is
refused whole with 422 and nothing is written — all-or-nothing is decided at file level (§5).

Each row becomes a contract through the same service manual entry uses, with its objects attached
by the object-list rule: the list where a contract has one, otherwise the single object on its own
row. Contracts are stamped &#x60;bulk_file&#x60;, the same provenance the US-1.5 import uses.

**An imported contract arrives without its lessee** and therefore reads *incomplete*, exactly as a
manually added one does before its party is captured. Whether the import should resolve the party
itself is Q-079; until it is answered, leaving it empty invents nothing. Gate 1 holds the request
back until every contract has one, so the capture is deferred rather than skipped.

**No payment plan is written**, even when &#x60;Staffelraten&#x60; is delivered: an instalment needs a due
date, and the timing convention, what &#x60;Laufzeit N&#x60; counts and where the residual falls are all
unsettled. **No collateral is written**: five of MILK&#x27;s eight types have no equivalent, and
importing only the three that map would silently drop declared security.

Same window and roles as manual capture — MILK introduces no permission of its own (§1).`,
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
    response: MilkImportResponse,
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
    path: "/api/v1/cases/:case_id/contracts/milk/validate",
    alias:
      "validate_milk_delivery_api_v1_cases__case_id__contracts_milk_validate_post",
    description: `Check a MILK workbook against the Sparkasse M rules and answer. Nothing is imported or stored.

The MILK bulk upload hands a filled workbook over and the answer comes back: validation runs here,
never in the interface, which is what makes the rule set enforceable (§2.2). Four sheets, joined on
the contract number, checked through layers A–J — file, structure, row shape, type, format, value
list, mandatory, conditional, uniqueness and cross-sheet. Layers A and B refuse the whole delivery
before a single row is read.

The outcome is decided for the FILE, not the row: one error anywhere means the delivery is refused
including the rows that passed (§5). Warnings are reported apart and never refuse a file.

**Nothing is written** — no batch, no stored file, no audit row. §7 is explicit that a failed
attempt leaves no trace and the corrected file is re-uploaded whole, so staging one here would
create the very trace the specification says does not exist. Whether an *accepted* delivery should
leave an Upload Request record is Q-080 and is not answered here.

&#x60;accepted: true&#x60; means the file would be acceptable, not that anything was imported: the commit
step is blocked on the party decision (Q-079) and on twelve MILK columns that have no field in the
contract record (BUG-059). FO + BO (on the company&#x27;s behalf) + the LC user for its own company; the
same window and roles as manual capture, because MILK introduces no permission of its own (§1).`,
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
    response: MilkValidationResponse,
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
    method: "get",
    path: "/api/v1/cases/:case_id/data",
    alias: "read_case_data_api_v1_cases__case_id__data_get",
    description: `The case Data area — the captured data grouped by field block (PRD1042-1938, US 1.22).

The wizard is intake; this is where the data lives and is corrected. Only the blocks whose capture
exists today are populated (leasing company, lessee + contracts, financing); the unbuilt
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
    method: "post",
    path: "/api/v1/cases/:case_id/documents",
    alias: "upload_case_document_api_v1_cases__case_id__documents_post",
    description: `Upload one file against a requirement of the case (201) — the bank and the leasing company.

The leasing company reaches only its own company&#x27;s cases (another&#x27;s answers 404) and only the
requirements on its list: a requirement the **bank generates** answers **404** and nothing is stored
(P30-34, client round 2 point 7). MIME whitelist, magic bytes and size cap as every case document.`,
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
business timezone (Europe/Berlin, no zone label, R6). For the leasing company the list leaves out
requirements whose document the **bank generates** (the calculation data sheet, the loan offer, …) —
so its wizard and its submission gate never count one as missing (P30-34 follow-up); the bank&#x27;s list
keeps them.`,
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
    method: "post",
    path: "/api/v1/cases/:case_id/documents/:requirement_definition_id/confirm-set",
    alias:
      "confirm_case_document_set_api_v1_cases__case_id__documents__requirement_definition_id__confirm_set_post",
    description: `The front office confirms this requirement&#x27;s file set is complete (PRD1042-2263).

A bank-side confirmation on a SEPARATE axis from the per-file review state — a requirement can be
PRESENT (files arrived, not yet checked) and set-confirmed at once. Idempotent; a later upload or
withdrawal resets it. The leasing company never confirms a set (refused as not-found). Thin
wrapper over the fulfilment service.`,
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
    method: "delete",
    path: "/api/v1/cases/:case_id/documents/:requirement_definition_id/files/:document_id",
    alias:
      "remove_case_document_file_api_v1_cases__case_id__documents__requirement_definition_id__files__document_id__delete",
    description: `Withdraw ONE filed document from a requirement (US 1.44 follow-up).

Per FILE, not per requirement: a requirement can hold several documents, so a single remove on
the row would have no defensible target. The same pair of permissions as the upload — whoever may
file may take their filing back — and a leasing company takes back only what its own company filed:
a bank file on its case answers 404 (BUG-111). Same tenant/LC scoping, so a case the caller cannot
see answers not-found.

Refused (422) once the bank has CHECKED the document: that is evidence the bank accepted, and
withdrawing it would change the case&#x27;s evidence after a completed review. Allowed while &#x60;present&#x60;
or &#x60;invalid&#x60;.

A soft remove — the row and its bytes stay for audit, and every live projection filters them out.
Returns the WHOLE refreshed list so the caller re-renders from the server&#x27;s truth rather than
guessing what the withdrawal did to the row&#x27;s state (the last file going takes it back to
&#x60;missing&#x60;).`,
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
      {
        name: "document_id",
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
    method: "post",
    path: "/api/v1/cases/:case_id/documents/:requirement_definition_id/files/:document_id/check",
    alias:
      "check_case_document_file_api_v1_cases__case_id__documents__requirement_definition_id__files__document_id__check_post",
    description: `The bank confirms ONE filed document is the right one (US-1.109, rule 06 DC6). Returns the
requirement&#x27;s re-derived state (DC5).

Both bank roles (&#x60;&#x60;doc.check&#x60;&#x60;), no four eyes on the single file — the whole-set sign-off at step
16 keeps its own. The leasing company never checks (not found). A file that is not awaiting review
→ 409 &#x60;&#x60;DOCUMENT_ALREADY_REVIEWED&#x60;&#x60;; a file not filed on this requirement → 404.`,
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
      {
        name: "document_id",
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
    path: "/api/v1/cases/:case_id/documents/:requirement_definition_id/files/:document_id/reject",
    alias:
      "reject_case_document_file_api_v1_cases__case_id__documents__requirement_definition_id__files__document_id__reject_post",
    description: `The bank rejects ONE filed document with a mandatory reason (US-1.109, rule 06 DC6, DC7).
Returns the requirement&#x27;s re-derived state (DC5). The reason (1–255) is kept on the file and
recorded in the case&#x27;s Activity trail. Same roles and refusals as Check.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1).max(255) }).passthrough(),
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
      {
        name: "document_id",
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
    path: "/api/v1/cases/:case_id/documents/merge",
    alias: "merge_case_documents_api_v1_cases__case_id__documents_merge_post",
    description: `Merge the picked PDFs into one, filed under Miscellaneous as &#x60;&#x60;merged_bundle_NN.pdf&#x60;&#x60; (type
&quot;Merged bundle&quot;); the caller downloads it from the returned &#x60;&#x60;document_id&#x60;&#x60;. Front Office only.
422: nothing picked (&#x60;&#x60;DOCUMENT_MERGE_NOTHING_SELECTED&#x60;&#x60;), a pick that is not a source of this case
or is a bundle (&#x60;&#x60;…_SOURCE_NOT_ALLOWED&#x60;&#x60;), not a PDF (&#x60;&#x60;…_SOURCE_NOT_PDF&#x60;&#x60;) or unreadable
(&#x60;&#x60;…_SOURCE_UNREADABLE&#x60;&#x60;).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MergeDocumentsRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MiscDocumentResponse,
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
    path: "/api/v1/cases/:case_id/documents/merge-sources",
    alias:
      "list_merge_sources_api_v1_cases__case_id__documents_merge_sources_get",
    description: `The documents the merge modal offers (US-1.110, rule 06 §5.5): Generated, Filed against a
requirement and Miscellaneous, each flagged PDF or not. Merged bundles are never listed. Front
Office only (&#x60;&#x60;doc.merge&#x60;&#x60;).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MergeSourcesResponse,
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
    path: "/api/v1/cases/:case_id/documents/misc",
    alias: "list_case_misc_documents_api_v1_cases__case_id__documents_misc_get",
    description: `The case&#x27;s miscellaneous (non-requirement) documents (PRD1042-2263).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MiscDocumentListResponse,
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
    path: "/api/v1/cases/:case_id/documents/misc",
    alias: "add_case_misc_document_api_v1_cases__case_id__documents_misc_post",
    description: `Upload a free-form document to a case, outside the resolved requirement set (PRD1042-2263).

Stored through the same secure media path (MIME whitelist + magic-byte confirmation + size cap) as
a requirement upload. The document type and label are optional and set here or edited later.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          Body_add_case_misc_document_api_v1_cases__case_id__documents_misc_post,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MiscDocumentResponse,
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
    path: "/api/v1/cases/:case_id/documents/misc/:misc_id",
    alias:
      "update_case_misc_document_api_v1_cases__case_id__documents_misc__misc_id__patch",
    description: `Set or clear a miscellaneous document&#x27;s type + label (PRD1042-2263).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateMiscDocumentRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "misc_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MiscDocumentResponse,
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
    path: "/api/v1/cases/:case_id/documents/misc/:misc_id",
    alias:
      "remove_case_misc_document_api_v1_cases__case_id__documents_misc__misc_id__delete",
    description: `Remove a miscellaneous document (soft remove — bytes + row kept for audit) (PRD1042-2263).

Bank-side only since BUG-111 — like the list, upload and relabel of the miscellaneous documents; the
leasing company answers 403.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "misc_id",
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
    path: "/api/v1/cases/:case_id/duplicates",
    alias: "read_case_duplicate_flags_api_v1_cases__case_id__duplicates_get",
    description: `The open duplicate flags of the case&#x27;s parties — what checklist step 2 lists (US-1.99, Rule 06
§2.2.8). Every open pair touching the lessee, a guarantor or a guarantee collateral&#x27;s guarantor,
with both records it names (&#x60;&#x60;roles&#x60;&#x60; empty for the bank&#x27;s other record). FO + BO only; the LC and
every other role answer 404 — duplicate data never reaches the portal (Rule 01).`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseDuplicateFlagsResponse,
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
    path: "/api/v1/cases/:case_id/duplicates/:pair_id/keep-both",
    alias:
      "keep_both_duplicate_api_v1_cases__case_id__duplicates__pair_id__keep_both_post",
    description: `Keep both records: the pair is two different parties (US-1.99). Front Office or Back Office, one click.
A pair not touching this case → 404; an already resolved pair → 409.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: KeepBothRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "pair_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DuplicateResolutionResponse,
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
    path: "/api/v1/cases/:case_id/duplicates/:pair_id/merge",
    alias:
      "merge_duplicate_api_v1_cases__case_id__duplicates__pair_id__merge_post",
    description: `Merge the pair in the chosen direction (US-1.99): the survivor stays, the other record is
retired, and this case&#x27;s lessee / guarantor / guarantee-collateral references move to the survivor
in the same transaction. Front Office or Back Office, no reason code, no approver (P30-25). A
survivor outside the pair → 422; a pair not touching this case → 404; an already resolved pair →
409.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MergeDuplicateRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "pair_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DuplicateResolutionResponse,
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
    path: "/api/v1/cases/:case_id/financing/calculate",
    alias:
      "calculate_case_financing_api_v1_cases__case_id__financing_calculate_post",
    description: `Run the provisional refinancing calculation over the current terms (PRD1042-11, US 1.41).

A read-only compute — nothing is persisted. With a body it previews the unsaved Terms on screen
(the tab&#x27;s Calculate, PRD1042-2266 / Rule 07 CA3); without, it runs on the stored terms. Saving
— terms and result together — is &#x60;&#x60;PUT …/financing/terms&#x60;&#x60;. The
measurement basis of the bound product template decides which computation runs: PRESENT_VALUE
discounts the contracts&#x27; lease streams, AGREED_AMOUNT returns the stored agreed amount, and
RATIO_ON_ACQUISITION_COST lends the net acquisition cost × the ratio (bullet or straight-line,
no discounting; an annuity on it → 422). A missing term (rate,
quota, value date, agreed amount) or an uncalibrated frequency also refuses with a typed 422,
never a computed zero (§6.5.8).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          calculate_case_financing_api_v1_cases__case_id__financing_calculate_post_Body,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CalculationResultResponse,
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
    path: "/api/v1/cases/:case_id/financing/conditions/:condition_id/undo",
    alias:
      "undo_financing_condition_api_v1_cases__case_id__financing_conditions__condition_id__undo_post",
    description: `Undo a settlement or a waiver — MET / WAIVED → OPEN, re-arming the disbursement block
(US 1.51; waiver: US-1.98).

The mirror of settle and waive, and the same front-office / back-office capability: the condition
returns to OPEN and its settlement or waiver metadata is cleared. A condition that is still open,
or expired, is a 409 &#x60;APPROVAL_CONDITION_NOT_UNDOABLE&#x60;; an unknown condition, or a cross-tenant /
unknown financing, is 404.`,
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
    description: `Waive an approval condition — OPEN → WAIVED in one step (US-1.98, Rule 06 §2.2.7, K6).

Front office and back office waive, with an optional comment and no second approver; the waived
condition no longer holds the disbursement. A non-open condition is a 409; an unknown condition,
or a cross-tenant / unknown financing, is 404.`,
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
    path: "/api/v1/cases/:case_id/financing/correct-settlement",
    alias:
      "correct_case_settlement_api_v1_cases__case_id__financing_correct_settlement_post",
    description: `Correct a settlement before SetUp — return the financing to Calculating (PRD1042-11, US 1.42).

Before SetUp a settled financing can still be corrected: it moves back from ReadyForSetup to
Calculating with a **mandatory reason** and an audit entry, and the stored calculation is marked out
of date (the stale figure is never recomputed on read — AC-23). This does NOT re-run the four-eyes
chain (D-144). The preparing role (Front Office) performs it; a call from any other state than
ReadyForSetup is refused **409** &#x60;INVALID_FINANCING_TRANSITION&#x60; (the back-edge is the only legal edge
into Calculating). A blank reason is **400**.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1) }).passthrough(),
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
    path: "/api/v1/cases/:case_id/financing/handover-file",
    alias:
      "download_handover_file_api_v1_cases__case_id__financing_handover_file_get",
    description: `The hand-over file for the bank&#x27;s core system — checklist step 18 (PRD1042-1941, US 1.25).

Thirty comma-separated fields in the four classes the core system expects (case data /
calculated values / fixed defaults / institution-filled); amounts at two decimals, rates at
three. Carries NEITHER returned value — the loan number and loan account do not exist when the
file is produced. Re-producible while the loan is not yet set up; every export is audited
(&#x60;&#x60;FINANCING_HANDOVER_EXPORTED&#x60;&#x60;). Export belongs to the preparing role alone (front office;
everyone else, incl. back office, answers not-found per the story&#x27;s matrix). A case with no
financing → 404. Columns without a calculation carrier export EMPTY (see &#x60;&#x60;handover_service&#x60;&#x60;).`,
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
up. They share one lifecycle: editable from SetUp onwards, never on a cancelled financing (P29-03;
otherwise 409). Thin wrapper: role-gated (front and back office, rule 01 &#x60;fin.loanno&#x60;; any other
role is refused as not-found), it resolves the financing by case
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
    method: "post",
    path: "/api/v1/cases/:case_id/financing/run-out",
    alias:
      "request_case_financing_run_out_api_v1_cases__case_id__financing_run_out_post",
    description: `Ask for the case&#x27;s disbursed financing to run out (F-6, BUG-098).

An error after the payout: the financing is cancelled and set up again. Fail-closed governance (44-step
matrix): nothing moves here — 202 with a pending governed action a **different** Back Office user
approves; the requester can never approve it (403). Back Office only (others: 404, non-disclosure).
Only a DISBURSED financing may run out (409 otherwise); a second request while one is pending → 409.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1).max(500) }).passthrough(),
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PendingApprovalResponse,
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
    path: "/api/v1/cases/:case_id/financing/terms",
    alias:
      "update_case_financing_terms_api_v1_cases__case_id__financing_terms_put",
    description: `Save every term of the Calculations tab in one write (PRD1042-2266, Rule 07 §3, §9).

A full replacement — every field is sent, &#x60;&#x60;null&#x60;&#x60; clears it. The Save also stores the calculation
the terms imply (Rule 07 CA3), returned as &#x60;&#x60;calculation_result&#x60;&#x60;; terms that cannot be calculated
yet still save, with no result. Front and Back Office. Editable while
the financing is Draft or Calculating; from ReadyForSetup (the bank settlement) the calculation is
frozen — 409 &#x60;&#x60;FINANCING_RATE_FIELD_LOCKED&#x60;&#x60;. Once step 4 committed the rate, its quote date and
lock period are frozen with it — 409 &#x60;&#x60;FINANCING_COMMITTED_RATE_IMMUTABLE&#x60;&#x60;. Invalid input (a
fourth decimal on the rate, an instalment day other than 1 / 30, a lock other than 7 / 14, a first
instalment not after the value date) is 422 &#x60;&#x60;VALIDATION_ERROR&#x60;&#x60;. A role outside FO / BO, another
tenant&#x27;s case, or a case without a financing is 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateTermsRequest,
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
    path: "/api/v1/cases/:case_id/generated-documents/bank-settlement",
    alias:
      "produce_bank_settlement_api_v1_cases__case_id__generated_documents_bank_settlement_post",
    description: `Produce (or re-produce) the bank settlement — step 15 (PRD1042-1940, US 1.24).

Assigns the settlement number on first production (a field of the FINANCING: 4 digits,
sequential per tenant, gaps permitted, seeded above the legacy counter) and keeps it across a
re-creation. NOT reproducible once the loan is set up in the core system (step 18 — both
returned values recorded): the attempt answers 409 GENERATED_DOCUMENT_LOCKED and is logged.
Front Office alone produces (everyone else 403); download follows case access.`,
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
    path: "/api/v1/cases/:case_id/generated-documents/calculation-data-sheet",
    alias:
      "upload_calculation_data_sheet_api_v1_cases__case_id__generated_documents_calculation_data_sheet_post",
    description: `File the calculation data sheet — the one generated type produced OUTSIDE the platform.

Nothing here computes it, so there is no production point; it is uploaded and then sits on the
generated tab beside the produced six (US 1.24). An UPLOAD, so it goes through the checked media
path — MIME whitelist, magic-byte confirmation and the size cap — unlike the rendered documents,
whose bytes the platform itself produced. Same preparing role as producing one (Front Office);
re-uploading replaces the current sheet (R5). Returns the refreshed list.`,
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
    path: "/api/v1/cases/:case_id/generated-documents/cover-sheet",
    alias:
      "produce_cover_sheet_api_v1_cases__case_id__generated_documents_cover_sheet_post",
    description: `Produce (or re-produce) the cover sheet — step 34 (PRD1042-1940, US 1.24).

Immediately before the collateral capture at step 35. The total exposure figure it carries has
no carrier yet (the borrower-unit aggregation is unbuilt) and renders pending — never a zero.
Reproducible. The total-exposure sheet and the calculation data sheet have NO production point
(owed by CrossLease, none inferred) and no route here.`,
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
    method: "post",
    path: "/api/v1/cases/:case_id/generated-documents/loan-offer",
    alias:
      "produce_loan_offer_api_v1_cases__case_id__generated_documents_loan_offer_post",
    description: `Produce (or re-produce) the loan offer — step 24, out at step 32 (PRD1042-1940, US 1.24).

Prints the loan number and the bank&#x27;s own loan account read from the financing (empty until the
step-18 set-up records them), and the payout and collection accounts the financing&#x27;s framework
agreement designates (P30-60; pending with no linked agreement or no designated account). The case
annotation and the per-LC framework-agreement references are pending carriers and render as such.
Reproducible; signature lines stay empty (signing happens outside the platform).`,
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
    path: "/api/v1/cases/:case_id/generated-documents/payment-plan",
    alias:
      "produce_payment_plan_api_v1_cases__case_id__generated_documents_payment_plan_post",
    description: `Produce (or re-produce) the payment plan document — step 15 (PRD1042-1940, US 1.24).

Renders the platform&#x27;s own plan (one section per contract) in the confirmed column set; refused
with a message naming the missing plan when no plan rows exist yet. NOT reproducible after the
step-18 loan set-up (409 GENERATED_DOCUMENT_LOCKED, logged). Front Office alone produces.`,
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

The company must be eligible (rule 03 §2.2: confirmed legal entity with a Händlernummer) and
hold an agreement in force today that sets a usable template; otherwise 422
&#x60;&#x60;CASE_LC_UNRESOLVED&#x60;&#x60;. The template is bound with it (rule 03 D1, US-1.78). The leasing
company binds only its own company; any other number answers 404 (BUG-045), and only while the
request is its working document — Draft or Missing information; in any other state it answers
409 &#x60;&#x60;LC_REQUEST_LOCKED&#x60;&#x60; and nothing changes (P29-12, rule 08 §4.1 CT1).

PUT rather than POST because it is settable more than once — the bank may change the company
until the bank settlement, which is where the quota, the dates and the accounts freeze anyway.

BUG-095 — &#x60;&#x60;lc_partner_id&#x60;&#x60; names the company picked in the wizard; it must hold &#x60;&#x60;lc_number&#x60;&#x60;.
Sent without it, a number that more than one eligible company holds is &#x60;&#x60;CASE_LC_UNRESOLVED&#x60;&#x60;.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BindLeasingCompanyRequest,
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
    description: `The match outcome and advisory duplicate flag of every party on the case (PRD1042-1929, US-1.86).

For each party — the lessee and every guarantor (the co-obligor is a guarantor with a kind of
obligation, not a separate category) — surfaces the computed match outcome (recognised / new /
candidate; no strength grades), the partner&#x27;s status and display name, and
&#x60;&#x60;has_unresolved_duplicate&#x60;&#x60;: the advisory flag capture sets instead of refusing a duplicate. The
bank resolves it inside the case; it never blocks the LC&#x27;s submit. A pure display over the matching
mechanism owned by PRD1042-1922. FO + BO only — the LC sees no duplicate data at all. Others → 404.`,
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
    description: `Ask for a cancelled case to be reopened (V-5; PRD1042-1947, US 1.31; BUG-099).

Fail-closed governance (44-step matrix, Q-018): the case does not move here. 202 with a pending
governed action that a **different** Back Office user approves (&#x60;&#x60;POST /governed-actions/{id}/approve&#x60;&#x60;);
the requester can never approve it (403). Role-gated (bank owner-role only — a non-owner is refused
as not-found), tenant-scoped (404 for a cross-tenant or unknown case). A case that is not
&#x60;&#x60;cancelled&#x60;&#x60; is refused now by the state machine → 409; a second request while one is pending → 409.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PendingApprovalResponse,
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
    path: "/api/v1/cases/:case_id/redemption",
    alias: "capture_case_redemption_api_v1_cases__case_id__redemption_put",
    description: `Capture what is owed to redeem the set, and from when. Front office.

The case must be a redemption follow-up (&#x60;&#x60;single_redemption&#x60;&#x60; / &#x60;&#x60;package_redemption&#x60;&#x60;) — 422
otherwise, because the amount would otherwise sit on a record that redeems nothing. Re-capturing
corrects the figure while it is still pending; once settled the figures are frozen (409).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RedemptionCaptureRequest,
      },
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RedemptionResponse,
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
    path: "/api/v1/cases/:case_id/redemption/settle",
    alias:
      "settle_case_redemption_api_v1_cases__case_id__redemption_settle_post",
    description: `Record that the money arrived. Back office, and terminal.

Refused when no amount has been captured (409): settling records that money arrived against a
stated figure, and a settled redemption of nothing reads as complete while meaning nothing.
Refused again once settled (409) — the row is locked before its status is read, so two approvers
settling at the same moment settle once.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RedemptionResponse,
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
    path: "/api/v1/cases/:case_id/redemptions",
    alias: "list_case_redemptions_api_v1_cases__case_id__redemptions_get",
    description: `US 1.37 — what has been paid off out of this case&#x27;s financing, newest first.

Read from the PARENT case (the refinancing request): a redemption is a follow-up case of the
financing, and the question this answers is what the deal has had redeemed out of it. A case
with no financing answers an empty page, not a 404 — nothing has been redeemed out of it yet.

Every figure is nullable: a redemption case exists from the moment it is started, before anyone
has worked out what it is worth.`,
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
        schema: z.number().int().gte(1).lte(200).optional().default(25),
      },
    ],
    response: RedemptionListResponse,
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
    description: `A returned refinancing request is sent back to the bank (PRD1042-1946, US 1.30; US-1.96).

The RESUBMIT half of the return→correct→resubmit loop — the return half is &#x60;&#x60;POST /decide&#x60;&#x60; from
US-1.29 (an approver decides missing-information / rework), so there is no new return endpoint here.
After correcting what the approver flagged, the front-office clerk sends the case back to the bank:
the request moves &#x60;&#x60;{missing-information | rework} → submitted&#x60;&#x60; and its round counter increments.

Thin wrapper: clerk-role gated (front office only; any other role — including back office — is
refused as not-found, object non-disclosure; the leasing company uses &#x60;&#x60;POST /lc/cases/{id}/resubmit&#x60;&#x60;),
tenant-scoped (a cross-tenant or unknown case is 404), then hands off to the service, which refuses
a request not in a returned state (409), runs the first-submission checks (422 with the failed
checks, US-1.96) and records who resubmitted and the new round. There is deliberately no
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
with its lessee / type / residual and completeness, and the financing figures —
the financing volume shown as PENDING (it is the derived payout amount, deferred with US-1.15&#x27;s
calculation). A read composing the existing per-concern reads; each block keeps its own visibility
rule. Tenant scoped → 404 for a case the caller cannot see. Bank roles only (BUG-072): the leasing
company&#x27;s review is &#x60;&#x60;GET /lc/cases/{id}/review&#x60;&#x60;, which carries its own case projection.`,
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
    method: "get",
    path: "/api/v1/cases/leasing-companies",
    alias: "list_case_leasing_companies_api_v1_cases_leasing_companies_get",
    description: `The leasing companies the tenant&#x27;s cases name — the bank case list&#x27;s Leasing company filter
(Milestone 1 rule 02 §1.3 &quot;the leasing companies present in the list&quot;, BUG-081). Front and Back
Office only; every other role answers not-found. Sorted by name.`,
    requestFormat: "json",
    response: CaseLeasingCompaniesResponse,
  },
  {
    method: "get",
    path: "/api/v1/cases/leasing-company-resolution",
    alias:
      "resolve_leasing_company_api_v1_cases_leasing_company_resolution_get",
    description: `Wizard step 1 (Milestone 1 rule 03 §2.3, US-1.78): the agreement in force today and the bank
product template it sets, for the company just picked, before the case exists.

Front Office, Back Office and the leasing company read it; every other role answers not-found.
The leasing company resolves only its own company (another id → 404) and never sees the quota,
the framework volume or the template — only &#x60;&#x60;has_usable_template&#x60;&#x60; (BUG-114), which every reader
gets, as it gets &#x60;&#x60;lc_numbers&#x60;&#x60; (the company&#x27;s dealer numbers — the LC&#x27;s own; step 1 binds the first). A partner that may not act as a leasing company → 422
&#x60;&#x60;CASE_LC_UNRESOLVED&#x60;&#x60;. Read-only; the bind (&#x60;&#x60;PUT /cases/{id}/leasing-company&#x60;&#x60;) applies the
same resolution.`,
    requestFormat: "json",
    parameters: [
      {
        name: "lc_partner_id",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: LeasingCompanyResolutionResponse,
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
    path: "/api/v1/classifications/wz2008",
    alias: "list_wz2008_api_v1_classifications_wz2008_get",
    description: `The WZ 2008 classification (839 subclasses, &#x60;&#x60;NN.NN.N&#x60;&#x60;) an industry code is chosen from — the
German wording is Destatis&#x27;, the English the NACE Rev. 2 class&#x27;s. Any signed-in user.`,
    requestFormat: "json",
    response: Wz2008Response,
  },
  {
    method: "get",
    path: "/api/v1/contracts",
    alias: "list_contracts_across_cases_api_v1_contracts_get",
    description: `The contracts of the tenant, across their cases (US-1.73, P30-15) — filterable, sortable, paged.

The bank&#x27;s list (M2 spec §1: Front and Back Office); every other role answers 404. The filters
combine (AND). &#x60;total&#x60; counts the matching set, not the page: this surface is meant to answer &quot;how
many contracts look like this&quot;, and a total that reported the page would answer a different
question.`,
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "deferred_state",
        type: "Query",
        schema: deferred_state,
      },
      {
        name: "contract_status",
        type: "Query",
        schema: contract_status,
      },
      {
        name: "financing_reference",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "no_financing",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "lc_partner_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "case_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "sort",
        type: "Query",
        schema: z.string().optional().default("-created_at"),
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
    response: ContractWorkSurfaceResponse,
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
    path: "/api/v1/contracts/:contract_id",
    alias: "read_contract_record_api_v1_contracts__contract_id__get",
    description: `P30-06 — the contract record page: the contract and the records around it.

Own contracts only (client round 2, blocker 2): the scope is in the query, so another leasing
company&#x27;s contract, another tenant&#x27;s and an unknown id all answer 404 alike.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractRecordRead,
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
    description: `Edit a contract&#x27;s captured fields. Guarded by the request&#x27;s write window.

A true partial update (BUG-029): &#x60;&#x60;model_fields_set&#x60;&#x60; is the set of fields this request actually
carried, so an omitted field keeps its stored value while one sent explicitly as &#x60;&#x60;null&#x60;&#x60; is
cleared. Without it every absent field would reach the service as &#x60;&#x60;None&#x60;&#x60; and overwrite the row.`,
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
    path: "/api/v1/contracts/:contract_id/collaterals",
    alias: "add_collateral_api_v1_contracts__contract_id__collaterals_post",
    description: `Add a collateral to a contract (PRD1042-2167, unblocks US 1.45).

&#x60;&#x60;value&#x60;&#x60; is mandatory (0.01–99,999,999.99). A GUARANTEE requires exactly one of &#x60;&#x60;identity&#x60;&#x60;
(create-confirmed) / &#x60;&#x60;existing_partner_id&#x60;&#x60; (link) and also assigns the party the guarantor role on
this contract; every other type rejects a party and requires &#x60;&#x60;provider_name&#x60;&#x60; (the address is
optional), which a GUARANTEE refuses (rule 04 C2). FO + BO + LC-own; only in the request&#x27;s write
window. Any number of collaterals per contract; the same live guarantee party twice is refused.
&#x60;&#x60;keep_both&#x60;&#x60; / &#x60;&#x60;duplicate_note&#x60;&#x60; carry the Matching candidates decision for the party, as on the
lessee capture (US-1.116). A Guarantee party created here takes &#x60;&#x60;personennummer_os_plus&#x60;&#x60; and the
party mask&#x27;s &#x60;&#x60;addresses&#x60;&#x60; and &#x60;&#x60;dealer_numbers&#x60;&#x60; in the same transaction (P30-17); sent without &#x60;&#x60;identity&#x60;&#x60; → 409 CONTRACT_COLLATERAL_CAPTURE_BLOCKED.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CollateralAddRequest,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__contracts__interfaces__http__schemas__collateral_schemas__CollateralResponse,
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
    path: "/api/v1/contracts/:contract_id/collaterals",
    alias: "list_collaterals_api_v1_contracts__contract_id__collaterals_get",
    description: `The live collaterals on a contract (PRD1042-2167). A Guarantee row carries its party&#x27;s name.

A contract with no collateral returns an empty list — normal, not incomplete. FO + BO + LC-own.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CollateralListResponse,
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
    path: "/api/v1/contracts/:contract_id/collaterals/:collateral_id/remove",
    alias:
      "remove_collateral_api_v1_contracts__contract_id__collaterals__collateral_id__remove_post",
    description: `Soft-remove a collateral from a contract (PRD1042-2167) — history preserved.

Sets removed-at + removal-reason; the row leaves the live set but is never deleted. A Guarantee
collateral also soft-removes the guarantor link it created, so the derived role does not outlive it.
FO + BO + LC-own; only in the request&#x27;s write window.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CollateralRemoveRequest,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "collateral_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__contracts__interfaces__http__schemas__collateral_schemas__CollateralResponse,
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
    path: "/api/v1/contracts/:contract_id/collaterals/preview",
    alias:
      "preview_collateral_partner_api_v1_contracts__contract_id__collaterals_preview_post",
    description: `Search the partner register for a Guarantee&#x27;s party before anything is created (PRD1042-2167).

Search-before-typing for the GUARANTEE case: returns the match candidates so the caller can link an
existing partner rather than create a duplicate. Creates nothing. FO + BO only — the LC never
receives candidates (404).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CollateralPreviewRequest,
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
    path: "/api/v1/contracts/:contract_id/defer",
    alias: "defer_contract_api_v1_contracts__contract_id__defer_post",
    description: `Hold a contract back within the request — reactivatable, not rejected (PRD1042-1928).

BUG-097 — on a committed contract this is C-8 (&#x60;&#x60;committed → deferred&#x60;&#x60;): &#x60;&#x60;reason&#x60;&#x60; is required
(422 &#x60;&#x60;CONTRACT_DEFERRAL_REASON_REQUIRED&#x60;&#x60;). A contract the decision moved to Deferred cannot be
reactivated (409 &#x60;&#x60;INVALID_CONTRACT_STATUS_TRANSITION&#x60;&#x60;).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: defer_contract_api_v1_contracts__contract_id__defer_post_Body,
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
    method: "get",
    path: "/api/v1/contracts/:contract_id/direct-debit-returns",
    alias:
      "list_direct_debit_returns_api_v1_contracts__contract_id__direct_debit_returns_get",
    description: `P30-13 — the contract&#x27;s direct debit returns, newest first (M2 spec §4.6). Front and Back Office;
everyone else, another tenant&#x27;s contract and an unknown id answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DirectDebitReturnListResponse,
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
    path: "/api/v1/contracts/:contract_id/direct-debit-returns",
    alias:
      "record_direct_debit_return_api_v1_contracts__contract_id__direct_debit_returns_post",
    description: `P30-13 — record that the lessee&#x27;s direct debit for one instalment came back. Financed contract only
(409 &#x60;&#x60;DIRECT_DEBIT_RETURN_NOT_ALLOWED&#x60;&#x60;); the instalment must be a paid row of the lease cash flow —
a resolved one may be returned again, an open one not (409 &#x60;&#x60;DIRECT_DEBIT_RETURN_NOT_ELIGIBLE&#x60;&#x60;, also
the loser of a concurrent record); returned on ∈ [due, today], reported on ∈ [returned on, today],
&quot;other&quot; needs &#x60;&#x60;reason_other&#x60;&#x60; (400 &#x60;&#x60;INVALID_DIRECT_DEBIT_RETURN&#x60;&#x60;). Audited (paid → open).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DirectDebitReturnCreate,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DirectDebitReturnRead,
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
    path: "/api/v1/contracts/:contract_id/direct-debit-returns/:return_id/resolve",
    alias:
      "resolve_direct_debit_return_api_v1_contracts__contract_id__direct_debit_returns__return_id__resolve_post",
    description: `P30-13 — the payment came in after the return: resolved on ∈ [returned on, today] (400), an
optional note; only an open return (409 &#x60;&#x60;DIRECT_DEBIT_RETURN_NOT_OPEN&#x60;&#x60;, also the loser of a
concurrent resolve); unknown return 404. Audited (open → paid).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DirectDebitReturnResolve,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "return_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DirectDebitReturnRead,
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
    path: "/api/v1/contracts/:contract_id/document-rows",
    alias:
      "list_contract_document_rows_api_v1_contracts__contract_id__document_rows_get",
    description: `P30-04 — the contract record&#x27;s Documents table, newest first: the contract&#x27;s and its objects&#x27; documents
and, for the bank, its financing&#x27;s. The leasing company (own contracts only) gets only contract / object
documents its own company uploaded — never DAT reports, the financing&#x27;s or generated documents (until Q-123;
the rule is the service&#x27;s). Another leasing company&#x27;s or tenant&#x27;s contract and an unknown id answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentRowListResponse,
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
creates one confirmed (&#x60;&#x60;identity&#x60;&#x60;) and links it; a duplicate hit is advisory and never blocks.
Any number of distinct guarantors may be added; the same party twice (live) is refused. Optional
kind of obligation (guarantee / co-obligation, open set). FO + BO + LC-own (rule 01 R6), only inside
the contract set&#x27;s write window.`,
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
than create a duplicate. Creates nothing. FO + BO only — the LC never receives candidates (404).`,
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
    method: "get",
    path: "/api/v1/contracts/:contract_id/lease-cash-flow",
    alias:
      "read_lease_cash_flow_api_v1_contracts__contract_id__lease_cash_flow_get",
    description: `P30-12 — the contract&#x27;s lease cash flow over the financing period (M2 spec §4.5): one row per lease
payment of the stored plan from the value date to the financing&#x27;s maturity (or the contract&#x27;s early
redemption); Refinanced &#x3D; due strictly after the value date; Loan payment &#x3D; round2(lease payment ×
quota) on refinanced rows (Q-107); Sum refinanced, Applied quota, the payout (a package contract&#x27;s share
of it, P30-46 — not recorded where the calculation stored none) and the residual line. A missing input answers
200 with &#x60;&#x60;unavailable&#x60;&#x60; set. Front and Back Office only; everyone else, another tenant&#x27;s contract
and an unknown id answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LeaseCashFlowRead,
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
(any duplicate hit opens an advisory duplicate pair for the bank and never blocks — US-1.86).
Sets the contract&#x27;s lessee. FO + BO + LC-own; only in the request&#x27;s write window.

The partner form&#x27;s Matching candidates decision (US-1.116), FO + BO only: &#x60;&#x60;keep_both&#x60;&#x60; creates the
typed party even against an exact register match (an LC sending it → 409 LESSEE_CAPTURE_BLOCKED);
&#x60;&#x60;duplicate_note&#x60;&#x60; (max 500) is stored on the duplicate pairs Keep both opens, and audited with the
capture on Merge into (&#x60;&#x60;existing_partner_id&#x60;&#x60;).

A party created here takes the party mask&#x27;s &#x60;&#x60;addresses&#x60;&#x60; and &#x60;&#x60;dealer_numbers&#x60;&#x60; in the same
transaction (P30-17); they are refused with &#x60;&#x60;existing_partner_id&#x60;&#x60;
and not written when the identity links an existing confirmed partner.`,
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
the caller can link one rather than create a duplicate. Creates nothing. FO + BO only — the
LC never receives candidates (404).`,
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
    method: "post",
    path: "/api/v1/contracts/:contract_id/lessee/remove",
    alias: "remove_lessee_api_v1_contracts__contract_id__lessee_remove_post",
    description: `Unlink the lessee from a contract (PRD1042-2165).

Clears the contract&#x27;s &#x60;&#x60;lessee_partner_id&#x60;&#x60; — the partner stays in the registry; only this
contract&#x27;s lessee slot is emptied, so the contract becomes incomplete until a lessee is
re-captured. FO + BO + LC-own; only in the request&#x27;s write window. A contract with no lessee is a
404. No body — this is a column null, not a soft-remove with a reason.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LesseeUnlinkResponse,
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
    path: "/api/v1/contracts/:contract_id/loan-payment-plan",
    alias:
      "read_loan_payment_plan_api_v1_contracts__contract_id__loan_payment_plan_get",
    description: `P30-10 — the contract&#x27;s Loan payment plan tab: the repayment schedule of its own financing (for a
package, the package loan&#x27;s whole schedule), read-only, with its Total line. The bank reads it adjusted for
settled redemptions (labelled); a leasing-company caller reads the plan as priced, without the bank-only
details (&#x60;&#x60;bank &#x3D; null&#x60;&#x60;: the product template, the set-up-in-OS+ flag). Nothing to show answers 200 with
&#x60;&#x60;unavailable&#x60;&#x60; set. Front Office, Back Office and the leasing company on its own contracts; everyone
else, another leasing company&#x27;s or tenant&#x27;s contract and an unknown id answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LoanPaymentPlanRead,
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
    path: "/api/v1/contracts/:contract_id/mark-non-performing",
    alias:
      "mark_contract_non_performing_api_v1_contracts__contract_id__mark_non_performing_post",
    description: `P30-14 — mark a Financed contract as non-performing (M2 spec §4.3), with an optional reason.

Front and Back Office only; every other role answers 404 (the module gate). A contract that is not
Financed answers 409 &#x60;&#x60;CONTRACT_PERFORMANCE_NOT_ALLOWED&#x60;&#x60;, one already marked 409
&#x60;&#x60;CONTRACT_ALREADY_NON_PERFORMING&#x60;&#x60;. Audited before → after. Returns the updated record.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MarkNonPerforming,
      },
      {
        name: "contract_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ContractRecordRead,
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
        schema: ContractRemove,
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
    method: "get",
    path: "/api/v1/contracts/:ref_id/activity",
    alias: "get_contract_activity",
    description: `The entity&#x27;s own events (its comments included), newest first, values masked.`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
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
    path: "/api/v1/contracts/:ref_id/comments",
    alias: "list_contract_comments",
    description: `Newest first. Bank-only: every comment is internal, and the leasing company never
reaches the thread (404).`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
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
        schema: z.number().int().gte(1).lte(200).optional().default(100),
      },
    ],
    response: CaseCommentListResponse,
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
    path: "/api/v1/contracts/:ref_id/comments",
    alias: "add_contract_comment",
    description: `Always stored as internal, whatever &#x60;&#x60;visibility&#x60;&#x60; says: the thread is bank-only.
Audited on the entity itself, so it appears in its Activity trail.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddCaseCommentRequest,
      },
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/contracts/:ref_id/comments/:comment_id",
    alias: "edit_contract_comment",
    description: `Author only (403 otherwise); a deleted comment cannot be edited (409).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ body: z.string().min(1).max(2000) }).passthrough(),
      },
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/contracts/:ref_id/comments/:comment_id",
    alias: "delete_contract_comment",
    description: `Author only (403 otherwise); a second delete is refused (409). The tombstone is returned.`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/contracts/filter-options",
    alias: "list_contract_filter_options_api_v1_contracts_filter_options_get",
    description: `The values one Contracts-list dropdown offers (P30-15, prototype &#x60;&#x60;ctrFilterValues&#x60;&#x60;): the
refinancing statuses (lifecycle order, codes), financing references, leasing companies (id →
name) or cases (id → reference) that occur among the caller&#x27;s live contracts — so a filter never
returns nothing. Narrowed by &#x60;&#x60;q&#x60;&#x60; (contains, case ignored), at most 50. Same roles as the list
(FO / BO); everyone else 404. Declared before &#x60;&#x60;/contracts/{contract_id}&#x60;&#x60;, which would take the
path otherwise.`,
    requestFormat: "json",
    parameters: [
      {
        name: "field",
        type: "Query",
        schema: z
          .string()
          .regex(/^(contract_status|financing|leasing_company|case)$/),
      },
      {
        name: "q",
        type: "Query",
        schema: assignee_id,
      },
    ],
    response: ContractFilterOptionsResponse,
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
    path: "/api/v1/contracts/milk/template",
    alias: "download_milk_template_api_v1_contracts_milk_template_get",
    description: `The blank MILK workbook, for the submitter to fill in.

Offered in the upload dialogue beside the file picker (§2.1). It carries the headings in the
right order, the drop-downs down to row 1001 and a frozen heading row, and **no example rows**.

Not case-scoped, and deliberately so: the template is the same file for every request and
contains no case data, so binding it to a case would add a lookup that answers nothing. It is
still authenticated, on the contracts read set — the same precedent as the object-classification
config above.

**Generated from the rule catalogue rather than stored.** The drop-downs are the only reason a
checker this strict stays usable (§2.1), so a template whose lists disagreed with the rules
would be worse than none — it would teach submitters to write values the checker then refuses.
Building it from the same catalogue the validator reads makes that disagreement impossible, and
means a revised validation workbook updates the template without anyone remembering to.`,
    requestFormat: "json",
    response: z.unknown(),
  },
  {
    method: "get",
    path: "/api/v1/dashboard",
    alias: "read_dashboard_api_v1_dashboard_get",
    description: `What is moving through refinancing today (US-1.71).

Guarded by the same role set as the case list, and every figure inherits that scoping: the
dashboard composes the case and financing list services rather than querying around them, so a
user cannot see a count over cases their list would not show them.`,
    requestFormat: "json",
    response: DashboardResponse,
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
        schema: assignee_id,
      },
      {
        name: "business_object_type",
        type: "Query",
        schema: assignee_id,
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
    description: `Link an already stored document to a requirement as a fulfilment (bank side).

Front and Back Office (&#x60;&#x60;DOCUMENT_REQUIREMENT_CATALOG_FULFILMENT_WRITE&#x60;&#x60;). A leasing-company user
answers **403** (BUG-110): it uploads through &#x60;&#x60;POST /cases/{case_id}/documents&#x60;&#x60;, which scopes the
case to its company and links internally. 422 &#x60;&#x60;INCOMPATIBLE_DOCUMENT_TYPE&#x60;&#x60; when the document&#x27;s
recorded type differs from the requirement&#x27;s; 404 for an unknown requirement or catalogue.`,
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
        schema: assignee_id,
      },
      {
        name: "case_type",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
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
    method: "get",
    path: "/api/v1/financings",
    alias: "list_financings_api_v1_financings_get",
    description: `The financings inventory of the tenant (PRD1042-1949, US 1.33) — sortable, filterable, paged.

P29-15: search on the financing / case reference, loan number, loan account and (US-1.66) account number;
exact filters for the ID, loan account, leasing company and account number dropdowns; the &#x60;&#x60;outstanding&#x60;&#x60;
toggle. They combine (AND). &#x60;&#x60;account_no&#x60;&#x60; is the IBAN of the payout account the financing&#x27;s framework
agreement designates (Q-113) — shared by every financing under that agreement. Bank roles only (FO / BO /
BPU, all of whom may read the agreement and the leasing company&#x27;s bank accounts); the LC and every platform
role answer 404 (non-disclosure).`,
    requestFormat: "json",
    parameters: [
      {
        name: "sort",
        type: "Query",
        schema: z.string().optional().default("-created_at"),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(25),
      },
      {
        name: "search",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(FinancingStatus).optional().default([]),
      },
      {
        name: "kind",
        type: "Query",
        schema: z.array(FinancingKind).optional().default([]),
      },
      {
        name: "financing_reference",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "loan_account",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "lc_partner_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "account_no",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "outstanding",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
    ],
    response: FinancingListResponse,
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
    path: "/api/v1/financings/:financing_id",
    alias: "read_financing_api_v1_financings__financing_id__get",
    description: `One financing by its own id — the financing detail page (P29-02).

The same record as &#x60;&#x60;GET /cases/{case_id}/financing&#x60;&#x60; plus the page header (case reference,
leasing company, framework agreement, product template), the hand-maintained values (P29-03),
the tab counts and the balance banner. Front Office and Back Office only, like the per-case read:
every other role, another tenant&#x27;s financing and an unknown id all answer 404 (object
non-disclosure). Declared after &#x60;&#x60;/export-csv&#x60;&#x60; so that path is never read as an id.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingDetailRead,
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
    path: "/api/v1/financings/:financing_id/collateral",
    alias:
      "get_financing_collateral_api_v1_financings__financing_id__collateral_get",
    description: `The financing&#x27;s DAT total (P29-06): kind, current total, an open proposal, evidence, re-check
state and every version. 404 &#x60;&#x60;COLLATERAL_NOT_FOUND&#x60;&#x60; while nothing is captured.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/collateral/confirm",
    alias:
      "confirm_financing_collateral_api_v1_financings__financing_id__collateral_confirm_post",
    description: `APPROVE the open re-determination. Back Office; neither the proposer nor the step-35 resolver
(403 &#x60;&#x60;COLLATERAL_CONFIRM_FORBIDDEN&#x60;&#x60;). No open proposal → 409 &#x60;&#x60;COLLATERAL_NOT_REDETERMINED&#x60;&#x60;. The
value becomes the next version and the flag clears.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/collateral/evidence",
    alias:
      "add_financing_collateral_evidence_api_v1_financings__financing_id__collateral_evidence_post",
    description: `Attach one DAT evidence file — DAT PDF or vehicle Excel. Front and Back Office. Wrong format →
422, over the size cap → 413; nothing stored.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ file: z.string() }).passthrough(),
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/collateral/evidence/:document_id",
    alias:
      "remove_financing_collateral_evidence_api_v1_financings__financing_id__collateral_evidence__document_id__delete",
    description: `Remove one DAT evidence file (soft). Not a live evidence file of this financing → 404
&#x60;&#x60;COLLATERAL_EVIDENCE_NOT_FOUND&#x60;&#x60;.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "document_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/collateral/redetermine",
    alias:
      "redetermine_financing_collateral_api_v1_financings__financing_id__collateral_redetermine_post",
    description: `PROPOSE a re-determined total. Front and Back Office (hub Q-127). No recorded total → 409
&#x60;&#x60;COLLATERAL_NO_FIRST_VALUE&#x60;&#x60;; another proposal open → 409 &#x60;&#x60;COLLATERAL_PROPOSAL_OPEN&#x60;&#x60;. Raises no
flag; stored as entered.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RedetermineCollateralRequest,
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/collateral/reject",
    alias:
      "reject_financing_collateral_api_v1_financings__financing_id__collateral_reject_post",
    description: `REJECT the open re-determination — the same four eyes as the approval. The proposal is
discarded, the current version stays, the flag stays raised.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/collateral/total",
    alias:
      "set_financing_collateral_total_api_v1_financings__financing_id__collateral_total_put",
    description: `Record the FIRST total — version 1, saved directly, no second person (hub Q-105 point 2); stored
as entered (no cap until hub Q-132). Front and Back Office. Once a version exists → 409
&#x60;&#x60;COLLATERAL_TOTAL_ALREADY_SET&#x60;&#x60;: a change is a re-determination.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetCollateralTotalRequest,
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/collateral/type",
    alias:
      "set_financing_collateral_type_api_v1_financings__financing_id__collateral_type_put",
    description: `Set the kind of security (single selection). Front and Back Office.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetCollateralTypeRequest,
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response:
      app__modules__cases__interfaces__http__schemas__case_schemas__CollateralResponse,
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
    path: "/api/v1/financings/:financing_id/document-rows",
    alias:
      "list_financing_document_rows_api_v1_financings__financing_id__document_rows_get",
    description: `P30-04 — the financing&#x27;s Documents table, newest first: its miscellaneous documents (removable), the
Calculation Data Sheet of its case (generated) and the DAT evidence of its DAT record (&#x60;&#x60;managed_on &#x3D;
collateral_card&#x60;&#x60; — edited on the DAT total card, never here); its contracts&#x27; and objects&#x27; documents join as
those sources land. Front and Back Office; everyone else, another tenant&#x27;s and an unknown id answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentRowListResponse,
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
    path: "/api/v1/financings/:financing_id/document-rows",
    alias:
      "upload_financing_document_row_api_v1_financings__financing_id__document_rows_post",
    description: `P30-04 — the table&#x27;s Upload with the financing as the owner. &#x60;&#x60;document_type&#x60;&#x60; is a table type; the
financing takes &#x60;&#x60;MISCELLANEOUS&#x60;&#x60; only (&#x60;&#x60;DAT_REPORT&#x60;&#x60; / &#x60;&#x60;LEASE_CONTRACT&#x60;&#x60; → 422 &#x60;&#x60;DOCUMENT_TYPE_NOT_FOR_OWNER&#x60;&#x60;),
and a generated type such as &#x60;&#x60;CALCULATION_DATA_SHEET&#x60;&#x60; is never uploaded (422 &#x60;&#x60;DOCUMENT_TYPE_NOT_UPLOADABLE&#x60;&#x60;).
Stored through the financing&#x27;s document store — PDF / Excel, magic bytes, 25 MB (422 otherwise, nothing stored).
Front and Back Office only.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          Body_upload_financing_document_row_api_v1_financings__financing_id__document_rows_post,
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DocumentRowRead,
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
    path: "/api/v1/financings/:financing_id/documents",
    alias:
      "list_financing_documents_api_v1_financings__financing_id__documents_get",
    description: `The financing&#x27;s own miscellaneous documents, newest first (P29-07). Removed ones are left out.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingDocumentListResponse,
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
    path: "/api/v1/financings/:financing_id/documents",
    alias:
      "add_financing_document_api_v1_financings__financing_id__documents_post",
    description: `Upload a document to the financing (P29-07). Through the secure media path — PDF / Excel
only, the content confirmed by its magic bytes, 25 MB cap (422 otherwise, nothing stored). The
type (&#x60;&#x60;original_agreement · addendum · correspondence · other&#x60;&#x60;) and label are optional.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          Body_add_financing_document_api_v1_financings__financing_id__documents_post,
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MiscDocumentResponse,
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
    path: "/api/v1/financings/:financing_id/documents/:document_id",
    alias:
      "update_financing_document_api_v1_financings__financing_id__documents__document_id__patch",
    description: `Set or clear a financing document&#x27;s type and label (P29-07).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateFinancingDocumentRequest,
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "document_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MiscDocumentResponse,
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
    path: "/api/v1/financings/:financing_id/documents/:document_id",
    alias:
      "remove_financing_document_api_v1_financings__financing_id__documents__document_id__delete",
    description: `Remove a financing document — a soft remove, the bytes and the row stay for audit (P29-07).`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "document_id",
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
    path: "/api/v1/financings/:financing_id/maintained-values",
    alias:
      "update_financing_maintained_values_api_v1_financings__financing_id__maintained_values_patch",
    description: `Edit the hand-maintained values on the Data tab (P29-03): loan number, loan account,
Sollbelastung and Habenausgleich (amount + date each).

Partial — only the fields sent change. The loan number and account are editable from SetUp
onwards and never on a cancelled financing (409 &#x60;&#x60;FINANCING_VALUES_LOCKED&#x60;&#x60;); the pre-financing
pair always. The body carries the &#x60;&#x60;updated_at&#x60;&#x60; the page loaded (optimistic lock): a financing
changed since answers 409 &#x60;&#x60;FINANCING_VERSION_CONFLICT&#x60;&#x60; and nothing is written. Every change is
audited before → after (&#x60;&#x60;FINANCING_VALUES_EDITED&#x60;&#x60;) and shows in
the financing&#x27;s Activity. Front and Back Office only; every other role, another tenant and an
unknown id answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateMaintainedValuesRequest,
      },
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingDetailRead,
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
    path: "/api/v1/financings/:financing_id/securities",
    alias:
      "list_financing_securities_api_v1_financings__financing_id__securities_get",
    description: `The Collaterals tab&#x27;s &quot;Collaterals&quot; card (P29-06): every live collateral captured on the
financing&#x27;s contracts — security, party, proof, contract and amount. Read only: they are captured
with the contract. A contract held back from the financing is not one of its contracts. Front and
Back Office; every other role, another tenant&#x27;s financing and an unknown id answer 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "financing_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: FinancingSecuritiesResponse,
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
    path: "/api/v1/financings/:ref_id/activity",
    alias: "get_financing_activity",
    description: `The entity&#x27;s own events (its comments included), newest first, values masked.`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
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
    path: "/api/v1/financings/:ref_id/comments",
    alias: "list_financing_comments",
    description: `Newest first. Bank-only: every comment is internal, and the leasing company never
reaches the thread (404).`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
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
        schema: z.number().int().gte(1).lte(200).optional().default(100),
      },
    ],
    response: CaseCommentListResponse,
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
    path: "/api/v1/financings/:ref_id/comments",
    alias: "add_financing_comment",
    description: `Always stored as internal, whatever &#x60;&#x60;visibility&#x60;&#x60; says: the thread is bank-only.
Audited on the entity itself, so it appears in its Activity trail.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddCaseCommentRequest,
      },
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/financings/:ref_id/comments/:comment_id",
    alias: "edit_financing_comment",
    description: `Author only (403 otherwise); a deleted comment cannot be edited (409).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ body: z.string().min(1).max(2000) }).passthrough(),
      },
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/financings/:ref_id/comments/:comment_id",
    alias: "delete_financing_comment",
    description: `Author only (403 otherwise); a second delete is refused (409). The tombstone is returned.`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/financings/export-csv",
    alias: "export_financings_csv_api_v1_financings_export_csv_get",
    description: `Export the filtered financings inventory as CSV (PRD1042-1949, US 1.33). P30-40: the list&#x27;s columns in
its order (&#x60;&#x60;EXPORT_COLUMNS&#x60;&#x60;, Account no. included since US-1.66), its filters and sort; every cell is safe from
formula injection (&#x60;&#x60;csv_cell&#x60;&#x60;). The export is
audited (&#x60;&#x60;FINANCING_LIST_EXPORTED&#x60;&#x60;) — an inventory leaving the system is an access event.`,
    requestFormat: "json",
    parameters: [
      {
        name: "sort",
        type: "Query",
        schema: z.string().optional().default("-created_at"),
      },
      {
        name: "search",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(FinancingStatus).optional().default([]),
      },
      {
        name: "kind",
        type: "Query",
        schema: z.array(FinancingKind).optional().default([]),
      },
      {
        name: "financing_reference",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "loan_account",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "lc_partner_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "account_no",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "outstanding",
        type: "Query",
        schema: z.boolean().optional().default(false),
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
    path: "/api/v1/financings/filter-options",
    alias: "list_financing_filter_options_api_v1_financings_filter_options_get",
    description: `The values one financing-list dropdown offers (P29-15, prototype &#x60;&#x60;finFxValues&#x60;&#x60;): the tenant&#x27;s
distinct financing references, loan accounts, leasing companies or account numbers (US-1.66 — the payout
accounts the framework agreements designate), narrowed by &#x60;&#x60;q&#x60;&#x60; (contains, case and spaces ignored), sorted,
at most 50. Same roles as the list (FO / BO / BPU); everyone else 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "field",
        type: "Query",
        schema: z
          .string()
          .regex(/^(reference|loan_account|leasing_company|account_no)$/),
      },
      {
        name: "q",
        type: "Query",
        schema: assignee_id,
      },
    ],
    response: FinancingFilterOptionsResponse,
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
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "valid_until",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "type",
        type: "Query",
        schema: z.array(FAEventTypeFilter).optional().default([]),
      },
      {
        name: "from",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "to",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(50),
      },
      {
        name: "cursor",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "search",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "type",
        type: "Query",
        schema: z.array(FAEventTypeFilter).optional().default([]),
      },
      {
        name: "from",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "to",
        type: "Query",
        schema: assignee_id,
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
    description: `BUG-141 — the financings drawn under this agreement (newest first, paged): reference, kind, contract
count, payout amount, status, ended reason. Bank Power User, Front Office and Back Office; 404 otherwise,
and for an agreement outside the tenant. Until BUG-146 links every financing to its agreement, only seeded
financings carry the link.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
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
        schema: z.number().int().gte(1).lte(100).optional().default(25),
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
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "valid_until",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
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

Defaults to newest-first (&#x60;&#x60;sort&#x3D;-created_at&#x60;&#x60;), unlike the bank&#x27;s queue-oriented &#x60;&#x60;/cases&#x60;&#x60;;
every column sorts both ways (P30-35, &#x60;&#x60;sort&#x60;&#x60;).

**Answers &#x60;LcCaseListResponse&#x60;, not the bank&#x27;s &#x60;CaseListResponse&#x60; (changed 2026-09-11).** This
route used to reuse the bank list model as &quot;a thin, clearly-named alias&quot;, which handed a
leasing-company user &#x60;owner_user_id&#x60;, &#x60;created_by&#x60;, &#x60;decision_round&#x60;, &#x60;request_status&#x60;,
&#x60;routing_exception&#x60; and &#x60;origin_financing_id&#x60; — &#x60;decision_round&#x60; being, in effect, how many
times the bank sent the request back. PRD1042-1951 withholds the bank&#x27;s internal review
information by name and requires the restriction to be &quot;enforced at query level and never by
hiding things in the interface&quot;, so the projection is the guard: those fields are absent from
the model and cannot be re-exposed by a serializer change. The detail route below was already
least-privilege; only the list had been aliased.`,
    requestFormat: "json",
    parameters: [
      {
        name: "sort",
        type: "Query",
        schema: z.string().optional().default("-created_at"),
      },
      {
        name: "search",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "status",
        type: "Query",
        schema: status__2,
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
    response: LcCaseListResponse,
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
    path: "/api/v1/lc/cases",
    alias: "start_lc_case_api_v1_lc_cases_post",
    description: `The leasing company starts a refinancing request (BUG-072; was &#x60;&#x60;POST /cases&#x60;&#x60;).

The same service as the bank&#x27;s start (&#x60;&#x60;CaseService.create_case&#x60;&#x60;: refinancing requests only, the company
from the caller, never the body), answered with the leasing company&#x27;s own projection — no owner, round,
routing or financing field is sent. Leasing-company users only; any other role 404; anonymous 401.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: StartCaseRequest,
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
    method: "post",
    path: "/api/v1/lc/cases/:case_id/discard",
    alias: "discard_lc_draft_api_v1_lc_cases__case_id__discard_post",
    description: `The leasing company discards its own draft (P30-33, client round 2, point 10).

No body. **Only a Draft request**; past Draft (Submitted, Missing information, Rework, …) or a
closed case → 409 &#x60;&#x60;CASE_NOT_DISCARDABLE&#x60;&#x60;, nothing changed. Own company only — another company&#x27;s,
an unknown or an already-discarded case → 404; any bank role → 404 (the portal route confirms
nothing to it); anonymous → 401. Answers 204: the draft leaves every leasing-company list, count and
read. The bank still holds it — case, request, financing and contracts Cancelled through the
existing cascade, with a &#x60;&#x60;case.draft_discarded&#x60;&#x60; activity entry. Nothing is deleted.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
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
    method: "put",
    path: "/api/v1/lc/cases/:case_id/leasing-company",
    alias: "bind_lc_own_company_api_v1_lc_cases__case_id__leasing_company_put",
    description: `The leasing company binds its own company to its request — wizard step 1 (BUG-072; was
&#x60;&#x60;PUT /cases/{id}/leasing-company&#x60;&#x60;). The same service and rules as the bank&#x27;s bind (own company only,
else 404; only while Draft or Missing information, else 409 &#x60;&#x60;LC_REQUEST_LOCKED&#x60;&#x60;; 422
&#x60;&#x60;CASE_LC_UNRESOLVED&#x60;&#x60;), answered with the leasing company&#x27;s own projection.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BindLeasingCompanyRequest,
      },
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
    method: "post",
    path: "/api/v1/lc/cases/:case_id/resubmit",
    alias: "resubmit_lc_case_api_v1_lc_cases__case_id__resubmit_post",
    description: `The leasing company sends its own request again after Missing information (US-1.96, Rule 06
§9.1 C16, §2.2.5).

Step 4&#x27;s Move back hands the data to the leasing company; once corrected, it resubmits here. Own
company only (the lookup is LC-scoped — another company&#x27;s case is 404); from Missing information
only — a Rework is the bank&#x27;s internal return and answers 404 (R8); a request not returned → 409;
the first-submission checks run (422 with the failed checks). No body. Answers with the LC&#x27;s own
projection, so no bank-internal field is returned. Held for the demo&#x27;s confirmation of A-5 (K13).`,
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
    path: "/api/v1/lc/cases/:case_id/review",
    alias: "review_lc_request_api_v1_lc_cases__case_id__review_get",
    description: `The leasing company&#x27;s one-page review of its own request before submission (BUG-072; was
&#x60;&#x60;GET /cases/{id}/review&#x60;&#x60;). The case block is its own projection; the bank&#x27;s financing block is not part
of the model at all; the agreement block keeps its LC visibility rule. Own company only — another
company&#x27;s case, an unknown or a discarded one is 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "case_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LcCaseReviewResponse,
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
    path: "/api/v1/lc/cases/:case_id/submit",
    alias: "submit_lc_request_api_v1_lc_cases__case_id__submit_post",
    description: `The leasing company submits its own request (BUG-072; was &#x60;&#x60;POST /cases/{id}/submit&#x60;&#x60;). The same
service and gates (a failed submission answers 422 with the typed &#x60;&#x60;failed_checks&#x60;&#x60;; not in Draft → 409),
answered with the leasing company&#x27;s own projection.`,
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
    method: "post",
    path: "/api/v1/lc/cases/:case_id/withdrawal-notice",
    alias:
      "signal_lc_withdrawal_api_v1_lc_cases__case_id__withdrawal_notice_post",
    description: `The leasing company tells the bank it is withdrawing (P29-11, client round 2, point 10).

Body &#x60;&#x60;{&quot;message&quot;: str | null}&#x60;&#x60; (optional, up to 2000 characters, stored as typed; blank &#x3D; none).
**No status changes** — the bank records the withdrawal. Writes a &#x60;&#x60;case.withdrawal_signalled&#x60;&#x60;
activity entry and, when a message is given, that message as an (external) comment on the case
thread. Only past Draft and while the case is open; a Draft or a closed case → 409
&#x60;&#x60;CASE_WITHDRAWAL_NOT_OFFERED&#x60;&#x60;, nothing written. Own company only — another company&#x27;s, an unknown
or a discarded case → 404; any bank role → 404; anonymous → 401; a message over 2000 → 422.
Answers 204.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LcWithdrawalNoticeRequest,
      },
      {
        name: "case_id",
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
    path: "/api/v1/lc/cases/summary",
    alias: "read_lc_portal_summary_api_v1_lc_cases_summary_get",
    description: `The leasing company&#x27;s dashboard figures — open requests and drafts — over all of its own cases.

Counted by one grouped query in the database (never by loading cases), scoped exactly like
&#x60;&#x60;GET /lc/cases&#x60;&#x60;: the tenant, the caller&#x27;s own company, a discarded draft gone. A case counts
under the badge the portal list gives it. A caller without a leasing-company binding (any bank
role) answers not-found, as on the list.`,
    requestFormat: "json",
    response: LcPortalSummaryResponse,
  },
  {
    method: "get",
    path: "/api/v1/lc/comment-notifications",
    alias: "list_lc_comment_notifications_api_v1_lc_comment_notifications_get",
    description: `The leasing-company user&#x27;s bell (US-1.113, rule 06 §4.4.1, AC1): one entry per own case on
which the bank left it a comment it has not marked as seen, newest first, at most 20. Each entry
names the newest such comment&#x27;s author and time. Any bank role answers 404.`,
    requestFormat: "json",
    response: LcCommentNotificationListResponse,
  },
  {
    method: "get",
    path: "/api/v1/lc/document-types",
    alias: "list_portal_document_types_api_v1_lc_document_types_get",
    description: `The types a party document can be uploaded under from the portal — requested types only.`,
    requestFormat: "json",
    response: PortalDocumentTypesResponse,
  },
  {
    method: "get",
    path: "/api/v1/lc/financings",
    alias: "list_lc_financings_api_v1_lc_financings_get",
    description: `The leasing company&#x27;s own financings (P29-14, P30-32; approved prototype &#x60;&#x60;vPortalFinancings&#x60;&#x60;).

Only its own company&#x27;s financings that **passed commitment**, in the portal&#x27;s own status wording
(In progress · Committed · Paid out · Running · Ended · Cancelled — Draft, Run-out and any unmapped
status are not listed); a Cancelled one only when it was cancelled after commitment. Filtered in the
query, never in the interface: search (financing number), framework agreement, portal status
(several). Every column sorts (&#x60;&#x60;sort&#x60;&#x60;). The row is the portal&#x27;s projection — reference, kind,
framework agreement name, contract count, portal status, and from the payout on the payout date,
amount and outstanding balance (off the stored plan) — with no status code, product template, rate
or loan field (rule 03 D3). A row does not open: the financing detail stays bank-only.
Leasing-company users only; a user without a company binding and every other role answer 404
(non-disclosure); an unknown sort key 422.`,
    requestFormat: "json",
    parameters: [
      {
        name: "search",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "portal_status",
        type: "Query",
        schema: z.array(PortalFinancingStatus).optional().default([]),
      },
      {
        name: "framework_agreement_id",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "sort",
        type: "Query",
        schema: z.string().optional().default("-created_at"),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(1).optional().default(1),
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(25),
      },
    ],
    response: LcFinancingListResponse,
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
    path: "/api/v1/lc/financings/framework-agreements",
    alias:
      "list_lc_financing_agreements_api_v1_lc_financings_framework_agreements_get",
    description: `P30-32 — the framework agreements the leasing company&#x27;s listed financings name, by name: the
choices of its Framework agreement filter. Its own company&#x27;s only; every other role 404.`,
    requestFormat: "json",
    response: LcFinancingAgreementOptionsResponse,
  },
  {
    method: "get",
    path: "/api/v1/lc/obligations/:business_object_id",
    alias: "get_lc_obligations_api_v1_lc_obligations__business_object_id__get",
    description: `The leasing company&#x27;s own document obligations for one case (&quot;Documents the bank needs&quot;).

Leasing-company users only. Requirements the **bank generates** (the calculation data sheet, the loan
offer, …) are not on the list — left out in the read, not hidden in the UI (P30-34, client round 2
point 7); the bank&#x27;s runtime view keeps them.`,
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
        schema: assignee_id,
      },
      {
        name: "object_type",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "case_type",
        type: "Query",
        schema: assignee_id,
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
    method: "post",
    path: "/api/v1/lc/partners/:id/documents",
    alias:
      "upload_portal_partner_document_api_v1_lc_partners__id__documents_post",
    description: `Store a document against a party this leasing company created. Multipart, like the bank&#x27;s
upload; a party it did not create answers 404, the same as an unknown id.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          Body_upload_portal_partner_document_api_v1_lc_partners__id__documents_post,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerDocumentItem,
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
    description: `Edit a lease object&#x27;s captured fields (PRD1042-1924, US 1.8). Write-window + role gated.

Partial, on the same mechanism as the contract edit above (BUG-029): &#x60;&#x60;model_fields_set&#x60;&#x60; separates
&quot;not sent&quot; from &quot;sent as null&quot;.`,
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
    method: "get",
    path: "/api/v1/partners/:id/addresses",
    alias: "list_partner_addresses_api_v1_partners__id__addresses_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerAddressListResponse,
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
    path: "/api/v1/partners/:id/addresses",
    alias: "add_partner_address_api_v1_partners__id__addresses_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerAddressInput,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerAddressResponse,
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
    path: "/api/v1/partners/:id/addresses/:address_id",
    alias:
      "update_partner_address_api_v1_partners__id__addresses__address_id__patch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerAddressInput,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "address_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerAddressResponse,
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
    path: "/api/v1/partners/:id/addresses/:address_id/retire",
    alias:
      "retire_partner_address_api_v1_partners__id__addresses__address_id__retire_post",
    description: `Retire, not delete — the row stays readable (mirrors the bank-account close route).`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "address_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerAddressResponse,
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
    path: "/api/v1/partners/:id/assessments",
    alias: "list_assessments_api_v1_partners__id__assessments_get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: AssessmentListResponse,
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
    path: "/api/v1/partners/:id/assessments",
    alias: "capture_assessment_api_v1_partners__id__assessments_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AssessmentCreateRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: AssessmentResponse,
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
    path: "/api/v1/partners/:id/assessments/:assessment_id/cancel",
    alias:
      "cancel_assessment_api_v1_partners__id__assessments__assessment_id__cancel_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1).max(500) }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "assessment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: AssessmentResponse,
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
        schema: assignee_id,
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
    path: "/api/v1/partners/:id/connections",
    alias: "list_partner_connections_api_v1_partners__id__connections_get",
    description: `Where this party already appears — its contracts and the requests carrying them.

PARTNER_VIEW, the same read right as the other partner-scoped reads: it excludes support_user
and leasing_company_user, and an LC must not learn which other companies a party deals with.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerConnectionsResponse,
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
        schema: assignee_id,
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
    method: "get",
    path: "/api/v1/partners/:id/documents",
    alias: "list_partner_documents_api_v1_partners__id__documents_get",
    description: `The documents kept on this party. Each row names the media object &quot;Open&quot; streams.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerDocumentsResponse,
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
    path: "/api/v1/partners/:id/documents",
    alias: "upload_partner_document_api_v1_partners__id__documents_post",
    description: `Store a document against this party.

Multipart, mirroring the case-document upload. The declared MIME type is the CLIENT&#x27;s claim and
is treated as such: the service checks it against the whitelist, caps the size, and confirms the
bytes really are that format before anything is stored.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema:
          Body_upload_partner_document_api_v1_partners__id__documents_post,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerDocumentItem,
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
    method: "put",
    path: "/api/v1/partners/:id/os-plus",
    alias: "edit_os_plus_api_v1_partners__id__os_plus_put",
    description: `The OS+ person number on its own (P30-50) — maintained by the Power User, Front Office and Back
Office (the PM&#x27;s answer of 5 Oct, point 2), with the dealer numbers&#x27; permission. It is the Power
User&#x27;s way in: Edit party stays Front and Back Office (P30-18). &#x60;&#x60;null&#x60;&#x60; clears the number; a
change is one &#x60;&#x60;PARTNER_UPDATED&#x60;&#x60; Activity entry, before → after. Returns the page detail with the
new &#x60;&#x60;version&#x60;&#x60;.

* 409 &#x60;&#x60;PARTNER_VERSION_CONFLICT&#x60;&#x60; — &#x60;&#x60;version&#x60;&#x60; is not the party&#x27;s; &#x60;&#x60;PARTY_NOT_EDITABLE&#x60;&#x60; — the
  party is not confirmed.
* 422 — a value longer than 50 characters, or a missing &#x60;&#x60;version&#x60;&#x60;.
* 404 — an unknown party or another tenant&#x27;s. Nothing is written on any refusal.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OsPlusEditRequest,
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
    method: "put",
    path: "/api/v1/partners/:id/party",
    alias: "edit_party_api_v1_partners__id__party_put",
    description: `Edit party (P30-18; M2 spec §6.3) — the partner page&#x27;s edit mode saved in one transaction.

Front Office and Back Office only (not the Power User, M2 spec §2). Writes directly, without the
Back Office approval of identifier changes; every changed value is logged before → after (one
Activity entry per field), and a changed CREFO / Schufa / VAT ID re-runs the duplicate check on
that anchor (a pending pair, nothing blocked). Returns the page detail with the new &#x60;&#x60;version&#x60;&#x60;.

* 409 &#x60;&#x60;PARTNER_VERSION_CONFLICT&#x60;&#x60; — &#x60;&#x60;version&#x60;&#x60; is not the party&#x27;s (someone saved in between);
  &#x60;&#x60;PARTY_NOT_EDITABLE&#x60;&#x60; — the party is not confirmed (draft / pending: &#x60;&#x60;PATCH /partners/{id}&#x60;&#x60;;
  rejected / merged / archived: final); &#x60;&#x60;PARTNER_ADDRESS_RETIRED&#x60;&#x60; / &#x60;&#x60;…_LAST_ACTIVE&#x60;&#x60; from the
  address changes.
* 422 &#x60;&#x60;PARTNER_TYPE_LOCKED&#x60;&#x60; — a different party type; &#x60;&#x60;PARTNER_DEALER_NUMBER_REQUIRED&#x60;&#x60; — a
  leasing company without a dealer number; field formats (4-digit dealer numbers, …).
* 404 — an unknown party, another tenant&#x27;s, or an address that is not the party&#x27;s. Nothing is
  written on any refusal.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartyEditRequest,
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
    path: "/api/v1/partners/:id/relationships",
    alias: "list_partner_relationships_api_v1_partners__id__relationships_get",
    description: `How this party stands to other parties, plus its beneficial owners (read-only here).`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerRelationshipsResponse,
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
    path: "/api/v1/partners/:id/relationships",
    alias: "add_partner_relationship_api_v1_partners__id__relationships_post",
    description: `Record one edge — Front Office and Back Office only (P30-21, M2 spec §2:
PARTNER_RELATIONSHIP_MANAGE; the Power User keeps PARTNER_EDIT but not this).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerRelationshipCreateRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerRelationshipItem,
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
    method: "get",
    path: "/api/v1/partners/:ref_id/activity",
    alias: "get_party_activity",
    description: `The entity&#x27;s own events (its comments included), newest first, values masked.`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
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
    path: "/api/v1/partners/:ref_id/comments",
    alias: "list_party_comments",
    description: `Newest first. Bank-only: every comment is internal, and the leasing company never
reaches the thread (404).`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
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
        schema: z.number().int().gte(1).lte(200).optional().default(100),
      },
    ],
    response: CaseCommentListResponse,
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
    path: "/api/v1/partners/:ref_id/comments",
    alias: "add_party_comment",
    description: `Always stored as internal, whatever &#x60;&#x60;visibility&#x60;&#x60; says: the thread is bank-only.
Audited on the entity itself, so it appears in its Activity trail.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddCaseCommentRequest,
      },
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/partners/:ref_id/comments/:comment_id",
    alias: "edit_party_comment",
    description: `Author only (403 otherwise); a deleted comment cannot be edited (409).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ body: z.string().min(1).max(2000) }).passthrough(),
      },
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/partners/:ref_id/comments/:comment_id",
    alias: "delete_party_comment",
    description: `Author only (403 otherwise); a second delete is refused (409). The tombstone is returned.`,
    requestFormat: "json",
    parameters: [
      {
        name: "ref_id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "comment_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CaseCommentItem,
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
    path: "/api/v1/partners/assessment-catalogue",
    alias: "get_assessment_catalogue_api_v1_partners_assessment_catalogue_get",
    requestFormat: "json",
    response: AssessmentCatalogueResponse,
  },
  {
    method: "post",
    path: "/api/v1/partners/duplicates/:id/keep-apart",
    alias:
      "keep_duplicate_apart_api_v1_partners_duplicates__id__keep_apart_post",
    description: `The two are different parties: the pair is kept apart (&#x60;&#x60;confirmed_distinct&#x60;&#x60;) and suppressed.
An unknown pair → 404; an already resolved pair → 409.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DuplicateKeepApartRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DuplicateResolutionResultResponse,
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
    path: "/api/v1/partners/duplicates/:id/merge",
    alias: "merge_duplicate_pair_api_v1_partners_duplicates__id__merge_post",
    description: `The survivor stays; the other record is retired (stays readable) and its roles and references
move to the survivor tenant-wide, in one transaction. A survivor outside the pair → 422; a record
named as a leasing company → 409; an unknown pair → 404; an already resolved pair → 409.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DuplicateMergeRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DuplicateResolutionResultResponse,
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
    path: "/api/v1/partners/duplicates/:id/resolution",
    alias:
      "get_duplicate_resolution_api_v1_partners_duplicates__id__resolution_get",
    description: `The pair, and each record with the roles it plays on live contracts — the survivor cards and
the merge preview (survivor, retired, roles that move). An unknown pair → 404.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DuplicatePairResolutionResponse,
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
        schema: assignee_id,
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
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "from_date",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "to_date",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "module_key",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "to_date",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "cursor",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
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

The module is set to &#x60;pending_enforcement&#x60; and a SECOND System Admin must approve via
POST /governed-actions/{id}/approve before it becomes active. Until then the module&#x27;s routes
answer 404 (existence non-disclosure). The 201 response (BUG-015) states the pending state
explicitly so the caller is not surprised by that 404; track approvals at
GET /governed-actions?status&#x3D;pending.`,
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
    response: ModuleActivationResponse,
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
    description: `Submit a partner as Draft. No screen calls this since P30-17 (the register&#x27;s New party uses
&#x60;&#x60;…/capture&#x60;&#x60;); it keeps the party mask&#x27;s roles, FO + BO, so no role creates a party here that
the screens do not allow.`,
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
        schema: assignee_id,
      },
      {
        name: "status",
        type: "Query",
        schema: z.array(PartnerStatus).optional().default([]),
      },
      {
        name: "partner_type",
        type: "Query",
        schema: z.array(PartnerType).optional().default([]),
      },
      {
        name: "role",
        type: "Query",
        schema: z.array(RegistryRole).optional().default([]),
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
        name: "referenceable",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "sort",
        type: "Query",
        schema: z.string().optional().default("-created_at"),
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
    method: "post",
    path: "/api/v1/tenants/:tenant_id/partners/capture",
    alias: "capture_partner_api_v1_tenants__tenant_id__partners_capture_post",
    description: `New party in the partner register (P30-17): the one party mask, the same outcome as the
contract form&#x27;s Create party. Creates the party **confirmed** with its addresses and dealer
numbers in one transaction (201); a duplicate hit opens an advisory pair and never
blocks. An exact match to a confirmed partner returns that partner untouched (200), unless
&#x60;&#x60;keep_both&#x60;&#x60;. FO + BO.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartnerCaptureRequest,
      },
      {
        name: "tenant_id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PartnerCaptureResponse,
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
    description: `The party mask&#x27;s Check for duplicates (register New party, and the contract form before its
contract exists) — FO + BO, the mask&#x27;s roles (P30-17). Creates nothing.`,
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
        schema: assignee_id,
      },
      {
        name: "status",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "last_login_from",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "last_login_to",
        type: "Query",
        schema: assignee_id,
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
        schema: assignee_id,
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
        schema: assignee_id,
      },
      {
        name: "last_login_from",
        type: "Query",
        schema: assignee_id,
      },
      {
        name: "last_login_to",
        type: "Query",
        schema: assignee_id,
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
    path: "/api/v1/users/me/detail",
    alias: "get_me_detail_api_v1_users_me_detail_get",
    description: `Return the full detail of the currently authenticated user — the shape of &#x60;GET /{id}&#x60;
(tenant name, invited by, approved by), for the user&#x27;s own profile page.

**Requirements:** Valid &#x60;access_token&#x60; HTTP-only cookie. No permission beyond being signed in:
every role reads its own record here, a leasing-company user included, while &#x60;GET /{id}&#x60;
stays behind &#x60;user:read&#x60;. There is no id parameter, so only the caller&#x27;s record is returned.`,
    requestFormat: "json",
    response: UserDetailResponse,
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
        schema: assignee_id,
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
        schema: assignee_id,
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
