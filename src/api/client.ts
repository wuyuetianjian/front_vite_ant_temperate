import axios from 'axios'
import config from '../config'

const client = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

client.interceptors.request.use((req) => {
  const token = localStorage.getItem('auth_token')
  if (token) req.headers.Authorization = `Bearer ${token}`
  return req
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      // avoid import cycle — use window.location instead of router
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message ?? err.response?.data?.reason
    return msg ?? err.message
  }
  return String(err)
}

export default client
