import client from './client'
import type { InitialPasswordReply, LoginReply, User } from '../types'

export const authApi = {
  getInitialPassword: () =>
    client.get<InitialPasswordReply>('/v1/auth/initial-password').then((r) => r.data),

  login: (username: string, password: string) =>
    client.post<LoginReply>('/v1/auth/login', { username, password }).then((r) => r.data),

  changePassword: (old_password: string, new_password: string) =>
    client.post('/v1/auth/change-password', { old_password, new_password }),

  me: () => client.get<User>('/v1/auth/me').then((r) => r.data),

  logout: (body?: { detail?: string }) => client.post('/v1/auth/logout', body ?? {}),
}
