import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { SupportContextBanner } from "./SupportContextBanner"
import { AuditorExpiryBanner } from "./AuditorExpiryBanner"
import { Toaster } from "@/components/ui/sonner"

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <SupportContextBanner />
        <AuditorExpiryBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
