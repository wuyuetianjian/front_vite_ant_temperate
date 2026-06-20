import client from './client'
import type { User, ListUsersReply, PageParams } from '../types'

export const usersApi = {
  list: (params?: PageParams) =>
    client.get<ListUsersReply>('/v1/users', { params }).then((r) => r.data),

  get: (id: number) => client.get<User>(`/v1/users/${id}`).then((r) => r.data),

  create: (data: { username: string; password: string; display_name?: string; disabled?: boolean; role_ids?: number[] }) =>
    client.post<User>('/v1/users', data).then((r) => r.data),

  update: (id: number, data: { display_name?: string; disabled?: boolean; role_ids?: number[] }) =>
    client.patch<User>(`/v1/users/${id}`, data).then((r) => r.data),

  delete: (id: number) => client.delete(`/v1/users/${id}`),

  assignRoles: (user_id: number, role_ids: number[]) =>
    client.put<User>(`/v1/users/${user_id}/roles`, { role_ids }).then((r) => r.data),
}
