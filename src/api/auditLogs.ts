import client from './client'
import type { AuditLogEntry, ListAuditLogsReply, PageParams } from '../types'

type AuditLogEntryWire = AuditLogEntry & {
  userId?: number
  userName?: string
  user_name?: string
  resourceType?: string
  resourceName?: string
  createdAt?: string
}

function normalizeAuditLog(log: AuditLogEntryWire): AuditLogEntry {
  const action = log.action ?? ''
  const resourceName = log.resource_name ?? log.resourceName ?? ''
  const username = log.username ?? log.userName ?? log.user_name ?? ''
  return {
    ...log,
    user_id: log.user_id ?? log.userId,
    username: username || (action === 'login' || action === 'logout' ? resourceName : ''),
    resource_type: log.resource_type ?? log.resourceType ?? '',
    resource_name: resourceName,
    created_at: log.created_at ?? log.createdAt ?? '',
  }
}

export const auditLogsApi = {
  list: (params?: PageParams & { action?: string; username?: string; resource_type?: string; start_time?: string; end_time?: string }) =>
    client.get<ListAuditLogsReply>('/v1/audit-logs', { params }).then((r) => ({
      ...r.data,
      logs: (r.data.logs ?? []).map((log) => normalizeAuditLog(log)),
    })),
}
