type QueryValue = string | number | boolean | string[] | undefined | null

export function buildQueryString(params: Record<string, QueryValue>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach(v => qs.append(key, v))
    } else if (typeof value === "boolean") {
      qs.set(key, String(value))
    } else if (value) {
      qs.set(key, String(value))
    }
  }
  const str = qs.toString()
  return str ? `?${str}` : ""
}
