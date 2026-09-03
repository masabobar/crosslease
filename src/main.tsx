import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { router } from "@/router"
import { THIRTY_SECONDS_MS } from "@/lib/constants"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { useToastStore } from "@/store/toastStore"
import { i18n } from "@/i18n/config"
import "./index.css"

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Initial-load failures are handled by each screen's own `isError` state
      // (per .claude/rules/api-error-display.md §3) — only surface a toast for
      // background refetches of a query that previously loaded successfully.
      if (query.state.data === undefined) return

      useToastStore.getState().showToast({
        variant: "error",
        title: i18n.t("errors.title"),
        // Resolves against `common`, which is both this `t`'s default namespace and the
        // fallback one — so the shared code catalogue is reachable from here even though a
        // background refetch can fail on any feature's screen.
        message: resolveApiErrorMessage(error, i18n.t),
      })
    },
  }),
  defaultOptions: { queries: { staleTime: THIRTY_SECONDS_MS } },
})

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
}

// PROTOTYPE MOCK bootstrap — see .claude/rules/project/prototype-mode.md.
//
// Double-guarded on purpose. `import.meta.env.DEV` is false in any production build, so the mock
// layer cannot be switched on by an environment variable leaking into a real deploy; VITE_USE_MOCKS
// then makes it opt-in during development. Dropping either guard would make a public prototype
// possible by accident.
//
// The dynamic import keeps msw and every handler out of the production bundle: Rollup drops the
// branch entirely once DEV is statically false.
async function start() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
    try {
      const [{ worker }, { installMockRoleSwitcher }] = await Promise.all([
        import("@/mocks/browser"),
        import("@/mocks/role"),
      ])
      installMockRoleSwitcher()
      await worker.start({
        // Scoped deliberately, not the `"warn"` shorthand. `"warn"` engages MSW's unhandled-request
        // strategy for EVERY request the worker sees, including same-origin document fetches like
        // `/settings/profile` — and that path ends in the worker re-fetching the request, which
        // throws `TypeError: Failed to fetch` and kills the response. Returning without calling
        // `print` leaves the request alone.
        //
        // Nothing is lost by scoping it: the fallback handler claims every `/api/v1` path, so an
        // unmocked API call already reports itself as a 501 naming the endpoint (handlers/fallback.ts).
        onUnhandledRequest(request, print) {
          if (new URL(request.url).pathname.startsWith("/api/")) print.warning()
        },
      })
      // eslint-disable-next-line no-console -- console.error is permitted (the hook blocks log/warn/debug); this is the only way to tell, at a glance, whether the layer that fakes your login is actually live
      console.error(
        "[PROTOTYPE MOCK] active — any email logs in; the role comes from the email's local part, e.g. front_office@prototype.example.com. Switch with setMockRole('back_office')."
      )
    } catch (mockError) {
      // The app must still boot. Without this the whole page stays blank on any mock failure — a
      // stale service worker, a bad handler import — with nothing on screen to say why, which is
      // indistinguishable from "login is broken".
      // eslint-disable-next-line no-console -- as above; a silent failure here is the worst outcome
      console.error(
        "[PROTOTYPE MOCK] failed to start — the app is running against the REAL API, so login needs real credentials.",
        mockError
      )
    }
  }
  render()
}

void start()
