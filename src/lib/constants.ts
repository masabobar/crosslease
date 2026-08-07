// ISO 4217 code for the only currency the platform transacts in — every monetary field
// on the wire is suffixed `_eur`. Passed to formatCurrency() on surfaces that render a
// figure without a `currency` field of their own in scope.
export const EUR_CURRENCY_CODE = "EUR"

export const ONE_SECOND_MS = 1_000
export const FIVE_MINUTES_MS = 5 * 60 * 1000
export const THIRTY_SECONDS_MS = 30_000
export const ONE_MINUTE_MS = 60_000
export const HOUR_MS = 60 * 60 * 1000
export const SUCCESS_REDIRECT_DELAY_MS = 800
export const COPIED_RESET_DELAY_MS = 2_000
// How long a search box waits after the last keystroke before its value reaches a query key
// (see @/hooks/useDebouncedValue). Long enough to swallow a burst of typing, short enough
// that the list still feels like it is reacting to the input.
export const SEARCH_DEBOUNCE_MS = 300

export const SUPPORT_EMAIL = "support@crosslease.com"
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`
