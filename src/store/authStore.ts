import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (access: string, refresh: string) => void
  clearTokens: () => void
}

// TODO: temporary localStorage persistence — remove when BE implements HttpOnly cookies (AC-12)
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
