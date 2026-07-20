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
import { ApiError } from "@/lib/api"
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

      const genericMessage = i18n.t("errors.generic")
      useToastStore.getState().showToast({
        variant: "error",
        title: i18n.t("errors.title"),
        message:
          error instanceof ApiError
            ? i18n.t(`errors.${error.code}`, { defaultValue: genericMessage })
            : genericMessage,
      })
    },
  }),
  defaultOptions: { queries: { staleTime: THIRTY_SECONDS_MS } },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
