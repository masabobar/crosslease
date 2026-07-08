import { create } from "zustand"

type TenantSelectionState = {
  selectedTenantId: string | null
  setSelectedTenantId: (tenantId: string | null) => void
}

export const useTenantSelectionStore = create<TenantSelectionState>(set => ({
  selectedTenantId: null,
  setSelectedTenantId: tenantId => set({ selectedTenantId: tenantId }),
}))
