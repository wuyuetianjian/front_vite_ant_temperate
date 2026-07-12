import { create } from 'zustand'
import config from '../config'
import { settingsApi } from '../api/settings'
import type { SystemSettings } from '../types'

const DEFAULT_SETTINGS: SystemSettings = {
  audit_log_retention_days: 90,
  session_log_retention_days: 30,
  service_name: config.appName || 'Temperate',
  site_icon: 'Temperate',
  corner_icon: 'Temperate',
  totp_enabled: false,
  default_theme_preset: 'glass',
  default_theme_mode: 'light',
  default_theme_config: '',
}

interface SystemSettingsStore {
  settings: SystemSettings
  loading: boolean
  load: () => Promise<SystemSettings>
  setSettings: (settings: SystemSettings) => void
}

function withDefaults(settings?: Partial<SystemSettings>): SystemSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    service_name: settings?.service_name || DEFAULT_SETTINGS.service_name,
    site_icon: settings?.site_icon || DEFAULT_SETTINGS.site_icon,
    corner_icon: settings?.corner_icon || DEFAULT_SETTINGS.corner_icon,
  }
}

export function isCustomIcon(value?: string): value is string {
  if (!value) return false
  const trimmed = value.trim()
  return trimmed !== '' && trimmed !== 'Temperate'
}

export const useSystemSettingsStore = create<SystemSettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  load: async () => {
    if (get().loading) return get().settings
    set({ loading: true })
    try {
      const settings = withDefaults(await settingsApi.get())
      set({ settings })
      return settings
    } finally {
      set({ loading: false })
    }
  },
  setSettings: (settings) => set({ settings: withDefaults(settings) }),
}))
