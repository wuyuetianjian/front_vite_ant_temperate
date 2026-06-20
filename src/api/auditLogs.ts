import client from './client'
import type { ListAuditLogsReply, PageParams } from '../types'

export const auditLogsApi = {
  list: (params?: PageParams & { action?: string }) =>
    client.get<ListAuditLogsReply>('/v1/audit-logs', { params }).then((r) => r.data),
}
