type QueryValue = string | number | boolean | string[] | undefined | null

// Contract: `undefined`/`null` is the only "omit this param" sentinel — every other
// value, including `0`, `false`, and `""`, is serialized as-is. Callers that want a
// falsy value to mean "unset" must normalize it to `undefined` before calling this
// (e.g. `search: search.length > 0 ? search : undefined`), not rely on this function
// to drop it for them.
export function buildQueryString(params: Record<string, QueryValue>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach(v => qs.append(key, v))
    } else {
      qs.set(key, String(value))
    }
  }
  const str = qs.toString()
  return str ? `?${str}` : ""
}
