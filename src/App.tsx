import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import { useThemeStore } from './store/theme'
import { useWallpaperStore } from './store/wallpaper'
import { isCustomIcon, useSystemSettingsStore } from './store/systemSettings'
import { useAuthStore } from './store/auth'
import { authApi } from './api/auth'
import { router } from './router'
import { buildAntdTheme, parseThemeConfig } from './theme/presets'

function WallpaperBackground({ enabled }: { enabled: boolean }) {
  const url = useWallpaperStore((s) => s.url)
  const hasWallpaper = !!url

  if (!enabled) return null

  return (
    <>
      <div
        className={`wallpaper-bg${hasWallpaper ? '' : ' wallpaper-bg-default'}`}
        aria-hidden="true"
      />
      <div className="wallpaper-overlay" aria-hidden="true" />
    </>
  )
}

export default function App() {
  const { mode, preset, customConfig, resolved } = useThemeStore()
  const settings = useSystemSettingsStore((s) => s.settings)
  const loadSystemSettings = useSystemSettingsStore((s) => s.load)
  const usesPersonalTheme = customConfig !== ''
  const effectivePreset = (usesPersonalTheme ? preset : settings.default_theme_preset || preset) as typeof preset
  const effectiveMode = usesPersonalTheme ? mode : (settings.default_theme_mode || mode) as typeof mode
  const effectiveConfig = usesPersonalTheme ? customConfig : settings.default_theme_config
  const isDark = (effectiveMode === 'system' ? resolved() : effectiveMode) === 'dark'
  const wallpaperUrl = useWallpaperStore((s) => s.url)
  const [ssoCompleting, setSSOCompleting] = useState(() => new URL(window.location.href).searchParams.has('sso_token'))

  useEffect(() => {
    loadSystemSettings().catch(() => {})
  }, [loadSystemSettings])

  useEffect(() => {
    const url = new URL(window.location.href)
    const ssoToken = url.searchParams.get('sso_token')
    if (!ssoToken) {
      setSSOCompleting(false)
      return
    }
    url.searchParams.delete('sso_token')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    localStorage.setItem('auth_token', ssoToken)
    authApi.me()
      .then((user) => {
        useAuthStore.getState().setAuth(ssoToken, user)
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        useAuthStore.getState().clearAuth()
      })
      .finally(() => setSSOCompleting(false))
  }, [])

  useEffect(() => {
    if (ssoCompleting) return
    if (window.location.pathname === '/setup') return
    authApi.getInitialPassword()
      .then((result) => {
        if (result.available) router.navigate('/setup', { replace: true })
      })
      .catch(() => {})
  }, [ssoCompleting])

  useEffect(() => {
    document.title = settings.service_name || 'Temperate'
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (icon) icon.href = isCustomIcon(settings.site_icon) ? settings.site_icon : '/favicon.svg'
  }, [settings.service_name, settings.site_icon])

  // Sync data-theme attribute for CSS variable switching
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    document.documentElement.dataset.themePreset = effectivePreset
    const config = parseThemeConfig(effectiveConfig, effectivePreset, effectiveMode)
    const variables: Record<string, string> = {
      '--theme-primary': config.primaryColor,
      '--theme-bg-layout': config.backgroundColor,
      '--theme-bg-surface': config.surfaceColor,
      '--theme-text-primary': config.textColor,
      '--theme-text-secondary': config.textSecondaryColor,
      '--theme-border': config.borderColor,
      '--theme-radius': `${config.borderRadius}px`,
    }
    for (const [name, value] of Object.entries(variables)) document.documentElement.style.setProperty(name, value)
  }, [effectiveConfig, effectiveMode, effectivePreset, isDark])

  // Sync wallpaper CSS variable
  useEffect(() => {
    const root = document.documentElement
    if (wallpaperUrl) {
      root.style.setProperty('--wallpaper-url', `url("${wallpaperUrl}")`)
    } else {
      root.style.removeProperty('--wallpaper-url')
    }
  }, [wallpaperUrl])

  return (
    <ConfigProvider
      theme={buildAntdTheme(effectivePreset, effectiveMode, effectiveConfig)}
    >
      <AntdApp>
        <WallpaperBackground enabled={effectivePreset === 'glass'} />
        {ssoCompleting ? null : <RouterProvider router={router} />}
      </AntdApp>
    </ConfigProvider>
  )
}
