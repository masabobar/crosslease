/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Catch-all for every API path no other handler claims. Registered LAST, so it only ever sees what
 * nothing else matched.
 *
 * **Why this has to exist.** Without it an unmocked call goes out to the real API, which answers 401
 * because there is no auth cookie. `@/lib/api`'s interceptor reads a 401 on an authenticated session
 * as "refresh the token", the refresh 401s too, and its catch calls `clearAuth()` — so visiting any
 * screen whose endpoint is not mocked silently logs you out. That made the prototype unusable.
 *
 * **Why an error and not empty data.** Returning `{ items: [] }` for everything would make every
 * unbuilt screen look finished and empty — exactly the invisible "looks done vs is done" delta that
 * `api-first.md` §4 exists to prevent. A 501 naming the method and path is honest: the screen shows its
 * error state, and the toast tells you precisely which endpoint to mock next.
 *
 * 501 is deliberate. It must not be 401 or 403 — those re-enter the refresh/logout path and the role
 * guards. `MOCK_NOT_IMPLEMENTED` has no i18n key, so `resolveApiErrorMessage` falls through to the
 * message below, which is what puts the endpoint's name on screen.
 */
import { http, HttpResponse } from "msw"

export const fallbackHandlers = [
  http.all("*/api/v1/*", ({ request }) => {
    const { pathname } = new URL(request.url)
    return HttpResponse.json(
      {
        detail: {
          code: "MOCK_NOT_IMPLEMENTED",
          message: `Not mocked in prototype mode: ${request.method} ${pathname}`,
        },
      },
      { status: 501 }
    )
  }),
]
