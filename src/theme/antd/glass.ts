import { useMemo } from 'react'
import { theme } from 'antd'
import type { ConfigProviderProps } from 'antd'

/**
 * Liquid-glass preset. Only sets brand tokens; the frosted material (translucent
 * surfaces + backdrop-filter) is owned by `liquid-glass.css`, so we deliberately
 * do NOT override component backgrounds here.
 */
const useGlassTheme = (): ConfigProviderProps =>
  useMemo(
    () => ({
      theme: {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorInfo: '#3b82f6',
          borderRadius: 12,
        },
      },
    }),
    [],
  )

export default useGlassTheme
