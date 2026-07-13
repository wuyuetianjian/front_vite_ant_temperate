import { useMemo } from 'react'
import { theme } from 'antd'
import type { ConfigProviderProps } from 'antd'

/** Ant Design dark algorithm with a softened blue accent. */
const useDarkTheme = (): ConfigProviderProps =>
  useMemo(
    () => ({
      theme: {
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#60a5fa',
          colorInfo: '#60a5fa',
          borderRadius: 8,
        },
      },
    }),
    [],
  )

export default useDarkTheme
