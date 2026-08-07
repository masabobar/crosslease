import { useEffect, useState } from "react"

/**
 * Returns `value` trailing by `delayMs`.
 *
 * Used for search inputs: the field itself stays fully responsive (it renders the immediate
 * value), while the debounced copy is what feeds the query key — so a name typed
 * character-by-character costs one request after the pause instead of one per keystroke,
 * and slow early responses can no longer land after later ones and win.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
