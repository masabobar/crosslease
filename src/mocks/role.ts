/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Which role the mocked session is signed in as. Held in localStorage rather than an env var so the
 * role can be changed without restarting Vite — switching role is the main thing you do when reviewing
 * a role-gated app, and a rebuild per switch makes that unusable.
 */
import { UserRoleSchema } from "@/features/users/api/schema"
import type { UserRole } from "@/features/users/types"

const STORAGE_KEY = "mock-role"

// front_office by default: of the seven roles it reaches the most of the Refinancing Request epic —
// the case list, the checklist, partners and duplicates. system_admin would show almost nothing,
// since the spec gives it no path into a tenant's cases.
const DEFAULT_ROLE: UserRole = "front_office"

/**
 * Adopts a role from the email typed at login, when that email names one.
 *
 * `front_office@prototype.example.com` signs you in as Front Office — which is what anyone expects from a
 * login form, and stops the role being an invisible piece of console state. Any other address is
 * accepted too and leaves the current role alone, so a real-looking email still gets you in.
 */
export function adoptRoleFromEmail(email: string): void {
  const local = email.trim().toLowerCase().split("@")[0]
  const parsed = UserRoleSchema.safeParse(local)
  if (!parsed.success) return
  try {
    localStorage.setItem(STORAGE_KEY, parsed.data)
  } catch {
    // Unwritable storage just means the role stays as it was; login still succeeds.
  }
}

export function getMockRole(): UserRole {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = UserRoleSchema.safeParse(stored)
    return parsed.success ? parsed.data : DEFAULT_ROLE
  } catch {
    // localStorage throws in some contexts (private mode, blocked site data). A prototype that
    // cannot read its own role should still render, as the default role.
    return DEFAULT_ROLE
  }
}

/**
 * Exposes `window.setMockRole('back_office')` so the role can be switched from the browser console.
 * Reloads on change because the role is read once per request and React Query has already cached
 * `/users/me` — a reload is simpler and more predictable than invalidating from outside React.
 */
export function installMockRoleSwitcher(): void {
  const w = window as typeof window & {
    setMockRole?: (role: string) => void
    getMockRole?: () => UserRole
  }

  w.getMockRole = getMockRole
  w.setMockRole = (role: string) => {
    const parsed = UserRoleSchema.safeParse(role)
    if (!parsed.success) {
      // eslint-disable-next-line no-console -- console.error is permitted; the pre-commit hook blocks log/warn/debug only, and this is the switcher's only feedback channel
      console.error(
        `setMockRole: "${role}" is not a role. One of: ${UserRoleSchema.options.join(", ")}`
      )
      return
    }
    localStorage.setItem(STORAGE_KEY, parsed.data)
    location.reload()
  }
}
