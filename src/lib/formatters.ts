export const DATE_LOCALE = "en-GB"

const MS_PER_MINUTE = 1000 * 60
const MS_PER_HOUR = MS_PER_MINUTE * 60
const MS_PER_DAY = MS_PER_HOUR * 24

type Translator = (
  key:
    | "time.justNow"
    | "time.minutesAgo"
    | "time.hoursAgo"
    | "time.yesterday"
    | "time.daysAgo",
  options?: Record<string, unknown>
) => string

export function formatLastLogin(dateStr: string | null, t: Translator): string {
  if (!dateStr) return "—"

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / MS_PER_MINUTE)
  const diffHours = Math.floor(diffMs / MS_PER_HOUR)
  const diffDays = Math.floor(diffMs / MS_PER_DAY)

  if (diffMinutes < 1) return t("time.justNow")
  if (diffMinutes < 60) return t("time.minutesAgo", { count: diffMinutes })
  if (diffHours < 24) return t("time.hoursAgo", { count: diffHours })
  if (diffDays === 1) return t("time.yesterday")
  if (diffDays < 7) return t("time.daysAgo", { count: diffDays })

  return date.toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// Rendered in the viewer's own timezone, so the zone label is not decoration. Audit and history
// surfaces are read as evidence, and a bare "14:32" cannot be reconciled against a UTC record —
// US 15.18 asks for "timestamp UTC" outright (Q-047). `timeZoneName: "short"` gives CET/CEST in
// Europe and a GMT±N offset elsewhere: always unambiguous, never bare. It also explains the date
// half, which is local too and can therefore sit a day either side of the UTC date.
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  return `${date.toLocaleDateString(DATE_LOCALE, { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString(DATE_LOCALE, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Monetary amounts follow the design's "€ 25.000.000,00" — German digit grouping with the
// symbol leading. No single Intl locale produces that (de-DE trails the symbol, en-GB
// groups with commas), so the formatted parts are reassembled. Deliberately not tied to
// the UI language: these are the bank's own figures and must read identically in both.
const CURRENCY_LOCALE = "de-DE"

export function formatCurrency(amount: number, currencyCode: string): string {
  const parts = new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(amount)
  const symbol =
    parts.find(part => part.type === "currency")?.value ?? currencyCode
  // Drops the literal separating symbol and digits; group/decimal separators keep their
  // own part types, so only the symbol-adjacent whitespace is removed.
  const digits = parts
    .filter(part => part.type !== "currency" && part.type !== "literal")
    .map(part => part.value)
    .join("")
  return `${symbol} ${digits}`
}

/**
 * Converts a dot-separated event type identifier into a human-readable label.
 * "auth.login_success" → "Login Success"
 */
export function formatEventType(eventType: string): string {
  const dotIndex = eventType.indexOf(".")
  const action = dotIndex !== -1 ? eventType.slice(dotIndex + 1) : eventType
  return action
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Converts a snake_case action type identifier into a human-readable label.
 * "state_transition" → "State Transition"
 */
export function formatActionType(actionType: string): string {
  return actionType
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
