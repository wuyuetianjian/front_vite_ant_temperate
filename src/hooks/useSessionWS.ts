import { useEffect, useRef } from 'react'
import config from '../config'
import client from '../api/client'

const POLL_INTERVAL = 30_000

type Options = {
  token: string | null
  onKicked: () => void
  onExpired?: () => void
}

function buildWSUrl(token: string): string {
  const base = config.apiBaseUrl
  if (base) {
    const wsBase = base.replace(/^http(s?)/, (_match: string, s: string) => `ws${s}`)
    return `${wsBase}/v1/ws?token=${encodeURIComponent(token)}`
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/v1/ws?token=${encodeURIComponent(token)}`
}

export function useSessionWS({ token, onKicked, onExpired }: Options) {
  const onKickedRef = useRef(onKicked)
  onKickedRef.current = onKicked
  const onExpiredRef = useRef(onExpired)
  onExpiredRef.current = onExpired

  // WebSocket: real-time kicked/expired notification from backend
  useEffect(() => {
    if (!token) return

    let stopped = false
    let terminated = false
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      if (stopped || terminated) return

      ws = new WebSocket(buildWSUrl(token!))

      ws.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string) as { type: string }
          if (msg.type === 'kicked') {
            terminated = true
            onKickedRef.current()
          } else if (msg.type === 'expired') {
            terminated = true
            onExpiredRef.current?.()
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        ws = null
        if (!stopped && !terminated) {
          reconnectTimer = setTimeout(connect, 5000)
        }
      }

      ws.onerror = () => {
        ws?.close()
      }
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [token])

  // Polling fallback: /v1/auth/me every 30s — 401 is handled by axios interceptor
  useEffect(() => {
    if (!token) return
    const id = setInterval(() => {
      client.get('/v1/auth/me').catch(() => {/* interceptor handles 401 */})
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [token])
}
