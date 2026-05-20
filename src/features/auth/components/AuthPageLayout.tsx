import type { ReactNode } from "react"
import { AppLogo } from "./AppLogo"

function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <header className="flex justify-center pt-8">
        <AppLogo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  )
}

export { AuthPageLayout }
