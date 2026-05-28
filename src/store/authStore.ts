import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface AuthState {
  isAuthenticated: boolean
  setAuthenticated: (value: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      setAuthenticated: isAuthenticated => set({ isAuthenticated }),
      clearAuth: () => set({ isAuthenticated: false }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
