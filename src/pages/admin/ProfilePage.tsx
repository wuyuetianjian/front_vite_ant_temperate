import { useState } from 'react'
import { Avatar, Button, Card, Descriptions, Space, Tag, Typography } from 'antd'
import { UserOutlined, KeyOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth'
import ChangePasswordModal from '../../components/ChangePasswordModal'

export default function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const visibleRoles = user?.roles.filter((r) => r.name !== '_effective') ?? []

  return (
    <div style={{ maxWidth: 640 }}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>{t('profile.title')}</Typography.Title>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
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

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Typography.Title level={5} style={{ marginBottom: 16 }}>{t('profile.changePassword')}</Typography.Title>
        <Button icon={<KeyOutlined />} onClick={() => setChangePasswordOpen(true)}>
          {t('profile.changePassword')}
        </Button>
      </Card>

      <ChangePasswordModal
        open={changePasswordOpen}
        onSuccess={() => setChangePasswordOpen(false)}
        onCancel={() => setChangePasswordOpen(false)}
      />
    </div>
  )
}
