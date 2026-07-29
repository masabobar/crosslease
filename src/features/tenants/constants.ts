export const SUPPORT_USERS_DROPDOWN_PAGE_SIZE = 100

// Grants are created by system admins, so resolving a grant's `granted_by` to a
// name needs the admin list as well as the support-user list. The API returns
// only `granted_by: uuid` on the grant itself.
export const GRANTOR_LOOKUP_PAGE_SIZE = 100
