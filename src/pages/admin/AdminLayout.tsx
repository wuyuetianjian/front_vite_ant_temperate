import { useState, useCallback } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Avatar, Button, Dropdown, Layout, Menu, Space, Typography, notification,
  theme as antdTheme, type MenuProps,
} from 'antd'
import {
  UserOutlined, TeamOutlined, SafetyOutlined, DashboardOutlined,
  LogoutOutlined, GlobalOutlined, MoonOutlined, SunOutlined, DesktopOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, KeyOutlined, AppstoreOutlined, ApartmentOutlined,
  MonitorOutlined, FileSearchOutlined, SettingOutlined, RobotOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth'
import { useThemeStore, type ThemeMode } from '../../store/theme'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import { useSessionWS } from '../../hooks/useSessionWS'
import { authApi } from '../../api/auth'
import { sessionsApi } from '../../api/sessions'
import { isCustomIcon, useSystemSettingsStore } from '../../store/systemSettings'

const { Sider, Header, Content } = Layout

const SIDER_WIDTH = 220
const SIDER_COLLAPSED_WIDTH = 64
const SVC = '/temperate.v1.TemperateService'

export default function AdminLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token: authToken, clearAuth, hasPermission } = useAuthStore()
  const { mode, setMode, resolved } = useThemeStore()
  const systemSettings = useSystemSettingsStore((s) => s.settings)
  const [collapsed, setCollapsed] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const handleKicked = useCallback(() => {
    // session already invalidated server-side; fire logout for audit log, ignore errors
    authApi.logout().catch(() => {})
    clearAuth()
    notification.warning({
      message: t('sessions.kickedTitle'),
      description: t('sessions.kickedMessage'),
      duration: 4,
    })
    navigate('/login', { replace: true })
  }, [clearAuth, navigate, t])

  useSessionWS({ token: authToken, onKicked: handleKicked })

  const isDark = resolved() === 'dark'
  const { token } = antdTheme.useToken()

  const handleLogout = async () => {
    try {
      const res = await sessionsApi.list({ username: user?.username })
      const session = res.sessions?.find((s) => s.status === 'active')
      let detail = `logout for "${user?.username ?? ''}"`
      if (session?.login_at) {
        const loginTime = new Date(session.login_at)
        const durationMs = Date.now() - loginTime.getTime()
        const h = Math.floor(durationMs / 3_600_000)
        const m = Math.floor((durationMs % 3_600_000) / 60_000)
        const duration = h > 0 ? `${h}h ${m}m` : `${m}m`
        detail += ` · 登录时间: ${loginTime.toLocaleString()} · 在线: ${duration} · 客户端: ${session.ip}`
      }
      await authApi.logout({ detail })
    } catch { /* ignore — local logout still proceeds */ }
    clearAuth()
    navigate('/login', { replace: true })
  }

  const selectedKey = (() => {
    const p = location.pathname
    if (p.startsWith('/admin/users')) return 'users'
    if (p.startsWith('/admin/roles')) return 'roles'
    if (p.startsWith('/admin/permissions')) return 'permissions'
    if (p.startsWith('/admin/sso')) return 'sso'
    if (p.startsWith('/admin/sessions')) return 'sessions'
    if (p.startsWith('/admin/audit-logs')) return 'audit-logs'
    if (p.startsWith('/admin/settings')) return 'settings'
    if (p.startsWith('/admin/service-accounts')) return 'service-accounts'
    if (p.startsWith('/admin/profile')) return 'profile'
    return 'dashboard'
  })()

  const adminChildren: MenuProps['items'] = [
    hasPermission(`${SVC}/ListUsers`) && {
      key: 'users',
      icon: <UserOutlined />,
      label: <Link to="/admin/users">{t('nav.users')}</Link>,
    },
    hasPermission(`${SVC}/ListRoles`) && {
      key: 'roles',
      icon: <TeamOutlined />,
      label: <Link to="/admin/roles">{t('nav.roles')}</Link>,
    },
    hasPermission(`${SVC}/ListPermissions`) && {
      key: 'permissions',
      icon: <SafetyOutlined />,
      label: <Link to="/admin/permissions">{t('nav.permissions')}</Link>,
    },
    hasPermission(`${SVC}/ListSSOProviders`) && {
      key: 'sso',
      icon: <ApartmentOutlined />,
      label: <Link to="/admin/sso">{t('nav.sso')}</Link>,
    },
    hasPermission(`${SVC}/ListSessions`) && {
      key: 'sessions',
      icon: <MonitorOutlined />,
      label: <Link to="/admin/sessions">{t('nav.sessions')}</Link>,
    },
    hasPermission(`${SVC}/ListAuditLogs`) && {
      key: 'audit-logs',
      icon: <FileSearchOutlined />,
      label: <Link to="/admin/audit-logs">{t('nav.auditLogs')}</Link>,
    },
    hasPermission(`${SVC}/GetSystemSettings`) && {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">{t('nav.settings')}</Link>,
    },
    hasPermission(`${SVC}/ListServiceAccounts`) && {
      key: 'service-accounts',
      icon: <RobotOutlined />,
      label: <Link to="/admin/service-accounts">{t('nav.serviceAccounts')}</Link>,
    },
  ].filter(Boolean) as MenuProps['items']

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">{t('nav.dashboard')}</Link>,
    },
    ...(adminChildren && adminChildren.length > 0
      ? [{
          key: 'admin',
          icon: <AppstoreOutlined />,
          label: t('nav.admin'),
          children: adminChildren,
        }]
      : []),
  ]

  const themeItems: MenuProps['items'] = [
    { key: 'light', label: t('theme.light'), icon: <SunOutlined /> },
    { key: 'dark', label: t('theme.dark'), icon: <MoonOutlined /> },
    { key: 'system', label: t('theme.system'), icon: <DesktopOutlined /> },
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => navigate('/admin/profile'),
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: t('changePassword.title'),
      onClick: () => setChangePasswordOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      danger: true,
      onClick: handleLogout,
    },
  ]

  const displayName = user?.display_name || user?.username || t('common.unknown')

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 2 }}>
      <Sider
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        collapsed={collapsed}
        className="glass"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          background: 'transparent',
          borderRight: '1px solid var(--glass-border)',
          borderRadius: 0,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{
            height: 56, display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px', gap: 10,
            borderBottom: '1px solid var(--glass-border)',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            background: isCustomIcon(systemSettings.corner_icon) ? 'rgba(255,255,255,0.72)' : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px var(--glass-accent-glow), inset 0 1px 0 rgba(255,255,255,0.25)',
            overflow: 'hidden',
          }}>
            {isCustomIcon(systemSettings.corner_icon) ? (
              <img src={systemSettings.corner_icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <AppstoreOutlined style={{ color: '#fff', fontSize: 14 }} />
            )}
          </div>
          {!collapsed && (
            <Typography.Text strong ellipsis style={{ fontSize: 15, color: 'var(--glass-text-primary)' }}>
              {systemSettings.service_name}
            </Typography.Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['admin']}
          items={menuItems}
          style={{ border: 'none', marginTop: 8, background: 'transparent' }}
          theme={isDark ? 'dark' : 'light'}
        />

        {/* Profile at bottom */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 8px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/admin/profile')}
        >
          <Avatar size={32} icon={<UserOutlined />} style={{ flexShrink: 0, background: token.colorPrimary }} />
          {!collapsed && (
            <Typography.Text ellipsis style={{ flex: 1, fontSize: 13, color: 'var(--glass-text-primary)' }}>
              {displayName}
            </Typography.Text>
          )}
        </div>
      </Sider>

      <Layout style={{
        marginLeft: collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
        transition: 'margin-left 0.2s',
        background: 'transparent',
      }}>
        {/* Floating glass header */}
        <Header
          className="glass"
          style={{
            position: 'sticky', top: 8, zIndex: 99,
            height: 52, lineHeight: '52px',
            margin: '8px 16px 0',
            padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent',
            borderRadius: 'var(--glass-radius-lg)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((v) => !v)}
            style={{ color: 'var(--glass-text-primary)' }}
          />

          <Space size={8}>
            {/* Language switch */}
            <Dropdown
              menu={{
                items: [
                  { key: 'zh', label: '中文' },
                  { key: 'en', label: 'English' },
                ],
                selectedKeys: [i18n.language.startsWith('zh') ? 'zh' : 'en'],
                onClick: ({ key }) => i18n.changeLanguage(key),
              }}
              placement="bottomRight"
            >
              <Button type="text" icon={<GlobalOutlined />} style={{ color: 'var(--glass-text-primary)' }} />
            </Dropdown>

            {/* Theme switch */}
            <Dropdown
              menu={{
                items: themeItems,
                selectedKeys: [mode],
                onClick: ({ key }) => setMode(key as ThemeMode),
              }}
              placement="bottomRight"
            >
              <Button type="text" icon={isDark ? <MoonOutlined /> : <SunOutlined />} style={{ color: 'var(--glass-text-primary)' }} />
            </Dropdown>

            {/* User menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '0 4px' }}>
                <Avatar size={28} icon={<UserOutlined />} style={{ background: token.colorPrimary }} />
                <Typography.Text style={{ fontSize: 13, color: 'var(--glass-text-primary)' }}>
                  {displayName}
                </Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24, paddingTop: 20, minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>

      <ChangePasswordModal
        open={changePasswordOpen}
        onSuccess={() => setChangePasswordOpen(false)}
        onCancel={() => setChangePasswordOpen(false)}
      />

    </Layout>
  )
}
