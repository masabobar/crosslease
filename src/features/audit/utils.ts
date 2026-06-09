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

/**
 * Converts a snake_case action type identifier into a human-readable label.
 *
 * Examples:
 *   "state_transition" → "State Transition"
 *   "create"           → "Create"
 *   "update"           → "Update"
 */
export function formatActionType(actionType: string): string {
  return actionType
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
