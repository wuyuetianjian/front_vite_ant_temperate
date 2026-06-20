import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import { useThemeStore } from './store/theme'
import { useWallpaperStore } from './store/wallpaper'
import { isCustomIcon, useSystemSettingsStore } from './store/systemSettings'
import { router } from './router'

function WallpaperBackground() {
  const url = useWallpaperStore((s) => s.url)
  const hasWallpaper = !!url

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
  const { resolved } = useThemeStore()
  const isDark = resolved() === 'dark'
  const wallpaperUrl = useWallpaperStore((s) => s.url)
  const settings = useSystemSettingsStore((s) => s.settings)
  const loadSystemSettings = useSystemSettingsStore((s) => s.load)

  useEffect(() => {
    loadSystemSettings().catch(() => {})
  }, [loadSystemSettings])

  useEffect(() => {
    document.title = settings.service_name || 'Temperate'
    const icon = document.querySelector<HTMLLinkElement>('link[rel=\"icon\"]')
    if (icon) icon.href = isCustomIcon(settings.site_icon) ? settings.site_icon : '/favicon.svg'
  }, [settings.service_name, settings.site_icon])

  // Sync data-theme attribute for CSS variable switching
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

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
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorInfo: '#3b82f6',
          borderRadius: 12,
          fontFamily: 'Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Button: { controlHeight: 40, borderRadius: 12 },
          Input: { controlHeight: 40, borderRadius: 12 },
          Select: { borderRadius: 12 },
        },
      }}
    >
      <AntdApp>
        <WallpaperBackground />
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}
