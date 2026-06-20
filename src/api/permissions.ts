import client from './client'
import type { Permission, ListPermissionsReply, PageParams } from '../types'

export const permissionsApi = {
  list: (params?: PageParams) =>
    client.get<ListPermissionsReply>('/v1/permissions', { params }).then((r) => r.data),

  create: (data: { module: string; action: string; operation?: string; description?: string }) =>
    client.post<Permission>('/v1/permissions', data).then((r) => r.data),

  update: (id: number, data: { operation?: string; description?: string }) =>
    client.patch<Permission>(`/v1/permissions/${id}`, data).then((r) => r.data),

  delete: (id: number) => client.delete(`/v1/permissions/${id}`),
}
