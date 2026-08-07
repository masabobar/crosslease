import { useEffect, useRef, useState } from "react"
import { COPIED_RESET_DELAY_MS } from "@/lib/constants"

type UseCopyToClipboardResult = {
  isCopied: boolean
  /** Resolves `false` when the clipboard write was refused, so the caller can surface it. */
  copy: (text: string) => Promise<boolean>
}

/**
 * Owns the "copied!" acknowledgement window and its timer cleanup. Deliberately does not
 * toast on failure — the caller reports it in its own i18n namespace.
 */
export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return false
    }
    setIsCopied(true)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(
      () => setIsCopied(false),
      COPIED_RESET_DELAY_MS
    )
    return true
  }

  return { isCopied, copy }
}
