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
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login')
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
