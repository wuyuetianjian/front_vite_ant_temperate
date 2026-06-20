import client from './client'
import type { Role, ListRolesReply, PageParams } from '../types'

export const rolesApi = {
  list: (params?: PageParams) =>
    client.get<ListRolesReply>('/v1/roles', { params }).then((r) => r.data),

  get: (id: number) => client.get<Role>(`/v1/roles/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; permission_ids?: number[]; inherited_role_ids?: number[] }) =>
    client.post<Role>('/v1/roles', data).then((r) => r.data),

  update: (id: number, data: { description?: string }) =>
    client.patch<Role>(`/v1/roles/${id}`, data).then((r) => r.data),

  delete: (id: number) => client.delete(`/v1/roles/${id}`),

  assignPermissions: (role_id: number, permission_ids: number[]) =>
    client.put<Role>(`/v1/roles/${role_id}/permissions`, { permission_ids }).then((r) => r.data),

  setInheritances: (role_id: number, inherited_role_ids: number[]) =>
    client.put<Role>(`/v1/roles/${role_id}/inheritances`, { inherited_role_ids }).then((r) => r.data),
}
