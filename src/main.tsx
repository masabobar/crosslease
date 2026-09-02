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
    const [{ worker }, { installMockRoleSwitcher }] = await Promise.all([
      import("@/mocks/browser"),
      import("@/mocks/role"),
    ])
    installMockRoleSwitcher()
    // "warn" covers anything outside `/api/v1` (assets, third-party). API paths never reach it: the
    // fallback handler claims every one and answers 501 rather than letting the call escape to the
    // real API, whose 401 would trip the interceptor's refresh-then-clearAuth path and log the
    // reviewer out. See handlers/fallback.ts.
    await worker.start({ onUnhandledRequest: "warn" })
  }
  render()
}

void start()
