import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Avatar, Button, Dropdown, Layout, Menu, Space, Typography,
  theme as antdTheme, type MenuProps,
} from 'antd'
import {
  UserOutlined, TeamOutlined, SafetyOutlined, DashboardOutlined,
  LogoutOutlined, GlobalOutlined, MoonOutlined, SunOutlined, DesktopOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, KeyOutlined, AppstoreOutlined, ApartmentOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth'
import { useThemeStore, type ThemeMode } from '../../store/theme'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import config from '../../config'

const { Sider, Header, Content } = Layout

const SIDER_WIDTH = 220
const SIDER_COLLAPSED_WIDTH = 64
const SVC = '/temperate.v1.TemperateService'

export default function AdminLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearAuth, hasPermission } = useAuthStore()
  const { mode, setMode, resolved } = useThemeStore()
  const [collapsed, setCollapsed] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const isDark = resolved() === 'dark'
  const { token } = antdTheme.useToken()

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const selectedKey = (() => {
    const p = location.pathname
    if (p.startsWith('/admin/users')) return 'users'
    if (p.startsWith('/admin/roles')) return 'roles'
    if (p.startsWith('/admin/permissions')) return 'permissions'
    if (p.startsWith('/admin/sso')) return 'sso'
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

  // glassmorphism values by theme
  const glassBg = isDark
    ? 'rgba(12, 12, 28, 0.65)'
    : 'rgba(255, 255, 255, 0.55)'
  const glassBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.07)'
    : '1px solid rgba(200, 200, 220, 0.35)'
  const headerGlassBg = isDark
    ? 'rgba(12, 12, 28, 0.75)'
    : 'rgba(255, 255, 255, 0.70)'

  const layoutBg = isDark
    ? 'linear-gradient(135deg, #0d0d1f 0%, #111827 50%, #0d1117 100%)'
    : 'linear-gradient(135deg, #e8eaf6 0%, #f3f4fb 50%, #ede7f6 100%)'

  return (
    <Layout style={{ minHeight: '100vh', background: layoutBg }}>
      <Sider
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        collapsed={collapsed}
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          background: glassBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: glassBorder,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{
            height: 56, display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px', gap: 10,
            borderBottom: glassBorder,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AppstoreOutlined style={{ color: '#fff', fontSize: 14 }} />
          </div>
          {!collapsed && (
            <Typography.Text strong ellipsis style={{ fontSize: 15 }}>
              {config.appName}
            </Typography.Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['admin']}
          items={menuItems}
          style={{
            border: 'none',
            marginTop: 8,
            background: 'transparent',
          }}
          theme={isDark ? 'dark' : 'light'}
        />

        {/* Profile at bottom */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 8px',
            borderTop: glassBorder,
            display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden',
            cursor: 'pointer',
            background: 'transparent',
          }}
          onClick={() => navigate('/admin/profile')}
        >
          <Avatar size={32} icon={<UserOutlined />} style={{ flexShrink: 0, background: token.colorPrimary }} />
          {!collapsed && (
            <Typography.Text ellipsis style={{ flex: 1, fontSize: 13 }}>{displayName}</Typography.Text>
          )}
        </div>
      </Sider>

      <Layout style={{
        marginLeft: collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
        transition: 'margin-left 0.2s',
        background: 'transparent',
      }}>
        <Header style={{
          position: 'sticky', top: 0, zIndex: 99,
          height: 56, lineHeight: '56px',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: headerGlassBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: glassBorder,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((v) => !v)}
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
              <Button type="text" icon={<GlobalOutlined />} />
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
              <Button type="text" icon={isDark ? <MoonOutlined /> : <SunOutlined />} />
            </Dropdown>

            {/* User menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '0 4px' }}>
                <Avatar size={28} icon={<UserOutlined />} style={{ background: token.colorPrimary }} />
                <Typography.Text style={{ fontSize: 13 }}>{displayName}</Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24, minHeight: 'calc(100vh - 56px)' }}>
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
