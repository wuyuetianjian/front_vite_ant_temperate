import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography } from 'antd'
import { UserOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth'
import { usersApi } from '../../api/users'
import { rolesApi } from '../../api/roles'
import { permissionsApi } from '../../api/permissions'

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState({ users: 0, roles: 0, permissions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      usersApi.list({ page_size: 1 }),
      rolesApi.list({ page_size: 1 }),
      permissionsApi.list({ page_size: 1 }),
    ])
      .then(([u, r, p]) => setStats({ users: u.total, roles: r.total, permissions: p.total }))
      .finally(() => setLoading(false))
  }, [])

  const displayName = user?.display_name || user?.username || ''

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        {t('dashboard.title')}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('dashboard.welcome', { name: displayName })}
      </Typography.Text>

      <Typography.Text strong style={{ display: 'block', marginBottom: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.55 }}>
        {t('dashboard.systemOverview')}
      </Typography.Text>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={loading} bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title={t('dashboard.totalUsers')}
              value={stats.users}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading} bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title={t('dashboard.totalRoles')}
              value={stats.roles}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading} bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title={t('dashboard.totalPermissions')}
              value={stats.permissions}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
