import client from './client'
import type { ListSessionsReply, PageParams } from '../types'

export const sessionsApi = {
  list: (params?: PageParams) =>
    client.get<ListSessionsReply>('/v1/sessions', { params }).then((r) => r.data),

  kick: (id: number) =>
    client.post(`/v1/sessions/${id}/kick`),
}
