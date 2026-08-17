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
const search = z.union([z.string(), z.null()]).optional()
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
const SubjectType = z.enum(["USER", "TENANT", "PARTNER"])
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
const PartnerType = z.enum([
  "legal_entity",
  "natural_person",
  "registered_sole_trader",
])
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
const PartnerMatchResponse = z
  .object({
    classification: z.string(),
    confidence: z.union([z.string(), z.null()]),
    matched_partner_id: z.union([z.string(), z.null()]),
    candidate_summaries: z.array(CandidateSummary),
    inputs_hash: z.string(),
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
const FirstInstallmentRule = z.enum([
  "submission_month",
  "following_month",
  "configurable_offset",
])
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
    first_installment_rule: z.union([FirstInstallmentRule, z.null()]),
    disbursement_derivation_rule: z.union([
      DisbursementDerivationRule,
      z.null(),
    ]),
    allowed_asset_categories: z.union([z.array(AssetCategory), z.null()]),
    min_term_months: z.union([z.number(), z.null()]),
    max_term_months: z.union([z.number(), z.null()]),
    max_ltv_ratio: z.union([z.string(), z.null()]),
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
    first_installment_rule: z.union([FirstInstallmentRule, z.null()]),
    disbursement_derivation_rule: z.union([
      DisbursementDerivationRule,
      z.null(),
    ]),
    allowed_asset_categories: z.union([z.array(AssetCategory), z.null()]),
    min_term_months: z.union([z.number(), z.null()]),
    max_term_months: z.union([z.number(), z.null()]),
    max_ltv_ratio: z.union([z.number(), z.string(), z.null()]),
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
const TemplateStatus = z.enum([
  "draft",
  "scheduled",
  "active",
  "superseded",
  "terminated",
  "discarded",
])
const status = z.union([TemplateStatus, z.null()]).optional()
const TemplateCurrentVersionSummary = z
  .object({
    version_id: z.string().uuid(),
    version_number: z.string(),
    version_status: z.string(),
    refinancing_form: RefinancingForm,
    legal_structure: LegalStructure,
    payment_timing: PaymentTiming,
    max_ltv_ratio: z.union([z.string(), z.null()]).optional(),
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
    first_installment_rule: z
      .union([FirstInstallmentRule, z.null()])
      .optional(),
    disbursement_derivation_rule: z
      .union([DisbursementDerivationRule, z.null()])
      .optional(),
    allowed_asset_categories: z
      .union([z.array(AssetCategory), z.null()])
      .optional(),
    min_term_months: z.union([z.number(), z.null()]).optional(),
    max_term_months: z.union([z.number(), z.null()]).optional(),
    max_ltv_ratio: z.union([z.number(), z.string(), z.null()]).optional(),
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
    vfe_amount_eur: z.union([z.number(), z.string(), z.null()]).optional(),
    payout_account_id: z.union([z.string(), z.null()]).optional(),
    collection_account_id: z.union([z.string(), z.null()]).optional(),
    product_template_ids: z.array(z.string().uuid()).min(1),
    product_template_version_pins: z
      .union([z.record(z.string(), z.string().uuid()), z.null()])
      .optional(),
  })
  .passthrough()
const FALifecycleStatus = z.enum(["draft", "active", "terminated"])
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
    vfe_amount_eur: z.union([z.string(), z.null()]),
    payout_account_id: z.union([z.string(), z.null()]),
    collection_account_id: z.union([z.string(), z.null()]),
    product_template_ids: z.array(z.string().uuid()),
    edit_version_counter: z.number().int(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough()
const FAAgreementLifecycle = z.enum([
  "draft",
  "active",
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
    product_template_version_pins: z.record(
      z.string(),
      z.union([z.string(), z.null()])
    ),
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
    effective_from: z.union([z.string(), z.null()]),
    activated_at: z.union([z.string(), z.null()]),
    activated_by: z.union([z.string(), z.null()]),
    activated_by_name: z.union([z.string(), z.null()]),
    suspended_at: z.union([z.string(), z.null()]),
    suspended_by: z.union([z.string(), z.null()]),
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
const FALCPartnerItem = z
  .object({ id: z.string().uuid(), legal_name: z.string() })
  .passthrough()
const FALCPartnersResponse = z
  .object({ items: z.array(FALCPartnerItem) })
  .passthrough()
const FAUtilizationResponse = z
  .object({
    max_volume_eur: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
    disbursed_volume_eur: z.union([z.string(), z.null()]).optional(),
    redeemed_volume_eur: z.union([z.string(), z.null()]).optional(),
    net_exposure_eur: z.union([z.string(), z.null()]).optional(),
    available_volume_eur: z.union([z.string(), z.null()]).optional(),
    utilization_pct: z.union([z.string(), z.null()]).optional(),
    limit_available_flag: z.union([z.boolean(), z.null()]).optional(),
    limit_breach_flag: z.union([z.boolean(), z.null()]).optional(),
    last_refreshed_at: z.union([z.string(), z.null()]).optional(),
    source: z.string().optional().default("limit_management"),
    available: z.boolean().optional().default(false),
  })
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
    document_type: z.string(),
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
    max_volume_eur: z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/),
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
const product_template_id = z
  .union([z.array(z.string().uuid()), z.null()])
  .optional()
const CatalogState = z.enum(["draft", "active", "suspended", "archived"])
const catalog_state = z.union([z.array(CatalogState), z.null()]).optional()
const CaseType = z.enum([
  "main_process",
  "package_redemption",
  "single_redemption",
  "lessee_change",
  "object_swap",
  "extension",
  "asset_event",
])
const CatalogListItemResponse = z
  .object({
    id: z.string().uuid(),
    catalog_name: z.string(),
    catalog_layer: CatalogLayer,
    catalog_state: CatalogState,
    entity_type: z.union([CatalogEntityType, z.null()]),
    entity_id: z.union([z.string(), z.null()]),
    case_type: z.union([CaseType, z.null()]).optional(),
    valid_from: z.string(),
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
      valid_from: z.string(),
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
      valid_from: z.string(),
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
      entity_type: z.union([CatalogEntityType, z.null()]),
      entity_id: z.union([z.string(), z.null()]),
      catalog_state: CatalogState,
      valid_from: z.string(),
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
    applicable_process_contexts: z.union([z.array(z.string()), z.null()]),
  })
  .partial()
  .passthrough()
const CatalogType = z.enum(["global_default", "product_specific"])
const app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse =
  z
    .object({
      id: z.string().uuid(),
      catalog_name: z.string(),
      catalog_type: CatalogType,
      applicable_process_contexts: z.array(z.string()),
      product_template_id: z.union([z.string(), z.null()]),
      valid_from: z.union([z.string(), z.null()]),
      valid_to: z.union([z.string(), z.null()]),
      created_by: z.string().uuid(),
      created_at: z.string().datetime({ offset: true }),
      updated_at: z.string().datetime({ offset: true }),
    })
    .passthrough()
const RequirementClassification = z.enum([
  "mandatory",
  "optional",
  "conditional",
])
const GovernanceClassification = z.enum([
  "operational",
  "compliance_sensitive",
  "regulatory_critical",
])
const SourceLayer = z.enum(["default", "override", "supplement", "deactivated"])
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
    governance_classification: GovernanceClassification,
    source_layer: SourceLayer,
    applicable_process_contexts: z.array(z.string()),
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
      catalog_type: CatalogType,
      applicable_process_contexts: z.array(z.string()),
      product_template_id: z.union([z.string(), z.null()]),
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
      catalog_type: CatalogType,
      applicable_process_contexts: z.array(z.string()).min(1),
      product_template_id: z.union([z.string(), z.null()]).optional(),
      valid_from: z.union([z.string(), z.null()]).optional(),
      valid_to: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough()
const catalog_type = z.union([CatalogType, z.null()]).optional()
const CatalogListItem = z
  .object({
    id: z.string().uuid(),
    catalog_name: z.string(),
    catalog_type: CatalogType,
    applicable_process_contexts: z.array(z.string()),
    product_template_id: z.union([z.string(), z.null()]),
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
    governance_classification: GovernanceClassification,
    source_layer: z.union([SourceLayer, z.null()]).optional(),
    applicable_process_contexts: z.array(z.string()).min(1),
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
    governance_classification: z.union([GovernanceClassification, z.null()]),
    applicable_process_contexts: z.union([z.array(z.string()), z.null()]),
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
    requirement_definition_id: z.string().uuid(),
    requirement_code: z.string(),
    document_type_name: z.string(),
    classification: z.string(),
    source_layer: z.string(),
    stage_categorization: z.union([z.string(), z.null()]),
    fulfilment_status: z.string(),
    is_blocking: z.boolean(),
    document_origin: z.string(),
  })
  .passthrough()
const RuntimeRequirementSurfaceResponse = z
  .object({
    catalog_id: z.string().uuid(),
    business_object_id: z.string().uuid(),
    process_context: z.string(),
    completeness_summary: z.string(),
    requirements: z.array(RuntimeRequirementItem),
  })
  .passthrough()
const MaterializeRequest = z
  .object({
    process_context: z.string(),
    framework_agreement_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()
const MaterializedRequirementResponse = z
  .object({
    requirement_definition_id: z.union([z.string(), z.null()]),
    requirement_code: z.string(),
    document_type_code: z.string(),
    document_type_name: z.string(),
    classification: z.string(),
    governance_classification: z.string(),
    source_layer: z.string(),
    stage_categorization: z.union([z.string(), z.null()]),
    applicable_process_contexts: z.array(z.string()),
    document_origin: z.string(),
  })
  .passthrough()
const MaterializationResponse = z
  .object({
    catalog_id: z.string().uuid(),
    process_context: z.string(),
    effective_requirements: z.array(MaterializedRequirementResponse),
    total: z.number().int(),
  })
  .passthrough()
const LCObligationItem = z
  .object({
    document_type_name: z.string(),
    is_mandatory: z.boolean(),
    fulfilment_status: z.string(),
    action_needed: z.boolean(),
  })
  .passthrough()
const LCObligationResponse = z
  .object({
    business_object_id: z.string().uuid(),
    process_context: z.string(),
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
    requirement_definition_id: z.string().uuid(),
    requirement_code: z.string(),
    classification: z.string(),
    status: z.string(),
  })
  .passthrough()
const CompletenessResponse = z
  .object({
    catalog_id: z.string().uuid(),
    process_context: z.string(),
    business_object_id: z.string().uuid(),
    summary: z.string(),
    mandatory_total: z.number().int(),
    mandatory_fulfilled: z.number().int(),
    mandatory_pending: z.number().int(),
    mandatory_missing: z.number().int(),
    per_requirement: z.array(PerRequirementStatusResponse),
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
  UpdateMeRequest,
  UserMePermissionsResponse,
  AccessReason,
  GrantStatus,
  SupportGrantResponse,
  Body_upload_picture_api_v1_users_me_picture_post,
  search,
  UserListItem,
  PaginatedUsersResponse,
  InviteUserRequest,
  app__modules__users__interfaces__http__schemas__user_schemas__UserRef,
  UserDetailResponse,
  EditUserRequest,
  ChangeEmailRequest,
  GovernedActionType,
  GovernedActionStatus,
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
  PartnerType,
  RegisteredAddress,
  LegalEntityIdentityDetail,
  NaturalPersonIdentityDetail,
  SoleProprietorIdentityDetail,
  PartnerDetailResponse,
  ResolutionEventSummary,
  CandidateSummary,
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
  RegisteredAddressInput,
  LegalEntityIdentityInput,
  NaturalPersonIdentityInput,
  SoleProprietorIdentityInput,
  PartnerMatchRequest,
  PartnerMatchResponse,
  PartnerSubmitRequest,
  PartnerSubmitResponse,
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
  FirstInstallmentRule,
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
  TemplateStatus,
  status,
  TemplateCurrentVersionSummary,
  TemplateListItem,
  TemplateListResponse,
  CreateTemplateDraftRequest,
  TemplateDraftCreatedResponse,
  BankEntity,
  RefiLoanValueDateRule,
  CreateFARequest,
  FALifecycleStatus,
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
  product_template_id,
  CatalogState,
  catalog_state,
  CaseType,
  CatalogListItemResponse,
  app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse,
  app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest,
  app__modules__workflow_task_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
  SuspendCatalogResponse,
  FieldRegistryItem,
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
  PhaseGateStatus,
  PhaseGateResponse,
  SetPhaseGateRequest,
  VfeRateResponse,
  VfeRateListResponse,
  VfeRateCreateRequest,
  VfeRateUpdateRequest,
  UpdateCatalogRequest,
  CatalogType,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogResponse,
  RequirementClassification,
  GovernanceClassification,
  SourceLayer,
  app__modules__document_requirement_catalog__domain__enums__StageCategorization,
  DocumentOrigin,
  RequirementResponse,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogDetailResponse,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CreateCatalogRequest,
  catalog_type,
  CatalogListItem,
  app__modules__document_requirement_catalog__interfaces__http__schemas__catalog_schemas__CatalogListResponse,
  AddRequirementRequest,
  RequirementListResponse,
  UpdateRequirementRequest,
  RuntimeRequirementItem,
  RuntimeRequirementSurfaceResponse,
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
  DocumentRoleScope,
  DocumentTypeOrigin,
  CreateDocumentTypeRequest,
  DocumentTypeResponse,
  origin,
  role_scope,
  DocumentTypeListResponse,
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
        schema: search,
      },
      {
        name: "action_type",
        type: "Query",
        schema: search,
      },
      {
        name: "event_type",
        type: "Query",
        schema: search,
      },
      {
        name: "entity_id",
        type: "Query",
        schema: search,
      },
      {
        name: "actor_id",
        type: "Query",
        schema: search,
      },
      {
        name: "actor_type",
        type: "Query",
        schema: search,
      },
      {
        name: "trigger_source",
        type: "Query",
        schema: search,
      },
      {
        name: "sensitive",
        type: "Query",
        schema: module_active,
      },
      {
        name: "from_dt",
        type: "Query",
        schema: search,
      },
      {
        name: "to_dt",
        type: "Query",
        schema: search,
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
        schema: search,
      },
      {
        name: "event_type",
        type: "Query",
        schema: search,
      },
      {
        name: "actor_id",
        type: "Query",
        schema: search,
      },
      {
        name: "actor_type",
        type: "Query",
        schema: search,
      },
      {
        name: "trigger_source",
        type: "Query",
        schema: search,
      },
      {
        name: "sensitive",
        type: "Query",
        schema: module_active,
      },
      {
        name: "from_dt",
        type: "Query",
        schema: search,
      },
      {
        name: "to_dt",
        type: "Query",
        schema: search,
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
        name: "process_context",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "business_object_id",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "business_object_type",
        type: "Query",
        schema: z.string(),
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
        schema: z.string(),
      },
      {
        name: "process_context",
        type: "Query",
        schema: z.string(),
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
        name: "process_context",
        type: "Query",
        schema: z.string(),
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
        schema: search,
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
        schema: search,
      },
      {
        name: "valid_until",
        type: "Query",
        schema: search,
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
        schema: search,
      },
      {
        name: "type",
        type: "Query",
        schema: z.array(FAEventTypeFilter).optional().default([]),
      },
      {
        name: "from",
        type: "Query",
        schema: search,
      },
      {
        name: "to",
        type: "Query",
        schema: search,
      },
      {
        name: "per_page",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(50),
      },
      {
        name: "cursor",
        type: "Query",
        schema: search,
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
        schema: search,
      },
      {
        name: "search",
        type: "Query",
        schema: search,
      },
      {
        name: "type",
        type: "Query",
        schema: z.array(FAEventTypeFilter).optional().default([]),
      },
      {
        name: "from",
        type: "Query",
        schema: search,
      },
      {
        name: "to",
        type: "Query",
        schema: search,
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
        schema: search,
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
        schema: search,
      },
      {
        name: "valid_until",
        type: "Query",
        schema: search,
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
        schema: search,
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
        schema: z.string().uuid(),
      },
      {
        name: "object_type",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "process_context",
        type: "Query",
        schema: z.string(),
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

Access is granted if the caller owns the file or is a system_admin.
Returns 404 for non-existent or unauthorized files (non-disclosing).`,
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
        schema: search,
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
        schema: search,
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
        schema: search,
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
        schema: search,
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
        schema: search,
      },
      {
        name: "from_date",
        type: "Query",
        schema: search,
      },
      {
        name: "to_date",
        type: "Query",
        schema: search,
      },
      {
        name: "module_key",
        type: "Query",
        schema: search,
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
        schema: search,
      },
      {
        name: "to_date",
        type: "Query",
        schema: search,
      },
      {
        name: "cursor",
        type: "Query",
        schema: search,
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
        schema: search,
      },
      {
        name: "catalog_type",
        type: "Query",
        schema: catalog_type,
      },
      {
        name: "process_context",
        type: "Query",
        schema: search,
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
        schema: search,
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
        schema: search,
      },
      {
        name: "status",
        type: "Query",
        schema: status,
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
        schema: search,
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
        schema: search,
      },
      {
        name: "last_login_from",
        type: "Query",
        schema: search,
      },
      {
        name: "last_login_to",
        type: "Query",
        schema: search,
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
        schema: search,
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
        schema: search,
      },
      {
        name: "last_login_from",
        type: "Query",
        schema: search,
      },
      {
        name: "last_login_to",
        type: "Query",
        schema: search,
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
        schema: search,
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
        schema: search,
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
