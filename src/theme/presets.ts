import { theme as antdTheme, type ThemeConfig } from 'antd'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeDensity = 'default' | 'compact'
export type ThemePresetKey =
  | 'default' | 'dark' | 'mui' | 'shadcn' | 'cartoon' | 'illustration' | 'bootstrap' | 'glass' | 'geek'

export interface ThemePreset {
  key: ThemePresetKey
  mode: ThemeMode
  density: ThemeDensity
  accent: string
  preview: [string, string, string]
  radius: number
}

export interface ThemeCustomConfig {
  primaryColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  textSecondaryColor: string
  borderColor: string
  borderRadius: number
  density: ThemeDensity
}

export const themePresets: ThemePreset[] = [
  { key: 'default', mode: 'light', density: 'default', accent: '#1677ff', preview: ['#f8fafc', '#1677ff', '#d9e8ff'], radius: 10 },
  { key: 'dark', mode: 'dark', density: 'default', accent: '#60a5fa', preview: ['#111827', '#60a5fa', '#334155'], radius: 10 },
  { key: 'mui', mode: 'light', density: 'default', accent: '#1976d2', preview: ['#ffffff', '#1976d2', '#e3f2fd'], radius: 8 },
  { key: 'shadcn', mode: 'light', density: 'compact', accent: '#18181b', preview: ['#fafafa', '#18181b', '#e4e4e7'], radius: 8 },
  { key: 'cartoon', mode: 'light', density: 'default', accent: '#0ea5e9', preview: ['#fff7ed', '#0ea5e9', '#fed7aa'], radius: 16 },
  { key: 'illustration', mode: 'light', density: 'default', accent: '#7c3aed', preview: ['#fff1f2', '#7c3aed', '#fde68a'], radius: 18 },
  { key: 'bootstrap', mode: 'light', density: 'default', accent: '#0d6efd', preview: ['#f8f9fa', '#0d6efd', '#dee2e6'], radius: 6 },
  { key: 'glass', mode: 'light', density: 'compact', accent: '#3b82f6', preview: ['#e0f2fe', '#3b82f6', '#ffffff'], radius: 12 },
  { key: 'geek', mode: 'dark', density: 'compact', accent: '#22c55e', preview: ['#020617', '#22c55e', '#164e63'], radius: 6 },
]

export const defaultThemePreset: ThemePresetKey = 'glass'

const lightDefaults: Record<ThemePresetKey, Omit<ThemeCustomConfig, 'density' | 'borderRadius'>> = {
  default: { primaryColor: '#1677ff', backgroundColor: '#f6f8fb', surfaceColor: '#ffffff', textColor: '#182230', textSecondaryColor: '#667085', borderColor: '#e4e7ec' },
  dark: { primaryColor: '#60a5fa', backgroundColor: '#111827', surfaceColor: '#1f2937', textColor: '#f8fafc', textSecondaryColor: '#94a3b8', borderColor: '#334155' },
  mui: { primaryColor: '#1976d2', backgroundColor: '#f5f7fb', surfaceColor: '#ffffff', textColor: '#1d2939', textSecondaryColor: '#667085', borderColor: '#d9e2ef' },
  shadcn: { primaryColor: '#18181b', backgroundColor: '#fafafa', surfaceColor: '#ffffff', textColor: '#18181b', textSecondaryColor: '#71717a', borderColor: '#e4e4e7' },
  cartoon: { primaryColor: '#0ea5e9', backgroundColor: '#fff7ed', surfaceColor: '#ffffff', textColor: '#1e293b', textSecondaryColor: '#64748b', borderColor: '#7dd3fc' },
  illustration: { primaryColor: '#7c3aed', backgroundColor: '#fff7fb', surfaceColor: '#ffffff', textColor: '#312e4b', textSecondaryColor: '#7c728f', borderColor: '#e9d5ff' },
  bootstrap: { primaryColor: '#0d6efd', backgroundColor: '#f8f9fa', surfaceColor: '#ffffff', textColor: '#212529', textSecondaryColor: '#6c757d', borderColor: '#dee2e6' },
  glass: { primaryColor: '#3b82f6', backgroundColor: '#eff6ff', surfaceColor: '#ffffff', textColor: '#14141e', textSecondaryColor: '#4b5563', borderColor: '#ffffff' },
  geek: { primaryColor: '#22c55e', backgroundColor: '#020617', surfaceColor: '#0f172a', textColor: '#e2e8f0', textSecondaryColor: '#94a3b8', borderColor: '#1e3a2b' },
}

const darkFallback = { backgroundColor: '#101828', surfaceColor: '#182230', textColor: '#f8fafc', textSecondaryColor: '#98a2b3', borderColor: '#344054' }
const colorPattern = /^#[0-9a-fA-F]{6}$/

export function getThemePreset(key?: string): ThemePreset {
  return themePresets.find((item) => item.key === key) ?? themePresets.find((item) => item.key === defaultThemePreset)!
}

export function resolveSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getDefaultThemeConfig(presetKey: ThemePresetKey, mode?: ThemeMode): ThemeCustomConfig {
  const preset = getThemePreset(presetKey)
  const resolvedMode = mode === 'system' ? resolveSystemTheme() : mode
  const colors = resolvedMode === 'dark' && preset.key !== 'dark' && preset.key !== 'geek'
    ? { ...lightDefaults[preset.key], ...darkFallback }
    : lightDefaults[preset.key]

  return { ...colors, borderRadius: preset.radius, density: preset.density }
}

export function parseThemeConfig(value?: string, presetKey: ThemePresetKey = defaultThemePreset, mode?: ThemeMode): ThemeCustomConfig {
  const defaults = getDefaultThemeConfig(presetKey, mode)
  if (!value) return defaults
  try {
    const input = JSON.parse(value) as Partial<ThemeCustomConfig>
    const color = (key: keyof Pick<ThemeCustomConfig, 'primaryColor' | 'backgroundColor' | 'surfaceColor' | 'textColor' | 'textSecondaryColor' | 'borderColor'>) =>
      typeof input[key] === 'string' && colorPattern.test(input[key]) ? input[key] : defaults[key]
    return {
      primaryColor: color('primaryColor'), backgroundColor: color('backgroundColor'), surfaceColor: color('surfaceColor'),
      textColor: color('textColor'), textSecondaryColor: color('textSecondaryColor'), borderColor: color('borderColor'),
      borderRadius: typeof input.borderRadius === 'number' && input.borderRadius >= 0 && input.borderRadius <= 32 ? input.borderRadius : defaults.borderRadius,
      density: input.density === 'compact' || input.density === 'default' ? input.density : defaults.density,
    }
  } catch {
    return defaults
  }
}

export function serializeThemeConfig(config: ThemeCustomConfig): string {
  return JSON.stringify(config)
}

export function previewThemeColor(key: keyof ThemeCustomConfig, value: string) {
  const variable: Partial<Record<keyof ThemeCustomConfig, string>> = {
    primaryColor: '--theme-primary', backgroundColor: '--theme-bg-layout', surfaceColor: '--theme-bg-surface',
    textColor: '--theme-text-primary', textSecondaryColor: '--theme-text-secondary', borderColor: '--theme-border',
  }
  const target = variable[key]
  if (target && /^#[0-9a-fA-F]{6}$/.test(value)) document.documentElement.style.setProperty(target, value)
}

export function buildAntdTheme(presetKey: ThemePresetKey, mode: ThemeMode, customConfig?: string): ThemeConfig {
  const preset = getThemePreset(presetKey)
  const resolvedMode = mode === 'system' ? resolveSystemTheme() : mode
  const isDark = preset.key === 'dark' || preset.key === 'geek' || resolvedMode === 'dark'
  const config = parseThemeConfig(customConfig, presetKey, mode)
  const algorithms = [isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm]
  if (config.density === 'compact') algorithms.push(antdTheme.compactAlgorithm)

  return {
    algorithm: algorithms,
    token: {
      colorPrimary: config.primaryColor, colorInfo: config.primaryColor, colorBgLayout: config.backgroundColor,
      colorBgContainer: config.surfaceColor, colorText: config.textColor, colorTextSecondary: config.textSecondaryColor,
      colorBorder: config.borderColor, borderRadius: config.borderRadius,
      fontFamily: 'Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    components: {
      Button: { controlHeight: config.density === 'compact' ? 34 : 40, borderRadius: config.borderRadius },
      Input: { controlHeight: config.density === 'compact' ? 34 : 40, borderRadius: config.borderRadius },
      Select: { controlHeight: config.density === 'compact' ? 34 : 40, borderRadius: config.borderRadius },
      Card: { borderRadiusLG: config.borderRadius },
      Table: { cellPaddingBlock: config.density === 'compact' ? 8 : 12, cellPaddingInline: config.density === 'compact' ? 10 : 16 },
    },
  }
}
