import client from './client'
import type { ListSessionsReply, PageParams, UserSession } from '../types'

type UserSessionWire = UserSession & {
  userId?: number
  kickedBy?: string
  loginAt?: string
  lastAccessAt?: string
}

function normalizeSession(session: UserSessionWire): UserSession {
  return {
    ...session,
    user_id: session.user_id ?? session.userId,
    kicked_by: session.kicked_by ?? session.kickedBy,
    login_at: session.login_at ?? session.loginAt,
    last_access_at: session.last_access_at ?? session.lastAccessAt,
  }
}

export const sessionsApi = {
  list: (params?: PageParams & { username?: string }) =>
    client.get<ListSessionsReply>('/v1/sessions', { params }).then((r) => ({
      ...r.data,
      sessions: (r.data.sessions ?? []).map((session) => normalizeSession(session)),
    })),

  kick: (id: number, meta?: { detail?: string; resource_name?: string }) =>
    client.post(`/v1/sessions/${id}/kick`, meta ?? {}),
}
