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
  disabled: boolean
  system: boolean
  roles: Role[]
  created_at: string
  updated_at: string
}

export interface LoginReply {
  token: string
  user: User
  must_change_password: boolean
  initial_password: string
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
