import { z } from "zod"

// Wraps a wire enum's `.options` so a missing/invalid selection emits the
// shared "required" message code (resolved via each feature's own field-error
// translator) instead of Zod's untranslated default message.
export function requiredEnum<const T extends readonly string[]>(options: T) {
  return z.enum(options, { error: "required" })
}
