import { z } from "zod"

// Wraps a wire enum's `.options` so a missing/invalid selection emits the
// shared "required" message code (resolved via each feature's own field-error
// translator) instead of Zod's untranslated default message.
export function requiredEnum<const T extends readonly string[]>(
  options: T
): z.ZodEnum<{ [K in T[number]]: K }> {
  return z.enum(options, { error: "required" })
}

// Same purpose for a required number input. An emptied field registered with
// react-hook-form's `valueAsNumber` yields NaN, and a bare `z.number()` then reports
// "Invalid input: expected number, received NaN" — raw English that reaches the UI
// wherever the component renders `errors.<field>.message` through a resolver.
export function requiredNumber(): z.ZodNumber {
  return z.number({ error: "required" })
}
