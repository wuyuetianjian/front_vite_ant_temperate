import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import { useThemeStore } from './store/theme'
import { useWallpaperStore } from './store/wallpaper'
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
          colorPrimary: '#6366f1',
          colorInfo: '#6366f1',
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
