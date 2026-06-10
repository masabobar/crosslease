import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core"
import { z } from "zod"

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
const LoginRequest = z
  .object({ email: z.string().email(), password: z.string() })
  .passthrough()
const MfaRequiredResponse = z
  .object({
    status: z.string().optional().default("MFA_REQUIRED"),
    verification_token: z.string(),
    expires_in: z.number().int(),
  })
  .passthrough()
const VerifyOtpRequest = z
  .object({ verification_token: z.string(), code: z.string().min(6).max(6) })
  .passthrough()
const UserRole = z.enum([
  "system_admin",
  "support_user",
  "auditor",
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
    access_valid_until: z.union([z.string(), z.null()]),
    invited_by: z.union([z.string(), z.null()]),
    invited_at: z.union([z.string(), z.null()]),
    activated_at: z.union([z.string(), z.null()]),
    last_login: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
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
const UpdateMeRequest = z
  .object({ phone_number: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const UserMePermissionsResponse = z
  .object({
    role: z.string(),
    permissions: z.array(z.string()),
    active_modules: z.array(z.string()),
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
  })
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
    phone_number: z.union([z.string(), z.null()]),
    pending_email: z.union([z.string(), z.null()]),
    profile_picture_url: z.union([z.string(), z.null()]),
    access_valid_until: z.union([z.string(), z.null()]),
    invited_by_user_id: z.union([z.string(), z.null()]),
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
  "user_platform_invite",
  "user_role_change",
  "user_auditor_period_update",
  "user_email_change",
  "module_activate",
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
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
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
  .object({ comment: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const ReInitiateRequest = z
  .object({ reason: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough()
const sensitive = z.union([z.boolean(), z.null()]).optional()
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
    old_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    new_data: z.union([z.object({}).partial().passthrough(), z.null()]),
    changed_fields: z.union([z.array(z.string()), z.null()]),
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
const PaginatedAuditEventsResponse = z
  .object({
    events: z.array(AuditEventResponse),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
    total_pages: z.number().int(),
  })
  .passthrough()
const TestSessionRequest = z.object({ email: z.string().email() }).passthrough()
const OTPResponse = z
  .object({
    code: z.string(),
    expires_at: z.string().datetime({ offset: true }),
  })
  .passthrough()

export const schemas = {
  ValidationError,
  HTTPValidationError,
  SetPasswordRequest,
  LoginRequest,
  MfaRequiredResponse,
  VerifyOtpRequest,
  UserRole,
  UserStatus,
  UserResponse,
  LoginResponse,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateMeRequest,
  UserMePermissionsResponse,
  Body_upload_picture_api_v1_users_me_picture_post,
  search,
  UserListItem,
  PaginatedUsersResponse,
  InviteUserRequest,
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
  SeedPackage,
  CreateTenantRequest,
  TenantStatus,
  TenantListResponse,
  PaginatedTenantsResponse,
  TenantResponse,
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
  PaginatedGovernedActionsResponse,
  ApproveRejectRequest,
  ReInitiateRequest,
  sensitive,
  AuditEventResponse,
  PaginatedAuditEventsResponse,
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
        schema: sensitive,
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
    method: "post",
    path: "/api/v1/auth/forgot-password",
    alias: "forgot_password_api_v1_auth_forgot_password_post",
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
    path: "/api/v1/auth/login",
    alias: "login_api_v1_auth_login_post",
    description: `First step of the two-step login flow.

**Flow:**
1. Validates email and password
2. Checks account status (active, not locked, not suspended)
3. Generates a 6-digit OTP and sends it to the user&#x27;s email
4. Returns a short-lived &#x60;verification_token&#x60; (5 min) to be used in &#x60;/verify-otp&#x60;

**Rate limiting:** 5 failed IP attempts per 10 min triggers IP throttle; 5 failed user attempts triggers a 15-min account lock.

**Returns:** &#x60;verification_token&#x60; + &#x60;expires_in&#x60; seconds`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginRequest,
      },
    ],
    response: MfaRequiredResponse,
    errors: [
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
    path: "/api/v1/auth/resend-otp",
    alias: "resend_otp_api_v1_auth_resend_otp_post",
    description: `Resend the OTP code for an in-progress login.

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
    path: "/api/v1/auth/reset-password",
    alias: "reset_password_api_v1_auth_reset_password_post",
    description: `Complete the password reset flow by setting a new password.

**Requirements:**
- Valid, unexpired reset token (1h TTL)
- Password min 8 chars, at least 1 uppercase letter and 1 number
- &#x60;password&#x60; and &#x60;password_confirm&#x60; must match

**Effect:** Updates password hash, clears &#x60;password_reset_token_hash&#x60;, invalidates all active sessions (&#x60;logout_all&#x60; timestamp + clears session set).

**Returns:** &#x60;PASSWORD_RESET_SUCCESS&#x60; — user must log in again on all devices`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResetPasswordRequest,
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
    path: "/api/v1/auth/set-password",
    alias: "set_password_api_v1_auth_set_password_post",
    description: `Complete account activation by setting the initial password.

**Requirements:**
- Valid, unexpired invitation token
- Password min 8 chars, at least 1 uppercase letter and 1 number
- &#x60;password&#x60; and &#x60;password_confirm&#x60; must match

**Effect:** Sets password hash, changes status to &#x60;active&#x60;, records &#x60;activated_at&#x60;, clears &#x60;invite_token_hash&#x60;.

**Returns:** &#x60;ACCOUNT_ACTIVATED&#x60; success — user can now log in`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetPasswordRequest,
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
    path: "/api/v1/auth/validate-reset-token",
    alias: "validate_reset_token_api_v1_auth_validate_reset_token_get",
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
    method: "get",
    path: "/api/v1/auth/validate-token",
    alias: "validate_activation_token_api_v1_auth_validate_token_get",
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
    path: "/api/v1/auth/verify-otp",
    alias: "verify_otp_api_v1_auth_verify_otp_post",
    description: `Second step of the two-step login flow.

**Flow:**
1. Validates &#x60;verification_token&#x60; (must not be expired)
2. Verifies the 6-digit OTP code (max 3 attempts)
3. Evicts oldest session if &#x60;MAX_CONCURRENT_SESSIONS&#x60; (5) is reached
4. Issues &#x60;access_token&#x60; (15 min) + &#x60;refresh_token&#x60; (7 days) as HTTP-only cookies

**Returns:** Full user object. Tokens are delivered via HTTP-only Secure cookies.`,
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
    path: "/api/v1/media/:media_id",
    alias: "serve_media_api_v1_media__media_id__get",
    description: `Stream a media file from S3. Requires valid session.

Access is granted if the caller owns the file or is a system_admin.
Returns 404 for non-existent or unauthorized files (non-disclosing).`,
    requestFormat: "json",
    parameters: [
      {
        name: "media_id",
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
    path: "/api/v1/tenants",
    alias: "create_tenant_api_v1_tenants_post",
    description: `Initiate a Four-Eyes tenant creation request. Requires &#x60;system_admin&#x60; role.

Tenant is pre-created in &#x60;draft&#x60; status. The governed action remains pending
until a different system_admin approves it. After approval the tenant stays
in &#x60;draft&#x60; — activate separately via &#x60;POST /tenants/{id}/activate&#x60;.
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
    method: "post",
    path: "/api/v1/tenants/:id/activate",
    alias: "activate_tenant_api_v1_tenants__id__activate_post",
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
- &#x60;auditor&#x60; — &#x60;access_valid_until&#x60; required.`,
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

**Returns:** &#x60;UserDetailResponse&#x60; including &#x60;tenant_name&#x60; and &#x60;invited_by_user_id&#x60; (human-readable USR-XXXXX format)`,
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
    path: "/api/v1/users/:user_id/change-role",
    alias: "initiate_role_change_api_v1_users__user_id__change_role_post",
    description: `Initiate a Four-Eyes role change request for a user. Requires &#x60;user:change_role&#x60; permission.

User must be in &#x60;active&#x60; status. The request remains pending until a different
system_admin approves it. Only one pending role-change request is allowed per user at a time.

**Returns:** &#x60;GovernedActionResponse&#x60; with &#x60;status&#x3D;pending&#x60;`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: InitiateRoleChangeRequest,
      },
      {
        name: "user_id",
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
    path: "/api/v1/users/:user_id/update-access-period",
    alias:
      "initiate_auditor_period_update_api_v1_users__user_id__update_access_period_post",
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
        name: "user_id",
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
    description: `Update the current user&#x27;s own profile. Only &#x60;phone_number&#x60; can be changed.
Requires valid &#x60;access_token&#x60; cookie.`,
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
