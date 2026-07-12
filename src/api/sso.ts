import client from './client'
import type { SSOProvider, SSOProviderBrief } from '../types'

export const ssoApi = {
  listPublic: () =>
    client.get<{ providers: SSOProviderBrief[] }>('/v1/sso/providers/public').then((r) => r.data.providers ?? []),

  list: (includeDisabled = true) =>
    client.get<{ providers: SSOProvider[] }>('/v1/sso/providers', { params: { include_disabled: includeDisabled } })
      .then((r) => r.data.providers ?? []),

  get: (id: number) =>
    client.get<SSOProvider>(`/v1/sso/providers/${id}`).then((r) => r.data),

  create: (data: {
    name: string
    type: string
    enabled: boolean
    icon: string
    sort_order: number
    config: Record<string, string>
  }) => client.post<SSOProvider>('/v1/sso/providers', data).then((r) => r.data),

  update: (id: number, data: {
    name: string
    enabled: boolean
    icon: string
    sort_order: number
    config: Record<string, string>
  }) => client.patch<SSOProvider>(`/v1/sso/providers/${id}`, data).then((r) => r.data),

  test: (data: {
    type: string
    config: Record<string, string>
    username: string
    password: string
  }) => client.post<{ success: boolean; display_name: string; message: string }>('/v1/sso/providers/test', data).then((r) => r.data),

  delete: (id: number) => client.delete(`/v1/sso/providers/${id}`),

  generateSamlKeyPair: (commonName = '') =>
    client.post<{ private_key: string; certificate: string }>('/v1/sso/saml/keypair', { common_name: commonName })
      .then((r) => r.data),
}
