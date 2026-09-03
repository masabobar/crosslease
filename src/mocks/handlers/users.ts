/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The user-management list and detail. One user per platform role, reusing the same fixture the signed-in
 * user comes from, plus a few extra rows so the status and role filters have something to filter.
 */
import { http } from "msw"
import {
  PaginatedUsersResponseSchema,
  UserResponseSchema,
  UserRoleSchema,
  type UserListItem,
} from "@/features/users/api/schema"
import { mockUser } from "@/mocks/fixtures/users"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

const TENANT_NAME = "CrossLease Bank"

// One row per role, derived from the same fixture that backs /users/me so the two never disagree.
const roleRows: UserListItem[] = UserRoleSchema.options.map(role => {
  const u = mockUser(role)
  return {
    id: u.id,
    user_id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    role: u.role,
    tenant_id: u.tenant_id,
    tenant_name: u.tenant_id ? TENANT_NAME : null,
    profile_picture_url: null,
    mfa_enabled: true,
    status: u.status,
    last_login: u.last_login,
    access_valid_until: u.access_valid_until,
  }
})

// Extra rows so the status filter is not single-valued.
const extraRows: UserListItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    user_id: "USR-90101",
    first_name: "Invited",
    last_name: "Clerk",
    email: "invited.clerk@prototype.local",
    role: "front_office",
    tenant_id: "00000000-0000-4000-8000-0000000000ff",
    tenant_name: TENANT_NAME,
    profile_picture_url: null,
    mfa_enabled: false,
    status: "invited",
    last_login: null,
    access_valid_until: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    user_id: "USR-90102",
    first_name: "Suspended",
    last_name: "Reviewer",
    email: "suspended.reviewer@prototype.local",
    role: "back_office",
    tenant_id: "00000000-0000-4000-8000-0000000000ff",
    tenant_name: TENANT_NAME,
    profile_picture_url: null,
    mfa_enabled: true,
    status: "suspended",
    last_login: "2026-06-11T08:00:00Z",
    access_valid_until: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    user_id: "USR-90103",
    first_name: "Time-limited",
    last_name: "Auditor",
    email: "timelimited.auditor@prototype.local",
    role: "auditor",
    tenant_id: null,
    tenant_name: null,
    profile_picture_url: null,
    mfa_enabled: true,
    status: "active",
    // The Auditor's time-limited access period — the one role that carries an expiry by design.
    last_login: "2026-08-30T12:00:00Z",
    access_valid_until: "2026-12-31T23:59:59Z",
  },
]

const allRows = [...roleRows, ...extraRows]

export const userHandlers = [
  http.get(`${API}/users`, ({ request }) => {
    const url = new URL(request.url)
    let rows = allRows

    const q = url.searchParams.get("search")?.trim().toLowerCase()
    if (q) {
      rows = rows.filter(u =>
        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q)
      )
    }
    const role = url.searchParams.get("role")
    if (role) rows = rows.filter(u => u.role === role)
    const status = url.searchParams.get("status")
    if (status) rows = rows.filter(u => u.status === status)

    const page = Number(url.searchParams.get("page") ?? "1") || 1
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20
    const start = (page - 1) * perPage

    return envelope(
      PaginatedUsersResponseSchema.parse({
        users: rows.slice(start, start + perPage),
        total: rows.length,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(rows.length / perPage)),
      })
    )
  }),

  // Declared after /users so the literal collection path is not shadowed. `me` is handled in
  // handlers/auth.ts, which is registered first.
  http.get(`${API}/users/:id`, ({ params }) => {
    const row = allRows.find(u => u.id === params.id)
    if (!row) return errorEnvelope("USER_NOT_FOUND", "User not found", 404)
    return envelope(UserResponseSchema.parse(mockUser(row.role)))
  }),
]
