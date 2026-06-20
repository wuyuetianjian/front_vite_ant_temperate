import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.BACKEND_URL ?? 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/v1': { target: backendUrl, changeOrigin: true, ws: true },
        '/health': { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
