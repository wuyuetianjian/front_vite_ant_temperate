import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthSettingsState {
  localAuthEnabled: boolean
  setLocalAuthEnabled: (enabled: boolean) => void
}

export const useAuthSettingsStore = create<AuthSettingsState>()(
  persist(
    (set) => ({
      localAuthEnabled: true,
      setLocalAuthEnabled: (enabled) => set({ localAuthEnabled: enabled }),
    }),
    { name: 'auth_settings' },
  ),
)
