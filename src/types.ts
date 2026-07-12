export interface Permission {
  id: number
  module: string
  action: string
  operation: string
  description: string
  system: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  description: string
  system: boolean
  permissions: Permission[]
  inherited_roles: Role[]
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  username: string
  display_name: string
  email: string
  disabled: boolean
  system: boolean
  source: string
  auth_sources: string[]
  totp_enabled: boolean
  theme_preset: string
  theme_mode: string
  theme_config: string
  roles: Role[]
  created_at: string
  updated_at: string
}

export interface LoginReply {
  token: string
  user: User
  must_change_password: boolean
  initial_password: string
  requires_2fa: boolean
  pre_auth_token: string
}

export interface Setup2FAReply {
  secret: string
  qr_url: string
}

export interface SSOProvider {
  id: number
  name: string
  type: 'oauth1' | 'oauth2' | 'oidc' | 'saml1' | 'saml2' | 'ldap'
  enabled: boolean
  icon: string
  sort_order: number
  config: Record<string, string>
  created_at: string
  updated_at: string
}

export interface SSOProviderBrief {
  id: number
  name: string
  type: string
  icon: string
}

export interface InitialPasswordReply {
  available: boolean
  username: string
  initial_password: string
}

export interface UserSession {
  id: number
  userId?: number
  user_id?: number
  username: string
  ip: string
  browser: string
  os: string
  status: 'active' | 'kicked' | 'expired'
  kickedBy?: string
  kicked_by?: string
  loginSource?: string
  login_source?: string
  loginAt?: string
  login_at?: string          // normalized from loginAt or login_at
  lastAccessAt?: string
  last_access_at?: string    // normalized from lastAccessAt or last_access_at
}

export interface AuditLogEntry {
  id: number
  user_id: number
  username: string
  action: string
  resource_type: string
  resource_name: string
  ip: string
  detail: string
  created_at: string
}

export interface SystemSettings {
  auditLogRetentionDays?: number
  sessionLogRetentionDays?: number
  serviceName?: string
  siteIcon?: string
  cornerIcon?: string
  audit_log_retention_days: number
  session_log_retention_days: number
  service_name: string
  site_icon: string
  corner_icon: string
  totp_enabled: boolean
  default_theme_preset: string
  default_theme_mode: string
  default_theme_config: string
}

export interface ListSessionsReply {
  sessions: UserSession[]
  total: number
}

export interface ListAuditLogsReply {
  logs: AuditLogEntry[]
  total: number
}

export interface PageParams {
  page_size?: number
  page_token?: number
}

export interface ListUsersReply {
  users: User[]
  total: number
}

export interface ListRolesReply {
  roles: Role[]
  total: number
}

export interface ListPermissionsReply {
  permissions: Permission[]
  total: number
}

export interface ServiceAccount {
  id: number
  name: string
  description: string
  token_prefix: string
  disabled: boolean
  roles: Role[]
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface ServiceAccountTokenReply {
  service_account: ServiceAccount
  token: string
}

export interface ListServiceAccountsReply {
  service_accounts: ServiceAccount[]
  total: number
}
