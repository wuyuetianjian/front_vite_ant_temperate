import { useState } from 'react'
import { Avatar, Button, Card, Descriptions, Space, Tag, Typography, message } from 'antd'
import { UserOutlined, KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth'
import { authApi } from '../../api/auth'
import { apiError } from '../../api/client'
import { useSystemSettingsStore } from '../../store/systemSettings'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import Setup2FAModal from '../../components/Setup2FAModal'
import Disable2FAModal from '../../components/Disable2FAModal'
import ThemePresetPanel from '../../components/ThemePresetPanel'

export default function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const totpSystemEnabled = useSystemSettingsStore((s) => s.settings.totp_enabled)
  const [messageApi, contextHolder] = message.useMessage()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [setup2FAOpen, setSetup2FAOpen] = useState(false)
  const [disable2FAOpen, setDisable2FAOpen] = useState(false)

  const visibleRoles = user?.roles?.filter((r) => r.name !== '_effective') ?? []

  const handleSetupSuccess = async () => {
    setSetup2FAOpen(false)
    try {
      const updated = await authApi.me()
      updateUser(updated)
    } catch { /* ignore */ }
  }

  const handleDisableSuccess = async () => {
    setDisable2FAOpen(false)
    try {
      const updated = await authApi.me()
      updateUser(updated)
    } catch (err) {
      messageApi.error(apiError(err))
    }
  }

  return (
    <div>
      {contextHolder}
      <Typography.Title level={4} style={{ marginBottom: 24 }}>{t('profile.title')}</Typography.Title>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
        gap: 16,
        alignItems: 'stretch',
      }}>
        <ThemePresetPanel />

        {/* 账户信息 — 始终撑满整行 */}
        <Card bordered={false} style={{ borderRadius: 12, gridColumn: '1 / -1' }}>
          <Space align="start" size={20} style={{ marginBottom: 24 }}>
            <Avatar size={64} icon={<UserOutlined />} />
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {user?.display_name || user?.username}
              </Typography.Title>
              <Typography.Text type="secondary">@{user?.username}</Typography.Text>
            </div>
          </Space>

          <Descriptions column={1} size="small" labelStyle={{ fontWeight: 600, width: 120 }}>
            <Descriptions.Item label={t('profile.username')}>{user?.username}</Descriptions.Item>
            <Descriptions.Item label={t('profile.displayName')}>
              {user?.display_name || <Typography.Text type="secondary">—</Typography.Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t('profile.roles')}>
              <Space wrap size={4}>
                {visibleRoles.map((r) => (
                  <Tag key={r.id} color={r.system ? 'blue' : 'default'}>{r.name}</Tag>
                ))}
                {visibleRoles.length === 0 && <Typography.Text type="secondary">—</Typography.Text>}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 修改密码 */}
        <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
          <Typography.Title level={5} style={{ marginBottom: 16 }}>{t('profile.changePassword')}</Typography.Title>
          <Button icon={<KeyOutlined />} onClick={() => setChangePasswordOpen(true)}>
            {t('profile.changePassword')}
          </Button>
        </Card>

        {/* 双因素认证 */}
        {totpSystemEnabled && (
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Space style={{ marginBottom: 16 }} align="center">
              <SafetyCertificateOutlined style={{ fontSize: 18 }} />
              <Typography.Title level={5} style={{ margin: 0 }}>{t('twoFactor.title')}</Typography.Title>
            </Space>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {t('twoFactor.description')}
            </Typography.Paragraph>
            <Space>
              <Tag color={user?.totp_enabled ? 'success' : 'default'}>
                {user?.totp_enabled ? t('twoFactor.enabled') : t('twoFactor.disabled')}
              </Tag>
              {user?.totp_enabled ? (
                <Button danger onClick={() => setDisable2FAOpen(true)}>
                  {t('twoFactor.disable')}
                </Button>
              ) : (
                <Button type="primary" onClick={() => setSetup2FAOpen(true)}>
                  {t('twoFactor.enable')}
                </Button>
              )}
            </Space>
          </Card>
        )}
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onSuccess={() => setChangePasswordOpen(false)}
        onCancel={() => setChangePasswordOpen(false)}
      />

      <Setup2FAModal
        open={setup2FAOpen}
        onSuccess={handleSetupSuccess}
        onCancel={() => setSetup2FAOpen(false)}
      />

      <Disable2FAModal
        open={disable2FAOpen}
        onSuccess={handleDisableSuccess}
        onCancel={() => setDisable2FAOpen(false)}
      />
    </div>
  )
}
