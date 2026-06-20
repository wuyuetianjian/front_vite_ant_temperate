import { useEffect, useState } from 'react'
import {
  Button, Popconfirm, Space, Table, Tag, Typography, message, type TableProps,
} from 'antd'
import { StopOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { sessionsApi } from '../../api/sessions'
import { apiError } from '../../api/client'
import config from '../../config'
import type { UserSession } from '../../types'

const formatTime = (value: string | null | undefined): string => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

export default function SessionsPage() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const pageSize = config.defaultPageSize

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await sessionsApi.list({ page_size: pageSize, page_token: (p - 1) * pageSize })
      // Only show active sessions — kicked/expired belong in audit logs
      const active = (res.sessions ?? []).filter((s) => s.status === 'active')
      setSessions(active)
      setTotal(res.total ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  const handleKick = async (id: number) => {
    try {
      await sessionsApi.kick(id)
      message.success(t('common.success'))
      load()
    } catch (err) {
      message.error(apiError(err))
    }
  }

  const columns: TableProps<UserSession>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    { title: t('sessions.user'), dataIndex: 'username', ellipsis: true },
    {
      title: t('sessions.ip'),
      dataIndex: 'ip',
      ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    { title: t('sessions.browser'), dataIndex: 'browser', ellipsis: true },
    { title: t('sessions.os'), dataIndex: 'os', ellipsis: true },
    {
      title: t('sessions.status'),
      dataIndex: 'status',
      width: 90,
      render: () => <Tag color="success">{t('sessions.statusActive')}</Tag>,
    },
    {
      title: t('sessions.loginAt'),
      key: 'loginAt',
      width: 170,
      render: (_, r) => formatTime(r.login_at),
    },
    {
      title: t('sessions.lastAccessAt'),
      key: 'lastAccessAt',
      width: 170,
      render: (_, r) => formatTime(r.last_access_at),
    },
    {
      title: t('common.actions'),
      width: 110,
      render: (_, record) => (
        <Popconfirm
          title={t('sessions.kickConfirm')}
          onConfirm={() => handleKick(record.id)}
        >
          <Button type="text" size="small" danger icon={<StopOutlined />}>
            {t('sessions.kick')}
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{t('sessions.title')}</Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => load()}>{t('common.search')}</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={sessions}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
          showTotal: (n) => t('common.total', { count: n }),
        }}
        bordered={false}
        style={{ borderRadius: 12, overflow: 'hidden' }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}
