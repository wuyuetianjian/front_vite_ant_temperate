import client from './client'
import type { InitialPasswordReply, LoginReply, Setup2FAReply, User } from '../types'

export const authApi = {
  getInitialPassword: () =>
    client.get<InitialPasswordReply>('/v1/auth/initial-password').then((r) => r.data),

  login: (username: string, password: string) =>
    client.post<LoginReply>('/v1/auth/login', { username, password }).then((r) => r.data),

  verifyTOTP: (pre_auth_token: string, totp_code: string) =>
    client.post<LoginReply>('/v1/auth/verify-totp', { pre_auth_token, totp_code }).then((r) => r.data),

  changePassword: (old_password: string, new_password: string) =>
    client.post('/v1/auth/change-password', { old_password, new_password }),

  me: () => client.get<User>('/v1/auth/me').then((r) => r.data),

  updateTheme: (data: { theme_preset: string; theme_mode: string; theme_config?: string }) =>
    client.put<User>('/v1/auth/me/theme', data).then((r) => r.data),

  logout: (body?: { detail?: string; redirect_uri?: string }) =>
    client.post<{ sso_logout_url?: string }>('/v1/auth/logout', body ?? {}).then((r) => r.data),

  setup2FA: () => client.post<Setup2FAReply>('/v1/auth/2fa/setup', {}).then((r) => r.data),

  enable2FA: (totp_code: string) =>
    client.post('/v1/auth/2fa/enable', { totp_code }),

  disable2FA: (totp_code: string) =>
    client.post('/v1/auth/2fa/disable', { totp_code }),

  adminReset2FA: (user_id: number) =>
    client.post(`/v1/users/${user_id}/reset-2fa`, {}),
}
