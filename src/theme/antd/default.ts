import { useMemo } from 'react'
import { theme } from 'antd'
import type { ConfigProviderProps } from 'antd'

/** Native Ant Design look — default algorithm, brand blue. */
const useDefaultTheme = (): ConfigProviderProps =>
  useMemo(
    () => ({
      theme: {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          colorInfo: '#1677ff',
          borderRadius: 8,
        },
      },
    }),
    [],
  )

export default useDefaultTheme
