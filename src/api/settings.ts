import client from './client'
import type { SystemSettings } from '../types'

export const settingsApi = {
  get: () => client.get<SystemSettings>('/v1/settings').then((r) => r.data),

  update: (data: SystemSettings) =>
    client.patch<SystemSettings>('/v1/settings', data).then((r) => r.data),
}
