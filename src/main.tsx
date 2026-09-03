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

function render(banner?: React.ReactNode) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {banner}
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
}

// PROTOTYPE MOCK bootstrap — see .claude/rules/project/prototype-mode.md.
//
// `VITE_USE_MOCKS` is the only guard. It was previously paired with `import.meta.env.DEV`, which is
// statically false in a production build and so made a mocked deploy impossible; that pairing was
// removed on request so a deployed prototype could be shared. The consequence is deliberate and
// worth stating: **any** build whose environment carries VITE_USE_MOCKS=true serves fabricated data,
// including one deployed at a URL containing the word "production".
//
// The compensating control is PrototypeBanner — a permanent on-screen marker, rendered only when the
// worker actually started, so the fakeness cannot be mistaken for a working app. Do not remove it
// while this guard is single.
//
// The import stays dynamic so msw and the handlers remain a separate chunk that is never fetched
// unless the flag is on — the cost of a normal build is one unused chunk, not a heavier main bundle.
async function start() {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
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
      // Rendered only here, on the success path: a banner shown when the worker failed to start would
      // claim the data is mocked while the app is in fact talking to the real API.
      const { PrototypeBanner } = await import("@/mocks/PrototypeBanner")
      render(<PrototypeBanner />)
      return
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
