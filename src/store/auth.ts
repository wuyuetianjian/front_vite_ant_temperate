import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { useThemeStore } from './theme'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  updateUser: (user: User) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
  hasPermission: (operation: string) => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth: (token, user) => {
        useThemeStore.getState().hydrateTheme(user)
        set({ token, user })
      },

      updateUser: (user) => {
        useThemeStore.getState().hydrateTheme(user)
        set({ user })
      },

      clearAuth: () => set({ token: null, user: null }),

      isAuthenticated: () => Boolean(get().token || localStorage.getItem('auth_token')),

      isAdmin: () => {
        const user = get().user
        if (!user) return false
        const roles = user.roles ?? []
        if (roles.some((r) => r.name === 'Admin')) return true
        return roles.some((r) =>
          (r.permissions ?? []).some((p) => p.module === 'system' && p.action === '*'),
        )
      },

      hasPermission: (operation: string) => {
        const user = get().user
        if (!user) return false
        const roles = user.roles ?? []
        if (roles.some((r) => r.name === 'Admin')) return true
        for (const role of roles) {
          for (const p of role.permissions ?? []) {
            if (p.module === 'system' && p.action === '*') return true
            if (p.operation === operation) return true
            if (p.operation?.endsWith('*') && operation.startsWith(p.operation.slice(0, -1))) return true
          }
        }
        return false
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('auth_token', state.token)
        }
      },
    },
  ),
)

export function resetAuth() {
  useAuthStore.getState().clearAuth()
  localStorage.removeItem('auth_token')
}

// keep localStorage in sync for the axios interceptor
useAuthStore.subscribe((state) => {
  if (state.token) {
    localStorage.setItem('auth_token', state.token)
  } else {
    localStorage.removeItem('auth_token')
  }
})
