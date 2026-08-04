// Route params arrive as arbitrary strings from the URL bar. Every record id this app
// routes on is a UUID on the wire — all nine of them resolve to `z.string().uuid()` in
// their feature's `api/schema.ts` — so a param that is not a UUID can never identify a
// record. Guarding before the param reaches a query means a mistyped URL renders
// not-found instead of firing a request the API rejects with a 422, and satisfies
// `security-and-auth.md` §3: no raw `params.id` passed into a query without a guard.
//
// Deliberately permissive on variant: this matches the 8-4-4-4-12 hex layout without
// checking the version nibble, because the job is rejecting obvious garbage (`create`,
// a truncated paste) rather than enforcing which UUID version the backend generates.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuidRouteParam(value: string | undefined): value is string {
  return value !== undefined && UUID_PATTERN.test(value)
}

// Product template versions are sequential integers starting at 1, carried in the path as
// strings (`version_number` is `z.string()` on the wire, holding "1", "2", …), so the UUID
// guard does not apply to them. Leading zeroes and "0" are rejected: neither is a version
// the backend can have produced.
const VERSION_NUMBER_PATTERN = /^[1-9][0-9]*$/

export function isVersionNumberRouteParam(
  value: string | undefined
): value is string {
  return value !== undefined && VERSION_NUMBER_PATTERN.test(value)
}
