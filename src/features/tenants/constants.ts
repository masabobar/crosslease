export const SUPPORT_USERS_DROPDOWN_PAGE_SIZE = 100

// Longest support-access grant the backend accepts; it answers
// GRANT_DURATION_EXCEEDED beyond this. Shared by CreateGrantFormSchema's
// refinement and NewGrantDialog's calendar bound so the two cannot drift.
export const MAX_GRANT_DAYS = 30

// The wire/date-picker format for a calendar date with no time component.
// <DatePicker> emits and consumes this, and it sorts lexicographically.
export const DATE_FORMAT = "yyyy-MM-dd"

// Grants are created by system admins, so resolving a grant's `granted_by` to a
// name needs the admin list as well as the support-user list. The API returns
// only `granted_by: uuid` on the grant itself.
export const GRANTOR_LOOKUP_PAGE_SIZE = 100
