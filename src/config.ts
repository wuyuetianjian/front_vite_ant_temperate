declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string
      appName?: string
    }
  }
}

const config = {
  // Runtime config (injected by docker/entrypoint.sh via /config.js) takes
  // precedence; build-time VITE_* vars are the fallback for local dev.
  apiBaseUrl: window.__APP_CONFIG__?.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? '',
  appName: window.__APP_CONFIG__?.appName ?? import.meta.env.VITE_APP_NAME ?? 'Temperate',
  defaultPageSize: 20,
} as const

export default config
