import { useEffect, useState } from 'react'
import {
  Button, DatePicker, Input, Select, Space, Table, Tabs, Tag, Typography, type TableProps,
} from 'antd'

import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import { auditLogsApi } from '../../api/auditLogs'
import AuditDetailPopover from '../../components/AuditDetailModal'
import config from '../../config'
import type { AuditLogEntry } from '../../types'

const ADMIN_ACTIONS = [
  'create',
  'update',
  'delete',
  'kick',
  'setup_2fa',
  'enable_2fa',
  'disable_2fa',
  'admin_reset_2fa',
  'regenerate_token',
]
const RESOURCE_TYPES = ['user', 'role', 'permission', 'session', 'service_account', 'sso_provider', 'settings']
const LOGIN_ACTIONS = new Set(['login', 'logout'])

const ACTION_META: Record<string, { label: string; color: string }> = {
  create: { label: '创建', color: 'green' },
  update: { label: '更新', color: 'blue' },
  delete: { label: '删除', color: 'red' },
  kick: { label: '踢出', color: 'orange' },
  login: { label: '登录', color: 'cyan' },
  logout: { label: '退出', color: 'default' },
  setup_2fa: { label: '创建 2FA 绑定', color: 'geekblue' },
  enable_2fa: { label: '启用 2FA', color: 'green' },
  disable_2fa: { label: '关闭 2FA', color: 'volcano' },
  admin_reset_2fa: { label: '重置 2FA', color: 'magenta' },
  regenerate_token: { label: '重置令牌', color: 'purple' },
}

const RESOURCE_LABELS: Record<string, string> = {
  user: '用户',
  role: '角色',
  permission: '权限',
  session: '在线会话',
  service_account: '服务账号',
  sso_provider: '单点登录',
  settings: '系统设置',
}

function actionLabel(action: string): React.ReactNode {
  const meta = ACTION_META[action] ?? { label: action || '—', color: 'default' }
  return <Tag color={meta.color} style={{ margin: 0 }}>{meta.label}</Tag>
}

function resourceTypeLabel(type: string): React.ReactNode {
  if (!type) return <Typography.Text type="secondary">—</Typography.Text>
  return <Tag style={{ margin: 0 }}>{RESOURCE_LABELS[type] ?? type}</Tag>
}

function resolveUser(r: AuditLogEntry, fallbackToResourceName = false): React.ReactNode {
  // username is already normalized from userName/user_name variants
  const name = r.username || (fallbackToResourceName ? r.resource_name : '')
  return name
    ? <Typography.Text>{name}</Typography.Text>
    : <Typography.Text type="secondary">—</Typography.Text>
}

function formatResourceName(entry: AuditLogEntry): React.ReactNode {
  const name = entry.resource_name
  if (!name) return <Typography.Text type="secondary">—</Typography.Text>
  // if name looks like a bare numeric ID, prefix with resource type for context
  if (/^\d+$/.test(name) && entry.resource_type) {
    const label = RESOURCE_LABELS[entry.resource_type] ?? entry.resource_type
    return `${label} #${name}`
  }
  return name
}

type TabKey = 'admin' | 'login'
type TimeRange = [Dayjs, Dayjs] | null
type AuditColumn = NonNullable<TableProps<AuditLogEntry>['columns']>[number]

interface Filters {
  user: string
  action: string | undefined
  resourceType: string | undefined
  timeRange: TimeRange
}

const DEFAULT_FILTERS: Filters = { user: '', action: undefined, resourceType: undefined, timeRange: null }

export default function AuditLogsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabKey>('admin')
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const pageSize = config.defaultPageSize

  const load = async (p: number, currentTab: TabKey, f: Filters) => {
    setLoading(true)
    try {
      const res = await auditLogsApi.list({
        page_size: pageSize,
        page_token: (p - 1) * pageSize,
        ...(f.user ? { username: f.user } : {}),
        // admin tab: apply action filter if chosen; login tab: no action filter (we'll filter client-side)
        ...(currentTab === 'admin' && f.action ? { action: f.action } : {}),
        ...(currentTab === 'admin' && f.resourceType ? { resource_type: f.resourceType } : {}),
        ...(f.timeRange ? {
          start_time: f.timeRange[0].startOf('day').toISOString(),
          end_time: f.timeRange[1].endOf('day').toISOString(),
        } : {}),
      })
      const raw = res.logs ?? []
      const filtered = currentTab === 'login'
        ? raw.filter((l) => LOGIN_ACTIONS.has(l.action))
        : raw.filter((l) => !LOGIN_ACTIONS.has(l.action) || Boolean(f.action))
      setLogs(filtered)
      setTotal(res.total ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page, tab, filters) }, [page])

  const handleSearch = (overrides?: Partial<Filters>) => {
    const f = { ...filters, ...overrides }
    setFilters(f)
    setPage(1)
    load(1, tab, f)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
    load(1, tab, DEFAULT_FILTERS)
  }

  const handleTabChange = (key: string) => {
    const next = key as TabKey
    setTab(next)
    setFilters(DEFAULT_FILTERS)
    setPage(1)
    load(1, next, DEFAULT_FILTERS)
  }

  const rangePresets = [
    { label: t('auditLogs.today'), value: [dayjs().startOf('day'), dayjs()] as [Dayjs, Dayjs] },
    { label: t('auditLogs.last7Days'), value: [dayjs().subtract(6, 'day').startOf('day'), dayjs()] as [Dayjs, Dayjs] },
    { label: t('auditLogs.last30Days'), value: [dayjs().subtract(29, 'day').startOf('day'), dayjs()] as [Dayjs, Dayjs] },
  ]

  const timeCol: AuditColumn = {
    title: t('auditLogs.time'),
    dataIndex: 'created_at',
    width: 170,
    render: (v: string) => v ? new Date(v).toLocaleString() : '—',
  }

  const detailCol: AuditColumn = {
    title: t('auditLogs.detail'),
    width: 90,
    render: (_: unknown, r: AuditLogEntry) => <AuditDetailPopover entry={r} />,
  }

  const adminColumns: TableProps<AuditLogEntry>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    {
      title: t('auditLogs.user'),
      dataIndex: 'username',
      ellipsis: true,
      render: (_, r) => resolveUser(r),
    },
    { title: t('auditLogs.action'), dataIndex: 'action', width: 90, render: (v: string) => actionLabel(v) },
    {
      title: t('auditLogs.resourceType'),
      dataIndex: 'resource_type',
      width: 120,
      render: (v) => resourceTypeLabel(String(v || '')),
    },
    {
      title: t('auditLogs.resourceName'),
      dataIndex: 'resource_name',
      ellipsis: true,
      render: (_, r) => formatResourceName(r),
    },
    {
      title: t('auditLogs.ip'),
      dataIndex: 'ip',
      ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    detailCol,
    timeCol,
  ]

  const loginColumns: TableProps<AuditLogEntry>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    {
      title: t('auditLogs.user'),
      dataIndex: 'username',
      ellipsis: true,
      render: (_, r) => resolveUser(r, true),
    },
    { title: t('auditLogs.action'), dataIndex: 'action', width: 90, render: (v: string) => actionLabel(v) },
    {
      title: t('auditLogs.ip'),
      dataIndex: 'ip',
      ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    detailCol,
    timeCol,
  ]

  const filterBar = (
    <Space wrap style={{ marginBottom: 16 }}>
      <Input.Search
        allowClear
        placeholder={t('auditLogs.filterUser')}
        style={{ width: 180 }}
        value={filters.user}
        onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value }))}
        onSearch={() => handleSearch()}
      />
      {tab === 'admin' && (
        <>
          <Select
            allowClear
            placeholder={t('auditLogs.filterAction')}
            style={{ width: 150 }}
            value={filters.action}
            onChange={(v) => setFilters((f) => ({ ...f, action: v }))}
            options={ADMIN_ACTIONS.map((a) => ({ value: a, label: ACTION_META[a]?.label ?? a }))}
          />
          <Select
            allowClear
            placeholder={t('auditLogs.filterResourceType')}
            style={{ width: 150 }}
            value={filters.resourceType}
            onChange={(v) => setFilters((f) => ({ ...f, resourceType: v }))}
            options={RESOURCE_TYPES.map((r) => ({ value: r, label: RESOURCE_LABELS[r] ?? r }))}
          />
        </>
      )}
      <DatePicker.RangePicker
        value={filters.timeRange}
        onChange={(range) => setFilters((f) => ({ ...f, timeRange: range ? [range[0]!, range[1]!] : null }))}
        presets={rangePresets}
        style={{ width: 240 }}
      />
      <Button type="primary" onClick={() => handleSearch()}>{t('common.search')}</Button>
      <Button onClick={handleReset}>{t('common.reset')}</Button>
    </Space>
  )

  const tableNode = (columns: TableProps<AuditLogEntry>['columns']) => (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={logs}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: (p) => setPage(p),
        showTotal: (n) => t('common.total', { count: n }),
        styles: { item: { borderRadius: 999 } },
      }}
      bordered={false}
      style={{ borderRadius: 12, overflow: 'hidden' }}
      scroll={{ x: 900 }}
    />
  )

  return (
    <div>
      <Typography.Title level={4} style={{ margin: '0 0 16px' }}>{t('auditLogs.title')}</Typography.Title>
      <Tabs
        activeKey={tab}
        onChange={handleTabChange}
        items={[
          {
            key: 'admin',
            label: t('auditLogs.operationLogs'),
            children: <>{filterBar}{tableNode(adminColumns)}</>,
          },
          {
            key: 'login',
            label: t('auditLogs.loginLogs'),
            children: <>{filterBar}{tableNode(loginColumns)}</>,
          },
        ]}
      />

    </div>
  )
}
