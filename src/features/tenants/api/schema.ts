import { z } from "zod"

export const TenantStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "archived",
  "rejected",
  "expired",
])
export type TenantStatus = z.infer<typeof TenantStatusSchema>

export const TenantTypeSchema = z.enum([
  "bank",
  "bank_entity",
  "bank_branch_group",
])
export type TenantType = z.infer<typeof TenantTypeSchema>

export const SeedPackageSchema = z.enum([
  "standard_retail_bank",
  "minimal_sandbox",
])
export type SeedPackage = z.infer<typeof SeedPackageSchema>

export const DefaultCurrencySchema = z.enum(["EUR", "USD"])
export type DefaultCurrency = z.infer<typeof DefaultCurrencySchema>

export const TenantListItemSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string(),
  name: z.string(),
  code: z.string(),
  country: z.string(),
  default_currency: z.string(),
  tenant_type: TenantTypeSchema,
  status: TenantStatusSchema,
  active_module_count: z.number().int(),
  created_at: z.string().optional(),
})
export type TenantListItem = z.infer<typeof TenantListItemSchema>

export const TenantsResponseSchema = z.object({
  tenants: z.array(TenantListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})
export type TenantsResponse = z.infer<typeof TenantsResponseSchema>

export const PlatformModuleSchema = z.object({
  key: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  group: z.string(),
  always_on: z.boolean(),
  permissions: z.array(z.string()),
})
export type PlatformModule = z.infer<typeof PlatformModuleSchema>

export const PlatformModulesResponseSchema = z.object({
  modules: z.array(PlatformModuleSchema),
})
export type PlatformModulesResponse = z.infer<
  typeof PlatformModulesResponseSchema
>

export const SeedPackageEntrySchema = z.object({
  key: z.string(),
  display_name: z.string(),
  description: z.string(),
  includes: z.array(z.string()),
  available: z.boolean(),
})
export type SeedPackageEntry = z.infer<typeof SeedPackageEntrySchema>

export const SeedPackagesResponseSchema = z.object({
  packages: z.array(SeedPackageEntrySchema),
})
export type SeedPackagesResponse = z.infer<typeof SeedPackagesResponseSchema>

export const TenantResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string(),
  name: z.string(),
  code: z.string(),
  legal_entity_name: z.string(),
  country: z.string(),
  default_currency: z.string(),
  tenant_type: TenantTypeSchema,
  description: z.string().nullable(),
  seed_package: SeedPackageSchema,
  core_banking_integration_ref: z.string().nullable(),
  status: TenantStatusSchema,
  legal_hold_flag: z.boolean(),
  activated_at: z.string().datetime().nullable(),
  mfa_required: z.boolean(),
  max_lc_count: z.number().int(),
  max_bank_user_count: z.number().int(),
  max_users_per_lc: z.number().int(),
  lc_utilisation: z.number().int().default(0),
  bank_user_utilisation: z.number().int().default(0),
  lc_user_highest_active: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().nullable(),
  approved_by: z.string().nullable(),
})
export type TenantResponse = z.infer<typeof TenantResponseSchema>

export const TenantSupportResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  tenant_type: TenantTypeSchema,
  status: TenantStatusSchema,
  country: z.string(),
  default_currency: z.string(),
  activated_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
})
export type TenantSupportResponse = z.infer<typeof TenantSupportResponseSchema>

// Tried in order: full admin response first, support response as fallback
export const TenantDetailSchema = z.union([
  TenantResponseSchema,
  TenantSupportResponseSchema,
])
export type TenantDetail = z.infer<typeof TenantDetailSchema>

export function isFullTenantResponse(t: TenantDetail): t is TenantResponse {
  return "legal_entity_name" in t
}

export const TenantModuleStatusSchema = z.enum([
  "active",
  "inactive",
  "pending_activation",
  "pending_enforcement",
  "pending_deactivation",
])
export type TenantModuleStatus = z.infer<typeof TenantModuleStatusSchema>

export const TenantModuleEntrySchema = z.object({
  key: z.string(),
  display_name: z.string(),
  group: z.string(),
  always_on: z.boolean(),
  status: TenantModuleStatusSchema,
  activated_at: z.string().datetime().nullable().optional(),
})
export type TenantModuleEntry = z.infer<typeof TenantModuleEntrySchema>

export const TenantDetailModulesResponseSchema = z.object({
  modules: z.array(TenantModuleEntrySchema),
})
export type TenantDetailModulesResponse = z.infer<
  typeof TenantDetailModulesResponseSchema
>

export const GovernanceHistoryEventSchema = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  actor_display: z.string().nullable(),
  old_data: z.record(z.string(), z.unknown()).nullable(),
  new_data: z.record(z.string(), z.unknown()).nullable(),
  reason: z.string().nullable(),
  recorded_at: z.string().datetime(),
})
export type GovernanceHistoryEvent = z.infer<
  typeof GovernanceHistoryEventSchema
>

export const GovernanceHistoryResponseSchema = z.object({
  events: z.array(GovernanceHistoryEventSchema),
  next_cursor: z.string().nullable(),
})
export type GovernanceHistoryResponse = z.infer<
  typeof GovernanceHistoryResponseSchema
>

export const GrantStatusSchema = z.enum(["active", "expired", "revoked"])
export type GrantStatus = z.infer<typeof GrantStatusSchema>

export const AccessReasonSchema = z.enum([
  "user_access_issue",
  "workflow_processing_diagnostic",
  "document_generation_diagnostic",
  "integration_troubleshooting",
  "compliance_query_support",
  "regulatory_assistance",
  "emergency_incident_response",
])
export type AccessReason = z.infer<typeof AccessReasonSchema>

export const SupportGrantSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  grantee_id: z.string().uuid(),
  granted_by: z.string().uuid(),
  access_reason: AccessReasonSchema,
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  status: GrantStatusSchema,
  additional_context: z.string().nullable(),
  revocation_reason: z.string().nullable(),
  revoked_by: z.string().uuid().nullable(),
  revoked_at: z.string().datetime().nullable(),
  is_emergency: z.boolean(),
  review_required_by: z.string().datetime().nullable(),
  review_completed_at: z.string().datetime().nullable(),
  reviewed_by: z.string().uuid().nullable(),
  review_outcome: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type SupportGrant = z.infer<typeof SupportGrantSchema>

export const CreateGrantFormSchema = z.object({
  grantee_id: z.string().uuid("required"),
  access_reason: AccessReasonSchema,
  valid_from: z.string().min(1, "required"),
  valid_until: z.string().min(1, "required"),
  additional_context: z.string().max(500).nullable().optional(),
})
export type CreateGrantForm = z.infer<typeof CreateGrantFormSchema>

export const RevokeGrantFormSchema = z.object({
  revocation_reason: z.string().min(10, "tooShort"),
})
export type RevokeGrantForm = z.infer<typeof RevokeGrantFormSchema>

export const AccessPolicyFlagRecordSchema = z.object({
  enabled: z.boolean(),
  modified_by: z.string().nullable(),
  modified_at: z.string().datetime().nullable(),
})
export type AccessPolicyFlagRecord = z.infer<
  typeof AccessPolicyFlagRecordSchema
>

export const AccessPolicyResponseSchema = z.object({
  support_read_only_access: AccessPolicyFlagRecordSchema,
  auditor_access: AccessPolicyFlagRecordSchema,
  lc_portal: AccessPolicyFlagRecordSchema,
})
export type AccessPolicyResponse = z.infer<typeof AccessPolicyResponseSchema>

export const IntegrationBindingResponseSchema = z.object({
  id: z.string().uuid().nullable(),
  tenant_id: z.string().uuid().nullable(),
  endpoint_url: z.string().nullable(),
  integration_active: z.boolean().nullable(),
  credential_scope_identifier: z.string().nullable(),
  disbursement_execution_boundary_note: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime().nullable(),
  last_modified_by: z.string().uuid().nullable(),
  updated_at: z.string().datetime().nullable(),
  decommission_timestamp: z.string().datetime().nullable(),
})
export type IntegrationBindingResponse = z.infer<
  typeof IntegrationBindingResponseSchema
>

export const UpsertIntegrationBindingFormSchema = z.object({
  endpoint_url: z
    .string()
    .min(1, "required")
    .url("invalidUrl")
    .refine(v => v.startsWith("https://"), "mustBeHttps"),
  credential_scope_identifier: z.string().min(1, "required"),
  integration_active: z.boolean(),
  disbursement_execution_boundary_note: z.string().optional(),
  justification: z.string().min(20, "justificationTooShort"),
})
export type UpsertIntegrationBindingForm = z.infer<
  typeof UpsertIntegrationBindingFormSchema
>

export const UpdateAccessPolicyFormSchema = z.object({
  support_read_only_access_allowed: z.boolean(),
  auditor_access_allowed: z.boolean(),
  lc_portal_enabled: z.boolean(),
  reason: z.string().min(20, "reasonTooShort"),
})
export type UpdateAccessPolicyForm = z.infer<
  typeof UpdateAccessPolicyFormSchema
>

export const CreateTenantFormSchema = z.object({
  name: z.string().min(2).max(200),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z0-9-]+$/, "codeInvalidChars"),
  tenant_type: TenantTypeSchema,
  default_currency: DefaultCurrencySchema,
  legal_entity_name: z.string().min(2).max(300),
  country: z.string().length(2),
  description: z.string().max(1000).optional(),
  modules: z.array(z.string()),
  seed_package: SeedPackageSchema,
  core_banking_integration_ref: z.string().max(200).optional(),
})
export type CreateTenantForm = z.infer<typeof CreateTenantFormSchema>

export const UpdateTenantFormSchema = z.object({
  name: z.string().min(2, "nameTooShort").max(200, "nameTooLong"),
  legal_entity_name: z
    .string()
    .min(1, "legalEntityNameRequired")
    .max(300, "legalEntityNameTooLong"),
  description: z.string().max(1000).optional(),
  legal_hold_flag: z.boolean(),
  justification: z.string().optional(),
})
export type UpdateTenantForm = z.infer<typeof UpdateTenantFormSchema>

export const ModuleActivateFormSchema = z.object({
  justification: z.string().min(10, "justificationTooShort"),
})
export type ModuleActivateForm = z.infer<typeof ModuleActivateFormSchema>

export const ModuleDeactivateFormSchema = z.object({
  justification: z.string().min(20, "justificationTooShort"),
})
export type ModuleDeactivateForm = z.infer<typeof ModuleDeactivateFormSchema>

export const SuspendTenantFormSchema = z.object({
  justification: z.string().min(30, "justificationTooShort"),
})
export type SuspendTenantForm = z.infer<typeof SuspendTenantFormSchema>

export const EditLicenceLimitsFormSchema = z.object({
  max_lc_count: z.number().int().min(1),
  max_bank_user_count: z.number().int().min(1),
  max_users_per_lc: z.number().int().min(1),
})
export type EditLicenceLimitsForm = z.infer<typeof EditLicenceLimitsFormSchema>

export const ReactivateTenantFormSchema = z.object({
  justification: z.string().min(20, "justificationTooShort"),
})
export type ReactivateTenantForm = z.infer<typeof ReactivateTenantFormSchema>

export const ArchiveTenantFormSchema = z.object({
  justification: z.string().min(50, "justificationTooShort"),
  irreversibility_acknowledgement: z.boolean().refine(v => v === true, {
    message: "mustAcknowledge",
  }),
  active_user_acknowledgement: z.boolean().optional(),
})
export type ArchiveTenantForm = z.infer<typeof ArchiveTenantFormSchema>

// Both generics are supplied on purpose. zod v4's ZodType is
// `ZodType<out Output = unknown, out Input = unknown, …>`, so `z.ZodType<ArchiveTenantForm>` alone
// leaves Input as `unknown` — and zodResolver requires Input to be assignable to RHF's FieldValues,
// which `unknown` is not. These schemas are plain objects plus a superRefine, with no transform, so
// input and output are the same shape.
export function createArchiveTenantFormSchema(
  hasActiveUsers: boolean
): z.ZodType<ArchiveTenantForm, ArchiveTenantForm> {
  if (!hasActiveUsers) return ArchiveTenantFormSchema
  return ArchiveTenantFormSchema.superRefine((data, ctx) => {
    if (!data.active_user_acknowledgement) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active_user_acknowledgement"],
        message: "mustAcknowledge",
      })
    }
  })
}

// Same reason as createArchiveTenantFormSchema above — Input must be stated, not defaulted.
export function createUpdateTenantFormSchema(
  originalName: string
): z.ZodType<UpdateTenantForm, UpdateTenantForm> {
  return UpdateTenantFormSchema.superRefine((data, ctx) => {
    if (data.name.trim() !== originalName.trim()) {
      if (!data.justification || data.justification.trim().length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["justification"],
          message: "justificationRequired",
        })
      }
    }
  })
}
