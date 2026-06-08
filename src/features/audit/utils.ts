/**
 * Converts a dot-separated event type identifier into a human-readable label.
 *
 * Examples:
 *   "auth.login_success"         → "Login Success"
 *   "auth.password_reset_request" → "Password Reset Request"
 *   "auth.logout"                → "Logout"
 *   "user.suspended"             → "Suspended"
 */
export function formatEventType(eventType: string): string {
  const dotIndex = eventType.indexOf(".")
  const action = dotIndex !== -1 ? eventType.slice(dotIndex + 1) : eventType
  return action
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
