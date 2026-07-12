import { useEffect, useRef, useState } from 'react'
import {
  Button, Input, Popconfirm, Space, Table, Tag, Typography, message, type TableProps,
} from 'antd'
import { StopOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { sessionsApi } from '../../api/sessions'
import { apiError } from '../../api/client'
import config from '../../config'
import type { UserSession } from '../../types'

const REFRESH_INTERVAL = 30_000

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
  const [username, setUsername] = useState('')

  const pageSize = config.defaultPageSize

  const load = async (p = page, user = username) => {
    setLoading(true)
    try {
      const res = await sessionsApi.list({
        page_size: pageSize,
        page_token: (p - 1) * pageSize,
        ...(user ? { username: user } : {}),
      })
      const active = (res.sessions ?? []).filter((s) => s.status === 'active')
      setSessions(active)
      setTotal(res.total ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  // auto-refresh every 30s
  const loadRef = useRef(load)
  loadRef.current = load
  useEffect(() => {
    const id = setInterval(() => loadRef.current(), REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const handleSearch = (value: string) => {
    setPage(1)
    load(1, value)
  }

  const handleKick = async (record: UserSession) => {
    try {
      const parts: string[] = [`kicked session for "${record.username}"`]
      if (record.ip)       parts.push(`客户端: ${record.ip}`)
      if (record.browser)  parts.push(`浏览器: ${record.browser}`)
      if (record.os)       parts.push(`OS: ${record.os}`)
      if (record.login_at) parts.push(`登录时间: ${new Date(record.login_at).toLocaleString()}`)
      await sessionsApi.kick(record.id, {
        detail: parts.join(' · '),
        resource_name: record.username,
      })
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
      title: t('sessions.loginSource'),
      dataIndex: 'login_source',
      width: 170,
      ellipsis: true,
      render: (_, record) => record.login_source || record.loginSource || <Typography.Text type="secondary">—</Typography.Text>,
    },
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
          onConfirm={() => handleKick(record)}
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
        <Space>
          <Input.Search
            allowClear
            placeholder={t('sessions.filterUser')}
            style={{ width: 200 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onSearch={handleSearch}
          />
          <Button icon={<ReloadOutlined />} onClick={() => load()}>{t('common.refresh')}</Button>
        </Space>
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
          onChange: (p) => { setPage(p); load(p) },
          showTotal: (n) => t('common.total', { count: n }),
          styles: { item: { borderRadius: 999 } },
        }}
        bordered={false}
        style={{ borderRadius: 12, overflow: 'hidden' }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}
