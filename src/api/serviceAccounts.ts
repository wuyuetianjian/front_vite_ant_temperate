import client from './client'
import type { ServiceAccount, ServiceAccountTokenReply, ListServiceAccountsReply, PageParams } from '../types'

export const serviceAccountsApi = {
  list: (params?: PageParams) =>
    client.get<ListServiceAccountsReply>('/v1/service-accounts', { params }).then((r) => r.data),

  get: (id: number) =>
    client.get<ServiceAccount>(`/v1/service-accounts/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; expires_in_days?: number; role_ids?: number[] }) =>
    client.post<ServiceAccountTokenReply>('/v1/service-accounts', data).then((r) => r.data),

  update: (id: number, data: { description?: string; disabled?: boolean; role_ids?: number[] }) =>
    client.patch<ServiceAccount>(`/v1/service-accounts/${id}`, data).then((r) => r.data),

  delete: (id: number) => client.delete(`/v1/service-accounts/${id}`),

  regenerateToken: (id: number, expires_in_days?: number) =>
    client.post<ServiceAccountTokenReply>(`/v1/service-accounts/${id}/regenerate-token`, { expires_in_days: expires_in_days ?? 0 }).then((r) => r.data),
}
