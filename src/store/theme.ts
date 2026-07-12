import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  defaultThemePreset,
  resolveSystemTheme,
  type ThemeMode,
  type ThemePresetKey,
} from '../theme/presets'

interface ThemeState {
  mode: ThemeMode
  preset: ThemePresetKey
  customConfig: string
  setMode: (mode: ThemeMode) => void
  setPreset: (preset: ThemePresetKey, mode?: ThemeMode, customConfig?: string) => void
  setCustomConfig: (customConfig: string) => void
  hydrateTheme: (input?: { theme_preset?: string; theme_mode?: string; theme_config?: string }) => void
  resolved: () => 'light' | 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      preset: defaultThemePreset,
      customConfig: '',
      setMode: (mode) => set({ mode }),
      setPreset: (preset, mode, customConfig) => set((state) => ({
        preset,
        mode: mode ?? state.mode,
        customConfig: customConfig ?? '',
      })),
      setCustomConfig: (customConfig) => set({ customConfig }),
      hydrateTheme: (input) => {
        if (!input) return
        set({
          preset: (input.theme_preset || defaultThemePreset) as ThemePresetKey,
          mode: (input.theme_mode || 'light') as ThemeMode,
          customConfig: input.theme_config || '',
        })
      },
      resolved: () => {
        const m = get().mode
        return m === 'system' ? resolveSystemTheme() : m
      },
    }),
    { name: 'theme_mode' },
  ),
)

export type { ThemeMode, ThemePresetKey }
