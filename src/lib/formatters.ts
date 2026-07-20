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

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  return `${date.toLocaleDateString(DATE_LOCALE, { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString(DATE_LOCALE, { hour: "2-digit", minute: "2-digit" })}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
