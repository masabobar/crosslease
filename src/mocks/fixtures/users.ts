/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * One user per platform role, so the prototype can be viewed as any of them without a backend.
 *
 * These objects are parsed by the real `UserResponseSchema` in the handler, deliberately: a fixture
 * that drifts from the schema fails loudly here rather than silently in a screen. That contract check
 * is the whole reason the mock sits at the network layer instead of stubbing the query functions.
 */
import type { UserResponse } from "@/features/users/api/schema"
import type { UserRole } from "@/features/users/types"

const NOW = "2026-09-02T10:00:00Z"

// Fixed UUIDs rather than generated ones: a stable id survives a reload, so React Query cache keys
// and any screen that reads `user.id` behave the same across sessions.
const IDS: Record<UserRole, string> = {
  system_admin: "00000000-0000-4000-8000-000000000001",
  support_user: "00000000-0000-4000-8000-000000000002",
  auditor: "00000000-0000-4000-8000-000000000003",
  bank_power_user: "00000000-0000-4000-8000-000000000004",
  front_office: "00000000-0000-4000-8000-000000000005",
  back_office: "00000000-0000-4000-8000-000000000006",
  leasing_company_user: "00000000-0000-4000-8000-000000000007",
}

const NAMES: Record<UserRole, [string, string]> = {
  system_admin: ["Sys", "Admin"],
  support_user: ["Sup", "Port"],
  auditor: ["Aud", "Itor"],
  bank_power_user: ["Power", "User"],
  front_office: ["Front", "Office"],
  back_office: ["Back", "Office"],
  leasing_company_user: ["Leasing", "Company"],
}

// The bank tenant every internal role belongs to. `leasing_company_user` is external, and
// `system_admin` / `support_user` sit outside the tenant by design (spec §4.1), so they carry null.
const BANK_TENANT_ID = "00000000-0000-4000-8000-0000000000ff"

const OUTSIDE_TENANT: readonly UserRole[] = ["system_admin", "support_user"]

export function mockUser(role: UserRole): UserResponse {
  const [first, last] = NAMES[role]
  return {
    id: IDS[role],
    user_id: `USR-9000${Object.keys(IDS).indexOf(role) + 1}`,
    first_name: first,
    last_name: last,
    // `example.com` deliberately, not `.local`. These addresses are typed into the real login form,
    // and if the mock layer is off — which it always is in a production build — the address reaches
    // the API's validator. `.local` is a reserved special-use TLD (RFC 6762), which pydantic's
    // email-validator refuses, so the API answered 422 VALIDATION_ERROR instead of a clean 401. That
    // read as "login is broken" rather than "this account does not exist". `example.com` is reserved
    // for exactly this purpose (RFC 2606) and passes validation.
    email: `${role}@prototype.example.com`,
    role,
    permissions: [],
    tenant_id: OUTSIDE_TENANT.includes(role) ? null : BANK_TENANT_ID,
    status: "active",
    phone_number: null,
    profile_picture_url: null,
    access_valid_until: null,
    invited_by: null,
    invited_at: null,
    activated_at: NOW,
    last_login: NOW,
    created_at: NOW,
    updated_at: NOW,
  }
}
