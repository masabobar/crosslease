/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The three endpoints that get an unauthenticated browser into the app. Only three are needed, because
 * `useAuthStore` persists nothing but an `isAuthenticated` flag and every RoleGuard reads the role from
 * `/users/me`:
 *
 *   POST /auth/login           → `next_step: "session"`, which makes LoginPage set the flag and go
 *                                straight to the dashboard — the OTP step is skipped entirely
 *   GET  /users/me             → the user, and therefore the role
 *   GET  /users/me/permissions → role + active_modules (the Framework Agreement sidebar gate)
 */
import { http } from "msw"
import { UserResponseSchema } from "@/features/users/api/schema"
import { mockUser } from "@/mocks/fixtures/users"
import { adoptRoleFromEmail, getMockRole } from "@/mocks/role"
import { envelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

export const authHandlers = [
  // Any email and password are accepted — this is a design review tool, not an auth test. But an
  // email whose local part names a role signs you in AS that role, so `front_office@prototype.example.com`
  // does the obvious thing and the role stops being invisible console state.
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown
    } | null
    if (typeof body?.email === "string") adoptRoleFromEmail(body.email)
    return envelope({ next_step: "session" })
  }),

  http.post(`${API}/auth/logout`, () => envelope({})),
  http.post(`${API}/auth/logout-all`, () => envelope({})),

  // Belt-and-braces against the logout trap. `@/lib/api` treats any 401 on an authenticated session as
  // "refresh the token", and its refresh `catch` calls `clearAuth()` — so a single failed refresh ends
  // the session. The fallback handler means nothing should 401 any more, but if something does, this
  // makes the refresh succeed instead of signing you out mid-review.
  http.post(`${API}/auth/refresh-token`, () => envelope({})),

  // Declared before /users/me so the more specific path is not shadowed if MSW's matching order ever
  // changes; today it matches exact paths, so this is belt-and-braces.
  http.get(`${API}/users/me/permissions`, () =>
    envelope({
      role: getMockRole(),
      permissions: [],
      // Only `framework_agreement` actually gates anything today (Sidebar.tsx:127). The rest are
      // listed so a newly added module gate does not silently hide a screen.
      active_modules: [
        "framework_agreement",
        "bank_product_template",
        "workflow_task_catalog",
        "document_requirement_catalog",
        "partner_management",
        "audit_trail",
      ],
    })
  ),

  http.get(`${API}/users/me`, () =>
    // Parsed with the real schema on the way out: if the fixture drifts from UserResponseSchema this
    // throws here, in one place, instead of surfacing as a broken screen. That check is the reason the
    // mock sits at the network layer rather than stubbing the query function.
    envelope(UserResponseSchema.parse(mockUser(getMockRole())))
  ),
]
