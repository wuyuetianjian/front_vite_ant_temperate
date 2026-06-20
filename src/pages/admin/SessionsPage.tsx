import { useEffect, useState } from 'react'
import {
  Button, Popconfirm, Space, Table, Tag, Typography, message, type TableProps,
} from 'antd'
import { StopOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { sessionsApi } from '../../api/sessions'
import { apiError } from '../../api/client'
import config from '../../config'
import type { UserSession } from '../../types'

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
      setSessions(res.sessions ?? [])
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

  const statusTag = (status: UserSession['status']) => {
    const map = {
      active: { color: 'success', label: t('sessions.statusActive') },
      kicked: { color: 'error', label: t('sessions.statusKicked') },
      expired: { color: 'default', label: t('sessions.statusExpired') },
    } as const
    const entry = map[status] ?? { color: 'default', label: status }
    return <Tag color={entry.color}>{entry.label}</Tag>
  }

  const sessionTime = (record: UserSession, camelKey: 'loginAt' | 'lastAccessAt', snakeKey: 'login_at' | 'last_access_at') =>
    record[camelKey] ?? record[snakeKey]

  const kickedBy = (record: UserSession) => record.kickedBy ?? record.kicked_by

  const columns: TableProps<UserSession>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    { title: t('sessions.user'), dataIndex: 'username', ellipsis: true },
    { title: t('sessions.ip'), dataIndex: 'ip', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    { title: t('sessions.browser'), dataIndex: 'browser', ellipsis: true },
    { title: t('sessions.os'), dataIndex: 'os', ellipsis: true },
    {
      title: t('sessions.status'),
      dataIndex: 'status',
      width: 100,
      render: (v) => statusTag(v),
    },
    {
      title: t('sessions.loginAt'),
      key: 'loginAt',
      width: 170,
      render: (_, record) => {
        const value = sessionTime(record, 'loginAt', 'login_at')
        return value ? new Date(value).toLocaleString() : '—'
      },
    },
    {
      title: t('sessions.lastAccessAt'),
      key: 'lastAccessAt',
      width: 170,
      render: (_, record) => {
        const value = sessionTime(record, 'lastAccessAt', 'last_access_at')
        return value ? new Date(value).toLocaleString() : '—'
      },
    },
    {
      title: t('sessions.kickedBy'),
      key: 'kickedBy',
      ellipsis: true,
      render: (_, record) => kickedBy(record) || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: t('common.actions'),
      width: 110,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={t('sessions.kickConfirm')}
            onConfirm={() => handleKick(record.id)}
            disabled={record.status !== 'active'}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<StopOutlined />}
              disabled={record.status !== 'active'}
            >
              {t('sessions.kick')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{t('sessions.title')}</Typography.Title>
        <Button onClick={() => load()}>{t('common.search')}</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={sessions}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (n) => t('common.total', { count: n }) }}
        bordered={false}
        style={{ borderRadius: 12, overflow: 'hidden' }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}
