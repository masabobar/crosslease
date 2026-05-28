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
  "pending_activation",
  "invited",
  "active",
  "suspended",
  "deactivated",
  "expired",
])
const UserResponse = z
  .object({
    id: z.string().uuid(),
    user_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    role: UserRole,
    permissions: z.array(z.string()).optional(),
    tenant_id: z.union([z.string(), z.null()]),
    status: UserStatus,
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
    access_valid_until: z.union([z.string(), z.null()]),
    invited_by_user_id: z.union([z.string(), z.null()]),
    invited_at: z.union([z.string(), z.null()]),
    activated_at: z.union([z.string(), z.null()]),
    last_login: z.union([z.string(), z.null()]),
    created_at: z.string().datetime({ offset: true }),
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
const CreateTenantRequest = z
  .object({
    name: z.string().min(2).max(200),
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    legal_entity_name: z.string().min(2).max(300),
    country: z.string().min(2).max(100),
    default_currency: z.string().min(3).max(10).optional().default("EUR"),
  })
  .passthrough()
const TenantStatus = z.enum(["draft", "active", "suspended", "archived"])
const TenantListResponse = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string(),
    name: z.string(),
    code: z.string(),
    country: z.string(),
    default_currency: z.string(),
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
    status: TenantStatus,
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
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
  search,
  UserListItem,
  PaginatedUsersResponse,
  InviteUserRequest,
  UserDetailResponse,
  ResendReason,
  ResendInvitationRequest,
  SuspensionReason,
  SuspendUserRequest,
  ReactivationReason,
  ReactivateUserRequest,
  DeactivationReason,
  DeactivateUserRequest,
  CreateTenantRequest,
  TenantStatus,
  TenantListResponse,
  PaginatedTenantsResponse,
  TenantResponse,
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
    method: "post",
    path: "/api/v1/tenants",
    alias: "create_tenant_api_v1_tenants_post",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTenantRequest,
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
- Platform roles (&#x60;system_admin&#x60;, &#x60;support_user&#x60;, &#x60;auditor&#x60;) — &#x60;tenant_id&#x60; must be null
- Tenant roles (&#x60;front_office&#x60;, &#x60;back_office&#x60;, &#x60;leasing_company_user&#x60;) — &#x60;tenant_id&#x60; required, tenant must be active
- &#x60;auditor&#x60; — &#x60;access_valid_until&#x60; required

**Effect:** Creates user record; for tenant-level roles sends activation email with invite link (48h TTL).

**Returns:** Created &#x60;UserResponse&#x60; with status &#x60;invited&#x60; or &#x60;pending_activation&#x60;`,
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
    method: "get",
    path: "/api/v1/users/me",
    alias: "get_me_api_v1_users_me_get",
    description: `Return the profile of the currently authenticated user.

**Requirements:** Valid &#x60;access_token&#x60; HTTP-only cookie.

**Returns:** Full &#x60;UserResponse&#x60; for the token owner`,
    requestFormat: "json",
    response: UserResponse,
  },
  {
    method: "get",
    path: "/health",
    alias: "health_check_health_get",
    requestFormat: "json",
    response: z.unknown(),
  },
])

export const api = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
