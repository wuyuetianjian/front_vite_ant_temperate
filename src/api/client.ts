import axios from 'axios'
import config from '../config'
import { resetAuth } from '../store/auth'

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
      resetAuth()
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/403') {
        window.location.replace('/login')
      }
    } else if (err.response?.status === 403) {
      const reason = err.response?.data?.reason
      if (reason === 'USER_DISABLED') {
        resetAuth()
        if (window.location.pathname !== '/403') {
          window.location.replace('/403?reason=disabled')
        }
      } else if (window.location.pathname !== '/403' && !window.location.pathname.startsWith('/login')) {
        window.location.replace('/403')
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
