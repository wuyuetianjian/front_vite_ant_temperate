import client from './client'
import type { SystemSettings } from '../types'

type SystemSettingsWire = Partial<SystemSettings>

function normalizeSettings(settings: SystemSettingsWire): SystemSettings {
  return {
    ...settings,
    audit_log_retention_days: settings.audit_log_retention_days ?? settings.auditLogRetentionDays ?? 90,
    session_log_retention_days: settings.session_log_retention_days ?? settings.sessionLogRetentionDays ?? 30,
    service_name: settings.service_name ?? settings.serviceName ?? 'Temperate',
    site_icon: settings.site_icon ?? settings.siteIcon ?? 'Temperate',
    corner_icon: settings.corner_icon ?? settings.cornerIcon ?? 'Temperate',
    totp_enabled: settings.totp_enabled ?? false,
    default_theme_preset: settings.default_theme_preset ?? 'glass',
    default_theme_mode: settings.default_theme_mode ?? 'light',
    default_theme_config: settings.default_theme_config ?? '',
  }
}

export const settingsApi = {
  get: () => client.get<SystemSettingsWire>('/v1/settings').then((r) => normalizeSettings(r.data)),

  update: (data: SystemSettings) =>
    client.patch<SystemSettingsWire>('/v1/settings', data).then((r) => normalizeSettings(r.data)),
}
