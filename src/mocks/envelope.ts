/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The real response envelope, in one place. `@/lib/api`'s response interceptor unwraps
 * `response.data.data`, so a handler that returned the bare object would work by accident today and
 * break the moment one needs a `code`. Error shape mirrors `{ detail: { code, message } }`, which is
 * what `ApiError.code` is read from.
 */
import { HttpResponse } from "msw"

export function envelope<T>(data: T, code = "OK") {
  return HttpResponse.json({ code, message: "Mocked response", data })
}

export function errorEnvelope(code: string, message: string, status: number) {
  return HttpResponse.json({ detail: { code, message } }, { status })
}
